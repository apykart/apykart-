/**
 * APYKART ADMIN UPLOAD HANDLERS - v4.2
 * Complete file input handlers for all upload zones
 * Integrates upload-system-fixed.js with admin.html modals
 */

// ════════════════════════════════════════════════════════════════
// GLOBAL UPLOAD STATE
// ════════════════════════════════════════════════════════════════

window._UPLOAD_STATE = {
  productImages: [],
  categoryImage: null,
  bannerImage: null,
  managerPhoto: null,
  homeImage: null,
  flashDealImages: []
};

// ════════════════════════════════════════════════════════════════
// PRODUCT IMAGE UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════

/**
 * Handle product image upload from file input
 * @param {FileList} files - Selected files
 */
async function handleProdImgs(files) {
  if (!files || !files.length) return;

  const progressBar = document.getElementById('pm-uprog');
  const progressFill = document.getElementById('pm-uprog-fill');
  const previewContainer = document.getElementById('pm-imgs');

  if (!previewContainer) return;

  for (let file of files) {
    // Validate before upload
    if (!file.type.startsWith('image/')) {
      showToast('Only images allowed for products', 'wrn');
      continue;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5MB)', 'wrn');
      continue;
    }

    try {
      // Show progress
      if (progressBar) progressBar.style.display = 'block';
      
      showToast('Uploading ' + file.name + '...', 'inf');

      // Upload using upload-system-fixed.js
      const url = await uploadImg(file, 'products', (percent) => {
        if (progressFill) {
          progressFill.style.width = percent + '%';
        }
      });

      // Store URL
      window._UPLOAD_STATE.productImages.push({
        url,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });

      // Show preview thumbnail
      const thumb = document.createElement('div');
      thumb.className = 'uthumb';
      thumb.innerHTML = `
        <img src="${url}" alt="${file.name}">
        <div class="uthumb-x" onclick="removeProdImg('${url}')" title="Remove">✕</div>
      `;
      previewContainer.appendChild(thumb);

      showToast(file.name + ' uploaded ✓', 'suc');

    } catch (error) {
      console.error('Product image upload error:', error);
      showToast('Failed to upload ' + file.name + ': ' + error.message, 'err');
    }
  }

  // Hide progress after done
  if (progressBar) {
    setTimeout(() => {
      progressBar.style.display = 'none';
      if (progressFill) progressFill.style.width = '0%';
    }, 1000);
  }
}

/**
 * Remove product image from preview and state
 * @param {string} url - Image URL to remove
 */
function removeProdImg(url) {
  window._UPLOAD_STATE.productImages = window._UPLOAD_STATE.productImages.filter(img => img.url !== url);
  const container = document.getElementById('pm-imgs');
  if (container) {
    container.querySelectorAll('.uthumb').forEach(thumb => {
      if (thumb.querySelector('img').src === url) {
        thumb.remove();
      }
    });
  }
}

// ════════════════════════════════════════════════════════════════
// CATEGORY IMAGE UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════

/**
 * Handle category image upload
 * @param {FileList} files - Selected files
 */
async function handleCatImg(files) {
  if (!files || !files.length) return;

  const file = files[0];

  if (!file.type.startsWith('image/')) {
    showToast('Only images allowed', 'wrn');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image too large (max 5MB)', 'wrn');
    return;
  }

  try {
    showToast('Uploading category image...', 'inf');

    const url = await uploadImg(file, 'categories', (percent) => {
      console.log('Category upload:', percent + '%');
    });

    window._UPLOAD_STATE.categoryImage = {
      url,
      name: file.name,
      type: file.type,
      size: file.size
    };

    // Show preview
    const preview = document.getElementById('cm-img-preview');
    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:100px;height:100px">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
          <button onclick="removeCatImg()" style="position:absolute;top:2px;right:2px;background:var(--red);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700">✕</button>
        </div>
      `;
    }

    showToast('Category image uploaded ✓', 'suc');

  } catch (error) {
    console.error('Category image upload error:', error);
    showToast('Upload failed: ' + error.message, 'err');
  }
}

/**
 * Remove category image
 */
function removeCatImg() {
  window._UPLOAD_STATE.categoryImage = null;
  const preview = document.getElementById('cm-img-preview');
  if (preview) {
    preview.innerHTML = '';
  }
}

// ════════════════════════════════════════════════════════════════
// BANNER IMAGE UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════

/**
 * Handle banner image upload
 * @param {FileList} files - Selected files
 */
async function handleBanImg(files) {
  if (!files || !files.length) return;

  const file = files[0];

  if (!file.type.startsWith('image/')) {
    showToast('Only images allowed', 'wrn');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image too large (max 5MB)', 'wrn');
    return;
  }

  try {
    showToast('Uploading banner...', 'inf');

    const url = await uploadImg(file, 'banners', (percent) => {
      console.log('Banner upload:', percent + '%');
    });

    window._UPLOAD_STATE.bannerImage = {
      url,
      name: file.name,
      type: file.type,
      size: file.size
    };

    // Show preview
    const preview = document.getElementById('bm-img-preview');
    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:150px;height:80px">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
          <button onclick="removeBanImg()" style="position:absolute;top:2px;right:2px;background:var(--red);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700">✕</button>
        </div>
      `;
    }

    showToast('Banner uploaded ✓', 'suc');

  } catch (error) {
    console.error('Banner image upload error:', error);
    showToast('Upload failed: ' + error.message, 'err');
  }
}

/**
 * Remove banner image
 */
function removeBanImg() {
  window._UPLOAD_STATE.bannerImage = null;
  const preview = document.getElementById('bm-img-preview');
  if (preview) {
    preview.innerHTML = '';
  }
}

// ════════════════════════════════════════════════════════════════
// HOME THEME IMAGE UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════

/**
 * Handle home theme hero image upload
 * @param {FileList} files - Selected files
 */
async function handleHomeThemeImg(files) {
  if (!files || !files.length) return;

  const file = files[0];

  if (!file.type.startsWith('image/')) {
    showToast('Only images allowed', 'wrn');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Image too large (max 10MB)', 'wrn');
    return;
  }

  try {
    showToast('Uploading home theme image...', 'inf');

    const url = await uploadImg(file, 'home-theme', (percent) => {
      console.log('Home theme upload:', percent + '%');
    });

    window._UPLOAD_STATE.homeImage = {
      url,
      name: file.name,
      type: file.type,
      size: file.size
    };

    // Show preview
    const preview = document.getElementById('ht-img-prev');
    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:100%;max-width:400px">
          <img src="${url}" style="width:100%;border-radius:8px;border:1px solid var(--border)">
          <button onclick="removeHomeThemeImg()" style="position:absolute;top:8px;right:8px;background:var(--red);color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">✕ Remove</button>
        </div>
      `;
    }

    showToast('Home theme image uploaded ✓', 'suc');

  } catch (error) {
    console.error('Home theme image upload error:', error);
    showToast('Upload failed: ' + error.message, 'err');
  }
}

/**
 * Remove home theme image
 */
function removeHomeThemeImg() {
  window._UPLOAD_STATE.homeImage = null;
  const preview = document.getElementById('ht-img-prev');
  if (preview) {
    preview.innerHTML = '';
  }
}

// ════════════════════════════════════════════════════════════════
// VIDEO UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════

/**
 * Handle video upload
 * @param {FileList} files - Selected files
 */
async function handleVideoUpload(files) {
  if (!files || !files.length) return;

  const file = files[0];

  if (!file.type.startsWith('video/')) {
    showToast('Only video files allowed', 'wrn');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('Video too large (max 50MB)', 'wrn');
    return;
  }

  try {
    const progressBar = document.getElementById('video-progress-bar');
    const progressContainer = document.getElementById('video-progress');
    
    showToast('Uploading video (this may take a while)...', 'inf');

    const url = await uploadVideo(file, 'videos', (percent) => {
      if (progressBar) {
        progressBar.style.width = percent + '%';
      }
      if (progressContainer && percent === 100) {
        progressContainer.style.display = 'none';
      }
    });

    // Show preview
    const preview = document.getElementById('video-preview');
    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:150px;height:100px">
          <video width="150" height="100" controls style="border-radius:8px;border:1px solid var(--border)">
            <source src="${url}" type="video/mp4">
          </video>
          <button onclick="removeVideoUpload()" style="position:absolute;top:2px;right:2px;background:var(--red);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700">✕</button>
        </div>
      `;
    }

    window.uploadedVideoUrl = url;
    showToast('Video uploaded successfully ✓', 'suc');

  } catch (error) {
    console.error('Video upload error:', error);
    showToast('Video upload failed: ' + error.message, 'err');
  }
}

/**
 * Remove video upload
 */
function removeVideoUpload() {
  window.uploadedVideoUrl = null;
  const preview = document.getElementById('video-preview');
  if (preview) {
    preview.innerHTML = '';
  }
}

// ════════════════════════════════════════════════════════════════
// BULK UPLOAD UTILITY
// ════════════════════════════════════════════════════════════════

/**
 * Get all uploaded images for current modal context
 * @param {string} context - 'product', 'category', 'banner', 'home'
 * @returns {Array} Array of image objects with urls
 */
function getUploadedImages(context) {
  const state = window._UPLOAD_STATE;
  
  switch(context) {
    case 'product':
      return state.productImages || [];
    case 'category':
      return state.categoryImage ? [state.categoryImage] : [];
    case 'banner':
      return state.bannerImage ? [state.bannerImage] : [];
    case 'home':
      return state.homeImage ? [state.homeImage] : [];
    default:
      return [];
  }
}

/**
 * Clear all uploads for a context
 * @param {string} context - 'product', 'category', 'banner', 'home'
 */
function clearUploads(context) {
  const state = window._UPLOAD_STATE;
  
  switch(context) {
    case 'product':
      state.productImages = [];
      const pm = document.getElementById('pm-imgs');
      if (pm) pm.innerHTML = '';
      break;
    case 'category':
      state.categoryImage = null;
      const cm = document.getElementById('cm-img-preview');
      if (cm) cm.innerHTML = '';
      break;
    case 'banner':
      state.bannerImage = null;
      const bm = document.getElementById('bm-img-preview');
      if (bm) bm.innerHTML = '';
      break;
    case 'home':
      state.homeImage = null;
      const hm = document.getElementById('ht-img-prev');
      if (hm) hm.innerHTML = '';
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// MODAL CLOSE HANDLERS - Clear uploads on cancel
// ════════════════════════════════════════════════════════════════

/**
 * Close product modal and clear uploads
 */
function closeProdModal() {
  clearUploads('product');
  const modal = document.getElementById('ov-product');
  if (modal) modal.classList.remove('open');
}

/**
 * Close category modal and clear uploads
 */
function closeCatModal() {
  clearUploads('category');
  const modal = document.getElementById('ov-cat');
  if (modal) modal.classList.remove('open');
}

/**
 * Close banner modal and clear uploads
 */
function closeBanModal() {
  clearUploads('banner');
  const modal = document.getElementById('ov-banner');
  if (modal) modal.classList.remove('open');
}

/**
 * Close home theme modal and clear uploads
 */
function closeHomeThemeModal() {
  clearUploads('home');
  const modal = document.getElementById('ov-home-theme');
  if (modal) modal.classList.remove('open');
}

// ════════════════════════════════════════════════════════════════
// EXPORT TO WINDOW
// ════════════════════════════════════════════════════════════════

window.handleProdImgs = handleProdImgs;
window.removeProdImg = removeProdImg;
window.handleCatImg = handleCatImg;
window.removeCatImg = removeCatImg;
window.handleBanImg = handleBanImg;
window.removeBanImg = removeBanImg;
window.handleHomeThemeImg = handleHomeThemeImg;
window.removeHomeThemeImg = removeHomeThemeImg;
window.handleVideoUpload = handleVideoUpload;
window.removeVideoUpload = removeVideoUpload;
window.getUploadedImages = getUploadedImages;
window.clearUploads = clearUploads;
window.closeProdModal = closeProdModal;
window.closeCatModal = closeCatModal;
window.closeBanModal = closeBanModal;
window.closeHomeThemeModal = closeHomeThemeModal;
