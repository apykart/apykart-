import { userData, currentUser, signInWithGoogle, logout } from '../services/auth.js';
import { router } from '../utils/router.js';

export class ProfilePage {
  constructor(container) { this.container = container; }
  render() {
    if (!currentUser) { this.renderGuest(); return; }
    const profile = userData.profile || {};
    const coins = userData.coins?.balance || 0;
    this.container.innerHTML = `
      <div class="profile-page">
        <div class="profile-header">
          <div class="avatar">${(profile.name?.[0] || 'U').toUpperCase()}</div>
          <div class="profile-info"><h3>${profile.name || 'User'}</h3><div>${profile.email || currentUser.email}</div></div>
          <button class="logout-btn">Sign Out</button>
        </div>
        <div class="stats-row"><div class="stat"><span>${userData.cart?.length || 0}</span>Cart</div><div class="stat"><span>${coins}</span>Coins</div><div class="stat"><span>${userData.wishlist?.length || 0}</span>Wishlist</div></div>
        <div class="menu">
          <div class="menu-item" data-route="orders">📦 My Orders</div>
          <div class="menu-item" data-route="wallet">🪙 ApyCoins Wallet</div>
          <div class="menu-item" data-route="addresses">📍 Saved Addresses</div>
          <div class="menu-item" data-route="seller">🏪 Seller Dashboard</div>
          <div class="menu-item" data-route="creator">🎬 Creator Dashboard</div>
          <div class="menu-item" data-route="refer">👥 Refer & Earn</div>
          <div class="menu-item" data-route="help">❓ Help & Support</div>
        </div>
      </div>`;
    this.container.querySelector('.logout-btn')?.addEventListener('click', async () => { await logout(); this.render(); });
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => router.navigate(item.dataset.route));
    });
  }
  renderGuest() {
    this.container.innerHTML = `<div class="profile-page guest"><div class="guest-card"><h2>Welcome to Apykart!</h2><p>Sign in to access your orders, coins, and more.</p><button class="google-signin-btn">Sign in with Google</button></div></div>`;
    this.container.querySelector('.google-signin-btn')?.addEventListener('click', async () => { await signInWithGoogle(); this.render(); });
  }
}
