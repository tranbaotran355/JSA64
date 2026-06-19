// auth.js - Hệ thống xác thực người dùng (dùng trên toàn bộ trang)
// Quản lý đăng ký, đăng nhập, đăng xuất và giỏ hàng theo tài khoản

// Băm mật khẩu bằng SHA-256 trước khi lưu
async function getPasswordHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

class AuthSystem {
    constructor() {
        this.currentUser = null;        // Người dùng hiện tại
        this.isLoggedIn = false;        // Trạng thái đã đăng nhập
        this.init();
    }

    init() {
        this.loadCurrentUser();         // Khôi phục phiên từ localStorage
        this.updateUI();                // Cập nhật giao diện theo trạng thái
        this.updateCartIcon();          // Cập nhật số lượng giỏ hàng
    }

    // Đăng ký người dùng mới (hash password trước khi lưu)
    async register(userData) {
        if (!userData.username || !userData.email || !userData.password) {
            return { success: false, message: 'All fields are required' };
        }

        const users = JSON.parse(localStorage.getItem('techsphere_users') || '[]');

        const email = userData.email.trim().toLowerCase();
        // Kiểm tra email đã tồn tại chưa
        if (users.find(user => user.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const passwordHash = await getPasswordHash(userData.password);

        // Thêm người dùng mới vào danh sách
        users.push({
            id: Date.now().toString(),
            username: userData.username,
            email: email,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()  // Thời gian tạo tài khoản
        });

        localStorage.setItem('techsphere_users', JSON.stringify(users));

        // Tự động đăng nhập sau khi đăng ký
        return this.login(userData.email, userData.password);
    }

    // Đăng nhập người dùng (hỗ trợ cả hash và plain text cũ)
    async login(email, password) {
        const trimmedEmail = String(email).trim().toLowerCase();
        const users = JSON.parse(localStorage.getItem('techsphere_users') || '[]');
        const user = users.find(u => u.email === trimmedEmail);

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Kiểm tra mật khẩu: ưu tiên hash, fallback plain text (tương thích ngược)
        const passwordHash = await getPasswordHash(password);
        let match = user.passwordHash === passwordHash;

        // Fallback: kiểm tra plain text (cho user đăng ký trước khi có hash)
        if (!match && user.password === password) {
            user.passwordHash = passwordHash;
            delete user.password;
            localStorage.setItem('techsphere_users', JSON.stringify(users));
            match = true;
        }

        if (!match) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Xoá password/hash trước khi lưu session
        const { passwordHash: _, password: __, ...userWithoutPassword } = user;

        localStorage.setItem('techsphere_current_user', JSON.stringify(userWithoutPassword));
        this.currentUser = userWithoutPassword;
        this.isLoggedIn = true;

        this.updateUI();
        return { success: true, user: userWithoutPassword };
    }

    // Đăng xuất người dùng
    logout() {
        localStorage.removeItem('techsphere_current_user'); // Xoá session
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();
        return { success: true };
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

    // Cập nhật giao diện theo trạng thái đăng nhập
    updateUI() {
        const userIcon = document.querySelector('.header-icons .fa-user, .header-icons .fa-user-circle');
        if (userIcon) {
            if (this.isLoggedIn) {
                const name = this.currentUser?.username || this.currentUser?.name || 'User';
                userIcon.parentElement.href = '#';
                userIcon.className = 'fas fa-user-circle';
                userIcon.title = `Xin chào, ${name}`;
                userIcon.parentElement.onclick = (e) => {
                    e.preventDefault();
                    if (confirm('Bạn có chắc muốn đăng xuất?')) {
                        this.logout();
                        window.location.reload();
                    }
                };
            } else {
                userIcon.parentElement.href = 'login.html';
                userIcon.className = 'fas fa-user';
                userIcon.title = 'Đăng nhập';
                userIcon.parentElement.onclick = null;
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

    // Lấy giỏ hàng của người dùng hiện tại
    getUserCart() {
        if (!this.isLoggedIn) return [];

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        return carts[userId] || [];
    }

    // Cập nhật giỏ hàng của người dùng
    updateUserCart(cartItems) {
        if (!this.isLoggedIn) return false;

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        carts[userId] = cartItems;
        localStorage.setItem('techsphere_carts', JSON.stringify(carts));
        return true;
    }

    // Xoá toàn bộ giỏ hàng của người dùng
    clearUserCart() {
        if (!this.isLoggedIn) return false;

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        delete carts[userId];
        localStorage.setItem('techsphere_carts', JSON.stringify(carts));
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

    // Khởi tạo giao diện giỏ hàng
    initCartUI() {
        this.updateCartIcon();
    }

    // Cập nhật số lượng hiển thị trên icon giỏ hàng
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.getCartCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Create global auth instance
window.auth = new AuthSystem();