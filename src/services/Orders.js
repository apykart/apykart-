import { db, auth } from './firebase.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function createOrder(orderData) {
  const user = auth.currentUser;
  const uid = user?.uid || 'guest';
  const order = {
    ...orderData, userId: uid,
    createdAt: serverTimestamp(),
    status: 'placed',
    statusHistory: [{ status: 'placed', time: new Date().toISOString() }]
  };
  const mainRef = await addDoc(collection(db, 'orders'), order);
  if (uid !== 'guest') {
    await addDoc(collection(db, 'users', uid, 'orders'), { ...order, orderId: mainRef.id });
  }
  return { id: mainRef.id, ...order };
}
export async function updateOrderStatus(orderId, newStatus, userId = null) {
  await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  if (userId) await updateDoc(doc(db, 'users', userId, 'orders', orderId), { status: newStatus });
}
