import { db, auth } from '../services/firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';

export class OrderDetailsPage {
  constructor(container, orderId) {
    this.container = container;
    this.orderId = orderId;
    this.order = null;
  }

  async render() {
    if (!auth.currentUser) {
      this.container.innerHTML = '<div>Please sign in</div>';
      return;
    }
    const docRef = doc(db, 'users', auth.currentUser.uid, 'orders', this.orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      this.container.innerHTML = '<div>Order not found</div>';
      return;
    }
    this.order = { id: snap.id, ...snap.data() };
    this.renderOrderDetails();
  }

  renderOrderDetails() {
    const statusSteps = ['placed', 'confirmed', 'shipped', 'delivered'];
    const currentStep = statusSteps.indexOf(this.order.status);
    const estDelivery = new Date(this.order.createdAt?.seconds * 1000);
    estDelivery.setDate(estDelivery.getDate() + 5);
    this.container.innerHTML = `
      <div class="order-details-page">
        <button class="back-btn">← Back</button>
        <h2>Order #${this.order.id.slice(-8)}</h2>
        <div class="tracking-timeline">
          ${statusSteps.map((step, idx) => `
            <div class="timeline-step ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}">
              <div class="step-icon">${idx <= currentStep ? '✓' : idx+1}</div>
              <div class="step-label">${step.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
        <div class="order-info">
          <div>Placed on: ${new Date(this.order.createdAt?.seconds * 1000).toLocaleDateString()}</div>
          <div>Est. Delivery: ${estDelivery.toLocaleDateString()}</div>
        </div>
        <div class="order-items">
          <h3>Items</h3>
          ${this.order.items.map(item => `
            <div class="order-item">
              <img src="${item.image}" width="60">
              <div>${item.name} x ${item.qty}</div>
              <div>${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join('')}
        </div>
        <div class="order-summary">
          <div>Subtotal: ${formatPrice(this.order.subtotal)}</div>
          ${this.order.coinDiscount ? `<div>Coins Discount: -${formatPrice(this.order.coinDiscount)}</div>` : ''}
          <div class="total">Total: ${formatPrice(this.order.total)}</div>
        </div>
        <div class="delivery-address">
          <h3>Delivery Address</h3>
          <div>${this.order.address.name}</div>
          <div>${this.order.address.line1}, ${this.order.address.city}, ${this.order.address.state} - ${this.order.address.pin}</div>
          <div>📞 ${this.order.address.phone}</div>
        </div>
        ${this.order.status === 'placed' || this.order.status === 'confirmed' ? 
          `<button class="cancel-order-btn" data-id="${this.order.id}">Cancel Order</button>` : ''}
      </div>
    `;
    document.querySelector('.back-btn').addEventListener('click', () => router.navigate('orders'));
    const cancelBtn = document.querySelector('.cancel-order-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelOrder());
    }
  }

  async cancelOrder() {
    if (confirm('Are you sure you want to cancel this order?')) {
      await updateDoc(doc(db, 'orders', this.order.id), { status: 'cancelled' });
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'orders', this.order.id), { status: 'cancelled' });
      showToast('Order cancelled');
      router.navigate('orders');
    }
  }
}
