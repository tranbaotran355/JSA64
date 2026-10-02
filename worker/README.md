# Chat proxy Worker

Proxy cho chatbot của `final/js/components/chatbot.js`. Inference chạy trong hạ
tầng Cloudflare qua **Workers AI**, nên không có API key nào phải quản lý và
không có key nào lọt xuống trình duyệt.

- `chat-proxy.js` — Worker, gọi `env.AI.run()`
- `chat-proxy.test.mjs` — test hợp đồng API, stub `env.AI.run` nên không tốn hạn mức
- `wrangler.toml` — cấu hình, gồm binding AI và danh sách origin được phép

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Không có bước `secret put`: Workers AI được gọi qua binding, không qua API key.

## Test

```bash
npm test
```

Chỉ chạy test, **không** deploy. Test tự stub `env.AI.run` nên không gọi mạng
và không tiêu hao neuron.

## Model

Model nằm ở hằng số `AI_MODEL` trong `chat-proxy.js`:

```js
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
```

**Tên model phải khớp đúng danh sách trong tài khoản Cloudflare.** Sai tên là
lỗi hỏng âm thầm, nên đừng đoán theo trí nhớ — hỏi tài khoản trước:

```bash
npx wrangler ai models list
```

Tên có đuôi `-fp8`. Có thể đoán sai `llama-3.3-70b-instruct-fast` (thiếu
`-fp8`) và Worker sẽ báo lỗi cấu hình model ngay khi có người gọi.

Nếu cần nhẹ hơn, `@cf/meta/llama-3.1-8b-instruct-fp8` rẻ hơn nhiều nhưng
trả lời tiếng Việt kém hơn hẳn.

## Hạn mức

Workers AI có hạn mức neuron theo ngày; free tier khoảng 10.000 neuron/ngày.
Model 70B tiêu nhiều hơn 8B khoảng một bậc độ lớn, nên site đông khách sẽ
cần nâng cấp hoặc hạ xuống model nhẹ.

Theo dõi mức tiêu: <https://dash.cloudflare.com/?to=/:account/ai/observability>

## Vì sao không dùng Gemini

Bản đầu tiên của Worker gọi Gemini API với key trong secret binding. Cách đó
chạy được ở local nhưng **hỏng trên Cloudflare**: Gemini chặn theo vị trí IP của
caller, mà Worker egress từ nhiều vùng, nên trả về:

```
FAILED_PRECONDITION — User location is not supported for the API use.
```

Lỗi này đến từ phía Google nên Worker báo chung là `"Yêu cầu không hợp lệ."`
(400) — rất dễ bị nhầm là lỗi code hoặc key hết hạn. Thực tế key vẫn hợp lệ.

Đổi sang Workers AI giải quyết tận gốc vì inference chạy trong Cloudflare,
không có IP egress ra ngoài.

Nếu sau này muốn quay lại Gemini, phải đặt proxy ở host cố định trong vùng
Google hỗ trợ, không đặt trong Worker.

## Chẩn đoán lỗi

Log lỗi chỉ nằm ở server, trả về client chỉ có thông báo chung chung. Xem log:

```bash
npx wrangler tail techstore-chat
```

Rồi gọi endpoint, log sẽ in `[ai] ok model=...` hoặc `[ai] error model=...`.

## API

`POST /api/chat`

```json
{ "message": "có laptop nào rẻ không?", "history": [], "products": [] }
```

Trả `200 {"reply": "..."}`. `history` là mảng `{role, parts:[{text}]}`, `products`
là mảng `{title|name, category, price, rating}` — Worker tự cắt bớt độ dài để
không vượt giới hạn của model.

Client gọi qua Worker, không gọi thẳng lên Workers AI.

## Trỏ frontend vào Worker

Trong `js/components/chatbot.js` (đi từ `final/`):

```js
const CHAT_ENDPOINT = 'https://techstore-chat.tranbaotran-project-web.workers.dev/api/chat';
```

Worker nằm khác domain với site nên **không** dùng đường dẫn tương đối
`/api/chat`: trình duyệt sẽ gửi tới domain của site và luôn nhận 404.

## Chạy local

```bash
npx wrangler dev
```

Worker chạy ở `http://localhost:8787`. Binding AI hoạt động cả khi dev local, và
`.dev.vars` không còn cần thiết vì đã không có secret nào.

## Origin được phép

Trình duyệt ở `https://tranbaotran355.github.io/JSA64/` gửi header
`Origin: https://tranbaotran355.github.io` — **không** có path `/JSA64/`.

Sửa `ALLOWED_ORIGINS` trong `wrangler.toml` rồi deploy lại:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5500,https://ten-ban.github.io"
```

Danh sách rỗng = cho phép mọi origin, tức ai biết URL Worker cũng gọi được bằng
curl và tiêu hao hạn mức AI của bạn. Chỉ dùng khi dev local.

## Giới hạn

Rate limit 10 request/phút mỗi IP, lưu trong bộ nhớ của instance Worker. Vì
instance là stateless nên đây chỉ là hàng rào cơ bản, chặn được lạm dụng thường
ngày chứ không phải tấn công có chủ đích.