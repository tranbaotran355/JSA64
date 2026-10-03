// js/admin-users.js - Quản lý người dùng (admin): danh sách users, ban/unban, xóa
// Dữ liệu: collection Firestore 'users' (profile của mỗi tài khoản).
// Cần nhúng Firebase SDK + configFirebase + auth.js trước file này.

(function () {
    'use strict';

    function tr(s) {
        return (typeof I18n !== 'undefined' && I18n) ? I18n.t(s) : s;
    }

    if (typeof auth === 'undefined' || !auth.isAdmin() || typeof db === 'undefined') {
        console.warn('Admin users: not loaded (not admin or firebase missing).');
        return;
    }

    /* ── DOM ── */
    const tableBody = document.getElementById('users-table-body');
    const countEl = document.getElementById('users-count');
    const banModal = document.getElementById('ban-user-modal');
    const banClose = document.getElementById('ban-modal-close');
    const banCancel = document.getElementById('ban-modal-cancel');
    const banConfirm = document.getElementById('ban-modal-confirm');
    const banDesc = document.getElementById('ban-modal-desc');
    const durationOptions = document.getElementById('ban-duration-options');

    /* ── State ── */
    let pendingBanId = null;   // uid đang chờ xác nhận ban
    let pendingBanName = '';
    let selectedDuration = '1 day';

    /* ── BAN_DURATIONS: đơn vị ms ── */
    const DAY = 24 * 60 * 60 * 1000;
    const DURATIONS = {
        '1 day': 1 * DAY,
        '1 week': 7 * DAY,
        '1 month': 30 * DAY,
        '1 year': 365 * DAY,
        'forever': null
    };

    /* ── Helpers ── */
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function formatDate(iso) {
        if (!iso) return tr('Unknown');
        var d = new Date(iso);
        if (isNaN(d.getTime())) return tr('Unknown');
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function usernameOf(user) {
        var un = user.username || '';
        var email = String(user.email || '');
        var prefix = email.split('@')[0] || '';
        // Nếu có username riêng thì dùng nó, ngược lại lấy phần trước @ của email
        return un && un.toLowerCase() !== prefix.toLowerCase() ? un : prefix;
    }

    function isBanned(user) {
        var b = user.ban;
        if (!b || b.banned !== true) return false;
        if (b.until == null) return true; // forever
        var until = new Date(b.until).getTime();
        if (isNaN(until)) return true;
        return until > Date.now();
    }

    function banInfo(user) {
        var b = user.ban;
        if (!b) return {};
        return {
            banned: isBanned(user),
            until: b.until || null,
            duration: b.duration || 'forever',
            at: b.at || ''
        };
    }

    /* ── Render bảng users ── */
    function renderUsers(users) {
        if (!tableBody) return;
        if (countEl) {
            var total = users.length;
            var bannedCount = users.filter(function (u) { return isBanned(u); }).length;
            countEl.innerHTML = '<i class="fas fa-user"></i> ' + total + ' ' + tr('users') +
                (bannedCount ? ' <span class="users-count-banned">· ' + bannedCount + ' ' + tr('banned') + '</span>' : '');
        }

        if (!users || !users.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">' + tr('No users found.') + '</td></tr>';
            return;
        }

        const html = users.map(function (user, i) {
            var info = banInfo(user);
            var name = usernameOf(user);

            var statusHtml = info.banned
                ? '<span class="user-status-badge banned" title="' + escapeHtml(tr('Banned until ') + (info.until ? formatDate(info.until) : tr('Forever'))) + '">'
                + '<i class="fas fa-ban"></i> ' + tr('Banned') + '</span>'
                : '<span class="user-status-badge active"><i class="fas fa-check-circle"></i> ' + tr('Active') + '</span>';

            var banLabel = info.banned ? tr('Unban') : tr('Ban');
            var banBtn = '<button type="button" class="btn-user btn-ban" data-id="' + user.__uid
                + '" data-name="' + escapeHtml(name) + '" data-role="' + escapeHtml(user.role || 'customer') + '" data-action="' + (info.banned ? 'unban' : 'ban') + '">'
                + '<i class="fas fa-' + (info.banned ? 'undo' : 'ban') + '"></i> ' + banLabel + '</button>';

            var deleteBtn = '<button type="button" class="btn-user btn-delete" data-id="' + user.__uid
                + '" data-name="' + escapeHtml(name) + '" data-role="' + escapeHtml(user.role || 'customer') + '" data-action="delete">'
                + '<i class="fas fa-trash-alt"></i> ' + tr('Delete') + '</button>';

            return '<tr>'
                + '<td data-label="' + tr('Index') + '">' + (i + 1) + '</td>'
                + '<td data-label="' + tr('Name') + '"><span class="user-name">' + escapeHtml(user.username || name) + '</span></td>'
                + '<td data-label="' + tr('Username') + '">@' + escapeHtml(name) + '</td>'
                + '<td data-label="' + tr('Email') + '">' + escapeHtml(user.email || '—') + '</td>'
                + '<td data-label="' + tr('Registered') + '">' + (user.createdAt ? formatDate(user.createdAt) : tr('Unknown')) + '</td>'
                + '<td data-label="' + tr('Status') + '">' + statusHtml + '</td>'
                + '<td data-label="' + tr('Actions') + '"><div class="user-actions">' + banBtn + deleteBtn + '</div></td>'
                + '</tr>';
        }).join('');

        tableBody.innerHTML = html;
    }

    /* ── Nạp dữ liệu users ── */
    function collectUsers(snapshot) {
        var users = [];
        snapshot.forEach(function (doc) {
            var data = doc.data() || {};
            data.__uid = doc.id;
            users.push(data);
        });
        users = users.filter(function (u) {
            return (u.role || 'customer') !== 'admin';
        });
        users.sort(function (a, b) {
            var t1 = new Date(a.createdAt || 0).getTime();
            var t2 = new Date(b.createdAt || 0).getTime();
            if (t1 !== t2) return t2 - t1;
            return String(a.email || '').localeCompare(String(b.email || ''));
        });
        return users;
    }

    function subscribeUsers() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> ' + tr('Loading users...') + '</td></tr>';
        try {
            db.collection('users').onSnapshot(function (snapshot) {
                renderUsers(collectUsers(snapshot));
            }, function (error) {
                console.error('Users listener failed: ', error);
                loadUsersOnce();
            });
        } catch (error) {
            console.error('Users listener setup failed: ', error);
            loadUsersOnce();
        }
    }

    function loadUsersOnce() {
        if (!tableBody) return;
        db.collection('users').get()
            .then(function (snapshot) {
                renderUsers(collectUsers(snapshot));
            })
            .catch(function (error) {
                console.error('Failed to load users: ', error);
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">' +
                    tr('Failed to load users. Check console / Firestore rules.') + '</td></tr>';
            });
    }

    /* ── Modal ban ── */
    function openBanModal(uid, name) {
        if (!banModal) return;
        pendingBanId = uid;
        pendingBanName = name || '';
        selectedDuration = '1 day';
        if (banDesc) {
            banDesc.innerHTML = tr('Please choose how long this account should be banned:') + '<br>'
                + '<strong>' + escapeHtml(pendingBanName) + '</strong> <span class="ban-modal-mail">' + escapeHtml(getUserEmail(uid)) + '</span>';
        }
        highlightDuration(selectedDuration);
        banModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeBanModal() {
        if (!banModal) return;
        banModal.classList.remove('active');
        document.body.style.overflow = '';
        pendingBanId = null;
        pendingBanName = '';
    }

    function getUserEmail(uid) {
        if (!tableBody) return '';
        var rows = tableBody.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
            var btn = rows[i].querySelector('[data-id="' + uid + '"]');
            if (btn) {
                var emailCell = rows[i].querySelector('td:nth-child(4)');
                return emailCell ? emailCell.textContent.trim() : '';
            }
        }
        return '';
    }

    function highlightDuration(d) {
        if (!durationOptions) return;
        durationOptions.querySelectorAll('.ban-option').forEach(function (opt) {
            opt.classList.toggle('selected', opt.dataset.duration === d);
        });
    }

    if (durationOptions) {
        durationOptions.addEventListener('click', function (e) {
            var opt = e.target.closest('.ban-option');
            if (!opt) return;
            selectedDuration = opt.dataset.duration;
            highlightDuration(selectedDuration);
        });
    }
    if (banClose) banClose.addEventListener('click', closeBanModal);
    if (banCancel) banCancel.addEventListener('click', closeBanModal);
    if (banModal) {
        banModal.addEventListener('click', function (e) {
            if (e.target === banModal) closeBanModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeBanModal();
    });

    /* ── Hành động ban / unban / delete ── */
    if (banConfirm) {
        banConfirm.addEventListener('click', async function () {
            if (!pendingBanId) return;
            var duration = selectedDuration || '1 day';

            var until = null;
            var ms = DURATIONS[duration];
            if (ms != null) until = new Date(Date.now() + ms).toISOString();

            var btn = banConfirm;
            btn.disabled = true;
            try {
                await db.collection('users').doc(pendingBanId).update({
                    ban: { banned: true,
                        until: until,
                        // Bản sao dạng Timestamp cho Firestore Rules: Rules không
                        // so sánh được chuỗi ISO với request.time, còn field `until`
                        // ở trên vẫn giữ nguyên để auth.js đọc.
                        untilTs: ms == null ? null : firebase.firestore.Timestamp.fromMillis(Date.now() + ms),
                        at: new Date().toISOString(),
                        duration: duration }
                });
                if (window.notify && notify.success) {
                    var label = duration === 'forever' ? tr('Forever') : duration;
                    notify.success(tr('User banned for ') + tr(label) + '.');
                }
                closeBanModal();
            } catch (error) {
                console.error('Failed to ban user: ', error);
                if (window.notify && notify.error) notify.error(tr('Failed to ban user: ') + error.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    async function unbanUser(uid) {
        try {
            await db.collection('users').doc(uid).update({
                ban: null
            });
            if (window.notify && notify.success) notify.success(tr('User unbanned successfully.'));
        } catch (error) {
            console.error('Failed to unban user: ', error);
            if (window.notify && notify.error) notify.error(tr('Failed to unban user: ') + error.message);
        }
    }

    if (tableBody) {
        tableBody.addEventListener('click', async function (e) {
            var btn = e.target.closest('.btn-user');
            if (!btn) return;
            var uid = btn.dataset.id;
            var name = btn.dataset.name || '';
            var action = btn.dataset.action;
            var roleTarget = btn.dataset.role || 'customer';

            // Không cho phép xóa hoặc ban tài khoản admin
            if (roleTarget === 'admin') {
                if (window.notify && notify.error) notify.error(tr('Không thể xóa hoặc cấm tài khoản quản trị viên.'));
                return;
            }

            // Bảo vệ tài khoản admin hiện tại
            if (uid && auth.currentUser && uid === auth.currentUser.id && action !== 'unban') {
                var selfMsg = action === 'delete'
                    ? 'You cannot delete your own admin account.'
                    : 'You cannot ban your own admin account.';
                if (window.notify && notify.error) notify.error(tr(selfMsg));
                return;
            }

            if (action === 'ban') {
                openBanModal(uid, name);
                return;
            }
            if (action === 'unban') {
                await unbanUser(uid);
                return;
            }
            if (action === 'delete') {
                if (!window.confirm(tr('Are you sure you want to delete this user?') + '\n\n' + name)) return;
                try {
                    await db.collection('users').doc(uid).delete();
                    if (window.notify && notify.success) notify.success(tr('User deleted successfully.'));
                } catch (error) {
                    console.error('Failed to delete user: ', error);
                    if (window.notify && notify.error) notify.error(tr('Failed to delete user: ') + error.message);
                }
            }
        });
    }

/* ── Khởi tạo ── */
    subscribeUsers();
})();