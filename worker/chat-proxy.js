// worker/chat-proxy.js - Cloudflare Worker làm trung gian cho chatbot.
//
// Mục đích: inference chạy trong hạ tầng Cloudflare qua Workers AI, không
// có API key nào cần quản lý và không có key nào lọt xuống trình duyệt.
// Client chỉ gọi POST /api/chat trên Worker này.
//
// Vì sao không dùng Gemini: Gemini API chặn theo vị trí IP của caller, mà
// Worker egress từ nhiều vùng nên trả về
// `FAILED_PRECONDITION — User location is not supported for the API use`.
// Workers AI chạy ngay trong Cloudflare nên không dính giới hạn đó.

// Tên model phải khớp đúng danh sách trong tài khoản Cloudflare. Sai tên là
// nguyên nhân hỏng âm thầm, nên đừng đoán: xem `npx wrangler ai models list`.
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
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
            // Firestore lưu tên sản phẩm ở field 'name'; client chatbot.js đã map
            // sang 'title', nhưng gọi API trực tiếp thì chỉ có 'name'.
            const title = clip(p && (p.title || p.name), 120) || 'Unknown Product';
            return `${title} | ${clip(p && p.category, 60) || 'Khác'} | $${price} | ★${rating}`;
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

async function callWorkersAI(env, prompt) {
    try {
        const res = await env.AI.run(AI_MODEL, {
            messages: [{ role: 'user', content: prompt }]
        });

        const reply = (res && typeof res.response === 'string' ? res.response : '').trim();
        console.log(`[ai] ok model=${AI_MODEL} promptChars=${prompt.length} replyChars=${reply.length}`);

        if (!reply) return { error: 'Dịch vụ AI trả về nội dung rỗng.', status: 502 };
        return { reply };
    } catch (err) {
        // Log phía server để chẩn đoán được (xem `npx wrangler tail`).
        // KHÔNG trả nguyên lỗi của Cloudflare về client.
        const detail = String((err && err.message) || err).slice(0, 1000);
        console.log(`[ai] error model=${AI_MODEL} detail=${detail}`);

        // Sai tên model là lỗi dễ gặp nhất, tách riêng để dễ đoán.
        if (/model/i.test(detail)) return { error: 'Dịch vụ AI đang lỗi cấu hình model.', status: 502 };
        if (/quota|neuron|limit|rate/i.test(detail)) {
            return { error: 'Đã vượt hạn mức AI, vui lòng thử lại sau.', status: 429 };
        }
        return { error: 'Dịch vụ AI đang lỗi.', status: 502 };
    }
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

        if (!env.AI) {
            return json({ error: 'Máy chủ chưa cấu hình Workers AI.' }, 503, cors);
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
            const result = await callWorkersAI(env, buildPrompt({ message, history: body.history, products: body.products }));
            if (result.error) return json({ error: result.error }, result.status, cors);
            return json({ reply: result.reply }, 200, cors);
        } catch {
            return json({ error: 'Không kết nối được dịch vụ AI.' }, 502, cors);
        }
    }
};