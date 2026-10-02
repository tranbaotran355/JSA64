# Chat proxy Worker

Giữ API key Gemini ở server thay vì trong trình duyệt.

- `chat-proxy.js` — Worker, đọc key từ secret binding `GEMINI_API_KEY`
- `wrangler.toml` — cấu hình, trong đó có danh sách origin được phép

## Deploy lần đầu

```bash
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

Lệnh `secret put` sẽ hỏi bạn dán key. Key được lưu trong Cloudflare, **không** nằm trong file nào trong repo.

Deploy xong bạn sẽ nhận URL dạng `https://techstore-chat.<subdomain>.workers.dev`.

## Trỏ frontend vào Worker

Trong `js/components/chatbot.js` (đi từ `final/`), sửa `CHAT_ENDPOINT`:

```js
// Worker khác domain với site
const CHAT_ENDPOINT = 'https://techstore-chat.<subdomain>.workers.dev/api/chat';

// hoặc nếu Worker đứng chung domain (route đã map /api/* sang Worker)
// thì giữ nguyên đường dẫn tương đối
const CHAT_ENDPOINT = '/api/chat';
```

## Chạy local

```bash
npx wrangler dev
```

Worker chạy ở `http://localhost:8787`. File `.dev.vars` để test local đã bị `.gitignore` loại:

```bash
echo "GEMINI_API_KEY=key_cua_ban" > .dev.vars
```

## Thêm domain thật vào allowlist

Sửa `ALLOWED_ORIGINS` trong `wrangler.toml` rồi deploy lại:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5500,https://ten-ban.github.io"
```

Danh sách rỗng nghĩa là cho phép mọi origin — chỉ nên dùng khi dev local.

## Xoá key sau khi lộ

Nếu key từng bị lộ, thu hồi tại <https://aistudio.google.com/apikey> rồi chạy lại `npx wrangler secret put GEMINI_API_KEY`.

## Giới hạn

Rate limit 10 request/phút mỗi IP, lưu trong bộ nhớ của instance Worker. Vì instance là stateless nên đây chỉ là hàng rào cơ bản, chặn được việc lạm dụng cơ bản chứ không phải tấn công có chủ đích.