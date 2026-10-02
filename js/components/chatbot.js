// js/components/chatbot.js - Widget chat trợ lý sản phẩm (Gemini + dữ liệu Firestore)
// Yêu cầu: đã nhúng Firebase SDK + js/configFirebase.js + js/firebase-api.js (getAllProducts)
// và css/chatbot.css. Widget tự chèn nút + panel vào cuối <body>.
//
// API key KHÔNG nằm trong file này. Request đi qua Cloudflare Worker
// (xem worker/chat-proxy.js), Worker giữ key trong secret binding.
(function () {
    // Worker deploy ở domain riêng (workers.dev) nên phải dùng URL đầy đủ.
    // Đường dẫn tương đối '/api/chat' sẽ trỏ về domain của site (github.io) và luôn 404.
    const CHAT_ENDPOINT = 'https://techstore-chat.tranbaotran-project-web.workers.dev/api/chat';

    let products = [];
    let chatHistory = [];
    let isReady = false;

    /* ── Chèn CSS + markup ── */
    function injectStyles() {
        if (document.querySelector('link[href$="css/chatbot.css"]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/chatbot.css';
        document.head.appendChild(link);
    }

    function injectMarkup() {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
        <button id="chat-toggle" title="Chat với trợ lý">
            💬
            <span id="chat-badge"></span>
        </button>

        <div id="chat-panel">
            <div id="chat-header">
                <div class="avatar">🛍️</div>
                <div class="info">
                    <h3>Trợ lý sản phẩm</h3>
                    <p><span id="status-dot"></span><span id="header-status">Đang tải...</span></p>
                </div>
                <button id="close-btn" title="Đóng">✕</button>
            </div>
            <div id="messages"></div>
            <div id="suggestions">
                <button class="suggestion-chip">Danh mục?</button>
                <button class="suggestion-chip">Rẻ nhất?</button>
                <button class="suggestion-chip">Điện thoại tốt</button>
                <button class="suggestion-chip">Đánh giá cao</button>
            </div>
            <div id="input-area">
                <textarea id="user-input" rows="1" placeholder="Hỏi về sản phẩm..."></textarea>
                <button id="send-btn" disabled>➤</button>
            </div>
        </div>`;
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    function el(id) { return document.getElementById(id); }

    /* ── Dữ liệu sản phẩm từ Firestore ── */
    async function loadProducts() {
        try {
            const all = await window.getAllProducts();
            products = all.map(p => ({
                ...p,
                title: p.name || 'Unknown Product',
                category: p.category || 'Khác',
                price: Number(p.price) || 0,
                rating: Number(p.rating) || 0
            }));
            checkReady();
        } catch (e) {
            console.error('chatbot: Không thể tải dữ liệu sản phẩm.', e);
        }
    }

    function checkReady() {
        if (products.length > 0) {
            isReady = true;
            el('send-btn').disabled = false;
            el('header-status').textContent = 'Sẵn sàng';
        }
    }

    /* ── Gọi proxy Worker (giữ API key ở server) ── */
    async function sendToGemini(userMessage) {
        const res = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                history: chatHistory,
                // Chỉ gửi field Worker thật sự dùng để dựng prompt.
                products: products.map(p => ({
                    title: p.title,
                    category: p.category,
                    price: p.price,
                    rating: p.rating
                }))
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.reply || 'Không có phản hồi.';
    }

    /* ── UI chat ── */
    function appendMessage(type, text, showBadge = false) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        el('messages').appendChild(div);
        el('messages').scrollTop = el('messages').scrollHeight;
        if (showBadge && !el('chat-panel').classList.contains('open')) {
            el('chat-badge').style.display = 'block';
        }
        return div;
    }

    async function chat(userMessage) {
        if (!isReady) return; // Chưa sẵn sàng thì bỏ qua im lặng
        if (!userMessage.trim()) return;

        appendMessage('user', userMessage);
        el('user-input').value = '';
        el('send-btn').disabled = true;
        const typingEl = appendMessage('typing', '⏳ Đang suy nghĩ...');

        try {
            const reply = await sendToGemini(userMessage);
            chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
            chatHistory.push({ role: 'model', parts: [{ text: reply }] });
            typingEl.remove();
            appendMessage('bot', reply, true);
        } catch (e) {
            typingEl.remove();
            appendMessage('bot', `❌ Lỗi: ${e.message}`);
        } finally {
            el('send-btn').disabled = false;
            el('user-input').focus();
        }
    }

    function bindEvents() {
        el('chat-toggle').addEventListener('click', () => {
            el('chat-panel').classList.toggle('open');
            el('chat-badge').style.display = 'none';
        });

        el('close-btn').addEventListener('click', () => el('chat-panel').classList.remove('open'));

        // Gợi ý: dùng delegation thay onclick inline
        el('suggestions').addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (chip) chat(chip.textContent);
        });

        el('send-btn').addEventListener('click', () => chat(el('user-input').value));
        el('user-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chat(el('user-input').value);
            }
        });
    }

    function init() {
        injectStyles();
        injectMarkup();
        bindEvents();
        loadProducts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
