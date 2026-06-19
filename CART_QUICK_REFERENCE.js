// CART_QUICK_REFERENCE.js - Tài liệu tham khảo nhanh cách dùng cartManager
// File hướng dẫn này giúp dev hiểu cách thao tác với giỏ hàng qua cartManager
// QUICK REFERENCE: Using cartManager in Your Code

// ============================================
// 1. INITIALIZE (Automatic - already in cart.js)
// ============================================
// cartManager object is created globally when cart.js loads


// ============================================
// 2. ADD ITEM TO CART (Use in product pages)
// ============================================
const product = {
    id: 'product_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: 'Product Name',
    price: 99.99,
    image: 'https://example.com/image.jpg',
    category: 'Electronics',
    quantity: 1
};

cartManager.addItem(product);  // Returns true/false


// ============================================
// 3. REMOVE ITEM FROM CART
// ============================================
cartManager.removeItem('product_id');  // Returns true/false


// ============================================
// 4. UPDATE QUANTITY
// ============================================
cartManager.updateQuantity('product_id', 5);  // Returns true/false
cartManager.updateQuantity('product_id', 0);  // Removes item


// ============================================
// 5. GET CART DATA
// ============================================
const allItems = cartManager.getCart();  // Returns array of items
const itemCount = cartManager.getItemCount();  // Returns total quantity
const subtotal = cartManager.getSubtotal();  // Returns number

// Get totals with tax and shipping
const totals = cartManager.getTotal(shippingCost, taxRate);
// Returns: { subtotal, shipping, tax, total }

// Examples:
const totals1 = cartManager.getTotal(0, 0.08);  // Free shipping, 8% tax
const totals2 = cartManager.getTotal(9.99, 0.06);  // $9.99 shipping, 6% tax


// ============================================
// 6. CHECK CART STATUS
// ============================================
if (cartManager.isEmpty()) {
    console.log('Cart is empty');
}

if (cartManager.hasItem('product_id')) {
    console.log('Item already in cart');
}


// ============================================
// 7. UPDATE HEADER BADGE
// ============================================
cartManager.updateCartIcon();  // Updates .cart-count display


// ============================================
// 8. CLEAR ENTIRE CART
// ============================================
cartManager.clearCart();  // Empties localStorage


// ============================================
// COMPLETE EXAMPLE: Add to Cart Button
// ============================================
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();

        // Get product info from DOM
        const card = this.closest('.product-card');
        const product = {
            id: 'product_' + card.querySelector('.product-title')
                .textContent.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: card.querySelector('.product-title').textContent,
            price: parseFloat(card.querySelector('.current-price')
                .textContent.replace('$', '')),
            image: card.querySelector('img').src,
            category: card.querySelector('.product-category').textContent,
            quantity: 1
        };

        // Add to cart
        if (cartManager.addItem(product)) {
            // Show success animation
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            this.style.backgroundColor = '#0F2854';
            cartManager.updateCartIcon();  // Update badge

            // Reset button after 1.5 seconds
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                this.style.backgroundColor = '';
            }, 1500);
        } else {
            alert('Failed to add item');
        }
    });
});


// ============================================
// COMPLETE EXAMPLE: Display Cart (cart.html)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const cartContainer = document.querySelector('.cart-items');

    function renderCart() {
        const items = cartManager.getCart();
        cartContainer.innerHTML = '';

        if (items.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty</p>';
            return;
        }

        // Render each item
        items.forEach(item => {
            const html = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>$${item.price.toFixed(2)}</p>
                    <input type="number" value="${item.quantity}" 
                        onchange="cartManager.updateQuantity('${item.id}', this.value); renderCart();">
                    <button onclick="cartManager.removeItem('${item.id}'); renderCart();">
                        Remove
                    </button>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', html);
        });

        // Update totals
        const totals = cartManager.getTotal(0, 0.08);
        document.querySelector('.total').textContent = 
            `Total: $${totals.total.toFixed(2)}`;
    }

    renderCart();
});


// ============================================
// localStorage STRUCTURE
// ============================================
/*
Key: "cart"
Value: JSON string of array

Example value in localStorage:
[
  {
    "id": "product_ultraphone_x_pro",
    "name": "UltraPhone X Pro 256GB",
    "price": 899.99,
    "image": "https://...",
    "category": "Smartphones",
    "quantity": 2
  },
  {
    "id": "product_galaxy_s24",
    "name": "Galaxy S24 Ultra 512GB",
    "price": 1199.99,
    "image": "https://...",
    "category": "Smartphones",
    "quantity": 1
  }
]

View in DevTools:
F12 → Application → Local Storage → Select your domain → Look for "cart" key
*/


// ============================================
// ERROR HANDLING
// ============================================
const product = {
    id: 'test_product',
    name: 'Test',
    price: 50  // Must be a number!
};

if (!cartManager.addItem(product)) {
    console.error('Failed to add item - check product data');
}

// Common mistakes:
// ❌ price: "$99.99"  (string - will fail)
// ✅ price: 99.99      (number - correct)

// ❌ quantity: "5"     (string - will fail)
// ✅ quantity: 5       (number - correct)


// ============================================
// DEBUGGING
// ============================================
// Check cart contents
console.log(cartManager.getCart());

// Check specific totals
console.log(cartManager.getSubtotal());
console.log(cartManager.getItemCount());

// Check localStorage directly
console.log(localStorage.getItem('cart'));

// Check if item exists
console.log(cartManager.hasItem('product_id'));

// Check cart status
console.log(cartManager.isEmpty());
