// js/pages/admin.js - Kiem tra quyen + dieu huong sidebar
(function () {
    // Chi admin moi duoc mo trang quan tri
    if (typeof auth !== 'undefined' && auth.isAdmin()) {
        var emailEl = document.getElementById('admin-email');
        if (emailEl && auth.currentUser && auth.currentUser.email) {
            emailEl.textContent = auth.currentUser.email;
        }
    } else {
        if (typeof notify !== 'undefined') {
            notify.error('Access denied: Admin only.');
        } else {
            alert('Access denied: Admin only.');
        }
        sessionStorage.setItem('redirectAfterLogin', 'admin.html');
        window.location.href = 'login.html';
    }
})();

(function () {
    // Sidebar navigation switch
    var navItems = document.querySelectorAll('.nav-item');
    var sections = document.querySelectorAll('.content-section');
    var pageTitle = document.getElementById('page-title');

    var titles = {
        dashboard: 'Dashboard',
        'product-list': 'Product List',
        orders: 'Orders',
        users: 'Users',
        settings: 'Settings'
    };

    navItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            var section = this.dataset.section;

            navItems.forEach(function (n) { n.classList.remove('active'); });
            this.classList.add('active');

            sections.forEach(function (s) { s.classList.remove('active'); });
            var target = document.querySelector('.content-section[data-section="' + section + '"]');
            if (target) target.classList.add('active');

            if (pageTitle && titles[section]) {
                pageTitle.textContent = titles[section];
            }
        });
    });

    console.log('Admin panel ready (TechSphere style)');
})();
