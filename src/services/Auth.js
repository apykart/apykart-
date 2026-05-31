import { auth, db } from './firebase.js';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export const provider = new GoogleAuthProvider();
export let currentUser = null;
export let userData = {
  cart: [], wishlist: [], addresses: [],
  coins: { balance: 0, transactions: [] },
  role: 'user', sellerVerification: null,
  sellerProducts: [], sellerEarnings: [],
  withdrawalRequests: [], sellerProfile: {},
  userVideos: []
};

let unsubscribeUser = null;

export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          profile: { name: user.displayName || '', email: user.email || '', phone: '' },
          role: 'user', createdAt: new Date()
        });
      }
      if (unsubscribeUser) unsubscribeUser();
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) Object.assign(userData, docSnap.data());
        window.dispatchEvent(new CustomEvent('user-updated', { detail: userData }));
      });
    } else {
      if (unsubscribeUser) unsubscribeUser();
    }
  });
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
export async function logout() { await signOut(auth); }
