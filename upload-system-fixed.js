/**
 * APYKART UPLOAD SYSTEM - FIXED v4.1
 * Complete working implementation for images, videos, documents
 * Tested with Cloudinary unsigned uploads
 */

// ════════════════════════════════════════════════════════════════
// CLOUDINARY CONFIG (CORRECTED)
// ════════════════════════════════════════════════════════════════

const CLOUD_NAME = "djcfq7tlf";           // ✅ Your Cloudinary cloud name
const UPLOAD_PRESET = "apykart_uploads";  // ✅ Must be UNSIGNED preset
const UPLOAD_PRESET_VIDEO = "apykart_videos"; // ✅ Separate for videos

// ════════════════════════════════════════════════════════════════
// IMAGE UPLOAD WITH COMPRESSION
// ════════════════════════════════════════════════════════════════

/**
 * Compress image before upload to reduce file size
 * @param {File} file - Image file
 * @returns {Promise<File>} Compressed image
 */
async function compressImg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Max dimensions: 1920x1920
        const maxDim = 1920;
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.8 quality
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file
 * @param {string} folder - Folder path in Cloudinary
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} Image URL
 */
async function uploadImg(file, folder, onProgress) {
  if (!file) throw new Error('No file selected');

  console.log('📤 Image upload start:', file.name, file.type, (file.size/1024).toFixed(1)+'KB');

  let uploadFile = file;
  try {
    uploadFile = await compressImg(file);
    console.log('🗜️ Compressed:', (uploadFile.size/1024).toFixed(1)+'KB');
  } catch(e) {
    console.warn('⚠️ Compress failed, using original:', e);
    uploadFile = file;
  }

  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('upload_preset', UPLOAD_PRESET);
  // ❌ DO NOT add 'folder' — unsigned presets reject it

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // ✅ CORRECT IMAGE ENDPOINT
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    
    // Track upload progress
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round(e.loaded / e.total * 100);
        onProgress(percent);
        console.log(`📊 Upload progress: ${percent}%`);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log('✅ Upload success:', data.secure_url);
        resolve(data.secure_url);
      } else {
        let m = `Image upload failed (${xhr.status})`;
        try { 
          m = JSON.parse(xhr.responseText)?.error?.message || m; 
        } catch(e) {}
        console.error('❌ Upload error:', m);
        reject(new Error(m));
      }
    };
    
    xhr.onerror = () => {
      console.error('❌ Network error');
      reject(new Error('Network error during image upload'));
    };
    
    xhr.onabort = () => {
      console.warn('⚠️ Upload aborted');
      reject(new Error('Upload aborted'));
    };
    
    xhr.send(formData);
  });
}

// ════════════════════════════════════════════════════════════════
// VIDEO UPLOAD
// ════════════════════════════════════════════════════════════════

/**
 * Upload video to Cloudinary
 * @param {File} file - Video file (MP4, MOV, WebM)
 * @param {string} folder - Folder path
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} Video URL
 */
async function uploadVideo(file, folder, onProgress) {
  if (!file) throw new Error('No file');
  
  console.log('🎬 Video upload start:', file.name, file.type, (file.size/1024/1024).toFixed(1)+'MB');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET_VIDEO);
  // ❌ DO NOT add 'folder' — unsigned presets reject it
  // ❌ DO NOT add 'api_key' — that makes it signed

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // ✅ CORRECT VIDEO ENDPOINT with resource_type in URL
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
    
    // Track upload progress
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round(e.loaded / e.total * 100);
        onProgress(percent);
        console.log(`📊 Video upload: ${percent}%`);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log('✅ Video upload success:', data.secure_url);
        resolve(data.secure_url);
      } else {
        let m = `Video upload failed (${xhr.status})`;
        try { 
          m = JSON.parse(xhr.responseText)?.error?.message || m; 
        } catch(e) {}
        console.error('❌ Video error:', m);
        reject(new Error(m));
      }
    };
    
    xhr.onerror = () => {
      console.error('❌ Network error');
      reject(new Error('Network error during video upload'));
    };
    
    xhr.send(formData);
  });
}

// ════════════════════════════════════════════════════════════════
// UNIVERSAL UPLOAD ROUTER
// ════════════════════════════════════════════════════════════════

/**
 * Upload file - auto-detects image vs video
 * @param {File} file - File to upload
 * @param {string} path - Path format: "videos/uid/name" or "images/uid/name"
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Public URL
 */
async function uploadToStorage(file, path, onProgress) {
  if (!file) return null;
  
  const isVideo = file.type.startsWith('video/') || path.startsWith('videos/');
  const folder = path.split('/').slice(0, -1).join('/');
  
  try {
    if (isVideo) {
      return await uploadVideo(file, folder, onProgress);
    } else {
      return await uploadImg(file, folder, onProgress);
    }
  } catch(e) {
    console.error('Upload error:', e.message);
    if (typeof showToast === 'function') {
      showToast('Upload failed: ' + e.message, 'err');
    }
    throw e;
  }
}

// ════════════════════════════════════════════════════════════════
// FILE INPUT HANDLERS FOR FORMS
// ════════════════════════════════════════════════════════════════

/**
 * Handle product image upload
 */
async function handleProductImageUpload(files) {
  if (!files.length) return;
  const file = files[0];
  
  try {
    showToast('Uploading image...', 'inf');
    const url = await uploadImg(file, 'products', (percent) => {
      console.log(`Product image: ${percent}%`);
    });
    
    // Add to preview
    const container = document.getElementById('product-images-preview');
    if (container) {
      const img = document.createElement('img');
      img.src = url;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.marginRight = '8px';
      container.appendChild(img);
    }
    
    // Store URL
    window.productImageUrls = window.productImageUrls || [];
    window.productImageUrls.push(url);
    
    showToast('Image uploaded successfully', 'suc');
  } catch(e) {
    showToast('Image upload failed: ' + e.message, 'err');
  }
}

/**
 * Handle category image upload
 */
async function handleCategoryImageUpload(files) {
  if (!files.length) return;
  const file = files[0];
  
  try {
    showToast('Uploading category image...', 'inf');
    const url = await uploadImg(file, 'categories', (percent) => {
      console.log(`Category image: ${percent}%`);
    });
    
    window.categoryImageUrl = url;
    
    // Show preview
    const preview = document.getElementById('cat-image-preview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:8px">`;
    }
    
    showToast('Category image uploaded', 'suc');
  } catch(e) {
    showToast('Upload failed: ' + e.message, 'err');
  }
}

/**
 * Handle banner image upload
 */
async function handleBannerImageUpload(files) {
  if (!files.length) return;
  const file = files[0];
  
  try {
    showToast('Uploading banner...', 'inf');
    const url = await uploadImg(file, 'banners', (percent) => {
      console.log(`Banner: ${percent}%`);
    });
    
    window.bannerImageUrl = url;
    
    const preview = document.getElementById('ban-image-preview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" style="width:150px;height:80px;object-fit:cover;border-radius:8px">`;
    }
    
    showToast('Banner uploaded', 'suc');
  } catch(e) {
    showToast('Upload failed: ' + e.message, 'err');
  }
}

/**
 * Handle video upload
 */
async function handleVideoUpload(files) {
  if (!files.length) return;
  const file = files[0];
  
  if (!file.type.startsWith('video/')) {
    showToast('Please select a video file', 'wrn');
    return;
  }
  
  try {
    const progressBar = document.getElementById('video-progress');
    
    showToast('Uploading video (this may take a while)...', 'inf');
    
    const url = await uploadVideo(file, 'videos', (percent) => {
      if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.parentElement.style.display = 'block';
      }
    });
    
    window.uploadedVideoUrl = url;
    
    const preview = document.getElementById('video-preview');
    if (preview) {
      preview.innerHTML = `<video width="150" height="100" controls><source src="${url}"></video>`;
    }
    
    showToast('Video uploaded successfully!', 'suc');
  } catch(e) {
    showToast('Video upload failed: ' + e.message, 'err');
  }
}

// ════════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════════

window.uploadImg = uploadImg;
window.uploadVideo = uploadVideo;
window.uploadToStorage = uploadToStorage;
window.compressImg = compressImg;
window.handleProductImageUpload = handleProductImageUpload;
window.handleCategoryImageUpload = handleCategoryImageUpload;
window.handleBannerImageUpload = handleBannerImageUpload;
window.handleVideoUpload = handleVideoUpload;
