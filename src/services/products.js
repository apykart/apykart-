import { db } from './firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export let products = [];
let unsubscribe = null;

export function initProductsListener() {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, 'products'), where('status', 'in', ['active', 'approved']));
  unsubscribe = onSnapshot(q, (snapshot) => {
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.dispatchEvent(new CustomEvent('products-updated', { detail: products }));
  });
}
export function findProduct(id) { return products.find(p => p.id === id); }
