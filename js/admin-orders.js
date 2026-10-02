// js/admin-orders.js - Quản lý đơn hàng (admin): danh sách tất cả orders, đổi trạng thái, lịch sử
// Dữ liệu: collection Firestore 'orders' (đơn đang xử lý) và 'order_history' (đơn đã hoàn thành).
// Cần nhúng Firebase SDK + configFirebase + auth.js trước file này.

(function () {
    'use strict';

    function tr(s) {
        return (typeof I18n !== 'undefined' && I18n) ? I18n.t(s) : s;
    }

    if (typeof auth === 'undefined' || !auth.isAdmin() || typeof db === 'undefined') {
        console.warn('Admin orders: not loaded (not admin or firebase missing).');
        return;
    }

    /* ── DOM ── */
    const tableBody = document.getElementById('orders-table-body');
    const historyBtn = document.getElementById('orders-history-btn');
    const historyModal = document.getElementById('order-history-modal');
    const historyClose = document.getElementById('orders-history-close');
    const historyBody = document.getElementById('history-modal-body');

    const STATUSES = ['Processing', 'Shipping', 'Submit'];

    /* ── Helpers ── */
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function formatDate(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function customerName(order) {
        var c = order.customer || {};
        var full = [c.firstName, c.lastName].filter(Boolean).join(' ');
        return full || order.userEmail || tr('Guest');
    }

    function customerAddress(order) {
        var c = order.customer || {};
        return [c.address, c.city, c.state, c.zip, c.country].filter(Boolean).join(', ');
    }

    function itemCount(order) {
        if (order.itemCount != null) return order.itemCount;
        return Array.isArray(order.items) ? order.items.length : 0;
    }

    /* ── Render bảng đơn hàng ── */
    function renderOrders(orders) {
        if (!tableBody) return;
        if (!orders || !orders.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">' + tr('No orders yet.') + '</td></tr>';
            return;
        }

        var html = orders.map(function (order) {
            var statusRaw = order.status || 'Processing';
            var status = tr(statusRaw);
            var address = customerAddress(order);
            var title = address ? ' title="' + escapeHtml(tr('Ship to: ') + address) + '"' : '';
            return '<tr' + title + '>'
                + '<td data-label="' + tr('Order ID') + '"><span class="order-id-cell">#' + escapeHtml(order.id || order.__docId) + '</span></td>'
                + '<td data-label="' + tr('Date') + '">' + formatDate(order.date) + '</td>'
                + '<td data-label="' + tr('Customer') + '"><div class="customer-cell">'
                + '<span class="customer-name">' + escapeHtml(customerName(order)) + '</span>'
                + '<span class="customer-mail">' + escapeHtml(order.userEmail || ((order.customer || {}).email || '')) + '</span>'
                + (order.username ? '<span class="customer-user">@' + escapeHtml(order.username) + '</span>' : '')
                + '</div></td>'
                + '<td data-label="' + tr('Items') + '">' + itemCount(order) + '</td>'
                + '<td data-label="' + tr('Total') + '">$' + (parseFloat(order.total) || 0).toFixed(2) + '</td>'
                + '<td data-label="' + tr('Status') + '"><span class="order-status-badge ' + statusRaw.toLowerCase() + '">' + status + '</span></td>'
                + '<td data-label="' + tr('Actions') + '"><div class="status-actions">'
                + STATUSES.map(function (s) {
                    var active = statusRaw === s ? ' active' : '';
                    return '<button type="button" class="status-btn' + active + '" data-id="' + order.__docId + '" data-status="' + s + '">' + tr(s) + '</button>';
                }).join('')
                + '</div></td>'
                + '</tr>';
        }).join('');

        tableBody.innerHTML = html;
    }

    /* ── Đổi trạng thái đơn hàng ── */
    if (tableBody) {
        tableBody.addEventListener('click', async function (e) {
            var btn = e.target.closest('.status-btn');
            if (!btn) return;

            var docId = btn.dataset.id;
            var status = btn.dataset.status;
            var row = btn.closest('tr');
            var badge = row.querySelector('.order-status-badge');

            btn.disabled = true;
            try {
                await db.collection('orders').doc(docId).update({ status: status });
                badge.className = 'order-status-badge ' + status.toLowerCase();
                badge.textContent = tr(status);
                row.querySelectorAll('.status-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                if (window.notify && notify.success) notify.success(tr('Order status updated to ') + tr(status));
            } catch (error) {
                console.error('Failed to update order status: ', error);
                if (window.notify && notify.error) notify.error(tr('Failed to update status: ') + error.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    /* ── Nạp dữ liệu orders (realtime + fallback) ── */
    function collectOrders(snapshot) {
        var orders = [];
        snapshot.forEach(function (doc) {
            var data = doc.data() || {};
            data.__docId = doc.id;
            orders.push(data);
        });
        return orders;
    }

    function subscribeOrders() {
        try {
            db.collection('orders')
                .orderBy('date', 'desc')
                .onSnapshot(function (snapshot) {
                    renderOrders(collectOrders(snapshot));
                }, function (error) {
                    console.error('Orders listener failed: ', error);
                    loadOrdersOnce();
                });
        } catch (error) {
            console.error('Orders listener setup failed: ', error);
            loadOrdersOnce();
        }
    }

    function loadOrdersOnce() {
        db.collection('orders').get()
            .then(function (snapshot) {
                var orders = collectOrders(snapshot);
                orders.sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
                renderOrders(orders);
            })
            .catch(function (error) {
                console.error('Failed to load orders: ', error);
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">' +
                        tr('Failed to load orders. Check console / Firestore rules.') + '</td></tr>';
                }
            });
    }

    /* ── Lịch sử đơn hàng (popup) ── */
    function renderHistory(orders) {
        if (!historyBody) return;
        if (!orders || !orders.length) {
            historyBody.innerHTML = '<div style="text-align:center;color:#6b7280;padding:40px 0;">' + tr('No completed orders yet.') + '</div>';
            return;
        }

        var html = orders.map(function (o) {
            var when = o.completedAt ? formatDate(o.completedAt) : (formatDate(o.date) || '');
            return '<div class="history-item">'
                + '<div class="history-item-head">'
                + '<span class="order-id-cell">#' + escapeHtml(o.id || o.__docId || '') + '</span>'
                + '<span class="history-completed"><i class="fas fa-check-circle"></i> ' + tr('Completed ') + when + '</span>'
                + '</div>'
                + '<div class="history-item-sub">'
                + '<span class="history-customer">'
                + '<span class="history-customer-name">' + escapeHtml(customerName(o)) + '</span>'
                + (o.username ? ' @' + escapeHtml(o.username) : '')
                + '<span class="customer-mail">' + escapeHtml(o.userEmail || ((o.customer || {}).email || '')) + '</span>'
                + '</span>'
                + '<span>' + itemCount(o) + ' ' + tr('item(s)') + '</span>'
                + '<span>$' + (parseFloat(o.total) || 0).toFixed(2) + '</span>'
                + '</div>'
                + '</div>';
        }).join('');

        historyBody.innerHTML = '<div class="history-list">' + html + '</div>';
    }

    function openHistory() {
        if (!historyModal) return;
        historyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (historyBody) {
            historyBody.innerHTML = '<div style="text-align:center;color:#6b7280;padding:30px 0;"><i class="fas fa-spinner fa-spin"></i> ' + tr('Loading history...') + '</div>';
        }
        db.collection('order_history')
            .orderBy('completedAt', 'desc')
            .get()
            .then(function (snapshot) {
                renderHistory(collectOrders(snapshot));
            })
            .catch(function (error) {
                console.error('Failed to load order history: ', error);
                if (historyBody) {
                    historyBody.innerHTML = '<div style="text-align:center;color:#b91c1c;padding:30px 0;">' +
                        tr('Failed to load history. Check console / Firestore rules.') + '</div>';
                }
            });
    }

    function closeHistory() {
        if (!historyModal) return;
        historyModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (historyBtn) historyBtn.addEventListener('click', openHistory);
    if (historyClose) historyClose.addEventListener('click', closeHistory);
    if (historyModal) {
        historyModal.addEventListener('click', function (e) {
            if (e.target === historyModal) closeHistory();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeHistory();
    });

    /* ── Khởi tạo ── */
    subscribeOrders();
})();