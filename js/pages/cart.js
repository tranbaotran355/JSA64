// js/pages/cart.js - Trang giỏ hàng
document.addEventListener('DOMContentLoaded', function () {
    if (typeof cartManager !== 'undefined') {
        cartManager.updateCartIcon();
    }

    function renderCart() {
        var cartContainer = document.querySelector('.cart-items');
        var cartHeader = document.querySelector('.cart-header p');
        var cart = typeof cartManager !== 'undefined' ? cartManager.getCart() : [];

        cartContainer.innerHTML = '';

        if (cart.length === 0) {
            if (cartHeader) cartHeader.textContent = 'Your cart is empty';
            cartContainer.insertAdjacentHTML('beforeend',
                '<div class="empty-cart">' +
                '<div class="empty-cart-icon"><i class="fas fa-shopping-cart"></i></div>' +
                '<h2>Your Cart is Empty</h2>' +
                "<p>Looks like you haven't added any products to your cart yet. Start shopping to fill it up!</p>" +
                '<a href="product-category.html" class="btn btn-primary" style="margin-top:20px;display:inline-block;padding:12px 30px;">' +
                '<i class="fas fa-shopping-bag"></i> Start Shopping</a></div>');
            updateCartSummary([]);
            return;
        }

        var totalItems = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
        if (cartHeader) {
            cartHeader.textContent = 'You have ' + totalItems + ' item' + (totalItems !== 1 ? 's' : '') + ' in your cart';
        }

        cart.forEach(function (item) {
            var html =
                '<div class="cart-item" data-id="' + item.id + '">' +
                '<div class="cart-item-image"><img src="' + item.image + '" alt="' + item.name + '"></div>' +
                '<div class="cart-item-info">' +
                '<h3>' + item.name + '</h3>' +
                '<div class="cart-item-category">' + (item.category || '') + '</div>' +
                '<div class="cart-item-price">$' + parseFloat(item.price).toFixed(2) + '</div>' +
                '</div>' +
                '<div class="cart-item-quantity">' +
                '<button class="quantity-btn minus" data-id="' + item.id + '">−</button>' +
                '<span class="quantity-display">' + item.quantity + '</span>' +
                '<button class="quantity-btn plus" data-id="' + item.id + '">+</button>' +
                '</div>' +
                '<button class="cart-item-remove" data-id="' + item.id + '"><i class="fas fa-trash"></i> Remove</button>' +
                '</div>';
            cartContainer.insertAdjacentHTML('beforeend', html);
        });

        attachCartEventListeners();
        updateCartSummary(cart);
    }

    function attachCartEventListeners() {
        document.querySelectorAll('.cart-item-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var productId = this.dataset.id;
                var productName = this.closest('.cart-item').querySelector('h3').textContent;
                cartManager.removeItem(productId);
                if (typeof notify !== 'undefined') notify.success(productName + ' removed from cart!');
                renderCart();
            });
        });

        document.querySelectorAll('.quantity-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var type = this.classList.contains('plus') ? 'plus' : 'minus';
                var quantityDisplay = this.parentElement.querySelector('.quantity-display');
                var newQuantity = parseInt(quantityDisplay.textContent, 10);

                if (type === 'plus') newQuantity++;
                else if (type === 'minus' && newQuantity > 1) newQuantity--;
                else return;

                cartManager.updateQuantity(this.dataset.id, newQuantity);
                renderCart();
            });
        });
    }

    function updateCartSummary(cart) {
        var totals = typeof cartManager !== 'undefined'
            ? cartManager.getTotal(0, 0.08)
            : { subtotal: 0, shipping: 0, tax: 0, total: 0 };

        var summaryRows = document.querySelectorAll('.summary-row');
        if (summaryRows.length >= 4) {
            var subtotalEl = summaryRows[0].querySelector('span:last-child');
            var shippingEl = summaryRows[1].querySelector('span:last-child');
            var taxEl = summaryRows[2].querySelector('span:last-child');
            var totalEl = document.querySelector('.summary-row.total .amount');

            if (subtotalEl) subtotalEl.textContent = '$' + totals.subtotal.toFixed(2);
            if (shippingEl) {
                shippingEl.textContent = cart.length > 0 ? 'FREE' : '$0.00';
                shippingEl.style.color = cart.length > 0 ? '#10b981' : 'inherit';
                shippingEl.style.fontWeight = cart.length > 0 ? '500' : '400';
            }
            if (taxEl) taxEl.textContent = '$' + totals.tax.toFixed(2);
            if (totalEl) totalEl.textContent = '$' + totals.total.toFixed(2);
        }

        var freeShippingMsg = document.querySelector('.free-shipping');
        if (freeShippingMsg) {
            if (cart.length > 0) {
                freeShippingMsg.innerHTML = '<i class="fas fa-check-circle"></i> Free shipping on your order!';
                freeShippingMsg.style.color = '#10b981';
            } else {
                freeShippingMsg.innerHTML = '<i class="fas fa-check-circle"></i> Add items to qualify for free shipping';
                freeShippingMsg.style.color = 'var(--gray-dark)';
            }
        }
    }

    // Nút thanh toán
    var checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            var cart = typeof cartManager !== 'undefined' ? cartManager.getCart() : [];
            if (cart.length === 0) {
                if (typeof notify !== 'undefined') notify.error('Your cart is empty. Add items before checkout.');
            } else {
                window.location.href = 'checkout.html';
            }
        });
    }

    var continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('click', function () {
            window.location.href = 'product-category.html';
        });
    }

    renderCart();

    // Giỏ hàng đổi ở tab khác / từ cloud realtime -> vẽ lại trang
    window.addEventListener('cart:updated', renderCart);
});
