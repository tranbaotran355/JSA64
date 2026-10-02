// worker/chat-proxy.js - Cloudflare Worker làm trung gian cho chatbot Gemini.
//
// Mục đích: API key Gemini KHÔNG BAO GIỜ được gửi xuống trình duyệt.
// Key nằm trong secret binding (wrangler secret put GEMINI_API_KEY).
// Client chỉ gọi POST /api/chat trên Worker này.

// Dùng alias 'latest' thay vì tên version cứng: model Flash-Lite đã bị
// Gemini gỡ khỏi :generateContent (gemini-2.5-flash-lite trả 404), nên hardcode
// version sẽ chết lặng lẽ khi Google retire model.
const GEMINI_MODEL = 'gemini-flash-lite-latest';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TURN_CHARS = 2000;
const MAX_HISTORY_TURNS = 10;
const MAX_PRODUCTS = 200;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Đếm request theo IP. Chỉ mang tính best-effort: instance của Worker là
// stateless và có thể bị thu hồi, nên đây chỉ chặn được lạm dụng cơ bản.
const hits = new Map();

function json(body, status, headers) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
    });
}

function allowedOrigins(env) {
    return (env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function corsHeaders(origin, allowList) {
    const ok = allowList.includes(origin);
    return {
        // Origin không hợp lệ thì trả 'null'. Trả allowList[0] là sai ngữ nghĩa:
        // header khai báo một origin mà request thực sự không có.
        'Access-Control-Allow-Origin': ok ? origin : 'null',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function isRateLimited(ip) {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX) {
        hits.set(ip, recent);
        return true;
    }

    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return false;
}

function clip(value, max) {
    return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function buildPrompt({ message, history, products }) {
    const productList = (Array.isArray(products) ? products.slice(0, MAX_PRODUCTS) : [])
        .map((p) => {
            const price = Number(p && p.price) || 0;
            const rating = Number(p && p.rating) || 0;
            return `${clip(p && p.title, 120) || 'Unknown Product'} | ${clip(p && p.category, 60) || 'Khác'} | $${price} | ★${rating}`;
        })
        .join('\n');

    const systemCtx = `Bạn là trợ lý tư vấn bán hàng thân thiện. Danh sách sản phẩm:\n${productList}\nTrả lời bằng tiếng Việt, ngắn gọn, hiển thị giá bằng USD.`;

    const historyText = (Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [])
        .map((turn) => {
            const text = clip(turn && turn.parts && turn.parts[0] && turn.parts[0].text, MAX_TURN_CHARS);
            if (!text) return '';
            return `${turn.role === 'user' ? 'Khách' : 'Trợ lý'}: ${text}`;
        })
        .filter(Boolean)
        .join('\n');

    const historyBlock = historyText ? `Lịch sử:\n${historyText}\n` : '';
    return `${systemCtx}\n\n${historyBlock}Khách: ${clip(message, MAX_MESSAGE_CHARS)}\nTrợ lý:`;
}

async function callGemini(env, prompt) {
    // Key truyền qua header, không nằm trên query string để không lọt vào log.
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
        }
    );

    if (!res.ok) {
        // Không trả nguyên body lỗi của Google về client.
        if (res.status === 429) return { error: 'Đã vượt hạn mức, vui lòng thử lại sau.', status: 429 };
        if (res.status === 400) return { error: 'Yêu cầu không hợp lệ.', status: 400 };
        if (res.status === 401 || res.status === 403) return { error: 'Máy chủ chưa được cấu hình API key.', status: 502 };
        return { error: `Dịch vụ AI đang lỗi (${res.status}).`, status: 502 };
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { reply: reply || 'Không có phản hồi.' };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const allowList = allowedOrigins(env);
        const cors = corsHeaders(origin, allowList);

        // Danh sách origin rỗng nghĩa là mở (tiện cho local dev), nên
        // chỉ chặn khi đã cấu hình ALLOWED_ORIGINS.
        if (allowList.length > 0 && !allowList.includes(origin)) {
            return json({ error: 'Origin không được phép.' }, 403, cors);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }

        if (request.method !== 'POST') {
            return json({ error: 'Chỉ nhận POST.' }, 405, cors);
        }

        const declaredLength = Number(request.headers.get('Content-Length') || 0);
        if (declaredLength > MAX_BODY_BYTES) {
            return json({ error: 'Payload quá lớn.' }, 413, cors);
        }

        if (isRateLimited(request.headers.get('CF-Connecting-IP') || 'unknown')) {
            return json({ error: 'Bạn gửi yêu cầu quá nhanh, thử lại sau.' }, 429, cors);
        }

        if (!env.GEMINI_API_KEY) {
            return json({ error: 'Máy chủ chưa cấu hình API key.' }, 503, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return json({ error: 'Body không phải JSON hợp lệ.' }, 400, cors);
        }

        const message = String((body && body.message) || '').trim();
        if (!message) {
            return json({ error: 'Thiếu nội dung câu hỏi.' }, 400, cors);
        }
        if (message.length > MAX_MESSAGE_CHARS) {
            return json({ error: 'Câu hỏi quá dài.' }, 400, cors);
        }

        try {
            const result = await callGemini(env, buildPrompt({ message, history: body.history, products: body.products }));
            if (result.error) return json({ error: result.error }, result.status, cors);
            return json({ reply: result.reply }, 200, cors);
        } catch {
            return json({ error: 'Không kết nối được dịch vụ AI.' }, 502, cors);
        }
    }
};