export const SUPPORTED_CATEGORIES = ['all', 'smartphone', 'laptop', 'accessories', 'smart device'];

export function formatMoneyVND(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function parseProductRating(value) {
  if (!value) return 4;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    return Math.min(5, Math.max(1, (parsed.getDate() % 5) + 1));
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return Math.min(5, Math.max(1, Math.round(numeric)));
  }

  return 4;
}

export function createRatingStars(rating) {
  const value = Number(rating) || 0;
  const fullCount = Math.round(value);
  const stars = new Array(5).fill('empty').map((_, index) => {
    if (index < fullCount) return '<i class="fas fa-star"></i>';
    return '<i class="far fa-star"></i>';
  });
  return stars.join('');
}

export function debounce(fn, delay = 250) {
  let timeout = null;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

export function showToast(message, type = 'info') {
  const wrapperId = 'toast-wrapper';
  let wrapper = document.getElementById(wrapperId);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = wrapperId;
    wrapper.className = 'toast-wrapper';
    document.body.appendChild(wrapper);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast--close" aria-label="Close">×</button>
  `;

  toast.querySelector('.toast--close').addEventListener('click', () => toast.remove());
  wrapper.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

export function showLoading(isLoading) {
  const id = 'page-loading-overlay';
  let overlay = document.getElementById(id);
  if (isLoading) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = id;
      overlay.className = 'body-overlay';
      overlay.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
      document.body.appendChild(overlay);
    }
  } else {
    overlay?.remove();
  }
}

export function normalizeCategory(type) {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized === 'smart device') return 'Smart Device';
  return normalized.replace(/(^\w|\s\w)/g, char => char.toUpperCase());
}
