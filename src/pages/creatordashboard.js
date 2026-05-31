import { userData, currentUser } from '../services/auth.js';
import { db } from '../services/firebase.js';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { router } from '../utils/router.js';
import { formatPrice } from '../utils/helpers.js';

export class CreatorDashboard {
  constructor(container) {
    this.container = container;
    this.videos = [];
  }

  async render() {
    if (!currentUser) {
      this.container.innerHTML = '<div class="login-prompt">Please sign in to view your creator dashboard.</div>';
      return;
    }

    // Load user's videos from Firestore (realtime is handled by listener)
    await this.loadUserVideos();

    const stats = this.calculateStats();

    this.container.innerHTML = `
      <div class="creator-dashboard">
        <div class="creator-header">
          <h1>Creator Dashboard</h1>
          <button class="upload-video-btn">🎬 Upload New Video</button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">💰 Total Earnings: ${formatPrice(stats.totalEarnings)}</div>
          <div class="stat-card">👁️ Total Views: ${stats.totalViews}</div>
          <div class="stat-card">📹 Videos: ${this.videos.length}</div>
          <div class="stat-card">🛒 Sales: ${stats.totalSales}</div>
        </div>
        <div class="videos-list" id="creatorVideosList"></div>
      </div>
    `;

    this.renderVideosList();
    this.container.querySelector('.upload-video-btn').addEventListener('click', () => {
      router.navigate('upload-video');
    });
  }

  async loadUserVideos() {
    const q = query(
      collection(db, 'videos'),
      where('uploaderUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    this.videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  calculateStats() {
    let totalEarnings = 0;
    let totalViews = 0;
    let totalSales = 0;

    // In real implementation, fetch from sellerEarnings that match video's product
    const earnings = userData.sellerEarnings || [];
    for (const video of this.videos) {
      totalViews += video.views || 0;
      const videoEarnings = earnings.filter(e => e.product_id === video.productId);
      totalEarnings += videoEarnings.reduce((s, e) => s + (e.net_earning || 0), 0);
      totalSales += videoEarnings.length;
    }
    return { totalEarnings, totalViews, totalSales };
  }

  renderVideosList() {
    const container = document.getElementById('creatorVideosList');
    if (!this.videos.length) {
      container.innerHTML = '<div class="empty-state">No videos uploaded yet. Click "Upload New Video" to get started.</div>';
      return;
    }
    container.innerHTML = this.videos.map(v => `
      <div class="video-item" data-id="${v.id}">
        <video src="${v.videoUrl}" width="120" height="200" poster="${v.thumbnailUrl || ''}"></video>
        <div class="video-info">
          <div class="video-title">${v.title || 'Untitled'}</div>
          <div class="video-status ${v.status}">${v.status}</div>
          <div>Views: ${v.views || 0}</div>
        </div>
      </div>
    `).join('');
  }
}
