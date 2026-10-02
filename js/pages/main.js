// js/pages/main.js - Logic riêng trang chủ
document.addEventListener('DOMContentLoaded', function () {
    // Click thẻ danh mục → chuyển trang tương ứng
    document.querySelectorAll('.category-card').forEach(function (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            var name = this.querySelector('h3').textContent.toLowerCase();
            if (name.includes('smartwatch') || name.includes('smart watch')) {
                window.location.href = 'smart-devices.html';
            } else if (name.includes('smartphone') || name.includes('tablet')) {
                window.location.href = 'product-category.html';
            } else if (name.includes('laptop')) {
                window.location.href = 'laptops.html';
            } else if (name.includes('accessor')) {
                window.location.href = 'accessories.html';
            } else if (name.includes('smart home')) {
                window.location.href = 'smart-devices.html';
            }
        });
    });

    // Icon tìm kiếm trên header → thực hiện search
    var searchIcon = document.querySelector('.fa-search');
    var searchInput = document.querySelector('.product-search');
    if (searchIcon && searchInput) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', function (e) {
            e.preventDefault();
            searchInput.value = searchInput.value.trim();
            if (searchInput.value) {
                doSearch();
            } else {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Tìm kiếm sản phẩm (Enter hoặc icon) + hỗ trợ ?search= từ URL
    if (!searchInput) return;
    var grids = document.querySelectorAll('.product-grid');

    grids.forEach(function (g) {
        g.dataset.origCategory = g.dataset.category || 'all';
        if (g.dataset.limit) g.dataset.origLimit = g.dataset.limit;
    });

    function doSearch() {
        var query = searchInput.value.trim();
        grids.forEach(function (grid) {
            if (query) {
                grid.dataset.category = 'all';
                grid.removeAttribute('data-limit');
                var pagination = grid.parentElement.querySelector('.pagination');
                if (pagination) pagination.style.display = 'none';
            } else {
                grid.dataset.category = grid.dataset.origCategory || 'all';
                if (grid.dataset.origLimit) grid.dataset.limit = grid.dataset.origLimit;
                else grid.removeAttribute('data-limit');
                var pagination = grid.parentElement.querySelector('.pagination');
                if (pagination) pagination.style.display = '';
            }
            if (window.__productsAPI && typeof window.__productsAPI.applyFilters === 'function') {
                window.__productsAPI.applyFilters(grid);
            }
        });
    }

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch();
        }
    });

    var q = new URLSearchParams(window.location.search).get('search');
    if (q) {
        searchInput.value = q;
        (function retry() {
            var firstGrid = document.querySelector('.product-grid');
            if (firstGrid && firstGrid.dataset.gridId) {
                doSearch();
            } else {
                setTimeout(retry, 300);
            }
        })();
    }
});
