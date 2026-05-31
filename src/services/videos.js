import { db } from './firebase.js';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary.js';

export let approvedVideos = [];
let unsubscribe = null;

/**
 * Initialize real-time listener for approved videos
 */
export function initVideosListener() {
  if (unsubscribe) unsubscribe();
  const q = query(
    collection(db, 'videos'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  unsubscribe = onSnapshot(q, (snapshot) => {
    approvedVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.dispatchEvent(new CustomEvent('videos-updated', { detail: approvedVideos }));
  });
}

/**
 * Upload a video file to Cloudinary and save metadata to Firestore
 * @param {File} file - Video file (MP4, MOV)
 * @param {Object} metadata - { title, description, productId, productName, price, ogPrice, uploaderName, uploaderUid }
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Saved video document (with id)
 */
export async function uploadVideo(file, metadata, onProgress) {
  // Step 1: Upload to Cloudinary (auto-detects video)
  const videoUrl = await uploadToCloudinary(file, onProgress);

  // Step 2: Save to Firestore with status 'pending'
  const docRef = await addDoc(collection(db, 'videos'), {
    ...metadata,
    videoUrl,
    status: 'pending',
    createdAt: serverTimestamp(),
    views: 0,
    likes: 0
  });

  return { id: docRef.id, ...metadata, videoUrl };
}
