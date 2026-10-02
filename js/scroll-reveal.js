// scroll-reveal.js - Hiệu ứng xuất hiện theo cuộn cho toàn bộ trang TechSphere
// Mỗi khối được "làm mờ" theo tỉ lệ phần nằm trong khung nhìn:
//   - nằm gọn trong khung   -> hiện rõ (opacity 1)
//   - bị mép khung cắt ngang -> mờ đúng phần nằm ngoài
//   - cuộn qua phía trên     -> mờ dần rồi biến mất
// Chỉ chạm opacity + transform (GPU) -> không giật layout.
(function () {
    'use strict';

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    /* Selector các khối + thẻ con cần animate */
    var SELECTORS = [
        'section',
        '[class$="-header"]',
        '.filter-section', '.category-grid', '.badge-grid', '.pagination',
        '.product-grid', '.cart-container', '.wishlist-grid', '.checkout-container',
        '.contact-grid', '.faq-section', '.stores-section', '.auth-shell',
        '.content-section', '.product-detail-wrapper', '.reviews-section',
        '.deals-banner', '.profile-grid', '.checkout-steps', '.product-search',
        '.profile-section', '.hero-intro', '.auth-pane',
        '.product-card', '.category-card', '.badge-card', '.cart-item',
        '.form-section', '.contact-form-container', '.contact-info-container',
        '.empty-wishlist', '.empty-state'
    ];

    /* Các phần tử không animate (sticky/fixed/không thuộc nội dung chính) */
    var EXCLUDE_SELECTOR = '#site-header, #site-footer, .sidebar, .admin-topbar, .breadcrumb, .filter-bar, .chatbot, header, footer';

    var els = [];
    var rafId = null;
    var timer = null;
    var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (fn) { return setTimeout(fn, 16); };

    function isExcluded(el) {
        try {
            return !!el.closest(EXCLUDE_SELECTOR);
        } catch (e) {
            var node = el;
            while (node) {
                if (node.nodeType === 1 && (node.tagName === 'HEADER' || node.tagName === 'FOOTER')) return true;
                node = node.parentNode;
            }
            return false;
        }
    }

    function collect(root) {
        var rootEl = root && root.querySelectorAll ? root : document;
        var found = rootEl.querySelectorAll(SELECTORS.join(','));
        for (var i = 0; i < found.length; i++) {
            var el = found[i];
            if (isExcluded(el)) continue;
            if (els.indexOf(el) !== -1) continue;
            el.setAttribute('data-rs', '');
            els.push(el);
        }
        schedule();
    }

    function update() {
        rafId = null;
        var vh = window.innerHeight || document.documentElement.clientHeight;

        /* Đọc rect tất cả trước (tránh layout thrash), sau đó mới ghi style */
        var reads = [];
        for (var i = 0; i < els.length; i++) {
            reads.push({ el: els[i], rect: els[i].getBoundingClientRect() });
        }
        for (var j = 0; j < reads.length; j++) {
            var r = reads[j].rect;
            var overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            if (overlap < 0) overlap = 0;
            var denom = Math.min(r.height, vh, 300);
            var ratio = denom > 0 ? Math.min(1, overlap / denom) : 1;
            if (ratio >= 1) {
                /* Hiện đủ -> bỏ inline transform để không đè hover/transition của CSS */
                reads[j].el.style.opacity = '1';
                reads[j].el.style.transform = '';
            } else {
                var dy = (1 - ratio) * 16;
                reads[j].el.style.opacity = ratio.toFixed(2);
                reads[j].el.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
            }
        }
    }

    function schedule() {
        if (!rafId) rafId = raf(update);
    }

    /* Khởi tạo + theo dõi nội dung render động (product cards, giỏ hàng...) */
    function init() {
        collect(document);

        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('load', schedule);
        /* Bắt scroll của MỌI phần tử (trang này cuộn qua body/html, không phải window) */
        document.addEventListener('scroll', schedule, { capture: true, passive: true });

        if (window.MutationObserver) {
            var observer = new MutationObserver(function () {
                if (timer) clearTimeout(timer);
                timer = setTimeout(function () { collect(document); }, 120);
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        schedule();
    }

    init();
})();