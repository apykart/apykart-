import { userData, currentUser } from '../services/auth.js';
import { showToast } from '../utils/helpers.js';

export class ReferPage {
  constructor(container) {
    this.container = container;
  }

  render() {
    const code = currentUser ? `APY${currentUser.uid.slice(-6)}` : 'GUEST';
    const link = `https://apykart.vercel.app?ref=${code}`;
    this.container.innerHTML = `
      <div class="refer-page">
        <div class="refer-header">
          <div class="refer-icon">🎁</div>
          <h2>Refer & Earn 100 Coins</h2>
          <p>Invite your friends to join Apykart. You both get 100 coins when they place their first order!</p>
        </div>
        <div class="refer-code-box">
          <div class="refer-code">${code}</div>
          <button class="copy-code-btn">Copy Code</button>
        </div>
        <div class="refer-link-box">
          <div class="refer-link">${link}</div>
          <button class="copy-link-btn">Copy Link</button>
        </div>
        <div class="how-it-works">
          <h3>How it works</h3>
          <ol>
            <li>Share your unique code or link</li>
            <li>Friend signs up and shops</li>
            <li>You both earn 100 ApyCoins</li>
          </ol>
        </div>
      </div>
    `;
    document.querySelector('.copy-code-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(code);
      showToast('Code copied!');
    });
    document.querySelector('.copy-link-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(link);
      showToast('Link copied!');
    });
  }
}
