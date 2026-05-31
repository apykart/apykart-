import { getCartTotal, getCartItems } from '../services/cart.js';
import { getUserCoins, useCoins, addCoins } from '../services/wallet.js';
import { createOrder } from '../services/orders.js';
import { showToast } from '../utils/helpers.js';

export class CheckoutPage {
  constructor(container) {
    this.container = container;
    this.useCoins = false;
  }

  render() {
    const total = getCartTotal();
    const userCoins = getUserCoins();
    const usableCoins = Math.min(userCoins, Math.floor(total / 0.1)); // 1 coin = ₹0.1
    const coinDiscount = this.useCoins ? usableCoins * 0.1 : 0;
    const finalTotal = total - coinDiscount;

    this.container.innerHTML = `
      <div class="checkout-container">
        <div class="order-summary">
          <h3>Order Summary</h3>
          <p>Total: ₹${total}</p>
          <label>
            <input type="checkbox" id="useCoinsCheckbox" ${this.useCoins ? 'checked' : ''}>
            Use ${usableCoins} ApyCoins (save ₹${coinDiscount.toFixed(0)})
          </label>
          <p class="final-total">Payable: ₹${finalTotal}</p>
          <button id="placeOrderBtn">Place Order</button>
        </div>
        <div id="paymentMethods"></div>
      </div>
    `;
    document.getElementById('useCoinsCheckbox').addEventListener('change', (e) => {
      this.useCoins = e.target.checked;
      this.render();
    });
    document.getElementById('placeOrderBtn').addEventListener('click', async () => {
      const order = await createOrder({
        items: getCartItems(),
        total: finalTotal,
        coinsUsed: this.useCoins ? usableCoins : 0,
        paymentMethod: 'COD'
      });
      if (this.useCoins) useCoins(usableCoins);
      addCoins(10, `Earned from order ${order.id}`);
      showToast('Order placed successfully!');
      // clear cart and redirect
    });
  }
}
