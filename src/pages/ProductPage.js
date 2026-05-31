import { products } from '../services/products.js';
import { addToCart } from '../services/cart.js';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';

export class ProductPage {
  constructor(container, productId) {
    this.container = container;
    this.productId = productId;
  }

  render() {
    const product = products.find(p => p.id === this.productId);
    if (!product) {
      this.container.innerHTML = '<div>Product not found</div>';
      return;
    }
    this.container.innerHTML = `
      <div class="product-page">
        <button class="back-btn">← Back</button>
        <div class="product-gallery">
          ${(product.images?.length ? product.images : [product.img]).map(src => `<img src="${src}" loading="lazy">`).join('')}
        </div>
        <div class="product-info">
          <h1>${product.name}</h1>
          <div class="price">${formatPrice(product.price)}</div>
          ${product.ogPrice ? `<div class="old-price">${formatPrice(product.ogPrice)}</div>` : ''}
          <div class="description">${product.desc || ''}</div>
          <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
          <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
        </div>
      </div>
    `;
    this.container.querySelector('.back-btn')?.addEventListener('click', () => history.back());
    this.container.querySelector('.add-to-cart-btn')?.addEventListener('click', async (e) => {
      await addToCart(e.target.dataset.id);
      showToast('Added to cart');
    });
    this.container.querySelector('.buy-now-btn')?.addEventListener('click', (e) => {
      router.navigate('checkout', { buyNowId: e.target.dataset.id });
    });
  }
}
