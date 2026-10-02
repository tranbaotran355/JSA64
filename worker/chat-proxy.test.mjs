// worker/chat-proxy.test.mjs - Kiểm tra hợp đồng API của Worker mà không cần
// gọi Workers AI thật (stub `env.AI.run`).
//
// Chạy: npm test (trong thư mục worker/)
//
// `npm test` chỉ chạy test, KHÔNG deploy. Deploy là `npm run deploy`.

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './chat-proxy.js';

const ALLOWED = 'https://tranbaotran355.github.io';

// env giả: AI binding trả về response cố định, không chạm mạng.
function makeEnv({ reply = 'Có bán laptop giá tốt.', ai, allowed = ALLOWED } = {}) {
    const calls = [];
    return {
        calls,
        env: {
            ALLOWED_ORIGINS: allowed,
            AI: ai || { async run(model, input) { calls.push({ model, input }); return { response: reply }; } }
        }
    };
}

function post(body, { origin = ALLOWED, env } = {}) {
    return worker.fetch(new Request('https://worker.example/api/chat', {
        method: 'POST',
        headers: {
            'Origin': origin,
            'Content-Type': 'application/json',
            ...(typeof body === 'string' ? {} : { 'Content-Length': String(JSON.stringify(body).length) })
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    }), env);
}

test('origin không nằm trong allowlist bị chặn 403', async () => {
    const { env } = makeEnv();
    const res = await post({ message: 'xin chào' }, { origin: 'https://evil.example', env });
    assert.equal(res.status, 403);
    // Không được phản chiếu origin lạ, kể cả origin thật của site.
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'null');
});

test('origin hợp lệ được phản chiếu đúng', async () => {
    const { env } = makeEnv();
    const res = await post({ message: 'xin chào' }, { env });
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ALLOWED);
});

test('body rác trả 400 bằng thông báo tiếng Việt', async () => {
    const { env } = makeEnv();
    const res = await post('{khong phai json', { env });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Body không phải JSON hợp lệ.');
});

test('thiếu message trả 400', async () => {
    const { env } = makeEnv();
    const res = await post({ products: [] }, { env });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Thiếu nội dung câu hỏi.');
});

test('GET bị từ chối 405', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(
        new Request('https://worker.example/api/chat', { headers: { 'Origin': ALLOWED } }),
        env
    );
    assert.equal(res.status, 405);
});

test('payload vượt giới hạn trả 413', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(new Request('https://worker.example/api/chat', {
        method: 'POST',
        headers: { 'Origin': ALLOWED, 'Content-Length': String(32 * 1024) },
        body: '{}'
    }), env);
    assert.equal(res.status, 413);
});

test('thiếu binding AI trả 503 chứ không phải 500', async () => {
    const res = await post({ message: 'xin chào' }, { env: { ALLOWED_ORIGINS: ALLOWED } });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, 'Máy chủ chưa cấu hình Workers AI.');
});

test('trả reply khi Workers AI thành công', async () => {
    const { env, calls } = makeEnv({ reply: '\n  Có laptop Lenovo giá tốt.  ' });
    const res = await post({ message: 'có laptop không?' }, { env });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { reply: 'Có laptop Lenovo giá tốt.' });

    // Model phải đúng tên trong danh sách tài khoản, và prompt phải là
    // một user message vì Workers AI không hiểu `contents`/`parts` của Gemini.
    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
    assert.equal(calls[0].input.messages.length, 1);
    assert.equal(calls[0].input.messages[0].role, 'user');
    assert.match(calls[0].input.messages[0].content, /có laptop không\?/);
});

test('prompt chứa tiếng Việt và danh sách sản phẩm đã cắt bớt', async () => {
    const products = [
        { name: 'Laptop Lenovo', category: 'Laptop', price: 899, rating: 4.5 },
        { title: 'iPhone 15', category: 'Phone', price: 999, rating: 4.8 }
    ];
    const { env, calls } = makeEnv();
    await post({
        message: 'so sánh giúp tôi',
        history: [{ role: 'user', parts: [{ text: 'chào' }] }],
        products
    }, { env });

    const prompt = calls[0].input.messages[0].content;
    assert.match(prompt, /Trả lời bằng tiếng Việt/);
    assert.match(prompt, /Laptop Lenovo \| Laptop \| \$899 \| ★4\.5/);
    // Firestore lưu tên ở field 'name', client gửi 'title' — cần nhận cả hai.
    assert.match(prompt, /iPhone 15 \| Phone \| \$999 \| ★4\.8/);
    assert.match(prompt, /Lịch sử:/);
});

test('Workers AI lỗi thì không lộ chi tiết lỗi ra client', async () => {
    const env = makeEnv({
        ai: { async run() { throw new Error('secret internal detail'); } }
    }).env;
    const res = await post({ message: 'xin chào' }, { env });
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.equal(body.error, 'Dịch vụ AI đang lỗi.');
    assert.ok(!JSON.stringify(body).includes('secret internal detail'));
});

test('hết hạn mức neuron trả 429', async () => {
    const env = makeEnv({
        ai: { async run() { throw new Error('Exceeded daily neuron limit'); } }
    }).env;
    const res = await post({ message: 'xin chào' }, { env });
    assert.equal(res.status, 429);
    assert.equal((await res.json()).error, 'Đã vượt hạn mức AI, vui lòng thử lại sau.');
});

test('Workers AI trả nội dung rỗng thì báo lỗi chứ không trả reply rỗng', async () => {
    const env = makeEnv({ ai: { async run() { return { response: '   ' }; } } }).env;
    const res = await post({ message: 'xin chào' }, { env });
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error, 'Dịch vụ AI trả về nội dung rỗng.');
});

test('OPTIONS trả 204 kèm header CORS để trình duyệt không bị chặn preflight', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(new Request('https://worker.example/api/chat', {
        method: 'OPTIONS',
        headers: { 'Origin': ALLOWED }
    }), env);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ALLOWED);
});