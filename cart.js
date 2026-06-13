// cart.js - Shared Cart System (No Authentication Required)
class CartManager {
    constructor() {
        this.storageKey = 'cart';
        this.init();
    }

    init() {
        this.updateCartIcon();
    }

    // Get all cart items
    getCart() {
        try {
            const cart = localStorage.getItem(this.storageKey);
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error reading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
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

    // Add item to cart
    addItem(product) {
        if (!product.id || !product.name || !product.price) {
            console.error('Invalid product:', product);
            return false;
        }

        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            // Item already in cart - increase quantity
            existingItem.quantity += product.quantity || 1;
        } else {
            // New item - add to cart
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

    // Remove item from cart
    removeItem(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        return this.saveCart(updatedCart);
    }

    // Update item quantity
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

    // Clear entire cart
    clearCart() {
        return this.saveCart([]);
    }

    // Get cart item count
    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Get cart subtotal
    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            return total + (parseFloat(item.price) || 0) * item.quantity;
        }, 0);
    }

    // Get cart total (including tax and shipping)
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

    // Update cart icon badge in header
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Check if item exists in cart
    hasItem(productId) {
        const cart = this.getCart();
        return cart.some(item => item.id === productId);
    }

    // Check if cart is empty
    isEmpty() {
        return this.getCart().length === 0;
    }
}

// Create global cart instance
window.cartManager = new CartManager();
