// js/pages/wishlist.js - Trang danh sach yeu thich
document.addEventListener('DOMContentLoaded', function () {
            const grid = document.getElementById('wishlistGrid');
            const emptyEl = document.getElementById('wishlistEmpty');
            const subtitle = document.getElementById('wishlist-subtitle');
            const addAllBtn = document.getElementById('add-all-btn');

            function escapeHtml(str) {
                return String(str == null ? '' : str)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }

            function render() {
                const wishlist = (typeof auth !== 'undefined' && auth.getWishlist) ? auth.getWishlist() : [];
                grid.innerHTML = '';

                // Số lượng hiển thị
                subtitle.textContent = wishlist.length
                    ? `${wishlist.length} saved item${wishlist.length !== 1 ? 's' : ''}`
                    : 'Your wishlist is empty';
                addAllBtn.disabled = wishlist.length === 0;

                if (!wishlist.length) {
                    emptyEl.style.display = 'block';
                    return;
                }
                emptyEl.style.display = 'none';

                wishlist.forEach(item => {
                    const thumb = item.image
                        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">`
                        : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;"><i class="fas fa-image" style="font-size:34px;"></i></div>';
                    const price = (parseFloat(item.price) || 0).toFixed(2);

                    const card = `
                        <div class="wishlist-card" data-id="${escapeHtml(item.id)}">
                            <div class="wl-thumb-wrap">
                                ${thumb}
                                <button class="wl-remove" data-id="${escapeHtml(item.id)}" title="Remove from wishlist">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="wl-info">
                                <div class="wl-category">${escapeHtml(item.category || 'Other')}</div>
                                <a class="wl-name" href="product-detail.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a>
                                <div class="wl-price">$${price}</div>
                                <button class="wl-add-cart" data-id="${escapeHtml(item.id)}">
                                    <i class="fas fa-shopping-cart"></i> Add to Cart
                                </button>
                            </div>
                        </div>`;
                    grid.insertAdjacentHTML('beforeend', card);
                });
            }

            // Xoá khỏi wishlist
            grid.addEventListener('click', function (e) {
                const removeBtn = e.target.closest('.wl-remove');
                if (removeBtn && typeof auth !== 'undefined') {
                    const id = removeBtn.dataset.id;
                    const item = auth.getWishlist().find(i => String(i.id) === String(id)) || {};
                    auth.toggleWishlist(item);
                    if (window.notify) notify.info(`${item.name || 'Item'} removed from your wishlist.`);
                }
            });

            // Thêm vào giỏ (giữ lại trong wishlist)
            grid.addEventListener('click', function (e) {
                const addBtn = e.target.closest('.wl-add-cart');
                if (!addBtn || typeof cartManager === 'undefined' || typeof auth === 'undefined') return;

                const id = addBtn.dataset.id;
                const item = auth.getWishlist().find(i => String(i.id) === String(id));
                if (!item) return;

                if (cartManager.addItem({ ...item, quantity: 1 })) {
                    addBtn.classList.add('added');
                    addBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                    setTimeout(() => {
                        addBtn.classList.remove('added');
                        addBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                    }, 1500);
                    if (window.notify) notify.success(`${item.name} added to cart!`);
                } else if (window.notify) {
                    notify.error('Failed to add item to cart.');
                }
            });

            // Thêm toàn bộ wishlist vào giỏ
            addAllBtn.addEventListener('click', function () {
                if (typeof cartManager === 'undefined' || typeof auth === 'undefined') return;
                const wishlist = auth.getWishlist();
                let count = 0;
                wishlist.forEach(item => {
                    if (cartManager.addItem({ ...item, quantity: 1 })) count++;
                });
                if (window.notify) {
                    if (count > 0) notify.success(`Added ${count} item${count !== 1 ? 's' : ''} to your cart!`);
                    else notify.error('Could not add items to cart.');
                }
            });

            // Render lần đầu + khi wishlist đổi (local / cloud / realtime)
            render();
            window.addEventListener('wishlist:updated', render);
            window.addEventListener('auth:data-pulled', render);
        });

