// js/pages/product-detail.js - Trang chi tiet san pham

// ── Thumbnail selection ──
const pdThumbnails = document.querySelectorAll('.thumbnail');
const pdMainImage = document.querySelector('.main-image img');

pdThumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
        pdThumbnails.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');

        // Doi anh chinh theo thumbnail
        if (pdMainImage) {
            var src = this.querySelector('img').src;
            pdMainImage.style.opacity = '0.5';
            setTimeout(function () {
                pdMainImage.src = src.replace('w=300', 'w=1200');
                pdMainImage.style.opacity = '1';
            }, 150);
        }
    });
});

// ── Option selection ──
document.querySelectorAll('.option-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var parent = this.parentElement;
        parent.querySelectorAll('.option-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
    });
});

// ── Build product object cho cart/wishlist: uu tien du lieu Firestore da tai qua applyProduct() ──
function buildPageProduct() {
    if (window.__pageProduct) return Object.assign({}, window.__pageProduct);

    // Fallback: scrape DOM khi chua tai kep (id lay tu URL ?id=)
    var titleEl = document.querySelector('.product-info-detail h1');
    var priceEl = document.querySelector('.current-price-detail');
    var imgEl = document.querySelector('.main-image img');
    var catEl = document.querySelector('.product-category-detail');
    var params = new URLSearchParams(window.location.search);

    return {
        id: params.get('id') || (titleEl ? titleEl.textContent.toLowerCase().replace(/[^a-z0-9]/g, '_') : ''),
        name: titleEl ? titleEl.textContent : '',
        price: priceEl ? (parseFloat(priceEl.textContent.replace('$', '').replace(',', '')) || 0) : 0,
        image: imgEl ? imgEl.src : '',
        category: catEl ? catEl.textContent.trim().toLowerCase() : ''
    };
}

// ── Wishlist toggle (#wishlist-detail-btn) - dong bo Firestore qua auth.js ──
var pdWishlistBtn = document.getElementById('wishlist-detail-btn');
if (pdWishlistBtn) {
    function setWishlistState(active) {
        pdWishlistBtn.classList.toggle('active', active);
        pdWishlistBtn.innerHTML = '<i class="' + (active ? 'fas' : 'far') + ' fa-heart"></i> ' + (active ? 'Wishlisted' : 'Wishlist');
        pdWishlistBtn.style.color = active ? '#e11d48' : '';
        pdWishlistBtn.style.borderColor = active ? '#e11d48' : '';
    }

    function syncWishlistState() {
        if (typeof auth === 'undefined' || !auth.isInWishlist) return;
        setWishlistState(auth.isInWishlist(buildPageProduct().id));
    }

    syncWishlistState();
    window.addEventListener('auth:data-pulled', syncWishlistState);
    window.addEventListener('wishlist:updated', syncWishlistState);

    pdWishlistBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof auth === 'undefined') return;

        var product = buildPageProduct();
        var added = auth.toggleWishlist(product);
        setWishlistState(added);
        if (window.notify) {
            (added ? notify.success : notify.info)(
                added ? product.name + ' saved to your wishlist!' : product.name + ' removed from your wishlist.');
        }
    });
}

// ── Add to cart ──
var addToCartBtn = document.getElementById('add-to-cart-detail');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function (e) {
        e.preventDefault();

        var product = Object.assign(buildPageProduct(), { quantity: 1 });

        if (typeof cartManager !== 'undefined' && cartManager.addItem(product)) {
            this.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
            this.style.backgroundColor = '#0F2854';

            var cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.style.transform = 'scale(1.3)';
                setTimeout(function () { cartCount.style.transform = 'scale(1)'; }, 300);
            }

            var btn = this;
            setTimeout(function () {
                btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                btn.style.backgroundColor = '';
            }, 2000);
        } else {
            console.error('Error adding to cart: cartManager not available or invalid product data');
            notify.error('Unable to add item to cart. Please refresh the page and try again.');
        }
    });
}

// ── Tai va hien thi san pham tu Firestore (?id=) ──
(function () {
    var params = new URLSearchParams(window.location.search);
    var productId = params.get('id');
    if (!productId) { showDetailLoading(false); return; }

    var catLinks = { smartphone: 'product-category.html', laptop: 'laptops.html', accessories: 'accessories.html', 'smart device': 'smart-devices.html' };

    function showDetailLoading(show) {
        var detail = document.querySelector('.product-detail');
        var overlay = document.querySelector('.product-detail-loading');
        if (detail) {
            if (show) detail.classList.add('loading');
            else detail.classList.remove('loading');
        }
        if (overlay) {
            if (show) overlay.classList.add('active');
            else overlay.classList.remove('active');
        }
    }

    function applyProduct(p) {
        document.title = p.name + ' | TechSphere';

        var catEl = document.querySelector('.product-category-detail');
        if (catEl) catEl.textContent = p.category.charAt(0).toUpperCase() + p.category.slice(1);

        var nameEl = document.querySelector('.product-info-detail h1');
        if (nameEl) nameEl.textContent = p.name;

        var ratingEl = document.querySelector('.product-rating-detail');
        if (ratingEl) {
            var r = Math.round(p.rating);
            var html = '<div>';
            for (var i = 1; i <= 5; i++) {
                if (i <= r) html += '<i class="fas fa-star"></i>';
                else if (i - 0.5 <= p.rating) html += '<i class="fas fa-star-half-alt"></i>';
                else html += '<i class="far fa-star"></i>';
            }
            var countTxt = (p.ratingCount != null) ? p.ratingCount : 0;
            html += '</div><span id="ratingSummary">' + p.rating.toFixed(1) + ' (' + countTxt + ' Reviews)</span>';
            ratingEl.innerHTML = html;
        }

        var priceEl = document.querySelector('.current-price-detail');
        if (priceEl) priceEl.textContent = '$' + Number(p.price).toFixed(2);

        var origPriceEl = document.querySelector('.original-price-detail');
        var discountEl = document.querySelector('.discount-badge');
        if (p.originalPrice) {
            if (origPriceEl) { origPriceEl.style.display = ''; origPriceEl.textContent = '$' + Number(p.originalPrice).toFixed(2); }
            if (discountEl) { discountEl.style.display = ''; discountEl.textContent = 'Save $' + (p.originalPrice - p.price).toFixed(0); }
        } else {
            if (origPriceEl) origPriceEl.style.display = 'none';
            if (discountEl) discountEl.style.display = 'none';
        }

        var imgEl = document.querySelector('.main-image img');
        if (imgEl) { imgEl.src = p.image; imgEl.alt = p.name; }

        var breadcrumb = document.querySelector('.breadcrumb-content');
        if (breadcrumb) {
            var catName = p.category.charAt(0).toUpperCase() + p.category.slice(1);
            var catHref = catLinks[p.category] || 'product-category.html';
            breadcrumb.innerHTML = '<a href="main.html">Home</a> <span>/</span> <a href="' + catHref + '">' + catName + '</a> <span>/</span> <span>' + p.name + '</span>';
        }

        // Luu du lieu Firestore de buildPageProduct() dung ID chuan cho cart/wishlist
        window.__pageProduct = {
            id: String(p.id),
            name: p.name,
            price: Number(p.price),
            image: p.image,
            category: p.category
        };
        if (typeof syncWishlistState === 'function') syncWishlistState();

        // Widget danh gia sao + danh sach reviews (js/ratings.js)
        if (window.Ratings && typeof Ratings.mount === 'function') {
            Ratings.mount(p.id);
        }

        showDetailLoading(false);
    }

    function tryLoad() {
        showDetailLoading(true);
        if (window.__productsAPI && typeof window.__productsAPI.fetchProducts === 'function') {
            window.__productsAPI.fetchProducts().then(function (products) {
                var product = products.find(function (p) { return String(p.id) === String(productId); });
                if (product) applyProduct(product);
                else showDetailLoading(false);
            }).catch(function (err) {
                console.error('product-detail: fetchProducts failed', err);
                showDetailLoading(false);
            });
        } else {
            setTimeout(tryLoad, 300);
        }
    }
    tryLoad();
})();
