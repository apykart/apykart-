import { getCoins } from '../services/wallet.js';
import { formatPrice } from '../utils/helpers.js';

export class WalletPage {
  constructor(container) { this.container = container; }
  render() {
    const coins = getCoins();
    const balance = coins.balance;
    const transactions = coins.transactions || [];
    this.container.innerHTML = `
      <div class="wallet-page">
        <div class="wallet-balance-card"><div class="balance-amount">${balance} 🪙</div><div class="balance-value">≈ ${formatPrice(balance * 0.1)}</div></div>
        <div class="coin-rules"><h4>How to earn coins</h4><ul><li>Place an order → +10</li><li>Refer a friend → +100</li><li>Rate app → +50</li></ul></div>
        <div class="transactions"><h4>History</h4>${transactions.length ? transactions.map(tx => `<div class="tx-item"><span>${tx.description}</span><span>${tx.type === 'earned' ? '+' : '-'}${tx.amount}</span></div>`).join('') : '<div>No transactions</div>'}</div>
      </div>
    `;
  }
}
