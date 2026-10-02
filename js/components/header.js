// js/components/header.js - Header dùng chung cho mọi trang TechSphere
// Cách dùng: đặt <div id="site-header"></div> ngay sau <body>, rồi nhúng file này
// SAU auth.js/cart.js và TRƯỚC navigation.js.
// Badge giỏ hàng (.cart-count) và badge tim yêu thích (.wishlist-count) được tự cập nhật.
(function () {
    const NAV_ITEMS = [
        { label: 'Home', href: 'main.html', match: ['main.html'] },
        { label: 'Smartphones', href: 'product-category.html', match: ['product-category.html'] },
        { label: 'Laptops', href: 'laptops.html', match: ['laptops.html'] },
        { label: 'Accessories', href: 'accessories.html', match: ['accessories.html'] },
        { label: 'Smart Devices', href: 'smart-devices.html', match: ['smart-devices.html'] },
        { label: 'Deals', href: 'deals.html', match: ['deals.html'] }
    ];

    function currentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1).toLowerCase() || 'main.html';
    }

    function isActive(item) {
        const cur = currentPage();
        return item.match.some(m => cur === m.toLowerCase());
    }

    function buildHeader() {
        const links = NAV_ITEMS.map(item =>
            `<li><a href="${item.href}" class="${isActive(item) ? 'active' : ''}">${item.label}</a></li>`
        ).join('\n            ');

        // Link Admin: chi hien voi tai khoan co quyen admin
        const showAdmin = (typeof auth !== 'undefined' && typeof auth.isAdmin === 'function' && auth.isAdmin());
        const adminLink = `<li class="admin-nav-item"${showAdmin ? '' : ' style="display:none;"'}><a href="admin.html">Admin</a></li>`;

        return `
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <img class="picLogo" src="other/logo.png" alt="TechSphere Logo">
                    Tech<span>Sphere</span>
                </div>

                <nav id="main-nav">
                    <ul>
            ${links}
            ${adminLink}
                    </ul>
                </nav>

                <button class="hamburger-menu" aria-label="Toggle navigation menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div class="header-icons">
                    <i class="fas fa-search" id="search-icon"></i>
                    <a href="login.html"><i class="fas fa-user"></i></a>
                    <div class="wishlist-icon">
                        <a href="wishlist.html"><i class="fas fa-heart"></i></a>
                        <span class="wishlist-count" style="display:none;">0</span>
                    </div>
                    <div class="cart-icon">
                        <a href="cart.html"><i class="fas fa-shopping-cart"></i></a>
                        <span class="cart-count" style="display:none;">0</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function mount() {
        let host = document.getElementById('site-header');
        if (!host) {
            host = document.createElement('div');
            host.id = 'site-header';
            document.body.insertBefore(host, document.body.firstChild);
        }
        host.innerHTML = buildHeader();

        // Tìm kiếm -> trang chủ với chế độ search
        const searchIcon = document.getElementById('search-icon');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => { window.location.href = 'main.html?search='; });
        }

        // Cập nhật trạng thái UI theo phiên đăng nhập + số lượng giỏ/wishlist hiện có
        refreshBadges();
        syncAdminLink();
        // Header vẽ xong sau khi auth.js khởi tạo thì phải gọi lại updateUI (icon user)
        try { if (typeof auth !== 'undefined' && auth.updateUI) auth.updateUI(); } catch (_) {}
        ['cart:updated', 'wishlist:updated', 'auth:data-pulled'].forEach(evt =>
            window.addEventListener(evt, refreshBadges)
        );
    }

    function refreshBadges() {
        try {
            if (typeof cartManager !== 'undefined' && cartManager.updateCartIcon) cartManager.updateCartIcon();
            if (typeof auth !== 'undefined' && auth.updateWishlistIcon) auth.updateWishlistIcon();
        } catch (_) { /* Bỏ qua */ }
        syncAdminLink();
    }

    // Ẩn/hiện link Admin theo quyền hiện tại (chạy lại khi đăng nhập/đăng xuất)
    function syncAdminLink() {
        try {
            const li = document.querySelector('.admin-nav-item');
            if (!li) return;
            const show = (typeof auth !== 'undefined' && typeof auth.isAdmin === 'function' && auth.isAdmin());
            li.style.display = show ? '' : 'none';
        } catch (_) { /* Bỏ qua */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
