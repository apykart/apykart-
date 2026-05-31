import { db } from './firebase.js';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary.js';

export let approvedVideos = [];
let unsubscribe = null;

export function initVideosListener() {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, 'videos'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
  unsubscribe = onSnapshot(q, (snapshot) => {
    approvedVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.dispatchEvent(new CustomEvent('videos-updated', { detail: approvedVideos }));
  });
}

export async function uploadVideo(file, metadata, onProgress) {
  const videoUrl = await uploadToCloudinary(file, onProgress, 'video');
  const docRef = await addDoc(collection(db, 'videos'), {
    ...metadata,
    videoUrl,
    status: 'pending',
    createdAt: serverTimestamp(),
    views: 0
  });
  return { id: docRef.id, ...metadata, videoUrl };
}
