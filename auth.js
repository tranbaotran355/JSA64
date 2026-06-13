// auth.js - User Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.updateUI();
        this.updateCartIcon(); // Add this line
    }

    // User registration
    register(userData) {
        if (!userData.username || !userData.email || !userData.password) {
            return { success: false, message: 'All fields are required' };
        }

        const users = JSON.parse(localStorage.getItem('techsphere_users') || '[]');

        // Check if user already exists
        if (users.find(user => user.email === userData.email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Add new user
        users.push({
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            password: userData.password, // In production, this should be hashed
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('techsphere_users', JSON.stringify(users));

        // Auto login after registration
        return this.login(userData.email, userData.password);
    }

    // User login
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('techsphere_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Remove password before storing
        const { password: _, ...userWithoutPassword } = user;

        localStorage.setItem('techsphere_current_user', JSON.stringify(userWithoutPassword));
        this.currentUser = userWithoutPassword;
        this.isLoggedIn = true;

        this.updateUI();
        return { success: true, user: userWithoutPassword };
    }

    // User logout
    logout() {
        localStorage.removeItem('techsphere_current_user');
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();
        return { success: true };
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('techsphere_current_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
        }
    }

    // Update UI based on login state
    updateUI() {
        // Update header user icon
        const userIcon = document.querySelector('.header-icons .fa-user');
        if (userIcon) {
            if (this.isLoggedIn) {
                userIcon.parentElement.href = '#';
                userIcon.classList.remove('fa-user');
                userIcon.classList.add('fa-user-circle');
                userIcon.title = `Logged in as ${this.currentUser?.username}`;

                // Add logout option on click
                userIcon.parentElement.onclick = (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        this.logout();
                        window.location.reload();
                    }
                };
            } else {
                userIcon.parentElement.href = 'login.html';
                userIcon.classList.remove('fa-user-circle');
                userIcon.classList.add('fa-user');
                userIcon.title = 'Login';
                userIcon.parentElement.onclick = null;
            }
        }
    }

    // Check if user is logged in (for protected features)
    checkAuth() {
        return this.isLoggedIn;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user's cart
    getUserCart() {
        if (!this.isLoggedIn) return [];

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        return carts[userId] || [];
    }

    // Update user's cart
    updateUserCart(cartItems) {
        if (!this.isLoggedIn) return false;

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        carts[userId] = cartItems;
        localStorage.setItem('techsphere_carts', JSON.stringify(carts));
        return true;
    }

    // Clear user's cart
    clearUserCart() {
        if (!this.isLoggedIn) return false;

        const userId = this.currentUser.id;
        const carts = JSON.parse(localStorage.getItem('techsphere_carts') || '{}');
        delete carts[userId];
        localStorage.setItem('techsphere_carts', JSON.stringify(carts));
        return true;
    }

    // Add item to cart
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

    // Remove item from cart
    removeFromCart(productId) {
        if (!this.isLoggedIn) return false;

        const cart = this.getUserCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        return this.updateUserCart(updatedCart);
    }

    // Update item quantity
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

    // Get cart count
    getCartCount() {
        if (!this.isLoggedIn) return 0;

        const cart = this.getUserCart();
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    // Get cart total
    getCartTotal() {
        if (!this.isLoggedIn) return 0;

        const cart = this.getUserCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = item.quantity || 1;
            return total + (price * quantity);
        }, 0);
    }
    // Initialize cart UI on page load
    initCartUI() {
        this.updateCartIcon();
    }

    // Update cart icon with real count
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.getCartCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    initCartUI() {
        this.updateCartIcon();
    }

    // Update cart icon with real count
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