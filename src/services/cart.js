import { userData, currentUser } from './auth.js';
import { db } from './firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { products } from './products.js';

export function getCart() {
  return userData.cart || [];
}

export function getCartTotal() {
  return (userData.cart || []).reduce((sum, item) => {
    const p = products.find(p => p.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

export async function addToCart(productId, qty = 1) {
  const existing = userData.cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    userData.cart.push({ id: productId, qty });
  }
  await saveCart();
}

export async function updateCartItemQty(productId, delta) {
  const item = userData.cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      userData.cart = userData.cart.filter(i => i.id !== productId);
    }
  }
  await saveCart();
}

export async function removeFromCart(productId) {
  userData.cart = userData.cart.filter(i => i.id !== productId);
  await saveCart();
}

async function saveCart() {
  if (!currentUser) return;
  const userRef = doc(db, 'users', currentUser.uid);
  await updateDoc(userRef, { cart: userData.cart });
}
