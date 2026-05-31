import { formatPrice } from '../utils/helpers.js';

export function renderProductCard(product, { addToCart }) {
  const firstImage = product.images?.[0] || product.img || '';
  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-img">
        <img src="${firstImage}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        ${product.ogPrice ? `<div class="product-old-price">${formatPrice(product.ogPrice)}</div>` : ''}
        <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
      </div>
    </div>
  `;
}
