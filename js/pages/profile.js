// js/pages/profile.js - Tai khoan nguoi dung
(function() {
            // ---- Auth: require login & fill real user data ----
            if (typeof auth === 'undefined' || !auth.checkAuth()) {
                window.location.href = 'login.html';
                return;
            }

            function escapeHtml(str) {
                return String(str == null ? '' : str)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }

            const currentUser = auth.getCurrentUser();
            const profileName = document.querySelector('.profile-card h2');
            if (profileName) {
                profileName.textContent = currentUser.username || currentUser.name || 'User';
            }
            const profileEmail = document.querySelector('.profile-card .user-email');
            if (profileEmail) {
                profileEmail.innerHTML = '<i class="far fa-envelope" style="margin-right:6px;"></i>' + (currentUser.email || '');
            }

            // ---- Avatar (Cloudinary upload by file) ----
            const avatarWrapper = document.getElementById('avatarWrapper');
            const avatarInput = document.getElementById('avatar-upload');
            const avatarImg = document.getElementById('profileAvatar');
            const avatarUploading = document.getElementById('avatarUploading');

            if (avatarImg && currentUser.avatar) {
                avatarImg.src = currentUser.avatar;
            }

            if (avatarWrapper && avatarInput) {
                avatarWrapper.addEventListener('click', function (e) {
                    if (e.target === avatarInput) return;
                    avatarInput.click();
                });
                avatarInput.addEventListener('change', async function () {
                    const file = avatarInput.files && avatarInput.files[0];
                    if (!file) return;
                    if (!file.type || file.type.indexOf('image/') !== 0) {
                        notify.error('Please select an image file to upload.');
                        return;
                    }
                    if (avatarUploading) avatarUploading.hidden = false;
                    try {
                        const url = await uploadImageToCloudinary(file);
                        await auth.updateProfile({ avatar: url });
                        if (avatarImg) avatarImg.src = url;
                        notify.success('Your profile picture was updated!');
                    } catch (error) {
                        console.error('Avatar upload failed:', error);
                        notify.error('Avatar upload failed. Please try again.');
                    } finally {
                        if (avatarUploading) avatarUploading.hidden = true;
                        avatarInput.value = '';
                    }
                });
            }

            // Fill optional profile fields (hide when not set)
            const userPhone = document.getElementById('userPhone');
            const userPhoneText = document.getElementById('userPhoneText');
            if (userPhone && userPhoneText) {
                if (currentUser.phone) {
                    userPhoneText.textContent = currentUser.phone;
                } else {
                    userPhone.style.display = 'none';
                }
            }
            const userAddress = document.getElementById('userAddress');
            const userAddressText = document.getElementById('userAddressText');
            if (userAddress && userAddressText) {
                if (currentUser.address) {
                    userAddressText.textContent = currentUser.address;
                } else {
                    userAddress.style.display = 'none';
                }
            }
            // Fill join date using Firebase Authentication creation time (if available)
            const joinDateText = document.getElementById('joinDateText');
            if (joinDateText) {
                if (currentUser.createdAt) {
                    const d = new Date(currentUser.createdAt);
                    joinDateText.textContent = 'Joined ' + d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                } else {
                    joinDateText.textContent = '';
                }
            }

            // ---- Order History: render from user data ----
            function renderOrders() {
                const orders = (typeof auth.getOrders === 'function') ? auth.getOrders() : [];
                const orderList = document.getElementById('orderList');
                const orderEmpty = document.getElementById('orderEmpty');
                const orderCount = document.getElementById('orderCount');

                if (orderCount) {
                    orderCount.textContent = orders.length + (orders.length === 1 ? ' order' : ' orders');
                }
                if (!orderList || !orderEmpty) return;

                orderList.innerHTML = '';
                orderEmpty.style.display = orders.length ? 'none' : 'block';

                const statusClass = { Processing: 'processing', Shipping: 'shipping', Submit: 'submit', Shipped: 'shipped', Delivered: 'delivered' };
                orders.forEach(order => {
                    const date = new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    const item = document.createElement('div');
                    item.className = 'order-item';
                    const confirmBtn = (order.status === 'Submit')
                        ? '<button class="order-confirm" data-order-id="' + escapeHtml(order.id) + '">Confirm Received</button>'
                        : '';
                    item.innerHTML = `
                        <div class="order-info">
                            <span class="order-id">#${escapeHtml(order.id)}</span>
                            <span class="order-date">${date} &middot; ${order.items ? order.items.length + ' item(s)' : ''}</span>
                            ${confirmBtn}
                        </div>
                        <span class="order-status ${statusClass[order.status] || 'processing'}">${escapeHtml(order.status || 'Processing')}</span>
                        <span class="order-total">$${(order.total || 0).toFixed(2)}</span>
                    `;
                    orderList.appendChild(item);

                    const btn = item.querySelector('.order-confirm');
                    if (btn) {
                        btn.addEventListener('click', async function () {
                            await confirmReceived(order, btn);
                        });
                    }
                });
            }

            // ---- Xác nhận đã nhận hàng: chuyển đơn vào order_history & xoá khỏi orders ----
            async function confirmReceived(order, btn) {
                if (typeof db === 'undefined') {
                    notify.error('Firestore not loaded. Please refresh the page.');
                    return;
                }
                const ok = window.confirm('Have you received order #' + order.id + '?');
                if (!ok) return;

                btn.disabled = true;
                try {
                    const snap = await db.collection('orders')
                        .where('userId', '==', currentUser.id)
                        .get();
                    let matched = null;
                    snap.forEach(doc => {
                        if ((doc.data().id || '') === order.id) matched = doc;
                    });
                    if (!matched) {
                        notify.error('Order not found.');
                        btn.disabled = false;
                        renderOrders();
                        return;
                    }

                    const data = matched.data();
                    data.completedAt = new Date().toISOString();
                    await db.collection('order_history').add(data);
                    await db.collection('orders').doc(matched.id).delete();

                    // Cập nhật cache local để giao diện bỏ đơn đã xác nhận
                    if (typeof auth !== 'undefined' && typeof auth.getOrders === 'function') {
                        const updated = auth.getOrders().filter(o => (o.id || '') !== order.id);
                        auth.setLocalMap('techsphere_orders', currentUser.id, updated);
                    }
                    notify.success('Thank you! Your order has been confirmed.');
                    renderOrders();
                } catch (error) {
                    console.error('Failed to confirm order: ', error);
                    notify.error('Failed to confirm order: ' + ((error && error.message) || 'Please try again.'));
                    btn.disabled = false;
                }
            }

            // ---- Wishlist: render from user data (thumbnail + gia + xoa) ----
            function renderWishlist() {
                const wishlist = (typeof auth.getWishlist === 'function') ? auth.getWishlist() : [];
                const grid = document.getElementById('wishlistGrid');
                const empty = document.getElementById('wishlistEmpty');
                const count = document.getElementById('wishlistCount');

                if (count) {
                    count.textContent = wishlist.length + (wishlist.length === 1 ? ' item' : ' items');
                }
                if (!grid || !empty) return;

                grid.innerHTML = '';
                empty.style.display = wishlist.length ? 'none' : 'block';

                wishlist.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'wishlist-item';
                    const imgHtml = item.image
                        ? '<img class="wishlist-thumb" src="' + item.image + '" alt="" loading="lazy">'
                        : '<div class="wishlist-thumb" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-image"></i></div>';
                    const priceTxt = (item.price != null && !Number.isNaN(Number(item.price)))
                        ? '$' + Number(item.price).toFixed(2) : '';
                    div.innerHTML =
                        imgHtml +
                        '<a class="wl-name" href="product-detail.html?id=' + encodeURIComponent(item.id || '') + '">' +
                            (item.name || 'Unknown product') + '</a>' +
                        (priceTxt ? '<span class="wl-price">' + priceTxt + '</span>' : '') +
                        '<button class="wl-remove" title="Remove from wishlist"><i class="fas fa-times"></i></button>';
                    grid.appendChild(div);

                    div.querySelector('.wl-remove').addEventListener('click', function () {
                        if (typeof auth !== 'undefined' && typeof auth.toggleWishlist === 'function') {
                            auth.toggleWishlist({ id: item.id, name: item.name, price: item.price, image: item.image });
                            renderWishlist();
                            if (window.notify && typeof notify.info === 'function') {
                                notify.info((item.name || 'Item') + ' removed from your wishlist!');
                            }
                        }
                    });
                });
            }

            renderOrders();
            renderWishlist();

            // ---- Purchase History: modal xem toan bo don cu (orders + order_history) ----
            var historyModal = document.getElementById('purchaseHistoryModal');
            var historyBody = document.getElementById('purchaseHistoryBody');
            var historyBtn = document.getElementById('purchaseHistoryBtn');
            var historyOrdersData = [];

            function openPurchaseHistory() {
                if (!historyModal || !historyBody) return;
                historyModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                historyBody.innerHTML = '<div class="ph-loading"><i class="fas fa-spinner fa-spin"></i> Loading purchase history...</div>';

                // Chi lay don hang cua nguoi dung hien tai
                var historyOrders = [];
                if (typeof auth.getOrders === 'function') {
                    (auth.getOrders() || []).forEach(function (o) { historyOrders.push(o); });
                }

                if (typeof db === 'undefined') {
                    historyOrdersData = historyOrders;
                    renderPurchaseHistory(historyOrders);
                    return;
                }

                Promise.all([
                    db.collection('orders').where('userId', '==', currentUser.id).get(),
                    db.collection('order_history').where('userId', '==', currentUser.id).get()
                ]).then(function (results) {
                    var merged = historyOrders.slice();
                    results.forEach(function (snap) {
                        snap.forEach(function (doc) {
                            var data = doc.data() || {};
                            data.__docId = doc.id;
                            merged.push(data);
                        });
                    });
                    // Loại trùng lặp theo id đơn hàng (cache + Firestore)
                    var seen = {};
                    merged = merged.filter(function (o) {
                        var key = String(o.id || o.__docId || '');
                        if (!key || seen[key]) return false;
                        seen[key] = true;
                        return true;
                    });
                    renderPurchaseHistory(merged);
                    historyOrdersData = merged;
                }).catch(function (error) {
                    console.error('Failed to load purchase history: ', error);
                    historyOrdersData = historyOrders;
                    renderPurchaseHistory(historyOrders);
                    if (window.notify) notify.error('Failed to load purchase history.');
                });
            }

            function historyStatusClass(status) {
                var map = { Processing: 'processing', Shipping: 'shipping', Submit: 'submit', Shipped: 'shipped', Delivered: 'delivered' };
                return map[status] || 'processing';
            }

            function renderPurchaseHistory(orders) {
                if (!historyBody) return;
                if (!orders || !orders.length) {
                    historyBody.innerHTML = '<div class="ph-empty"><i class="fas fa-box-open"></i><p>No purchase history yet</p><span>Your completed orders will appear here.</span></div>';
                    return;
                }
                orders.sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });

                var list = document.createElement('div');
                list.className = 'ph-list';

                orders.forEach(function (order) {
                    var date = new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    var items = (Array.isArray(order.items) && order.items.length) ? order.items : [];
                    var itemsHtml = '';

                    items.forEach(function (item) {
                        var imgHtml = item.image
                            ? '<img class="ph-item-thumb" src="' + escapeHtml(item.image) + '" alt="">'
                            : '<div class="ph-item-thumb" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-image" style="font-size:16px;"></i></div>';
                        var priceTxt = (item.price != null && !Number.isNaN(Number(item.price)))
                            ? '$' + Number(item.price).toFixed(2) : '';
                        itemsHtml +=
                            '<div class="ph-item">' +
                                imgHtml +
                                '<div class="ph-item-info">' +
                                    '<a class="ph-item-name" target="_blank" href="product-detail.html?id=' + encodeURIComponent(String(item.id || '')) + '">' + escapeHtml(item.name || 'Unknown product') + '</a>' +
                                    '<div class="ph-item-sub">Qty: ' + (parseInt(item.quantity, 10) || 1) + (priceTxt ? ' &middot; ' + priceTxt : '') + '</div>' +
                                '</div>' +
                            '</div>';
                    });
                    if (!itemsHtml) {
                        itemsHtml = '<div style="font-size:13px;color:var(--gray-dark);padding:6px 0;">No items captured for this order.</div>';
                    }

                    var card = document.createElement('div');
                    card.className = 'ph-order-item';
                    card.setAttribute('data-oid', String(order.id || order.__docId || ''));
                    card.innerHTML =
                        '<div class="ph-order-head">' +
                            '<div>' +
                                '<span class="ph-order-id">#' + escapeHtml(order.id || order.__docId || '') + '</span>' +
                                '<div class="ph-order-date">' + date + ' &middot; ' + items.length + ' item(s)</div>' +
                            '</div>' +
                            '<span class="ph-order-status ' + historyStatusClass(order.status || 'Processing') + '">' + escapeHtml(order.status || 'Processing') + '</span>' +
                            '<span class="ph-order-total">$' + (Number(order.total) || 0).toFixed(2) + '</span>' +
                        '</div>' +
                        itemsHtml +
                        '<div class="ph-actions">' +
                            '<button class="ph-btn ph-buy-again" data-order-id="' + escapeHtml(order.id || order.__docId || '') + '"><i class="fas fa-redo"></i> Buy Again</button>' +
                        '</div>';
                    list.appendChild(card);
                });

                historyBody.innerHTML = '';
                historyBody.appendChild(list);
            }

            function addItemsToCart(items) {
                if (typeof cartManager === 'undefined' || !Array.isArray(items) || !items.length) {
                    if (window.notify) notify.error('Nothing to add to cart.');
                    return;
                }
                var count = 0;
                items.forEach(function (item) {
                    if (!item || !item.id || !item.name) return;
                    cartManager.addItem({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price) || 0,
                        image: item.image || '',
                        category: item.category || '',
                        quantity: parseInt(item.quantity, 10) || 1
                    });
                    count++;
                });
                if (window.notify) notify.success(count + ' item(s) added to your cart!');
                if (typeof cartManager.updateCartIcon === 'function') cartManager.updateCartIcon();
            }

            // Mua lai: lay don hang tu data da fetch (orders + order_history)
            function findOrderById(orderId) {
                return historyOrdersData.find(function (o) {
                    return String(o.id || o.__docId || '') === String(orderId);
                }) || null;
            }

            if (historyBtn) {
                historyBtn.addEventListener('click', openPurchaseHistory);
            }
            var historyClose = document.getElementById('purchaseHistoryClose');
            if (historyClose) {
                historyClose.addEventListener('click', function () {
                    historyModal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            if (historyModal) {
                historyModal.addEventListener('click', function (e) {
                    if (e.target === historyModal) {
                        historyModal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            }
            if (historyBody) {
                historyBody.addEventListener('click', function (e) {
                    var isAdd = e.target.closest('.ph-btn-add');
                    var isBuyAgain = e.target.closest('.ph-buy-again');
                    if (isAdd || isBuyAgain) {
                        var order = findOrderById((isAdd || isBuyAgain).dataset.orderId);
                        if (order && Array.isArray(order.items) && order.items.length) {
                            addItemsToCart(order.items);
                        } else if (window.notify) {
                            notify.error('No items to add for this order.');
                        }
                    }
                });
            }
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && historyModal && historyModal.classList.contains('active')) {
                    historyModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Render lai khi du lieu tu Firestore duoc tai xong (auth.pullUserData)
            window.addEventListener('auth:data-pulled', function () {
                // // Cp nht thng tin user (c th mi hn sau khi ti profile)
                const refreshed = auth.getCurrentUser();
                if (refreshed) {
                    if (profileName) profileName.textContent = refreshed.username || 'User';
                    if (profileEmail) profileEmail.innerHTML = '<i class="far fa-envelope" style="margin-right:6px;"></i>' + (refreshed.email || '');
                    if (avatarImg && refreshed.avatar) avatarImg.src = refreshed.avatar;
                }
                renderOrders();
                renderWishlist();
            });

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    auth.logout();
                    window.location.href = 'login.html';
                });
            }

            // ---- Mobile menu toggle ----
            const menuBtn = document.getElementById('mobile-menu-btn');
            const nav = document.getElementById('main-nav');
            if (menuBtn && nav) {
                menuBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    nav.classList.toggle('active');
                    const icon = menuBtn.querySelector('i');
                    if (nav.classList.contains('active')) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
                document.addEventListener('click', function(e) {
                    if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
                        nav.classList.remove('active');
                        const icon = menuBtn.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
            }

            // ---- Account Settings: load saved state & persist changes ----
            const settings = (typeof auth.getSettings === 'function') ? auth.getSettings() : {};
            const languageEl = document.getElementById('settingLanguage');
            const paymentEl = document.getElementById('settingPayment');
            if (languageEl) languageEl.textContent = settings.language || 'English (US)';
            if (paymentEl) paymentEl.textContent = settings.paymentMethod || 'Not set';

            const notifToggle = document.getElementById('notifToggle');
            const darkToggle = document.getElementById('darkToggle');
            if (notifToggle) notifToggle.classList.toggle('active', !!settings.notifications);
            if (darkToggle) darkToggle.classList.toggle('active', !!settings.darkMode);

            if (notifToggle) {
                notifToggle.addEventListener('click', function() {
                    this.classList.toggle('active');
                    if (typeof auth.saveSettings === 'function') {
                        auth.saveSettings({ notifications: this.classList.contains('active') });
                    }
                });
            }
            if (darkToggle) {
                darkToggle.addEventListener('click', function() {
                    this.classList.toggle('active');
                    if (typeof auth.saveSettings === 'function') {
                        auth.saveSettings({ darkMode: this.classList.contains('active') });
                    }
                });
            }

            // ---- Edit profile button ----
            const editBtn = document.getElementById('editProfileBtn');
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    notify.info('Edit profile form would open here. (Full edit functionality can be implemented.)');
                });
            }

            // ---- Search icon: chuyen sang trang tim kiem ----
            const searchIcon = document.querySelector('.header-icons .fa-search');
            if (searchIcon) {
                searchIcon.style.cursor = 'pointer';
                searchIcon.addEventListener('click', function() {
                    window.location.href = 'main.html?search=';
                });
            }

        })();
