import { db, auth } from '../services/firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';
import { deductCoins } from '../services/wallet.js';

export class OrderDetailsPage {
  constructor(container, orderId) {
    this.container = container;
    this.orderId = orderId;
    this.order = null;
  }

  async render() {
    if (!auth.currentUser) {
      this.container.innerHTML = '<div class="error">Please sign in to view order details.</div>';
      return;
    }

    try {
      // Try to fetch from user subcollection first
      const userOrderRef = doc(db, 'users', auth.currentUser.uid, 'orders', this.orderId);
      let snap = await getDoc(userOrderRef);
      
      // If not found, try top-level orders collection
      if (!snap.exists()) {
        const topOrderRef = doc(db, 'orders', this.orderId);
        snap = await getDoc(topOrderRef);
      }

      if (!snap.exists()) {
        this.container.innerHTML = '<div class="error">Order not found.</div>';
        return;
      }

      this.order = { id: snap.id, ...snap.data() };
      this.renderOrderDetails();
    } catch (error) {
      console.error('Error loading order:', error);
      this.container.innerHTML = '<div class="error">Failed to load order details. Please try again.</div>';
    }
  }

  renderOrderDetails() {
    const statusSteps = ['placed', 'confirmed', 'shipped', 'delivered'];
    const currentStep = statusSteps.indexOf(this.order.status);
    
    // Safe date handling: Firestore timestamp or ISO string
    let orderDate = new Date();
    if (this.order.createdAt) {
      if (typeof this.order.createdAt.toDate === 'function') {
        orderDate = this.order.createdAt.toDate();
      } else if (this.order.createdAt.seconds) {
        orderDate = new Date(this.order.createdAt.seconds * 1000);
      } else if (typeof this.order.createdAt === 'string') {
        orderDate = new Date(this.order.createdAt);
      }
    }
    const estDelivery = new Date(orderDate);
    estDelivery.setDate(estDelivery.getDate() + 5);
    
    const orderDateStr = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const estDeliveryStr = estDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // Safely get address
    const address = this.order.address || {};
    const addressName = address.name || 'Not provided';
    const addressLine = address.line1 ? `${address.line1}, ${address.city || ''}, ${address.state || ''} - ${address.pin || ''}` : 'Address not available';
    const addressPhone = address.phone || '';

    // Safely map items
    const items = this.order.items || [];
    
    this.container.innerHTML = `
      <div class="order-details-page">
        <button class="back-btn">← Back to Orders</button>
        <h2>Order #${this.order.id.slice(-8)}</h2>
        <div class="tracking-timeline">
          ${statusSteps.map((step, idx) => `
            <div class="timeline-step ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}">
              <div class="step-icon">${idx <= currentStep ? '✓' : idx + 1}</div>
              <div class="step-label">${step.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
        <div class="order-info">
          <div>📅 Placed on: ${orderDateStr}</div>
          <div>🚚 Est. Delivery: ${estDeliveryStr}</div>
        </div>
        <div class="order-items">
          <h3>Items</h3>
          ${items.map(item => `
            <div class="order-item">
              <img src="${item.image || '/fallback-image.png'}" width="60" alt="${item.name}" onerror="this.src='/fallback-image.png'">
              <div class="item-details">
                <div>${item.name}</div>
                <div>Qty: ${item.qty}</div>
              </div>
              <div class="item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join('')}
        </div>
        <div class="order-summary">
          <div class="summary-row">Subtotal: ${formatPrice(this.order.subtotal || 0)}</div>
          ${this.order.coinDiscount ? `<div class="summary-row">Coins Discount: -${formatPrice(this.order.coinDiscount)}</div>` : ''}
          <div class="summary-row total">Total Paid: ${formatPrice(this.order.total || 0)}</div>
        </div>
        <div class="delivery-address">
          <h3>Delivery Address</h3>
          <div><strong>${addressName}</strong></div>
          <div>${addressLine}</div>
          ${addressPhone ? `<div>📞 ${addressPhone}</div>` : ''}
        </div>
        ${(this.order.status === 'placed' || this.order.status === 'confirmed') ? 
          `<button class="cancel-order-btn">Cancel Order</button>` : ''}
        ${this.order.status === 'delivered' ? 
          `<button class="return-order-btn">Return Order</button>` : ''}
      </div>
    `;

    // Attach event listeners
    const backBtn = this.container.querySelector('.back-btn');
    if (backBtn) backBtn.addEventListener('click', () => router.navigate('orders'));
    
    const cancelBtn = this.container.querySelector('.cancel-order-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelOrder());
    
    const returnBtn = this.container.querySelector('.return-order-btn');
    if (returnBtn) returnBtn.addEventListener('click', () => this.returnOrder());
  }

  async cancelOrder() {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    try {
      // Update both collections
      const updates = { status: 'cancelled', cancelledAt: new Date().toISOString() };
      await updateDoc(doc(db, 'orders', this.order.id), updates);
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'orders', this.order.id), updates);
      }
      
      // Deduct 10 coins as penalty if user had enough (optional)
      try {
        await deductCoins(10, `Order cancellation penalty #${this.order.id.slice(-8)}`);
        showToast('Order cancelled. 10 coins deducted.', 'info');
      } catch (coinErr) {
        showToast('Order cancelled (insufficient coins for penalty)', 'warn');
      }
      
      router.navigate('orders');
    } catch (error) {
      console.error('Cancel error:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
    }
  }

  async returnOrder() {
    if (!confirm('Request return for this order? You will get 10 coins back after successful return.')) return;
    
    try {
      const updates = { status: 'return_requested', returnRequestedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'orders', this.order.id), updates);
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'orders', this.order.id), updates);
      }
      showToast('Return request submitted. Our team will contact you.', 'success');
      router.navigate('orders');
    } catch (error) {
      console.error('Return error:', error);
      showToast('Failed to request return. Please try again.', 'error');
    }
  }
}
