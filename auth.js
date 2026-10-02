// auth.js - Hệ thống xác thực người dùng bằng Firebase Auth + Firestore (giống Buoi3)
// Quản lý đăng ký, đăng nhập, đăng xuất và đồng bộ giỏ hàng/đơn hàng/wishlist lên Firestore
//
// Collections trên Firestore:
//   users/{uid}            : { username, email, role, createdAt, phone, address, settings }
//   carts/{uid}            : { items: [...] }                        - giỏ hàng theo tài khoản
//   wishlist/{uid}         : { items: [...] }                        - yêu thích theo tài khoản
//   orders/{autoId}        : { userId, id, date, items, total, ... } - đơn hàng
//
// Dữ liệu vẫn được mirror xuống localStorage để các trang đọc đồng bộ không bị vỡ.
//
// QUYỀN ADMIN KHÔNG ĐƯỢC CẤP TỪ PHÍA CLIENT.
// Trước đây file này tự tạo sẵn một tài khoản admin với mật khẩu hardcode và tự
// gán role: 'admin' cho các email trong danh sách. Cả hai đều đã bị xoá vì
// Firestore Security Rules (firestore.rules) chặn ghi role, và vì mật khẩu nằm
// trong mã nguồn công khai là lỗ hổng chiếm quyền quản trị.
// Tài khoản admin phải được tạo tay trong Firebase Console rồi gán role: 'admin'.

class AuthSystem {
    constructor() {
        this.currentUser = null;        // Người dùng hiện tại
        this.isLoggedIn = false;        // Trạng thái đã đăng nhập
        this._signingOut = false;       // Cờ đang đăng xuất (chặn onAuthStateChanged ghi đè)
        this.init();
    }

    // Firebase SDK có sẵn chưa (cần nhúng CDN + js/configFirebase.js trước file này)
    get firebaseReady() {
        return typeof firebase !== 'undefined' && !!firebase.auth && typeof db !== 'undefined';
    }

    init() {
        this.loadCurrentUser();         // Khôi phục phiên từ localStorage (hiển thị nhanh UI)
        this.updateUI();                // Cập nhật giao diện theo trạng thái
        this.updateCartIcon();          // Cập nhật số lượng giỏ hàng
        this.updateWishlistIcon();      // Cập nhật số lượng wishlist
        this.watchAuthState();          // Đồng bộ phiên đăng nhập với Firebase
    }

    /* ══════════════ ĐỒNG BỘ PHIÊN VỚI FIREBASE ══════════════ */

    watchAuthState() {
        if (!this.firebaseReady) {
            console.warn('auth.js: Firebase chưa sẵn sàng, chạy chế độ offline.');
            return;
        }
        firebaseAuth.onAuthStateChanged(async (fbUser) => {
            if (fbUser) {
                try {
                    const profile = await this.fetchOrCreateProfile(fbUser);
                    const banCheck = await this.checkBan(profile, fbUser.uid);
                    if (banCheck.banned) {
                        this._handleBanSignout(banCheck.message);
                        return;
                    }
                    this.currentUser = { id: fbUser.uid, ...profile };
                    this.isLoggedIn = true;
                    localStorage.setItem('techsphere_current_user', JSON.stringify(this.currentUser));
                    await this.pullUserData();       // Tải giỏ hàng/đơn hàng/wishlist từ Firestore
                    this.attachRealtimeSync();       // Lắng nghe thay đổi giỏ hàng/wishlist theo thời gian thực
                } catch (error) {
                    console.error('auth.js: load profile failed', error);
                }
            } else if (this.isLoggedIn && !this._signingOut) {
                // Bị đăng xuất từ nơi khác / phiên hết hạn
                this.detachRealtimeSync();
                this.currentUser = null;
                this.isLoggedIn = false;
                localStorage.removeItem('techsphere_current_user');
            }
            this.updateUI();
            this.updateCartIcon();
            this.updateWishlistIcon();
        });
    }

    // Lấy profile từ Firestore users/{uid}; nếu chưa có thì tạo mới
    async fetchOrCreateProfile(fbUser) {
        const ref = db.collection('users').doc(fbUser.uid);
        const snap = await ref.get();
        let profile;
        if (snap.exists) {
            profile = snap.data() || {};
        } else {
            // Không ghi `role`: Firestore Rules chỉ cho admin tạo field này.
            // Tài khoản đăng ký bình thường sẽ không có field role.
            profile = {
                username: fbUser.displayName || String(fbUser.email || 'user').split('@')[0],
                email: fbUser.email,
                createdAt: new Date().toISOString()
            };
            await ref.set(profile);
        }
        const clean = {
            username: profile.username,
            email: profile.email,
            role: profile.role || 'customer',
            createdAt: profile.createdAt,
            phone: profile.phone || '',
            address: profile.address || '',
            avatar: profile.avatar || '',
            settings: profile.settings || null,
            ban: profile.ban || null
        };
        if (!clean.settings) delete clean.settings;
        if (!clean.ban) delete clean.ban;
        if (!clean.avatar) delete clean.avatar;
        return clean;
    }

    // Kiểm tra ban của user: account bị cấm sẽ không được đăng nhập/sử dụng
    // - ban.banned === true và ban.until == null  => cấm vĩnh viễn
    // - ban.banned === true và ban.until trong tương lai => cấm tới thời điểm đó
    // - hết hạn ban => tự gỡ ban (xóa field) và coi như bình thường
    async checkBan(profile, uid) {
        var b = profile && profile.ban;

        if (!b || b.banned !== true) {
            return { banned: false };
        }

        var untilRaw = b.until;

        if (untilRaw == null) {
            return {
                banned: true,
                forever: true,
                duration: b.duration || 'forever',
                until: null,
                message: 'Tài khoản của bạn đã bị ban vĩnh viễn.'
            };
        }

        var untilMs = new Date(untilRaw).getTime();

        if (isNaN(untilMs)) {
            return {
                banned: true,
                forever: true,
                duration: b.duration || 'forever',
                until: null,
                message: 'Tài khoản của bạn đã bị ban vĩnh viễn.'
            };
        }

        if (untilMs <= Date.now()) {
            // Ban đã hết hạn -> coi như bình thường.
            // KHÔNG tự ghi `ban: null` vào Firestore: Firestore Rules chỉ cho admin
            // chạm vào field `ban`, nên lệnh này sẽ bị từ chối. Rules tự coi ban
            // đã hết hạn là không bị ban, nên không cần dọn field.
            // Muốn xoá hẳn field `ban` thì admin gỡ ban trong trang quản trị.
            return { banned: false };
        }

        var durationLabels = {
            '1 day': '1 ngày',
            '1 week': '1 tuần',
            '1 month': '1 tháng',
            '1 year': '1 năm',
            'forever': 'vĩnh viễn'
        };
        var durationText = durationLabels[b.duration] || b.duration || '';
        var dateStr = new Date(untilMs).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return {
            banned: true,
            forever: false,
            duration: b.duration || '',
            until: untilMs,
            message: 'Tài khoản của bạn đã bị ban ' + durationText + ', đến ' + dateStr + '.'
        };
    }

    // Đăng xuất khẩn cấp khi account bị ban trong lúc đang sử dụng
    _handleBanSignout(message) {
        try {
            sessionStorage.setItem(
                'techsphere_ban_notice',
                message || 'Tài khoản của bạn đã bị ban.'
            );
        } catch (_) { }

        this._signingOut = true;
        this.detachRealtimeSync();

        localStorage.removeItem('techsphere_current_user');
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();

        var self = this;
        if (this.firebaseReady) {
            firebaseAuth.signOut().finally(function () {
                self._signingOut = false;
            });
        } else {
            this._signingOut = false;
        }

        if (window.location.pathname.toLowerCase().indexOf('login.html') !== -1) {
            window.location.reload();
        } else {
            window.location.href = 'login.html';
        }
    }

    // Chuyển lỗi Firebase thành thông báo thân thiện
    friendlyError(error) {
        const code = error && error.code ? error.code : '';
        switch (code) {
            case 'auth/email-already-in-use': return 'Email already registered';
            case 'auth/invalid-email': return 'Please enter a valid email address';
            case 'auth/weak-password': return 'Password should be at least 6 characters';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': return 'Invalid email or password';
            case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
            case 'auth/network-request-failed': return 'Network error. Please check your connection.';
            default: return (error && error.message) ? error.message : 'Something went wrong';
        }
    }

    /* ══════════════ ĐĂNG KÝ / ĐĂNG NHẬP / ĐĂNG XUẤT ══════════════ */

    // Đăng ký người dùng mới bằng Firebase Auth + lưu profile vào Firestore
    async register(userData) {
        if (!this.firebaseReady) return { success: false, message: 'Firebase not loaded. Please refresh the page.' };
        if (!userData.username || !userData.email || !userData.password) {
            return { success: false, message: 'All fields are required' };
        }

        const email = userData.email.trim().toLowerCase();

        try {
            const cred = await firebaseAuth.createUserWithEmailAndPassword(email, userData.password);
            const uid = cred.user.uid;

            const profile = {
                username: userData.username,
                email: email,
                createdAt: new Date().toISOString()
            };
            await db.collection('users').doc(uid).set(profile);

            this.currentUser = { id: uid, ...profile };
            this.isLoggedIn = true;
            localStorage.setItem('techsphere_current_user', JSON.stringify(this.currentUser));

            await this.mergeGuestCartToCloud();     // Gộp giỏ hàng khách vào tài khoản
            await this.mergeGuestWishlistToCloud(); // Gộp wishlist khách vào tài khoản
            this.updateUI();
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Register failed:', error);
            return { success: false, message: this.friendlyError(error) };
        }
    }

    // Đăng nhập bằng Firebase Auth, sau đó tải profile từ Firestore
    async login(email, password) {
        if (!this.firebaseReady) return { success: false, message: 'Firebase not loaded. Please refresh the page.' };

        const trimmedEmail = String(email).trim().toLowerCase();
        try {
            const cred = await firebaseAuth.signInWithEmailAndPassword(trimmedEmail, password);
            const uid = cred.user.uid;
            const profile = await this.fetchOrCreateProfile(cred.user);

            // Chặn tài khoản đang bị ban
            const banCheck = await this.checkBan(profile, uid);
            if (banCheck.banned) {
                await firebaseAuth.signOut().catch(() => { });
                this.currentUser = null;
                this.isLoggedIn = false;
                localStorage.removeItem('techsphere_current_user');
                return {
                    success: false,
                    banned: true,
                    ban: banCheck,
                    message: banCheck.message
                };
            }

            this.currentUser = { id: uid, ...profile };
            this.isLoggedIn = true;
            localStorage.setItem('techsphere_current_user', JSON.stringify(this.currentUser));

            await this.mergeGuestCartToCloud();     // Gộp giỏ hàng khách vào giỏ của tài khoản
            await this.mergeGuestWishlistToCloud(); // Gộp wishlist khách vào wishlist của tài khoản
            await this.pullUserData();              // Tải dữ liệu từ Firestore về cache
            this.attachRealtimeSync();              // Bật đồng bộ thời gian thực
            this.updateUI();
            this.updateCartIcon();
            this.updateWishlistIcon();
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, message: this.friendlyError(error) };
        }
    }

    // Đăng xuất người dùng khỏi Firebase và xoá session local
    logout() {
        this._signingOut = true;
        this.detachRealtimeSync();                          // Ngắt lắng nghe Firestore realtime
        localStorage.removeItem('techsphere_current_user'); // Xoá session
        localStorage.removeItem('cart');                     // Xoá giỏ hàng local (tránh lẫn giữa các tài khoản)
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();
        this.updateCartIcon();
        this.updateWishlistIcon();
        if (this.firebaseReady) {
            firebaseAuth.signOut().finally(() => { this._signingOut = false; });
        } else {
            this._signingOut = false;
        }
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { source: 'logout' } }));
        window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { source: 'logout' } }));
        return { success: true };
    }

    // Kiểm tra người dùng hiện tại có quyền admin không.
    // Chỉ đọc `role` từ hồ sơ Firestore - tự quyết định quyền ở client là không an toàn.
    // Đây chỉ để ẩn/hiện giao diện; quyền thật do firestore.rules thực thi.
    isAdmin() {
        if (!this.currentUser) return false;
        return this.currentUser.role === 'admin';
    }

    // Khôi phục người dùng từ localStorage khi load lại trang
    loadCurrentUser() {
        const userData = localStorage.getItem('techsphere_current_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
            } catch {
                localStorage.removeItem('techsphere_current_user');
            }
        }
    }

    // Kiểm tra người dùng đã đăng nhập chưa (dùng cho trang được bảo vệ)
    checkAuth() {
        return this.isLoggedIn;
    }

    // Lấy thông tin người dùng hiện tại
    getCurrentUser() {
        return this.currentUser;
    }

    /* ══════════════ ĐỒNG BỘ DỮ LIỆU USER VỚI FIRESTORE ══════════════ */

    // Tải toàn bộ dữ liệu của user từ Firestore về cache localStorage
    async pullUserData() {
        if (!this.firebaseReady || !this.isLoggedIn) return;
        const userId = this.currentUser.id;
        try {
            // 1. Giỏ hàng: carts/{uid} -> ghi vào key 'cart' cho cartManager hiển thị
            const cartSnap = await db.collection('carts').doc(userId).get();
            if (cartSnap.exists && Array.isArray(cartSnap.data().items)) {
                const cloudItems = cartSnap.data().items;
                localStorage.setItem('cart', JSON.stringify(cloudItems));
                this.setLocalUserCart(userId, cloudItems);
            } else {
                this.syncCartToCloud(this.getLocalUserCart(userId)); // Đẩy giỏ local lên cloud
            }

            // 2. Wishlist: wishlist/{uid}
            const wishSnap = await db.collection('wishlist').doc(userId).get();
            if (wishSnap.exists && Array.isArray(wishSnap.data().items)) {
                this.setLocalMap('techsphere_wishlist', userId, wishSnap.data().items);
            } else if ((this.getWishlist() || []).length) {
                this.syncWishlistToCloud();
            }

            // 3. Đơn hàng: query orders where userId == uid (sắp xếp client-side)
            const ordersSnap = await db.collection('orders')
                .where('userId', '==', userId)
                .get();
            const cloudOrders = [];
            ordersSnap.forEach(doc => cloudOrders.push(doc.data()));
            cloudOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.setLocalMap('techsphere_orders', userId, cloudOrders);

            // 4. Settings nằm trong profile doc
            if (this.currentUser.settings) {
                this.setLocalMap('techsphere_settings', userId, this.currentUser.settings);
            }
        } catch (error) {
            console.error('auth.js: pullUserData failed', error);
        }
        this.updateCartIcon();
        this.updateWishlistIcon();
        // Báo cho các trang (profile...) biết dữ liệu Firestore đã tải xong
        window.dispatchEvent(new CustomEvent('auth:data-pulled'));
    }

    // Gộp giỏ hàng của khách (chưa đăng nhập) vào giỏ trên Firestore sau khi đăng nhập
    async mergeGuestCartToCloud() {
        if (!this.firebaseReady || !this.isLoggedIn) return;
        try {
            const guestItems = JSON.parse(localStorage.getItem('cart') || '[]');
            const userId = this.currentUser.id;
            const cartSnap = await db.collection('carts').doc(userId).get();
            const cloudItems = (cartSnap.exists && Array.isArray(cartSnap.data().items)) ? cartSnap.data().items : [];

            if (guestItems.length) {
                // Gộp theo id, cộng dồn số lượng
                const merged = [...cloudItems];
                guestItems.forEach(g => {
                    const found = merged.find(m => m.id === g.id);
                    if (found) found.quantity = (found.quantity || 1) + (g.quantity || 1);
                    else merged.push({ ...g });
                });
                localStorage.setItem('cart', JSON.stringify(merged));
                this.setLocalUserCart(userId, merged);
                await db.collection('carts').doc(userId).set({ items: merged, updatedAt: new Date().toISOString() });
            }
        } catch (error) {
            console.error('auth.js: mergeGuestCartToCloud failed', error);
        }
    }

    // Gộp wishlist của khách (chưa đăng nhập) vào wishlist trên Firestore sau khi đăng nhập
    async mergeGuestWishlistToCloud() {
        if (!this.firebaseReady || !this.isLoggedIn) return;
        try {
            const guestItems = JSON.parse(localStorage.getItem('techsphere_guest_wishlist') || '[]');
            const userId = this.currentUser.id;
            const snap = await db.collection('wishlist').doc(userId).get();
            const cloudItems = (snap.exists && Array.isArray(snap.data().items)) ? snap.data().items : [];

            if (guestItems.length) {
                // Gộp theo id, giữ bản đầu tiên gặp phải
                const merged = [...cloudItems];
                guestItems.forEach(g => {
                    if (!merged.find(m => m.id === g.id)) merged.push({ ...g });
                });
                localStorage.setItem('techsphere_guest_wishlist', '[]');
                this.setLocalMap('techsphere_wishlist', userId, merged);
                await db.collection('wishlist').doc(userId)
                    .set({ items: merged, updatedAt: new Date().toISOString() });
            }
        } catch (error) {
            console.error('auth.js: mergeGuestWishlistToCloud failed', error);
        }
    }

    /* ══════════════ ĐỒNG BỘ THỜI GIAN THỰC (Firestore onSnapshot) ══════════════ */

    // Lắng nghe carts/{uid} + wishlist/{uid}: thay đổi từ tab/thiết bị khác sẽ
    // tự động mirror xuống localStorage và phát sự kiện cho các trang cập nhật UI.
    attachRealtimeSync() {
        if (!this.firebaseReady || !this.isLoggedIn || this._realtimeAttached) return;
        const userId = this.currentUser.id;
        this._realtimeAttached = true;

        // Hồ sơ người dùng: users/{uid} - khi bị ban (từ admin) sẽ tự đăng xuất ngay lập tức
        this._profileUnsub = db.collection('users').doc(userId)
            .onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data() || {};
                const b = data.ban;
                if (b && b.banned === true) {
                    const untilMs = b.until != null ? new Date(b.until).getTime() : null;
                    const expired = untilMs != null && untilMs <= Date.now();
                    if (!expired) {
                        const message = (untilMs == null || isNaN(untilMs))
                            ? 'Your account has been permanently banned.'
                            : 'Your account has been suspended. Please contact support.';
                        this._handleBanSignout(message);
                    }
                }
            }, (err) => console.error('auth.js: profile onSnapshot failed', err));

        // Giỏ hàng: carts/{uid}
        this._cartUnsub = db.collection('carts').doc(userId)
            .onSnapshot((snap) => {
                if (!snap.exists || !Array.isArray(snap.data().items)) return;
                const cloudItems = snap.data().items;
                let localItems = [];
                try { localItems = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (_) {}
                if (JSON.stringify(localItems) === JSON.stringify(cloudItems)) return; // Tránh vòng lặp echo

                localStorage.setItem('cart', JSON.stringify(cloudItems));
                this.setLocalUserCart(userId, cloudItems);
                if (typeof cartManager !== 'undefined' && cartManager.updateCartIcon) cartManager.updateCartIcon();
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: { source: 'cloud' } }));
            }, (err) => console.error('auth.js: cart onSnapshot failed', err));

        // Wishlist: wishlist/{uid}
        this._wishUnsub = db.collection('wishlist').doc(userId)
            .onSnapshot((snap) => {
                if (!snap.exists || !Array.isArray(snap.data().items)) return;
                const cloudItems = snap.data().items;
                if (JSON.stringify(this.getWishlist()) === JSON.stringify(cloudItems)) return;

                this.setLocalMap('techsphere_wishlist', userId, cloudItems);
                this.updateWishlistIcon();
                window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { source: 'cloud' } }));
            }, (err) => console.error('auth.js: wishlist onSnapshot failed', err));

        // Đơn hàng: orders (query theo userId) - đổi trạng thái từ admin cập nhật live
        this._ordersUnsub = db.collection('orders')
            .where('userId', '==', userId)
            .onSnapshot((snap) => {
                const cloudOrders = [];
                snap.forEach((doc) => cloudOrders.push(doc.data()));
                cloudOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                this.setLocalMap('techsphere_orders', userId, cloudOrders);
                window.dispatchEvent(new CustomEvent('auth:data-pulled'));
            }, (err) => console.error('auth.js: orders onSnapshot failed', err));
    }

    // Ngắt toàn bộ listener realtime (khi đăng xuất / mất phiên)
    detachRealtimeSync() {
        if (this._profileUnsub) { try { this._profileUnsub(); } catch (_) {} this._profileUnsub = null; }
        if (this._cartUnsub) { try { this._cartUnsub(); } catch (_) {} this._cartUnsub = null; }
        if (this._wishUnsub) { try { this._wishUnsub(); } catch (_) {} this._wishUnsub = null; }
        if (this._ordersUnsub) { try { this._ordersUnsub(); } catch (_) {} this._ordersUnsub = null; }
        this._realtimeAttached = false;
    }

    // Đẩy trạng thái giỏ hàng hiện tại lên Firestore (fire-and-forget)
    syncCartToCloud(items) {
        if (!this.firebaseReady || !this.isLoggedIn) return;
        const userId = this.currentUser.id;
        db.collection('carts').doc(userId)
            .set({ items: items || [], updatedAt: new Date().toISOString() })
            .catch(err => console.error('auth.js: syncCartToCloud failed', err));
    }

    syncWishlistToCloud() {
        if (!this.firebaseReady || !this.isLoggedIn) return;
        const items = this.getWishlist();
        db.collection('wishlist').doc(this.currentUser.id)
            .set({ items: items, updatedAt: new Date().toISOString() })
            .catch(err => console.error('auth.js: syncWishlistToCloud failed', err));
    }

    setLocalMap(key, userId, value) {
        const map = JSON.parse(localStorage.getItem(key) || '{}');
        map[userId] = value;
        localStorage.setItem(key, JSON.stringify(map));
    }

    getLocalUserCart(userId) {
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        return carts[userId] || [];
    }

    setLocalUserCart(userId, items) {
        this.setLocalMap('techsphere_carts', userId, items || []);
    }

    /* ══════════════ GIỎ HÀNG THEO TÀI KHOẢN (mirror local + cloud) ══════════════ */

    // Lấy giỏ hàng của người dùng hiện tại
    getUserCart() {
        if (!this.isLoggedIn) return [];
        return this.getLocalUserCart(this.currentUser.id);
    }

    // Cập nhật giỏ hàng của người dùng (ghi local + đẩy lên Firestore)
    updateUserCart(cartItems) {
        if (!this.isLoggedIn) return false;
        const userId = this.currentUser.id;
        this.setLocalUserCart(userId, cartItems);
        this.syncCartToCloud(cartItems);
        return true;
    }

    // Xoá toàn bộ giỏ hàng của người dùng
    clearUserCart() {
        if (!this.isLoggedIn) return false;
        const userId = this.currentUser.id;
        this.setLocalUserCart(userId, []);
        this.syncCartToCloud([]);
        return true;
    }

    // Thêm sản phẩm vào giỏ hàng
    addToCart(product) {
        if (!this.isLoggedIn) return false;

        const cart = this.getUserCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            cart.push({
                ...product,
                quantity: product.quantity || 1
            });
        }

        return this.updateUserCart(cart);
    }

    // Xoá sản phẩm khỏi giỏ hàng
    removeFromCart(productId) {
        if (!this.isLoggedIn) return false;

        const cart = this.getUserCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        return this.updateUserCart(updatedCart);
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartItemQuantity(productId, quantity) {
        if (!this.isLoggedIn) return false;

        const cart = this.getUserCart();
        const item = cart.find(item => item.id === productId);

        if (item) {
            if (quantity <= 0) {
                return this.removeFromCart(productId);
            }
            item.quantity = quantity;
            return this.updateUserCart(cart);
        }

        return false;
    }

    // Đếm tổng số lượng sản phẩm trong giỏ hàng
    getCartCount() {
        if (!this.isLoggedIn) return 0;

        const cart = this.getUserCart();
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    // Tính tổng tiền giỏ hàng
    getCartTotal() {
        if (!this.isLoggedIn) return 0;

        const cart = this.getUserCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = item.quantity || 1;
            return total + (price * quantity);
        }, 0);
    }

    /* ══════════════ ĐƠN HÀNG (Firestore collection 'orders') ══════════════ */

    // Lấy danh sách đơn hàng của người dùng hiện tại (từ cache, được làm mới khi đăng nhập)
    getOrders() {
        if (!this.isLoggedIn) return [];
        const userId = this.currentUser.id;
        const orders = JSON.parse(localStorage.getItem('techsphere_orders') || '{}');
        return orders[userId] || [];
    }

    // Thêm đơn hàng mới: lưu Firestore + cache local để hiển thị ngay
    async addOrder(order) {
        if (!this.isLoggedIn) return false;
        const userId = this.currentUser.id;

        const orderData = {
            ...order,
            userId: userId,
            userEmail: this.currentUser.email || ''
        };

        // 1. Ghi cache local ngay để profile.html hiển thị tức thì
        const localOrders = this.getOrders();
        localOrders.unshift(orderData);
        this.setLocalMap('techsphere_orders', userId, localOrders);

        // 2. Ghi lên Firestore
        if (this.firebaseReady) {
            try {
                const docRef = await db.collection('orders').add(orderData);
                orderData.firestoreId = docRef.id;
                this.setLocalMap('techsphere_orders', userId, this.getOrders());
            } catch (error) {
                console.error('auth.js: addOrder to Firestore failed', error);
                throw error; // Để checkout biết mà báo lỗi
            }
        }
        return true;
    }

    /* ══════════════ WISHLIST (Firestore: wishlist/{uid}; guest lưu localStorage) ══════════════ */

    // Lấy danh sách yêu thích: đã đăng nhập -> theo tài khoản, chưa -> guest list
    getWishlist() {
        if (this.isLoggedIn && this.currentUser) {
            const userId = this.currentUser.id;
            const wishlists = JSON.parse(localStorage.getItem('techsphere_wishlist') || '{}');
            return wishlists[userId] || [];
        }
        try {
            const guest = JSON.parse(localStorage.getItem('techsphere_guest_wishlist') || '[]');
            return Array.isArray(guest) ? guest : [];
        } catch (_) {
            return [];
        }
    }

    // Kiểm tra sản phẩm đã có trong wishlist chưa
    isInWishlist(productId) {
        return this.getWishlist().some(item => item.id === productId);
    }

    // Thêm/xoá sản phẩm khỏi wishlist (trả về true nếu đã thêm, false nếu đã xoá)
    // Hoạt động cả khi chưa đăng nhập: guest list tự gộp lên Firestore khi đăng nhập.
    toggleWishlist(product) {
        if (!product || !product.id) return false;

        const items = this.getWishlist();
        const existingIndex = items.findIndex(item => item.id === product.id);
        let added;

        if (existingIndex >= 0) {
            items.splice(existingIndex, 1);
            added = false;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                category: product.category || '',
                addedAt: Date.now()
            });
            added = true;
        }

        if (this.isLoggedIn && this.currentUser) {
            const userId = this.currentUser.id;
            const wishlists = JSON.parse(localStorage.getItem('techsphere_wishlist') || '{}');
            wishlists[userId] = items;
            localStorage.setItem('techsphere_wishlist', JSON.stringify(wishlists));
            this.syncWishlistToCloud();
        } else {
            localStorage.setItem('techsphere_guest_wishlist', JSON.stringify(items));
        }

        this.updateWishlistIcon();
        window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { added: added, source: 'local' } }));
        return added;
    }

    /* ══════════════ CÀI ĐẶT TÀI KHOẢN (lưu trong users/{uid}.settings) ══════════════ */

    // Lấy cài đặt tài khoản của người dùng hiện tại (kèm mặc định)
    getSettings() {
        const defaults = {
            language: 'English (US)',
            notifications: true,
            darkMode: false,
            paymentMethod: ''
        };
        if (!this.isLoggedIn) return defaults;

        const userId = this.currentUser.id;
        const settings = JSON.parse(localStorage.getItem('techsphere_settings') || '{}');
        return { ...defaults, ...(settings[userId] || {}) };
    }

    // Lưu cài đặt tài khoản (local + merge vào Firestore users/{uid})
    saveSettings(patch) {
        if (!this.isLoggedIn) return false;

        const userId = this.currentUser.id;
        const settings = { ...this.getSettings(), ...patch };
        this.setLocalMap('techsphere_settings', userId, settings);

        if (this.firebaseReady) {
            db.collection('users').doc(userId)
                .set({ settings: settings }, { merge: true })
                .catch(err => console.error('auth.js: saveSettings failed', err));
        }
        return true;
    }

    // Cập nhật thông tin hồ sơ người dùng (localStorage + Firestore users/{uid})
    async updateProfile(patch) {
        if (!this.isLoggedIn || !this.currentUser) return false;
        this.currentUser = { ...this.currentUser, ...(patch || {}) };
        localStorage.setItem('techsphere_current_user', JSON.stringify(this.currentUser));
        if (this.firebaseReady) {
            try {
                await db.collection('users').doc(this.currentUser.id).set(patch, { merge: true });
            } catch (error) {
                console.error('auth.js: updateProfile failed', error);
                throw error;
            }
        }
        return true;
    }

    /* ══════════════ GIAO DIỆN ══════════════ */

    // Khởi tạo giao diện giỏ hàng
    initCartUI() {
        this.updateCartIcon();
    }

    // Cập nhật giao diện theo trạng thái đăng nhập
    updateUI() {
        const userIcon = document.querySelector('.header-icons .fa-user, .header-icons .fa-user-circle');
        if (userIcon) {
            if (this.isLoggedIn) {
                const name = this.currentUser?.username || this.currentUser?.name || 'User';
                userIcon.parentElement.href = 'profile.html';
                userIcon.className = 'fas fa-user-circle';
                userIcon.title = `Xin chào, ${name}`;
                userIcon.parentElement.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = 'profile.html';
                };
            } else {
                userIcon.parentElement.href = 'login.html';
                userIcon.className = 'fas fa-user';
                userIcon.title = 'Đăng nhập';
                userIcon.parentElement.onclick = null;
            }
        }
    }

    // Cập nhật số lượng hiển thị trên icon giỏ hàng
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            let count = 0;
            if (typeof cartManager !== 'undefined' && cartManager.getCart) {
                count = cartManager.getItemCount();
            } else {
                count = this.getCartCount();
            }
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Cập nhật số lượng hiển thị trên icon wishlist (tim) ở header
    updateWishlistIcon() {
        document.querySelectorAll('.wishlist-count').forEach(el => {
            const count = this.getWishlist().length;
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }
}

// Create global auth instance
window.auth = new AuthSystem();
