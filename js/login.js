import { auth } from './auth.js';
import { showToast } from './utils.js';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const togglePasswordButton = document.getElementById('toggleLoginPassword');

function updateHeader(user) {
  const userLabel = document.querySelector('#userLabel');
  if (!userLabel) return;
  if (user) {
    userLabel.textContent = `Xin chào, ${user.name}`;
    userLabel.href = 'cart.html';
  }
}

togglePasswordButton?.addEventListener('click', () => {
  const hidden = passwordInput.type === 'password';
  passwordInput.type = hidden ? 'text' : 'password';
  togglePasswordButton.textContent = hidden ? 'Ẩn' : 'Hiện';
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  const result = await auth.login(email, password);
  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  window.location.href = 'home.html';
});

auth.subscribe(updateHeader);
