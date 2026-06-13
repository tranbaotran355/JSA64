import { showToast } from './utils.js';

const USERS_KEY = 'techsphere_users';
const SESSION_KEY = 'techsphere_session';
const CART_KEY = 'techsphere_cart';

function emailIsValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function passwordRules(password) {
  const value = String(password);
  const rules = [
    { test: value.length >= 8, message: 'Ít nhất 8 ký tự.' },
    { test: /[A-Z]/.test(value), message: 'Một chữ cái in hoa.' },
    { test: /[a-z]/.test(value), message: 'Một chữ cái in thường.' },
    { test: /\d/.test(value), message: 'Một chữ số.' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Một ký tự đặc biệt.' },
  ];
  return rules;
}

async function getPasswordHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

class AuthService {
  constructor() {
    this.currentUser = loadSession();
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.currentUser);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.currentUser));
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async register({ name, email, password, confirmPassword }) {
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();

    if (!trimmedName) {
      return { success: false, message: 'Vui lòng nhập tên đầy đủ.' };
    }
    if (!emailIsValid(trimmedEmail)) {
      return { success: false, message: 'Email không hợp lệ.' };
    }
    const passwordValidation = passwordRules(password).filter(rule => !rule.test);
    if (passwordValidation.length) {
      return { success: false, message: passwordValidation[0].message };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Mật khẩu xác nhận chưa khớp.' };
    }

    const users = loadUsers();
    if (users.some(user => user.email === trimmedEmail)) {
      return { success: false, message: 'Email đã được đăng ký trước đó.' };
    }

    const passwordHash = await getPasswordHash(password);
    const newUser = {
      id: Date.now().toString(),
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);
    this.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    saveSession(this.currentUser);
    this.notify();
    showToast('Đăng ký thành công. Đã đăng nhập tự động.', 'success');
    return { success: true, user: this.currentUser };
  }

  async login(email, password) {
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!emailIsValid(trimmedEmail)) {
      return { success: false, message: 'Email không hợp lệ.' };
    }

    const users = loadUsers();
    const passwordHash = await getPasswordHash(password);
    const foundUser = users.find(user => user.email === trimmedEmail && user.passwordHash === passwordHash);
    if (!foundUser) {
      return { success: false, message: 'Email hoặc mật khẩu không chính xác.' };
    }

    this.currentUser = { id: foundUser.id, name: foundUser.name, email: foundUser.email };
    saveSession(this.currentUser);
    this.notify();
    showToast('Đăng nhập thành công.', 'success');
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
    clearSession();
    this.notify();
    showToast('Bạn đã đăng xuất.', 'info');
  }

  getCart() {
    if (!this.currentUser) return [];
    const cart = loadCart();
    return cart[this.currentUser.email] || [];
  }

  saveCart(items) {
    if (!this.currentUser) return;
    const cart = loadCart();
    cart[this.currentUser.email] = items;
    saveCart(cart);
  }

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  addToCart(product) {
    if (!this.currentUser) {
      showToast('Vui lòng đăng nhập để tiếp tục.', 'error');
      return false;
    }
    const currentCart = this.getCart();
    const nextCart = [...currentCart];
    const existing = nextCart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity = Math.min(99, (existing.quantity || 1) + 1);
    } else {
      nextCart.push({ ...product, quantity: 1 });
    }
    this.saveCart(nextCart);
    return true;
  }

  updateCartItem(productId, quantity) {
    const cart = this.getCart();
    const nextCart = cart.map(item => item.id === productId ? { ...item, quantity } : item).filter(item => item.quantity > 0);
    this.saveCart(nextCart);
    return nextCart;
  }

  removeCartItem(productId) {
    const cart = this.getCart().filter(item => item.id !== productId);
    this.saveCart(cart);
    return cart;
  }
}

export const auth = new AuthService();
