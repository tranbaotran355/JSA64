import { formatMoneyVND, createRatingStars } from '../js/utils.js';

export function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;

  card.innerHTML = `
    <figure>
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
    </figure>
    <div class="product-details">
      <div class="product-meta">
        <span class="product-category">${product.type}</span>
        <span class="rating">${createRatingStars(product.rating)} <span>${product.rating.toFixed(1)}</span></span>
      </div>
      <h3>${product.name}</h3>
      <div class="price-row">
        <strong>${formatMoneyVND(product.price)}</strong>
        <button type="button" class="primary add-to-cart">Add to cart</button>
      </div>
    </div>
  `;

  return card;
}
