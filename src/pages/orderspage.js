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

  async render() {
    if (!auth.currentUser) {
      this.container.innerHTML = '<div>Please sign in to view your orders.</div>';
      return;
    }

    this.container.innerHTML = '<div class="loading">Loading orders...</div>';

    // Real-time listener for user's orders
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'orders'),
      orderBy('createdAt', 'desc')
    );
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.renderOrdersList();
    });
  }

  renderOrdersList() {
    if (!this.orders.length) {
      this.container.innerHTML = '<div class="empty-orders">No orders yet. Start shopping!</div>';
      return;
    }

    this.container.innerHTML = `
      <div class="orders-page">
        <h2>My Orders</h2>
        <div class="orders-list">
          ${this.orders.map(order => this.renderOrderCard(order)).join('')}
        </div>
      </div>
    `;

    // Attach click handlers for order details
    document.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('track-btn')) return;
        const orderId = card.dataset.id;
        router.navigate('order-details', { id: orderId });
      });
    });
  }

  renderOrderCard(order) {
    const firstItem = order.items?.[0];
    const itemCount = order.items?.length || 0;
    const statusLabels = {
      placed: 'Placed',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-header">
          <span class="order-id">#${order.id.slice(-8)}</span>
          <span class="order-status ${order.status}">${statusLabels[order.status] || order.status}</span>
        </div>
        <div class="order-items-preview">
          ${firstItem ? `<img src="${firstItem.image}" alt="${firstItem.name}" class="preview-img">` : ''}
          <span>${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="order-footer">
          <div class="order-total">${formatPrice(order.total)}</div>
          <button class="track-btn" data-order="${order.id}">Track Order</button>
        </div>
      </div>
    `;
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
