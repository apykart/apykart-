import { products } from '../services/products.js';
import { addToCart } from '../services/cart.js';
import { router } from '../utils/router.js';
import { showToast } from '../utils/helpers.js';

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

    const images = product.images?.length ? product.images : [product.img];
    this.container.innerHTML = `
      <div class="product-page">
        <button class="back-btn" onclick="history.back()">← Back</button>
        <div class="product-gallery">
          ${images.map(src => `<img src="${src}" loading="lazy" class="gallery-img">`).join('')}
        </div>
        <div class="product-info">
          <h1>${product.name}</h1>
          <div class="price">${this.formatPrice(product.price)}</div>
          ${product.ogPrice ? `<div class="old-price">${this.formatPrice(product.ogPrice)}</div>` : ''}
          <div class="description">${product.desc}</div>
          <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
          <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
        </div>
      </div>
    `;

    this.container.querySelector('.add-to-cart-btn').addEventListener('click', async (e) => {
      await addToCart(e.target.dataset.id);
      showToast('Added to cart');
    });
    this.container.querySelector('.buy-now-btn').addEventListener('click', (e) => {
      router.navigate('checkout', { buyNowId: e.target.dataset.id });
    });
  }

  formatPrice(p) { return `₹${p.toLocaleString()}`; }
}
