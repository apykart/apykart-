import { db } from '../services/firebase.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export class AdminDashboard {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <div class="admin-dashboard">
        <h2>Admin Panel</h2>
        <div id="pendingVideos"></div>
        <div id="pendingSellers"></div>
        <div id="allOrders"></div>
      </div>
    `;
    await this.loadPendingVideos();
    await this.loadPendingSellers();
    await this.loadOrders();
  }

  async loadPendingVideos() {
    const q = query(collection(db, 'videos'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const container = document.getElementById('pendingVideos');
    container.innerHTML = '<h3>Videos pending approval</h3>' + snapshot.docs.map(doc => `
      <div class="admin-item">
        <video src="${doc.data().videoUrl}" width="200"></video>
        <button onclick="approveVideo('${doc.id}')">Approve</button>
        <button onclick="rejectVideo('${doc.id}')">Reject</button>
      </div>
    `).join('');
    window.approveVideo = async (id) => {
      await updateDoc(doc(db, 'videos', id), { status: 'approved' });
      location.reload();
    };
    window.rejectVideo = async (id) => {
      await updateDoc(doc(db, 'videos', id), { status: 'rejected' });
      location.reload();
    };
  }

  async loadPendingSellers() {
    const q = query(collection(db, 'users'), where('seller_verification.status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const container = document.getElementById('pendingSellers');
    container.innerHTML = '<h3>Seller verifications</h3>' + snapshot.docs.map(doc => `
      <div class="admin-item">
        <div>User: ${doc.data().profile?.email}</div>
        <button onclick="approveSeller('${doc.id}')">Approve</button>
        <button onclick="rejectSeller('${doc.id}')">Reject</button>
      </div>
    `).join('');
    window.approveSeller = async (uid) => {
      await updateDoc(doc(db, 'users', uid), { role: 'seller', 'seller_verification.status': 'approved' });
      location.reload();
    };
  }

  async loadOrders() {
    const snapshot = await getDocs(collection(db, 'orders'));
    const container = document.getElementById('allOrders');
    container.innerHTML = '<h3>All Orders</h3>' + snapshot.docs.map(doc => `
      <div>${doc.id} - ${doc.data().total} - ${doc.data().status}</div>
    `).join('');
  }
}
