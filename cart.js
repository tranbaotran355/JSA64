// cart.js - Hệ thống giỏ hàng dùng chung (không cần đăng nhập)
// Lưu giỏ hàng trên localStorage, dùng cho các trang không yêu cầu tài khoản
class CartManager {
    constructor() {
        this.storageKey = 'cart';   // Key lưu trong localStorage
        this.init();
    }

    init() {
        this.updateCartIcon();
    }

    // Lấy danh sách sản phẩm trong giỏ hàng
    getCart() {
        try {
            const cart = localStorage.getItem(this.storageKey);
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error reading cart:', error);
            return [];
        }
    }

    // Lưu giỏ hàng xuống localStorage
    saveCart(items) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(items));
            this.updateCartIcon();
            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            return false;
        }
    }

    // Thêm sản phẩm vào giỏ hàng
    addItem(product) {
        if (!product.id || !product.name || !product.price) {
            console.error('Invalid product:', product);
            return false;
        }

        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            // Sản phẩm đã có - tăng số lượng
            existingItem.quantity += product.quantity || 1;
        } else {
            // Sản phẩm mới - thêm vào giỏ hàng
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                category: product.category || '',
                quantity: product.quantity || 1
            });
        }

        return this.saveCart(cart);
    }

    // Xoá sản phẩm khỏi giỏ hàng
    removeItem(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        return this.saveCart(updatedCart);
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(productId);
        }

        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);

        if (item) {
            item.quantity = quantity;
            return this.saveCart(cart);
        }

        return false;
    }

    // Xoá toàn bộ giỏ hàng
    clearCart() {
        return this.saveCart([]);
    }

    // Đếm tổng số lượng sản phẩm
    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Tính tạm tính (chưa gồm phí ship và thuế)
    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            return total + (parseFloat(item.price) || 0) * item.quantity;
        }, 0);
    }

    // Tính tổng tiền (gồm thuế và phí ship)
    getTotal(shippingCost = 0, taxRate = 0.08) {
        const subtotal = this.getSubtotal();
        const tax = subtotal * taxRate;
        const total = subtotal + shippingCost + tax;
        return {
            subtotal: subtotal,
            shipping: shippingCost,
            tax: tax,
            total: total
        };
    }

    // Cập nhật badge số lượng trên icon giỏ hàng
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    hasItem(productId) {
        const cart = this.getCart();
        return cart.some(item => item.id === productId);
    }

    // Kiểm tra giỏ hàng có rỗng không
    isEmpty() {
        return this.getCart().length === 0;
    }
}

// Tạo instance giỏ hàng toàn cục, dùng được ở mọi trang
window.cartManager = new CartManager();
