import { db, auth } from '../services/firebase.js';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { router } from '../utils/router.js';
import { formatPrice } from '../utils/helpers.js';

export class OrdersPage {
  constructor(container) {
    this.container = container;
    this.orders = [];
    this.unsubscribe = null;
  }

  render() {
    if (!auth.currentUser) {
      this.container.innerHTML = '<div>Please sign in to view orders</div>';
      return;
    }
    this.container.innerHTML = '<div>Loading orders...</div>';
    const q = query(collection(db, 'users', auth.currentUser.uid, 'orders'), orderBy('createdAt', 'desc'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.renderOrdersList();
    });
  }

  renderOrdersList() {
    if (!this.orders.length) {
      this.container.innerHTML = '<div class="empty-orders">No orders yet</div>';
      return;
    }
    this.container.innerHTML = `<div class="orders-page"><h2>My Orders</h2><div class="orders-list">${this.orders.map(order => `
      <div class="order-card" data-id="${order.id}">
        <div class="order-header"><span>#${order.id.slice(-8)}</span><span class="status ${order.status}">${order.status}</span></div>
        <div class="order-preview">${order.items?.length} item(s) - ${formatPrice(order.total)}</div>
        <button class="view-details">View Details</button>
      </div>
    `).join('')}</div></div>`;
    document.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details')) router.navigate('order-details', { id: card.dataset.id });
      });
    });
  }

  destroy() { if (this.unsubscribe) this.unsubscribe(); }
}
