import { auth } from './auth.js';
import { showToast } from './utils.js';

const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('registerName');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmInput = document.getElementById('registerConfirmPassword');
const togglePasswordButton = document.getElementById('toggleRegisterPassword');

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

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await auth.register({
    name: nameInput.value,
    email: emailInput.value,
    password: passwordInput.value,
    confirmPassword: confirmInput.value,
  });

  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  window.location.href = 'home.html';
});

auth.subscribe(updateHeader);
