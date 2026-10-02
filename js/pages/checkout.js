// js/pages/checkout.js - Trang thanh toán (đặt hàng -> Firestore 'orders')
document.addEventListener('DOMContentLoaded', function () {
    // Yêu cầu đăng nhập
    if (typeof auth === 'undefined' || !auth.checkAuth()) {
        notify.error('Please login to proceed to checkout');
        setTimeout(function () { window.location.href = 'login.html'; }, 2000);
        return;
    }

    var currentUser = auth.getCurrentUser();

    // Điền sẵn email + tiêu đề icon user
    if (currentUser) {
        var userIcon = document.querySelector('.header-icons .fa-user');
        if (userIcon) userIcon.title = 'Logged in as ' + currentUser.username;

        var emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = currentUser.email || '';
    }

    /* ── Tổng tiền & vận chuyển (thuế 8% thống nhất toàn trang) ── */
    var TAX_RATE = 0.08;
    var SHIPPING_OPTIONS = [
        { name: 'Express Shipping', cost: 9.99 },
        { name: 'Standard Shipping', cost: 0 }
    ];

    function getSelectedShipping() {
        var radios = document.querySelectorAll('input[name="shipping"]');
        var idx = Array.prototype.indexOf.call(radios, document.querySelector('input[name="shipping"]:checked'));
        return SHIPPING_OPTIONS[idx >= 0 ? idx : 0];
    }

    function setSummary(subtotal, shippingCost, tax) {
        var rows = document.querySelectorAll('.summary-row');
        if (rows.length >= 3) {
            rows[0].querySelector('span:last-child').textContent = '$' + subtotal.toFixed(2);
            var shipEl = rows[1].querySelector('span:last-child');
            shipEl.textContent = shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2);
            shipEl.style.color = shippingCost === 0 ? '#10b981' : 'inherit';
            rows[2].querySelector('span:last-child').textContent = '$' + tax.toFixed(2);
        }
        var totalAmount = document.querySelector('.summary-row.total .amount');
        if (totalAmount) totalAmount.textContent = '$' + (subtotal + shippingCost + tax).toFixed(2);
    }

    function updateOrderSummary() {
        var cart = typeof cartManager !== 'undefined' ? cartManager.getCart() : [];
        var orderItemsContainer = document.querySelector('.order-items');
        if (!orderItemsContainer) return;

        if (cart.length === 0) {
            orderItemsContainer.innerHTML =
                '<p style="text-align:center;color:#6b7280;padding:20px 0;">Your cart is empty. ' +
                '<a href="product-category.html" style="color:#1C4D8D;font-weight:500;">Continue shopping</a></p>';
            setSummary(0, 0, 0);
            return;
        }

        function qtyOf(item) { return parseInt(item.quantity, 10) || 1; }

        var subtotal = 0;
        orderItemsContainer.innerHTML = cart.map(function (item) {
            var itemTotal = (parseFloat(item.price) || 0) * qtyOf(item);
            subtotal += itemTotal;
            return '<div class="order-item">' +
                '<div class="order-item-info"><h4>' + item.name + '</h4><p>Quantity: ' + qtyOf(item) + '</p></div>' +
                '<div class="order-item-price">$' + itemTotal.toFixed(2) + '</div>' +
                '</div>';
        }).join('');

        var shipping = getSelectedShipping();
        setSummary(subtotal, shipping.cost, subtotal * TAX_RATE);
    }

    updateOrderSummary();
    window.addEventListener('cart:updated', updateOrderSummary);

    // Chọn phương thức vận chuyển
    var paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(function (method) {
        method.addEventListener('click', function () {
            paymentMethods.forEach(function (m) {
                m.classList.remove('selected');
                m.querySelector('input[type="radio"]').checked = false;
            });
            method.classList.add('selected');
            method.querySelector('input[type="radio"]').checked = true;
            updateOrderSummary();
        });
    });

    document.querySelectorAll('input[name="shipping"]').forEach(function (radio) {
        radio.addEventListener('change', updateOrderSummary);
    });

    // ── Validation ──
    var form = document.querySelector('.checkout-form');
    var continueBtn = document.querySelector('.btn-complete');

    function validateForm() {
        var requiredFields = form.querySelectorAll('[required]');
        var isValid = true;
        var firstInvalidField = null;

        requiredFields.forEach(function (field) {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#ef4444';
                field.style.backgroundColor = '#fee2e2';
                if (!firstInvalidField) firstInvalidField = field;
            } else {
                field.style.borderColor = '';
                field.style.backgroundColor = '';
            }
        });

        if (!isValid && firstInvalidField) firstInvalidField.focus();
        return isValid;
    }

    form.querySelectorAll('[required]').forEach(function (field) {
        field.addEventListener('change', function () {
            if (this.value.trim()) {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    });

    /* ── Đặt hàng: ghi Firestore 'orders' rồi xoá giỏ ── */
    if (continueBtn) {
        continueBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            var cart = typeof cartManager !== 'undefined' ? cartManager.getCart() : [];
            if (!cart.length) {
                notify.error('Your cart is empty!');
                window.location.href = 'cart.html';
                return;
            }
            if (!validateForm()) {
                notify.error('Please fill in all required fields!');
                return;
            }

            var email = document.getElementById('email').value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                notify.error('Please enter a valid email address!');
                return;
            }
            var phoneDigits = document.getElementById('phone').value.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                notify.error('Please enter a valid phone number!');
                return;
            }
            var zip = document.getElementById('zip').value.trim();
            if (zip.length < 5) {
                notify.error('Please enter a valid ZIP code!');
                return;
            }

            function val(id) {
                var el = document.getElementById(id);
                return el ? el.value.trim() : '';
            }

            function qtyOf(item) { return parseInt(item.quantity, 10) || 1; }

            var shipping = getSelectedShipping();
            var subtotal = cart.reduce(function (s, item) { return s + (parseFloat(item.price) || 0) * qtyOf(item); }, 0);
            var tax = subtotal * TAX_RATE;

            var order = {
                id: 'TS-' + Date.now().toString(36).toUpperCase(),
                date: new Date().toISOString(),
                items: cart,
                itemCount: cart.reduce(function (s, item) { return s + qtyOf(item); }, 0),
                subtotal: +(subtotal.toFixed(2)),
                shippingName: shipping.name,
                shipping: shipping.cost,
                tax: +(tax.toFixed(2)),
                total: +((subtotal + shipping.cost + tax).toFixed(2)),
                status: 'Processing',
                customer: {
                    firstName: val('firstName'),
                    lastName: val('lastName'),
                    company: val('company'),
                    apartment: val('apartment'),
                    email: email,
                    phone: val('phone'),
                    address: val('address'),
                    city: val('city'),
                    state: val('state'),
                    zip: zip,
                    country: val('country')
                }
            };

            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            try {
                await auth.addOrder(order);          // Lưu Firestore collection 'orders'
                auth.clearUserCart();                // Xoá giỏ theo tài khoản
                if (typeof cartManager !== 'undefined') cartManager.clearCart(); // Xoá giỏ local
                notify.success('Order placed successfully! 🎉');
                setTimeout(function () { window.location.href = 'profile.html'; }, 1200);
            } catch (error) {
                console.error('Failed to place order:', error);
                notify.error('Failed to place order: ' + ((error && error.message) || 'Please try again.'));
                this.disabled = false;
                this.innerHTML = 'Continue to Payment <i class="fas fa-arrow-right"></i>';
            }
        });
    }

    // Nút quay lại giỏ
    var backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            window.location.href = 'cart.html';
        });
    }
});
