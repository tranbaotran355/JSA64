import { auth } from './auth.js';
import { formatMoneyVND, showToast } from './utils.js';

const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const cartEmpty = document.getElementById('cartEmpty');
const checkoutButton = document.getElementById('checkoutButton');

function renderCart() {
  if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const items = auth.getCart();
  cartList.innerHTML = '';

  if (!items.length) {
    cartEmpty.classList.remove('hidden');
    cartTotal.textContent = '0 VNĐ';
    return;
  }

  cartEmpty.classList.add('hidden');
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.productId = item.id;
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <span class="cart-item-category">${item.type}</span>
        <strong>${formatMoneyVND(item.price)}</strong>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button class="quantity-btn" data-action="decrease">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" data-action="increase">+</button>
        </div>
        <button class="remove-button">Xóa</button>
      </div>
    `;
    fragment.appendChild(row);
  });

  cartList.appendChild(fragment);
  updateCartTotal(items);
}

function updateCartTotal(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatMoneyVND(total);
}

cartList?.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;

  const itemRow = button.closest('.cart-item');
  const productId = itemRow?.dataset.productId;
  if (!productId) return;

  if (button.dataset.action === 'increase') {
    const items = auth.getCart();
    const next = items.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
    auth.saveCart(next);
    renderCart();
    showToast('Đã cập nhật số lượng.', 'success');
  }

  if (button.dataset.action === 'decrease') {
    const items = auth.getCart();
    const next = items
      .map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item)
      .filter(item => item.quantity > 0);
    auth.saveCart(next);
    renderCart();
  }

  if (button.classList.contains('remove-button')) {
    const next = auth.getCart().filter(item => item.id !== productId);
    auth.saveCart(next);
    renderCart();
    showToast('Sản phẩm đã được xoá khỏi giỏ hàng.', 'info');
  }
});

checkoutButton?.addEventListener('click', () => {
  showToast('Tính năng thanh toán sẽ sớm có mặt.', 'info');
});

auth.subscribe(user => {
  if (!user) {
    window.location.href = '../login.html';
  } else {
    renderCart();
  }
});
