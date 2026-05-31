import { db } from './firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export let products = [];
let unsubscribeProducts = null;

export function initProductsListener() {
  const q = query(collection(db, 'products'), where('status', 'in', ['active', 'approved']));
  unsubscribeProducts = onSnapshot(q, (snapshot) => {
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('products-updated', { detail: products }));
  });
}

export function findProduct(id) {
  return products.find(p => p.id === id);
}
