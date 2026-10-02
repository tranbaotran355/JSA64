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

## Model Gemini

Model nằm ở hằng số `GEMINI_MODEL` trong `chat-proxy.js`:

```js
const GEMINI_MODEL = 'gemini-flash-lite-latest';
```

Đây là **alias** (`-latest`), không phải tên version cứng. Không hardcode version vì Google có thể retire model bất cứ lúc nào — `gemini-2.5-flash-lite` đã bị gỡ khỏi `:generateContent`, khiến Worker trả về:

```json
{"error":"Dịch vụ AI đang lỗi (404)."}
```

Lưu ý: 404 nghĩa là key hợp lệ nhưng tên model sai. Key sai hoặc hết hạn sẽ trả 400 `API_KEY_INVALID` và Worker báo `"Yêu cầu không hợp lệ."`.

Khi gặp 404, xem key hiện tại truy cập được những model nào:

```powershell
$r = curl.exe -s "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000" -H "x-goog-api-key: KEY_CUA_BAN" | ConvertFrom-Json
$r.models | Where-Object { $_.name -match 'generateContent' } | ForEach-Object { $_.name -replace 'models/','' }
```

Sửa `GEMINI_MODEL` theo kết quả rồi `npx wrangler deploy` lại. Ứng viên tối giản: `gemini-flash-lite-latest` (rẻ nhất) hoặc `gemini-3.1-flash-lite`.

## Trỏ frontend vào Worker

Trong `js/components/chatbot.js` (đi từ `final/`), sửa `CHAT_ENDPOINT`:

```js
// Worker khác domain với site — đây là cấu hình đang dùng
const CHAT_ENDPOINT = 'https://techstore-chat.tranbaotran-project-web.workers.dev/api/chat';

// hoặc nếu Worker đứng chung domain (route đã map /api/* sang Worker)
// thì giữ nguyên đường dẫn tương đối
const CHAT_ENDPOINT = '/api/chat';
```

Không dùng đường dẫn tương đối khi Worker nằm ở domain khác: `/api/chat` sẽ được trình duyệt gửi tới domain của site (`tranbaotran355.github.io`) và luôn trả 404.

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