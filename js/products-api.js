/**
 * products-api.js - Render sản phẩm động từ API
 *
 * LOGIC ÁNH XẠ DANH MỤC:
 * API trả về sản phẩm với trường `type`: 'smartphone', 'laptop', 'accessories', 'smart device'.
 * Ánh xạ đến các trang:
 *   - smartphone  → product-category.html (Điện thoại)
 *   - laptop      → laptops.html (Laptop)
 *   - accessories → accessories.html (Phụ kiện)
 *   - smart device → smart-devices.html (Thiết bị thông minh)
 *
 * Mỗi trang HTML có `.product-grid` với thuộc tính `data-category`.
 * Sản phẩm khớp danh mục sẽ được render; nếu 'all' thì hiển thị tất cả.
 * Nhiều danh mục cách nhau bằng dấu phẩy sẽ hiển thị ở tất cả trang khớp.
 */
(function () {
  'use strict';

  /* ── Cấu hình ── */
  const API_URL = (typeof PRODUCTS_API !== 'undefined' ? PRODUCTS_API : window.PRODUCTS_API) ||
    'https://script.google.com/macros/s/AKfycbwL93-aZVBuGBD0WBq7mxAEZm_nE9r4RaNXsYnMNrcDbaUfH_xuP4i4aOoZLHat19GjFg/exec';
  const ITEMS_PER_PAGE = 8;       // Số sản phẩm mỗi trang
  const CACHE_TTL = 60000;        // Cache tồn tại 60 giây

  /* ── Biến trạng thái ── */
  let cachedProducts = null;      // Cache sản phẩm
  let lastFetch = 0;              // Lần fetch cuối
  let currentPage = {};           // Trang hiện tại (theo grid ID)
  let activeFilters = {};         // Bộ lọc đang active

  /* ── Chuẩn hoá dữ liệu sản phẩm từ API ── */
  function normalize(p) {
    const id = String(p.id ?? 'prod_' + Math.random().toString(36).slice(2, 10));
    const name = p.name ?? p.title ?? 'Unknown Product';
    const price = Number(p.price ?? p.price_usd ?? p.amount ?? 0);
    const image = p.image ?? p.img ?? p.thumbnail ?? '';
    const type = String(p.type ?? p.category ?? '').toLowerCase().trim() || 'other';

    let rating = Number(p.rating ?? p.stars ?? 0);
    if (!rating || Number.isNaN(rating)) {
      const d = new Date(p.rating);
      if (!Number.isNaN(d.valueOf())) {
        rating = Math.min(5, Math.max(1, (d.getDate() % 5) + 1));
      } else {
        rating = 4;
      }
    }
    rating = Math.min(5, Math.max(1, Math.round(rating)));

    return { id, name, price, image, type, rating,
      originalPrice: p.original_price ? Number(p.original_price) : null }; // Giá gốc (nếu có)
  }

  /* ── Fetch sản phẩm từ API (có cache) ── */
  async function fetchProducts(forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && cachedProducts && (now - lastFetch) < CACHE_TTL) {
      return cachedProducts;
    }
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      const data = await res.json();
      const rawList = data?.value ?? data?.products ?? data ?? [];
      const list = Array.isArray(rawList) ? rawList : [];
      const seen = new Map();
      const products = [];
      for (const raw of list) {
        const p = normalize(raw);
        if (!seen.has(p.id)) {
          seen.set(p.id, true);
          products.push(p);
        }
      }
      cachedProducts = products;
      lastFetch = now;
      return products;
    } catch (e) {
      console.error('products-api: fetch failed', e);
      throw e;
    }
  }

  /* ── Kiểm tra sản phẩm có thuộc danh mục không ── */
  function matchesCategory(product, categoryFilter) {
    if (!categoryFilter || categoryFilter === 'all') return true;
    const filterTypes = categoryFilter.split(',').map(s => s.trim().toLowerCase());
    return filterTypes.some(ft => product.type === ft || product.type.includes(ft));
  }

  /* ── Định dạng giá ($) ── */
  function formatPrice(val) {
    if (val == null || Number.isNaN(Number(val))) return '';
    return '$' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ── Tạo HTML sao đánh giá (có hỗ trợ nửa sao) ── */
  function ratingHtml(rating) {
    const v = Number(rating) || 0;
    const full = Math.floor(v);
    const half = v - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let h = '';
    for (let i = 0; i < full; i++) h += '<i class="fas fa-star"></i>';
    if (half) h += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) h += '<i class="far fa-star"></i>';
    if (v) h += `<span>(${v.toFixed(1)})</span>`;
    return h;
  }

  /* ── Tạo thẻ sản phẩm (HTML) ── */
  function createCard(p) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.id;
    card.dataset.type = p.type;
    card.dataset.price = p.price;

    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${p.name.replace(/"/g, '&quot;')}" loading="lazy">`
      : '<div class="product-image-placeholder">No Image</div>';

    const priceHtml = p.originalPrice
      ? `<span class="current-price">${formatPrice(p.price)}</span><span class="original-price">${formatPrice(p.originalPrice)}</span>`
      : `<span class="current-price">${formatPrice(p.price)}</span>`;

    card.innerHTML = `
      <div class="product-image">${imgHtml}</div>
      <div class="product-info">
        <div class="product-category">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}</div>
        <h3 class="product-title">${p.name}</h3>
        <div class="product-price">${priceHtml}</div>
        <div class="product-rating">${ratingHtml(p.rating)}</div>
        <button class="add-to-cart"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
      </div>
    `;

    // Xử lý nút "Add to Cart"
    const btn = card.querySelector('.add-to-cart');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const product = {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.type,
        quantity: 1
      };
      if (typeof cartManager !== 'undefined' && cartManager.addItem(product)) {
        this.style.backgroundColor = '#10b981';
        this.innerHTML = '<i class="fas fa-check"></i> Added!';
        if (window.notify && typeof notify.success === 'function') {
          notify.success(`${p.name} added to cart!`);
        }
        setTimeout(() => {
          this.style.backgroundColor = '';
          this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }, 1500);
      } else if (window.notify && typeof notify.error === 'function') {
        notify.error('Failed to add item.');
      }
    });

    // Click vào thẻ sản phẩm -> xem chi tiết
    card.addEventListener('click', function (e) {
      if (e.target.closest('.add-to-cart')) return;
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      window.location.href = `product-detail.html?id=${encodeURIComponent(p.id)}&name=${encodeURIComponent(slug)}`;
    });

    return card;
  }

  /* ── Tạo thẻ deal (có badge giảm giá) ── */
  function createDealCard(p, discount) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = p.id;
    card.dataset.type = p.type;
    card.dataset.price = p.price;

    const discounted = (p.price * (1 - discount / 100)).toFixed(2);
    const saving = (p.price - discounted).toFixed(2);

    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${p.name.replace(/"/g, '&quot;')}" loading="lazy">`
      : '<div class="product-image-placeholder">No Image</div>';

    card.innerHTML = `
      <div class="discount-badge">-${discount}%</div>
      <div class="product-image">${imgHtml}</div>
      <div class="product-info">
        <div class="product-category">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}</div>
        <h3 class="product-title">${p.name}</h3>
        <div class="product-price">
          <span class="current-price">${formatPrice(Number(discounted))}</span>
          <span class="original-price">${formatPrice(p.price)}</span>
          <span class="saving-tag">Save $${saving}</span>
        </div>
        <div class="action-buttons">
          <button class="btn-primary-deals add-deal-cart"><i class="fas fa-shopping-cart"></i> Add</button>
          <button class="btn-icon buy-now" title="Buy Now"><i class="fas fa-bolt"></i></button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector('.add-deal-cart');
    addBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const product = {
        id: p.id,
        name: p.name,
        price: Number(discounted),
        image: p.image,
        category: p.type,
        quantity: 1
      };
      if (typeof cartManager !== 'undefined' && cartManager.addItem(product)) {
        this.style.backgroundColor = '#10b981';
        this.innerHTML = '<i class="fas fa-check"></i> Added!';
        if (window.notify && typeof notify.success === 'function') {
          notify.success(`${p.name} added to cart!`);
        }
        setTimeout(() => {
          this.style.backgroundColor = '';
          this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add';
        }, 1500);
      } else if (window.notify && typeof notify.error === 'function') {
        notify.error('Failed to add item.');
      }
    });

    card.querySelector('.buy-now')?.addEventListener('click', function (e) {
      e.stopPropagation();
      window.location.href = 'checkout.html';
    });

    card.addEventListener('click', function (e) {
      if (e.target.closest('.add-deal-cart') || e.target.closest('.buy-now')) return;
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      window.location.href = `product-detail.html?id=${encodeURIComponent(p.id)}&name=${encodeURIComponent(slug)}`;
    });

    return card;
  }

  /* ── Hiển thị trạng thái loading (skeleton) ── */
  function showLoading(grid) {
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'product-card product-skeleton';
      skeleton.innerHTML = `
        <div class="product-image" style="background:#e0e6ed;animation:pulse 1.5s infinite;"></div>
        <div class="product-info">
          <div style="height:14px;background:#e0e6ed;border-radius:4px;width:40%;margin-bottom:8px;animation:pulse 1.5s infinite;"></div>
          <div style="height:18px;background:#e0e6ed;border-radius:4px;width:80%;margin-bottom:8px;animation:pulse 1.5s infinite;"></div>
          <div style="height:22px;background:#e0e6ed;border-radius:4px;width:30%;margin-bottom:8px;animation:pulse 1.5s infinite;"></div>
          <div style="height:40px;background:#e0e6ed;border-radius:8px;width:100%;animation:pulse 1.5s infinite;"></div>
        </div>
      `;
      grid.appendChild(skeleton);
    }
  }

  /* ── Hiển thị trạng thái không có sản phẩm ── */
  function showEmpty(grid, message) {
    grid.innerHTML = `<div class="product-empty"><i class="fas fa-box-open" style="font-size:48px;color:#b0c4de;margin-bottom:16px;display:block;"></i><p>${message || 'No products found.'}</p></div>`;
  }

  /* ── Hiển thị trạng thái lỗi ── */
  function showError(grid, message) {
    grid.innerHTML = `<div class="product-empty product-error"><i class="fas fa-exclamation-triangle" style="font-size:48px;color:#e53e3e;margin-bottom:16px;display:block;"></i><p>${message || 'Failed to load products.'}</p><button onclick="location.reload()" style="margin-top:12px;padding:10px 24px;border:none;border-radius:8px;background:#1c4d8d;color:white;cursor:pointer;font-weight:600;">Retry</button></div>`;
  }

  /* ── Render phân trang ── */
  function renderPagination(container, totalPages, current, callback) {
    container.innerHTML = '';
    if (totalPages <= 1) return;
    const prev = document.createElement('button');
    prev.className = 'pagination-btn';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.addEventListener('click', () => { if (current > 1) callback(current - 1); });
    container.appendChild(prev);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'pagination-btn' + (i === current ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', () => callback(i));
      container.appendChild(btn);
    }
    const next = document.createElement('button');
    next.className = 'pagination-btn';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.addEventListener('click', () => { if (current < totalPages) callback(current + 1); });
    container.appendChild(next);
  }

  /* ── Xử lý và render một grid sản phẩm ── */
  async function renderGrid(grid) {
    const catFilter = grid.dataset.category || 'all';
    const limit = Number(grid.dataset.limit) || 0;
    const isDeals = grid.dataset.deals === 'true';
    const gridId = grid.id || ('grid_' + Math.random().toString(36).slice(2, 8));
    grid.dataset.gridId = gridId;

    const paginationContainer = document.querySelector(`.pagination[data-for="${gridId}"]`)
      || grid.parentElement.querySelector('.pagination');

    showLoading(grid);

    try {
      const allProducts = await fetchProducts();
      let filtered = allProducts.filter(p => matchesCategory(p, catFilter));

      if (!filtered.length) {
        showEmpty(grid, 'No products match this category.');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }

      const pageSize = limit || ITEMS_PER_PAGE;
      const totalPages = Math.ceil(filtered.length / pageSize);

      if (!currentPage[gridId]) currentPage[gridId] = 1;
      if (currentPage[gridId] > totalPages) currentPage[gridId] = 1;

      function renderPage(page) {
        currentPage[gridId] = page;
        const start = (page - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        grid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        pageItems.forEach(p => {
          fragment.appendChild(isDeals ? createDealCard(p, Math.floor(Math.random() * 30) + 10) : createCard(p));
        });
        grid.appendChild(fragment);
        if (paginationContainer) {
          renderPagination(paginationContainer, totalPages, page, renderPage);
        }
      }

      renderPage(currentPage[gridId]);
    } catch (e) {
      console.error('products-api: renderGrid error', e);
      showError(grid, 'Unable to load products. Please try again later.');
      if (paginationContainer) paginationContainer.innerHTML = '';
    }
  }

  /* ── Áp dụng bộ lọc cho grid (giá, sắp xếp, tìm kiếm) ── */
  async function applyFilters(grid) {
    const gridId = grid.dataset.gridId;
    const catFilter = grid.dataset.category || 'all';
    const limit = Number(grid.dataset.limit) || 0;
    const isDeals = grid.dataset.deals === 'true';
    const paginationContainer = document.querySelector(`.pagination[data-for="${gridId}"]`)
      || grid.parentElement.querySelector('.pagination');

    showLoading(grid);

    try {
      const allProducts = await fetchProducts();
      let filtered = allProducts.filter(p => matchesCategory(p, catFilter));

      const priceFilter = activeFilters[gridId + '_price'];
      if (priceFilter) {
        filtered = filtered.filter(p => {
          if (priceFilter === 'under50') return p.price < 50;
          if (priceFilter === '50-200') return p.price >= 50 && p.price <= 200;
          if (priceFilter === '200-500') return p.price > 200 && p.price <= 500;
          if (priceFilter === 'over500') return p.price > 500;
          if (priceFilter === 'under500') return p.price < 500;
          if (priceFilter === '500-1000') return p.price >= 500 && p.price <= 1000;
          if (priceFilter === '1000-1500') return p.price >= 1000 && p.price <= 1500;
          if (priceFilter === 'over1500') return p.price > 1500;
          return true;
        });
      }

      const sortBy = activeFilters[gridId + '_sort'];
      if (sortBy) {
        if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
        else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      const searchQuery = activeFilters[gridId + '_search'];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
      }

      if (!filtered.length) {
        showEmpty(grid, 'No products match your criteria.');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }

      const pageSize = limit || ITEMS_PER_PAGE;
      const totalPages = Math.ceil(filtered.length / pageSize);
      if (!currentPage[gridId]) currentPage[gridId] = 1;
      if (currentPage[gridId] > totalPages) currentPage[gridId] = 1;

      function renderPage(page) {
        currentPage[gridId] = page;
        const start = (page - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        grid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        pageItems.forEach(p => {
          fragment.appendChild(isDeals ? createDealCard(p, Math.floor(Math.random() * 30) + 10) : createCard(p));
        });
        grid.appendChild(fragment);
        if (paginationContainer) {
          renderPagination(paginationContainer, totalPages, page, renderPage);
        }
      }

      renderPage(currentPage[gridId]);
    } catch (e) {
      console.error('products-api: applyFilters error', e);
      showError(grid, 'Unable to load products.');
      if (paginationContainer) paginationContainer.innerHTML = '';
    }
  }

  /* ── Khởi tạo dropdown lọc và ô tìm kiếm ── */
  function initFilters(grid) {
    const gridId = grid.dataset.gridId;
    const filters = grid.closest('.container, section, div') || grid.parentElement;
    const selects = filters.querySelectorAll('.filter-select');
    const searchInput = filters.querySelector('.filter-search');
    const resetBtn = filters.querySelector('.filter-reset-btn, [data-reset]');

    selects.forEach(sel => {
      const key = sel.dataset.filter || sel.id || 'sort';
      sel.addEventListener('change', () => {
        activeFilters[gridId + '_' + key] = sel.value;
        currentPage[gridId] = 1;
        applyFilters(grid);
      });
    });

    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          activeFilters[gridId + '_search'] = searchInput.value;
          currentPage[gridId] = 1;
          applyFilters(grid);
        }, 300);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selects.forEach(sel => { sel.value = sel.querySelector('option')?.value || ''; });
        if (searchInput) searchInput.value = '';
        activeFilters = {};
        currentPage[gridId] = 1;
        applyFilters(grid);
      });
    }
  }

  /* ── Hàm render chính - tìm tất cả grid và render ── */
  async function render() {
    const grids = document.querySelectorAll('.product-grid');
    if (!grids.length) return;

    grids.forEach(grid => {
      const gridId = 'grid_' + Math.random().toString(36).slice(2, 8);
      grid.dataset.gridId = gridId;
    });

    for (const grid of grids) {
      initFilters(grid);
      await renderGrid(grid);
    }
  }

  /* ── Tự động làm mới dữ liệu mỗi 60 giây ── */
  function startAutoRefresh() {
    setInterval(() => {
      cachedProducts = null;
      lastFetch = 0;
      render();
    }, CACHE_TTL);
  }

  /* ── Khởi động khi DOM sẵn sàng ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { render(); startAutoRefresh(); });
  } else {
    render();
    startAutoRefresh();
  }

  /* ── Public API để debug ── */
  window.__productsAPI = { fetchProducts, render, applyFilters, refresh: () => { cachedProducts = null; lastFetch = 0; render(); } };

  /* ── Thêm CSS animation pulse cho skeleton loading ── */
  const style = document.createElement('style');
  style.textContent = `@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}.product-skeleton{pointer-events:none}.product-empty,.product-error{grid-column:1/-1;text-align:center;padding:60px 20px;color:#6b7280;font-size:16px}.product-search{width:100%;padding:12px 15px;border:1px solid #d1d5db;border-radius:12px;font-family:'Inter',sans-serif;font-size:15px;background:#fff;outline:none;transition:border-color .2s ease;box-sizing:border-box;margin-bottom:20px}.product-search:focus{border-color:#1C4D8D}`;
  document.head.appendChild(style);
})();
