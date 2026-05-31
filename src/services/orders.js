import { db, auth } from './firebase.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function createOrder(orderData) {
  const user = auth.currentUser;
  const uid = user?.uid || 'guest';
  
  // Prepare order object
  const order = {
    ...orderData,
    userId: uid,
    createdAt: serverTimestamp(),
    status: 'placed',  // FIX: start with 'placed' not 'confirmed'
    statusHistory: [{ status: 'placed', time: new Date().toISOString() }]
  };
  
  // Save to top-level 'orders' collection (admin panel)
  const mainRef = await addDoc(collection(db, 'orders'), order);
  
  // Save to user subcollection (user dashboard)
  if (uid !== 'guest') {
    await addDoc(collection(db, 'users', uid, 'orders'), { ...order, orderId: mainRef.id });
  }
  
  return { id: mainRef.id, ...order };
}

export async function updateOrderStatus(orderId, newStatus, userId = null) {
  const updates = { status: newStatus, updatedAt: serverTimestamp() };
  // Update main collection
  await updateDoc(doc(db, 'orders', orderId), updates);
  // Update user subcollection if userId provided
  if (userId) {
    await updateDoc(doc(db, 'users', userId, 'orders', orderId), updates);
  }
}
