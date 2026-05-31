import { db, auth } from '../services/firebase.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';
import { deductCoins } from '../services/wallet.js';

export class OrderDetailsPage {
  constructor(container, orderId) {
    this.container = container;
    this.orderId = orderId;
    this.order = null;
    this.orderDocRef = null; // Store reference for updates
  }

  async render() {
    if (!auth.currentUser) {
      this.container.innerHTML = '<div class="error">Please sign in to view order details.</div>';
      return;
    }

    try {
      // First try to fetch from top-level orders collection using the ID directly
      const topOrderRef = doc(db, 'orders', this.orderId);
      let snap = await getDoc(topOrderRef);
      
      if (snap.exists()) {
        this.order = { id: snap.id, ...snap.data() };
        this.orderDocRef = topOrderRef;
      } else {
        // If not found, search in user's subcollection by orderId field
        const userOrdersRef = collection(db, 'users', auth.currentUser.uid, 'orders');
        const q = query(userOrdersRef, where('orderId', '==', this.orderId));
        const querySnap = await getDocs(q);
        
        if (!querySnap.empty) {
          const docSnap = querySnap.docs[0];
          this.order = { id: docSnap.id, ...docSnap.data(), actualOrderId: this.orderId };
          this.orderDocRef = doc(db, 'orders', this.orderId); // Still update main order
        } else {
          this.container.innerHTML = '<div class="error">Order not found.</div>';
          return;
        }
      }

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
          <div><strong>${this.escapeHtml(addressName)}</strong></div>
          <div>${this.escapeHtml(addressLine)}</div>
          ${addressPhone ? `<div>📞 ${this.escapeHtml(addressPhone)}</div>` : ''}
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
      const orderIdToUpdate = this.order.actualOrderId || this.order.id;
      // Update top-level orders collection
      await updateDoc(doc(db, 'orders', orderIdToUpdate), { 
        status: 'cancelled', 
        cancelledAt: new Date().toISOString() 
      });
      
      // Also update user subcollection if exists (find by orderId)
      if (auth.currentUser) {
        const userOrdersRef = collection(db, 'users', auth.currentUser.uid, 'orders');
        const q = query(userOrdersRef, where('orderId', '==', orderIdToUpdate));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const userOrderDoc = querySnap.docs[0];
          await updateDoc(userOrderDoc.ref, { status: 'cancelled', cancelledAt: new Date().toISOString() });
        }
      }
      
      // Deduct 10 coins as penalty (only if coins are available)
      try {
        await deductCoins(10, `Order cancellation penalty #${orderIdToUpdate.slice(-8)}`);
        showToast('Order cancelled. 10 coins deducted.', 'info');
      } catch (coinErr) {
        // Penalty deduction failed, but order still cancelled
        showToast('Order cancelled (penalty could not be deducted)', 'warn');
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
      const orderIdToUpdate = this.order.actualOrderId || this.order.id;
      await updateDoc(doc(db, 'orders', orderIdToUpdate), { 
        status: 'return_requested', 
        returnRequestedAt: new Date().toISOString() 
      });
      
      if (auth.currentUser) {
        const userOrdersRef = collection(db, 'users', auth.currentUser.uid, 'orders');
        const q = query(userOrdersRef, where('orderId', '==', orderIdToUpdate));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const userOrderDoc = querySnap.docs[0];
          await updateDoc(userOrderDoc.ref, { status: 'return_requested', returnRequestedAt: new Date().toISOString() });
        }
      }
      
      showToast('Return request submitted. Our team will contact you.', 'success');
      router.navigate('orders');
    } catch (error) {
      console.error('Return error:', error);
      showToast('Failed to request return. Please try again.', 'error');
    }
  }

  // Simple XSS protection
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
}
