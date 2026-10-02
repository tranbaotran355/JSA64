// js/pages/deals.js - Countdown flash sale + bộ lọc trang Deals
(function () {
    // ── Countdown ──
    var endTime = new Date();
    endTime.setDate(endTime.getDate() + 2);
    endTime.setHours(endTime.getHours() + 14);

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateTimer() {
        var distance = endTime - new Date().getTime();
        var ids = ['days', 'hours', 'minutes', 'seconds'];
        if (distance < 0) {
            ids.forEach(function (id) { document.getElementById(id).innerText = '00'; });
            return;
        }
        document.getElementById('days').innerText = pad(Math.floor(distance / 86400000));
        document.getElementById('hours').innerText = pad(Math.floor((distance % 86400000) / 3600000));
        document.getElementById('minutes').innerText = pad(Math.floor((distance % 3600000) / 60000));
        document.getElementById('seconds').innerText = pad(Math.floor((distance % 60000) / 1000));
    }

    updateTimer();
    setInterval(updateTimer, 1000);
})();

document.addEventListener('DOMContentLoaded', function () {
    var catSelect = document.getElementById('categoryFilter');
    var grid = document.getElementById('deals-grid');

    // Lọc theo danh mục
    if (catSelect && grid) {
        catSelect.addEventListener('change', function () {
            grid.dataset.category = this.value;
            if (window.__productsAPI) window.__productsAPI.render();
        });
    }

    // Nút reset bộ lọc
    var resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            document.querySelectorAll('.filter-select').forEach(function (s) { s.value = 'all'; });
            var sort = document.querySelector('#sortSelect');
            if (sort) sort.value = 'discount';
            if (grid) grid.dataset.category = 'all';
            if (window.__productsAPI) window.__productsAPI.render();
            if (window.notify && typeof notify.info === 'function') notify.info('Filters reset!');
        });
    }
});
