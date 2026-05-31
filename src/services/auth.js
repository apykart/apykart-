import { auth, db } from './firebase.js';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export const provider = new GoogleAuthProvider();

// Global user state (observable)
export let currentUser = null;
export let userData = {
  cart: [],
  wishlist: [],
  addresses: [],
  coins: { balance: 0, transactions: [] },
  role: 'user',
  sellerVerification: null,
  sellerProducts: [],
  sellerEarnings: [],
  withdrawalRequests: [],
  sellerProfile: { bankName: '', accountNumber: '', ifsc: '', upi: '' },
  userVideos: []
};

let unsubscribeUser = null;

export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      // Ensure user document exists
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          profile: { name: user.displayName || '', email: user.email || '', phone: '' },
          role: 'user',
          createdAt: new Date()
        });
      }
      // Realtime listener for user data
      if (unsubscribeUser) unsubscribeUser();
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          Object.assign(userData, docSnap.data());
          window.dispatchEvent(new CustomEvent('user-updated', { detail: userData }));
        }
      });
    } else {
      if (unsubscribeUser) unsubscribeUser();
      // Reset to defaults
      Object.assign(userData, {
        cart: [], wishlist: [], addresses: [], coins: { balance: 0, transactions: [] },
        role: 'user', sellerVerification: null, sellerProducts: [], sellerEarnings: [],
        withdrawalRequests: [], sellerProfile: {}, userVideos: []
      });
    }
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
  });
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
        }
