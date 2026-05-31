import { getCart, getCartTotal, clearCart } from '../services/cart.js';
import { getCoins, addCoins, deductCoins } from '../services/wallet.js';
import { userData, currentUser } from '../services/auth.js';
import { createOrder } from '../services/orders.js';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';

export class CheckoutPage {
  constructor(container) {
    this.container = container;
    this.useCoins = false;
    this.selectedAddressId = null;
  }

  render() {
    const cart = getCart();
    const items = cart.map(item => {
      const product = window.products?.find(p => p.id === item.id);
      return { ...item, product };
    }).filter(i => i.product);
    const subtotal = items.reduce((s, i) => s + (i.product.price * i.qty), 0);
    const coins = getCoins().balance;
    const usableCoins = Math.min(coins, Math.floor(subtotal / 0.1));
    const coinDiscount = this.useCoins ? usableCoins * 0.1 : 0;
    const total = subtotal - coinDiscount;
    const addresses = userData.addresses || [];

    this.container.innerHTML = `
      <div class="checkout-page">
        <h2>Checkout</h2>
        <div class="checkout-section"><h3>Delivery Address</h3><div id="addressList">${addresses.map(addr => `
          <div class="address-card ${addr.isDefault ? 'default' : ''}" data-id="${addr.id}">
            <div>${addr.name}, ${addr.line1}, ${addr.city} - ${addr.pin}</div>
            <div>📞 ${addr.phone}</div>
          </div>`).join('')}</div><button class="add-address-btn">+ Add Address</button>
        </div>
        <div class="checkout-section"><h3>Order Summary</h3>${items.map(i => `<div>${i.product.name} x ${i.qty} = ${formatPrice(i.product.price * i.qty)}</div>`).join('')}
          <div>Subtotal: ${formatPrice(subtotal)}</div>${coinDiscount > 0 ? `<div>Coins Discount: -${formatPrice(coinDiscount)}</div>` : ''}
          <div class="total">Total: ${formatPrice(total)}</div>
        </div>
        <div class="checkout-section"><label><input type="checkbox" id="useCoinsCheckbox" ${this.useCoins ? 'checked' : ''} ${usableCoins === 0 ? 'disabled' : ''}> Use ${usableCoins} ApyCoins (save ${formatPrice(usableCoins * 0.1)})</label></div>
        <button id="placeOrderBtn">Place Order</button>
      </div>
    `;
    document.getElementById('useCoinsCheckbox')?.addEventListener('change', (e) => { this.useCoins = e.target.checked; this.render(); });
    document.querySelector('.add-address-btn')?.addEventListener('click', () => router.navigate('addresses'));
    document.getElementById('placeOrderBtn')?.addEventListener('click', () => this.placeOrder(items, subtotal, usableCoins, coinDiscount, total));
    document.querySelectorAll('.address-card').forEach(card => card.addEventListener('click', () => {
      this.selectedAddressId = card.dataset.id;
      document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    }));
    const defaultAddr = addresses.find(a => a.isDefault);
    if (defaultAddr && !this.selectedAddressId) this.selectedAddressId = defaultAddr.id;
  }

  async placeOrder(items, subtotal, usableCoins, coinDiscount, total) {
    const address = userData.addresses?.find(a => a.id === this.selectedAddressId);
    if (!address) { showToast('Select delivery address', 'warn'); return; }
    if (this.useCoins && usableCoins > 0) await deductCoins(usableCoins, 'Used at checkout');
    await addCoins(10, 'Order placed');
    const orderData = { items, subtotal, total, coinDiscount, coinsUsed: this.useCoins ? usableCoins : 0, address, paymentMethod: 'COD', status: 'placed' };
    await createOrder(orderData);
    await clearCart();
    showToast('Order placed successfully!');
    router.navigate('orders');
  }
}
