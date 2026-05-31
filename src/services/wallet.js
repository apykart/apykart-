import { userData, currentUser } from './auth.js';
import { db } from './firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

export function getCoins() { return userData.coins || { balance: 0, transactions: [] }; }
export async function addCoins(amount, description) {
  const coins = getCoins();
  coins.balance += amount;
  coins.transactions.unshift({ id: Date.now().toString(), type: 'earned', amount, description, date: new Date().toISOString() });
  await saveCoins(coins);
}
export async function deductCoins(amount, description) {
  const coins = getCoins();
  if (coins.balance < amount) throw new Error('Insufficient coins');
  coins.balance -= amount;
  coins.transactions.unshift({ id: Date.now().toString(), type: 'redeemed', amount, description, date: new Date().toISOString() });
  await saveCoins(coins);
}
async function saveCoins(coins) {
  if (!currentUser) return;
  await updateDoc(doc(db, 'users', currentUser.uid), { coins });
}
