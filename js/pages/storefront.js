// js/pages/storefront.js - Tìm kiếm + icon search, dùng chung các trang liệt kê sản phẩm
(function () {
    var searchInput = document.querySelector('.product-search');
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

    // Icon tìm kiếm trên header → thực hiện search
    var icon = document.querySelector('.fa-search');
    if (icon) {
        icon.addEventListener('click', function (e) {
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
})();
