import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB9wwF-K1AwN8xlrppiKELDXx0NxqJknbc",
  authDomain: "apykart-916.firebaseapp.com",
  projectId: "apykart-916",
  storageBucket: "apykart-916.firebasestorage.app",
  messagingSenderId: "787741109597",
  appId: "1:787741109597:web:883a5eee5e9bb9602f8cb4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
