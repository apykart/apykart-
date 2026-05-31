import { db } from './firebase.js';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary.js';

export let approvedVideos = [];
let unsubscribeVideos = null;

export function initVideosListener() {
  const q = query(
    collection(db, 'videos'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  unsubscribeVideos = onSnapshot(q, (snapshot) => {
    approvedVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.dispatchEvent(new CustomEvent('videos-updated', { detail: approvedVideos }));
  });
}

export async function uploadVideo(file, metadata, onProgress) {
  const videoUrl = await uploadToCloudinary(file, onProgress, 'video');
  const newVideo = {
    ...metadata,
    videoUrl,
    status: 'pending',
    createdAt: serverTimestamp(),
    views: 0
  };
  const docRef = await addDoc(collection(db, 'videos'), newVideo);
  return { id: docRef.id, ...newVideo };
}
