import { getCoins, addCoins } from '../services/wallet.js';
import { formatPrice } from '../utils/helpers.js';

export class WalletPage {
  constructor(container) {
    this.container = container;
  }

  render() {
    const coins = getCoins();
    const balance = coins.balance;
    const transactions = coins.transactions || [];

    this.container.innerHTML = `
      <div class="wallet-page">
        <div class="wallet-balance-card">
          <div class="balance-icon">🪙</div>
          <div class="balance-amount">${balance}</div>
          <div class="balance-value">≈ ${formatPrice(balance * 0.1)}</div>
        </div>
        <div class="coin-rules">
          <h4>How to earn coins</h4>
          <ul>
            <li>📦 Place an order → +10 coins</li>
            <li>👥 Refer a friend → +100 coins</li>
            <li>⭐ Rate the app → +50 coins</li>
            <li>🎂 Birthday bonus → +100 coins</li>
          </ul>
        </div>
        <div class="transactions">
          <h4>Transaction History</h4>
          ${transactions.length === 0 ? '<div class="empty">No transactions yet</div>' : 
            transactions.map(tx => `
              <div class="tx-item ${tx.type}">
                <span class="tx-desc">${tx.description}</span>
                <span class="tx-amount">${tx.type === 'earned' ? '+' : '-'}${tx.amount}</span>
                <span class="tx-date">${new Date(tx.date).toLocaleDateString()}</span>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }
            }
