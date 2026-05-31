import { getCart, updateCartItemQty, removeFromCart, getCartTotal } from '../services/cart.js';
import { products } from '../services/products.js';
import { router } from '../utils/router.js';
import { formatPrice } from '../utils/helpers.js';

export class CartPage {
  constructor(container) {
    this.container = container;
  }

  render() {
    const cart = getCart();
    if (!cart.length) {
      this.container.innerHTML = `
        <div class="empty-cart">
          <div>🛒 Your cart is empty</div>
          <button class="shop-now-btn">Start Shopping</button>
        </div>
      `;
      this.container.querySelector('.shop-now-btn').addEventListener('click', () => router.navigate('home'));
      return;
    }

    const items = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return { ...item, product };
    }).filter(i => i.product);

    const total = getCartTotal();

    this.container.innerHTML = `
      <div class="cart-page">
        <h2>My Cart</h2>
        <div class="cart-items">
          ${items.map(item => this.renderCartItem(item)).join('')}
        </div>
        <div class="cart-summary">
          <div class="total">Total: ${formatPrice(total)}</div>
          <button class="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    `;

    this.attachEvents();
    this.container.querySelector('.checkout-btn').addEventListener('click', () => router.navigate('checkout'));
  }

  renderCartItem({ id, qty, product }) {
    return `
      <div class="cart-item" data-id="${id}">
        <img src="${product.images?.[0] || product.img}" alt="${product.name}" loading="lazy">
        <div class="item-details">
          <div class="item-name">${product.name}</div>
          <div class="item-price">${formatPrice(product.price)}</div>
          <div class="item-actions">
            <button class="qty-down">-</button>
            <span class="qty">${qty}</span>
            <button class="qty-up">+</button>
            <button class="remove-btn">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('.cart-item').forEach(itemEl => {
      const id = itemEl.dataset.id;
      const qtySpan = itemEl.querySelector('.qty');
      const downBtn = itemEl.querySelector('.qty-down');
      const upBtn = itemEl.querySelector('.qty-up');
      const removeBtn = itemEl.querySelector('.remove-btn');

      downBtn.addEventListener('click', async () => {
        await updateCartItemQty(id, -1);
        this.render();
      });
      upBtn.addEventListener('click', async () => {
        await updateCartItemQty(id, 1);
        this.render();
      });
      removeBtn.addEventListener('click', async () => {
        await removeFromCart(id);
        this.render();
      });
    });
  }
}
