const API_URL = 'https://script.google.com/macros/s/AKfycbwL93-aZVBuGBD0WBq7mxAEZm_nE9r4RaNXsYnMNrcDbaUfH_xuP4i4aOoZLHat19GjFg/exec';

let cachedProducts = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

function normalizeProduct(raw) {
  const id = String(raw.id ?? '');
  const name = raw.name ?? raw.title ?? 'Unknown Product';
  const price = Number(raw.price ?? raw.price_usd ?? raw.amount ?? 0);
  const image = raw.image ?? raw.img ?? raw.thumbnail ?? 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80';
  let type = String(raw.type ?? raw.category ?? '').toLowerCase().trim();
  if (!type) type = 'other';

  let rating = Number(raw.rating ?? raw.stars ?? 0);
  if (!rating || Number.isNaN(rating)) {
    const parsed = new Date(raw.rating);
    if (!Number.isNaN(parsed.valueOf())) {
      rating = Math.min(5, Math.max(1, (parsed.getDate() % 5) + 1));
    } else {
      rating = 4;
    }
  }
  rating = Math.min(5, Math.max(1, Math.round(rating)));

  return { id, name, price, image, type, rating };
}

export async function fetchProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && (now - lastFetch) < CACHE_TTL) {
    return cachedProducts;
  }

  const response = await fetch(API_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
  }

  const data = await response.json();
  const rawList = data?.value ?? data?.products ?? data ?? [];
  const list = Array.isArray(rawList) ? rawList : [];

  const seen = new Map();
  const products = [];
  for (const raw of list) {
    const p = normalizeProduct(raw);
    if (!seen.has(p.id)) {
      seen.set(p.id, true);
      products.push(p);
    }
  }

  cachedProducts = products;
  lastFetch = now;
  return products;
}

export async function fetchProductsByType(type) {
  const all = await fetchProducts();
  if (!type || type === 'all') return all;
  return all.filter(p => p.type === type.toLowerCase().trim());
}

export async function getCategories() {
  const all = await fetchProducts();
  const types = [...new Set(all.map(p => p.type))];
  return types.sort();
}
