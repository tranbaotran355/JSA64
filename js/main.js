import { fetchProducts } from './api.js';
import { auth } from './auth.js';
import { createProductCard } from '../components/productCard.js';
import { formatMoneyVND, parseProductRating, normalizeCategory, showToast, showLoading, debounce } from './utils.js';

const productGrid = document.querySelector('#productGrid');
const searchInput = document.querySelector('#searchInput');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const totalResultsText = document.querySelector('#totalResults');
const emptyState = document.querySelector('#emptyState');
const cartCount = document.querySelector('#cartCount');
const userButton = document.querySelector('#userButton');
const heroStatus = document.querySelector('#heroStatus');

const state = {
  products: [],
  filtered: [],
  category: 'all',
  query: '',
};

function normalizeProduct(raw) {
  return {
    id: raw.id?.toString() ?? String(Date.now()),
    name: raw.name ?? 'Unknown product',
    price: Number(raw.price) || 0,
    type: normalizeCategory(raw.type),
    rawType: String(raw.type ?? 'other').toLowerCase(),
    image: raw.image || 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    rating: parseProductRating(raw.rating),
  };
}

function getFilteredProducts() {
  return state.products.filter(product => {
    const matchesCategory = state.category === 'all' || product.rawType === state.category;
    const matchesSearch = product.name.toLowerCase().includes(state.query.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function renderProducts(products) {
  productGrid.innerHTML = '';
  if (!products.length) {
    emptyState.classList.remove('hidden');
    totalResultsText.textContent = '0 sản phẩm hiển thị';
    return;
  }

  emptyState.classList.add('hidden');
  totalResultsText.textContent = `${products.length} sản phẩm hiển thị`;

  const fragment = document.createDocumentFragment();
  products.forEach(product => {
    fragment.appendChild(createProductCard(product));
  });
  productGrid.appendChild(fragment);
}

function updateCategoryButtons() {
  categoryButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.category === state.category);
  });
}

function updateCartBadge() {
  const count = auth.getCartCount();
  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? 'grid' : 'none';
}

function updateUserButton(user) {
  if (!user) {
    userButton.textContent = 'Đăng nhập';
    userButton.href = 'login.html';
    return;
  }
  userButton.textContent = `Xin chào, ${user.name}`;
  userButton.href = 'cart.html';
}

function attachEvents() {
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      updateCategoryButtons();
      renderProducts(getFilteredProducts());
    });
  });

  searchInput.addEventListener('input', debounce(event => {
    state.query = event.target.value.trim();
    renderProducts(getFilteredProducts());
  }, 250));

  productGrid.addEventListener('click', event => {
    const addButton = event.target.closest('.add-to-cart');
    if (!addButton) return;

    const card = addButton.closest('.product-card');
    const productId = card.dataset.productId;
    const product = state.products.find(item => item.id === productId);
    if (!product) return;

    if (!auth.isAuthenticated()) {
      showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'error');
      window.location.href = 'login.html';
      return;
    }

    const success = auth.addToCart(product);
    if (success) {
      showToast('Đã thêm sản phẩm vào giỏ hàng.', 'success');
      updateCartBadge();
    }
  });
}

async function loadProducts() {
  showLoading(true);
  try {
    const rawProducts = await fetchProducts();
    state.products = rawProducts.map(normalizeProduct);
    renderProducts(getFilteredProducts());
    heroStatus.textContent = `${state.products.length} sản phẩm mới nhất đã sẵn sàng.`;
    updateCartBadge();
  } catch (error) {
    showToast(error.message, 'error');
    emptyState.querySelector('p').textContent = 'Không thể tải sản phẩm. Vui lòng thử lại sau.';
    emptyState.classList.remove('hidden');
  } finally {
    showLoading(false);
  }
}

function init() {
  document.body.classList.add('home-page');
  attachEvents();
  auth.subscribe(updateUserButton);
  loadProducts();
}

init();
