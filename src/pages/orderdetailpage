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
  }

  async render() {
    if (!auth.currentUser) { this.container.innerHTML = '<div>Please sign in</div>'; return; }
    try {
      const topRef = doc(db, 'orders', this.orderId);
      let snap = await getDoc(topRef);
      if (snap.exists()) this.order = { id: snap.id, ...snap.data() };
      else {
        const q = query(collection(db, 'users', auth.currentUser.uid, 'orders'), where('orderId', '==', this.orderId));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) this.order = { id: querySnap.docs[0].id, ...querySnap.docs[0].data(), actualOrderId: this.orderId };
        else { this.container.innerHTML = '<div>Order not found</div>'; return; }
      }
      this.renderOrderDetails();
    } catch (error) { this.container.innerHTML = '<div>Error loading order</div>'; }
  }

  renderOrderDetails() {
    const steps = ['placed', 'confirmed', 'shipped', 'delivered'];
    const currentStep = steps.indexOf(this.order.status);
    let orderDate = new Date();
    if (this.order.createdAt?.toDate) orderDate = this.order.createdAt.toDate();
    else if (this.order.createdAt?.seconds) orderDate = new Date(this.order.createdAt.seconds * 1000);
    const estDelivery = new Date(orderDate); estDelivery.setDate(estDelivery.getDate() + 5);
    const addr = this.order.address || {};
    this.container.innerHTML = `
      <div class="order-details-page">
        <button class="back-btn">← Back</button>
        <h2>Order #${this.order.id.slice(-8)}</h2>
        <div class="tracking-timeline">
          ${steps.map((step, idx) => `<div class="timeline-step ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}"><div class="step-icon">${idx <= currentStep ? '✓' : idx+1}</div><div class="step-label">${step}</div></div>`).join('')}
        </div>
        <div class="order-info"><div>Placed: ${orderDate.toLocaleDateString()}</div><div>Est. Delivery: ${estDelivery.toLocaleDateString()}</div></div>
        <div class="order-items"><h3>Items</h3>${(this.order.items || []).map(item => `<div class="order-item"><img src="${item.image || ''}" width="60"><div>${item.name} x ${item.qty}</div><div>${formatPrice(item.price * item.qty)}</div></div>`).join('')}</div>
        <div class="order-summary"><div>Subtotal: ${formatPrice(this.order.subtotal || 0)}</div>${this.order.coinDiscount ? `<div>Coins Discount: -${formatPrice(this.order.coinDiscount)}</div>` : ''}<div class="total">Total: ${formatPrice(this.order.total || 0)}</div></div>
        <div class="delivery-address"><h3>Delivery Address</h3><div>${addr.name}</div><div>${addr.line1}, ${addr.city} - ${addr.pin}</div><div>📞 ${addr.phone}</div></div>
        ${(this.order.status === 'placed' || this.order.status === 'confirmed') ? '<button class="cancel-order-btn">Cancel Order</button>' : ''}
        ${this.order.status === 'delivered' ? '<button class="return-order-btn">Return Order</button>' : ''}
      </div>
    `;
    this.container.querySelector('.back-btn')?.addEventListener('click', () => router.navigate('orders'));
    this.container.querySelector('.cancel-order-btn')?.addEventListener('click', () => this.cancelOrder());
    this.container.querySelector('.return-order-btn')?.addEventListener('click', () => this.returnOrder());
  }

  async cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    const id = this.order.actualOrderId || this.order.id;
    await updateDoc(doc(db, 'orders', id), { status: 'cancelled' });
    if (auth.currentUser) {
      const q = query(collection(db, 'users', auth.currentUser.uid, 'orders'), where('orderId', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) await updateDoc(snap.docs[0].ref, { status: 'cancelled' });
    }
    try { await deductCoins(10, `Cancel order ${id.slice(-8)}`); showToast('Cancelled, -10 coins'); } catch(e) { showToast('Cancelled'); }
    router.navigate('orders');
  }

  async returnOrder() {
    if (!confirm('Request return?')) return;
    const id = this.order.actualOrderId || this.order.id;
    await updateDoc(doc(db, 'orders', id), { status: 'return_requested' });
    if (auth.currentUser) {
      const q = query(collection(db, 'users', auth.currentUser.uid, 'orders'), where('orderId', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) await updateDoc(snap.docs[0].ref, { status: 'return_requested' });
    }
    showToast('Return requested');
    router.navigate('orders');
  }
}
