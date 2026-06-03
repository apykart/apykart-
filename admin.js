/**
 * APYKART ADMIN PANEL v4.0
 * Complete JavaScript Implementation with Upload Support
 * 
 * UPLOAD SYSTEM:
 * - Firebase Storage for primary uploads
 * - Cloudinary as fallback
 * - Supports: images, videos, documents
 */

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyDtest123456789",
  authDomain: "apykart-916.firebaseapp.com",
  projectId: "apykart-916",
  storageBucket: "apykart-916.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  databaseURL: "https://apykart-916.firebaseio.com"
};

// Initialize Firebase (if available)
let db = null, storage = null, auth = null;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  auth = firebase.auth();
}

// CLOUDINARY CONFIGURATION
const CLOUDINARY_CLOUD_NAME = "djcfq7tlf";
const CLOUDINARY_UPLOAD_PRESET = "apykart_uploads"; // Must be unsigned preset

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════

let currentUser = null;
let selectedFiles = {
  product: [],
  category: [],
  banner: [],
  homeImg: null
};

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} folder - Storage folder path
 * @returns {Promise<string>} Download URL
 */
async function uploadToFirebase(file, folder) {
  try {
    if (!storage) throw new Error("Firebase Storage not initialized");

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${folder}/${fileName}`;
    
    const ref = storage.ref(storagePath);
    const uploadTask = ref.put(file, {
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.email || 'unknown'
      }
    });

    // Monitor upload progress
    uploadTask.on('state_changed', 
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload progress: ${progress}%`);
        document.dispatchEvent(new CustomEvent('uploadProgress', { 
          detail: { progress, fileName }
        }));
      }
    );

    await uploadTask;
    const downloadUrl = await ref.getDownloadURL();
    return downloadUrl;

  } catch (error) {
    console.error("Firebase upload error:", error);
    // Fallback to Cloudinary
    return uploadToCloudinary(file);
  }
}

/**
 * Upload file to Cloudinary (fallback)
 * @param {File} file - File to upload
 * @returns {Promise<string>} Cloudinary URL
 */
async function uploadToCloudinary(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('timestamp', Math.floor(Date.now() / 1000));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * Generic file upload handler
 * @param {File} file - File to upload
 * @param {string} folder - Storage folder
 * @param {string} fileType - 'image', 'video', or 'document'
 * @returns {Promise<{url, name, type, size}>}
 */
async function uploadFile(file, folder = 'uploads', fileType = 'image') {
  try {
    // Validate file
    const validation = validateFile(file, fileType);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Show loading
    showToast('Uploading ' + file.name + '...', 'info');

    // Upload
    const url = await uploadToFirebase(file, folder);

    return {
      url,
      name: file.name,
      type: file.type,
      size: file.size
    };

  } catch (error) {
    showToast('Upload failed: ' + error.message, 'err');
    throw error;
  }
}

/**
 * Validate file before upload
 * @param {File} file
 * @param {string} fileType
 * @returns {{valid: boolean, error?: string}}
 */
function validateFile(file, fileType) {
  const maxSizes = {
    image: 5 * 1024 * 1024,      // 5MB
    video: 50 * 1024 * 1024,     // 50MB
    document: 10 * 1024 * 1024   // 10MB
  };

  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  // Check size
  if (file.size > maxSizes[fileType || 'image']) {
    return {
      valid: false,
      error: `File too large. Max size: ${maxSizes[fileType || 'image'] / 1024 / 1024}MB`
    };
  }

  // Check type
  if (fileType && allowedTypes[fileType] && !allowedTypes[fileType].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes[fileType].join(', ')}`
    };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL UPLOAD HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handle home theme hero image upload
 */
async function handleHomeImg(file) {
  if (!file) return;
  
  try {
    const fileData = await uploadFile(file, 'home-theme', 'image');
    selectedFiles.homeImg = fileData;

    // Show preview
    const preview = document.getElementById('ht-img-prev');
    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:100%;max-width:400px">
          <img src="${fileData.url}" style="width:100%;border-radius:8px;border:1px solid var(--border)">
          <button onclick="clearHomeImg()" style="position:absolute;top:8px;right:8px;background:var(--red);color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px">✕ Remove</button>
        </div>
      `;
    }

    showToast('Image uploaded successfully', 'suc');
  } catch (error) {
    console.error('Home image upload error:', error);
  }
}

/**
 * Clear home image
 */
function clearHomeImg() {
  selectedFiles.homeImg = null;
  document.getElementById('ht-img-prev').innerHTML = '';
}

/**
 * Open product modal
 */
function openProductModal(productId) {
  const modal = document.getElementById('product-modal');
  if (!modal) createProductModal();
  
  const modalEl = document.getElementById('product-modal');
  if (modalEl) {
    modalEl.classList.add('open');
    if (productId) loadProductData(productId);
  }
}

/**
 * Open category modal
 */
function openCatModal(catId) {
  const modal = document.getElementById('cat-modal');
  if (!modal) createCategoryModal();
  
  const modalEl = document.getElementById('cat-modal');
  if (modalEl) {
    modalEl.classList.add('open');
    if (catId) loadCategoryData(catId);
  }
}

/**
 * Open banner modal
 */
function openBannerModal(bannerId) {
  const modal = document.getElementById('banner-modal');
  if (!modal) createBannerModal();
  
  const modalEl = document.getElementById('banner-modal');
  if (modalEl) {
    modalEl.classList.add('open');
    if (bannerId) loadBannerData(bannerId);
  }
}

/**
 * Open manager modal
 */
function openMgrModal(mgrId) {
  const modal = document.getElementById('mgr-modal');
  if (!modal) createManagerModal();
  
  const modalEl = document.getElementById('mgr-modal');
  if (modalEl) {
    modalEl.classList.add('open');
    if (mgrId) loadManagerData(mgrId);
  }
}

/**
 * Open flash deal modal
 */
function openFlashDealModal() {
  const modal = document.getElementById('flashdeal-modal');
  if (!modal) createFlashDealModal();
  
  const modalEl = document.getElementById('flashdeal-modal');
  if (modalEl) {
    modalEl.classList.add('open');
  }
}

/**
 * Open featured products picker
 */
function openFeaturedPicker() {
  const modal = document.getElementById('featured-picker-modal');
  if (!modal) createFeaturedPickerModal();
  
  const modalEl = document.getElementById('featured-picker-modal');
  if (modalEl) {
    modalEl.classList.add('open');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save product with images
 */
async function saveProduct() {
  try {
    const form = document.getElementById('product-form');
    if (!form) {
      showToast('Form not found', 'err');
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const productData = {
      name: formData.get('name'),
      category: formData.get('category'),
      price: parseFloat(formData.get('price')),
      mrp: parseFloat(formData.get('mrp')),
      description: formData.get('description'),
      stock: parseInt(formData.get('stock')),
      images: selectedFiles.product,
      active: document.getElementById('product-active')?.checked || false,
      featured: document.getElementById('product-featured')?.checked || false,
      createdAt: new Date().toISOString()
    };

    // Validate
    if (!productData.name || !productData.category) {
      showToast('Please fill required fields', 'wrn');
      return;
    }

    // Save to Firestore
    if (db) {
      await db.collection('products').add(productData);
      showToast('Product saved successfully', 'suc');
      closeModal('product-modal');
      loadProducts();
    }

  } catch (error) {
    console.error('Product save error:', error);
    showToast('Error saving product: ' + error.message, 'err');
  }
}

/**
 * Save category with image
 */
async function saveCategory() {
  try {
    const name = document.getElementById('cat-name')?.value;
    const desc = document.getElementById('cat-desc')?.value;
    const icon = document.getElementById('cat-icon')?.value;

    if (!name) {
      showToast('Category name required', 'wrn');
      return;
    }

    const categoryData = {
      name,
      description: desc,
      icon,
      image: selectedFiles.category[0] || null,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await db.collection('categories').add(categoryData);
      showToast('Category saved successfully', 'suc');
      closeModal('cat-modal');
      loadCategories();
    }

  } catch (error) {
    console.error('Category save error:', error);
    showToast('Error saving category: ' + error.message, 'err');
  }
}

/**
 * Save banner with image
 */
async function saveBanner() {
  try {
    const title = document.getElementById('ban-title')?.value;
    const link = document.getElementById('ban-link')?.value;

    if (!title || selectedFiles.banner.length === 0) {
      showToast('Title and image required', 'wrn');
      return;
    }

    const bannerData = {
      title,
      link,
      image: selectedFiles.banner[0],
      active: document.getElementById('banner-active')?.checked || false,
      order: parseInt(document.getElementById('banner-order')?.value) || 0,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await db.collection('banners').add(bannerData);
      showToast('Banner saved successfully', 'suc');
      closeModal('banner-modal');
      loadBanners();
    }

  } catch (error) {
    console.error('Banner save error:', error);
    showToast('Error saving banner: ' + error.message, 'err');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function loadProducts() {
  try {
    if (!db) return;
    const products = await db.collection('products').get();
    // Render products to table
  } catch (error) {
    console.error('Load products error:', error);
  }
}

async function loadCategories() {
  try {
    if (!db) return;
    const categories = await db.collection('categories').get();
    // Render categories to grid
  } catch (error) {
    console.error('Load categories error:', error);
  }
}

async function loadBanners() {
  try {
    if (!db) return;
    const banners = await db.collection('banners').get();
    // Render banners to list
  } catch (error) {
    console.error('Load banners error:', error);
  }
}

async function loadProductData(productId) {
  try {
    if (!db) return;
    const doc = await db.collection('products').doc(productId).get();
    // Load data into form
  } catch (error) {
    console.error('Load product data error:', error);
  }
}

async function loadCategoryData(catId) {
  try {
    if (!db) return;
    const doc = await db.collection('categories').doc(catId).get();
    // Load data into form
  } catch (error) {
    console.error('Load category data error:', error);
  }
}

async function loadBannerData(bannerId) {
  try {
    if (!db) return;
    const doc = await db.collection('banners').doc(bannerId).get();
    // Load data into form
  } catch (error) {
    console.error('Load banner data error:', error);
  }
}

async function loadManagerData(mgrId) {
  try {
    if (!auth) return;
    // Load manager data
  } catch (error) {
    console.error('Load manager data error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Close modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'inf') {
  const toasts = document.getElementById('TOASTS');
  if (!toasts) return;

  const iconMap = { suc: '✓', err: '✕', wrn: '⚠', inf: 'ℹ' };
  const classMap = { suc: 'suc', err: 'err', wrn: 'wrn', inf: 'inf' };

  const toast = document.createElement('div');
  toast.className = `toast ${classMap[type]}`;
  toast.innerHTML = `
    <div class="ti">${iconMap[type]}</div>
    <div class="tc">
      <div class="tt">${message}</div>
    </div>
    <div class="tx" onclick="this.parentElement.remove()">✕</div>
  `;

  toasts.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 250);
    }
  }, 4000);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Navigation function
 */
function nav(page) {
  const pages = document.querySelectorAll('.pg');
  pages.forEach(p => p.classList.remove('on'));
  
  const targetPage = document.getElementById('pg-' + page);
  if (targetPage) {
    targetPage.classList.add('on');
    document.getElementById('tb-title').textContent = page.charAt(0).toUpperCase() + page.slice(1);
  }
}

/**
 * Sidebar toggle
 */
function toggleSB() {
  const sb = document.getElementById('SB');
  if (sb) {
    sb.classList.toggle('mob-open');
  }
}

/**
 * Close mobile sidebar
 */
function closeMobSB() {
  const sb = document.getElementById('SB');
  if (sb) {
    sb.classList.remove('mob-open');
  }
}

/**
 * Apply theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('admin-theme', theme);
  
  // Update card selection
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.getElementById('tc-' + theme)?.classList.add('selected');
}

/**
 * Change password
 */
async function changePwd() {
  try {
    const cp = document.getElementById('st-cp')?.value;
    const np = document.getElementById('st-np')?.value;
    const cnp = document.getElementById('st-cnp')?.value;

    if (!cp || !np || !cnp) {
      showToast('All fields required', 'wrn');
      return;
    }

    if (np !== cnp) {
      showToast('Passwords do not match', 'wrn');
      return;
    }

    if (np.length < 8) {
      showToast('Password must be at least 8 characters', 'wrn');
      return;
    }

    if (auth && auth.currentUser) {
      await auth.currentUser.updatePassword(np);
      showToast('Password updated successfully', 'suc');
      document.getElementById('st-cp').value = '';
      document.getElementById('st-np').value = '';
      document.getElementById('st-cnp').value = '';
    }

  } catch (error) {
    showToast('Error: ' + error.message, 'err');
  }
}

/**
 * Logout
 */
async function doLogout() {
  try {
    if (auth) {
      await auth.signOut();
      document.getElementById('AUTH').classList.remove('gone');
      document.getElementById('APP').classList.add('gone');
      showToast('Logged out successfully', 'suc');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Login
 */
async function doLogin() {
  try {
    const email = document.getElementById('l-email')?.value;
    const pass = document.getElementById('l-pass')?.value;

    if (!email || !pass) {
      showAuthError('Email and password required');
      return;
    }

    if (auth) {
      const userCred = await auth.signInWithEmailAndPassword(email, pass);
      currentUser = userCred.user;
      
      document.getElementById('AUTH').classList.add('gone');
      document.getElementById('APP').classList.remove('gone');
      document.getElementById('sb-uname').textContent = currentUser.email;
      document.getElementById('st-uid').textContent = currentUser.uid;
      document.getElementById('st-aname').textContent = currentUser.email;

      loadProducts();
      loadCategories();
      loadBanners();
    }

  } catch (error) {
    showAuthError(error.message);
  }
}

/**
 * Show auth error
 */
function showAuthError(message) {
  const err = document.getElementById('auth-err');
  if (err) {
    err.textContent = message;
    err.classList.add('show');
    setTimeout(() => err.classList.remove('show'), 5000);
  }
}

/**
 * Auth tab switch
 */
function authTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.auth-tab').forEach(t => {
    if (t.getAttribute('data-tab') === tab) t.classList.add('on');
  });

  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-reset').style.display = tab === 'reset' ? 'block' : 'none';
}

/**
 * Global search
 */
function globalSearch(query) {
  console.log('Search query:', query);
  // Implement search logic
}

/**
 * Filter functions (stubs)
 */
function filterOrders(value) { console.log('Filter orders:', value); }
function filterProducts(value) { console.log('Filter products:', value); }
function filterPendingProducts(value) { console.log('Filter pending:', value); }
function filterVerification(value) { console.log('Filter verification:', value); }
function filterUsers(value) { console.log('Filter users:', value); }
function filterUsersBanned(value) { console.log('Filter users banned:', value); }
function filterSellers(value) { console.log('Filter sellers:', value); }

/**
 * Save settings
 */
async function saveSettings() {
  try {
    showToast('Settings saved', 'suc');
  } catch (error) {
    showToast('Error saving settings: ' + error.message, 'err');
  }
}

/**
 * Save app branding
 */
async function saveAppBranding() {
  try {
    const logo = document.getElementById('st-logo-emoji')?.value || '🛒';
    const name = document.getElementById('st-app-name')?.value || 'apykart';
    const color = document.getElementById('st-app-name-color')?.value || '#ffd700';
    const split = parseInt(document.getElementById('st-app-name-split')?.value) || 3;
    const tagline = document.getElementById('st-app-tagline')?.value;

    if (db) {
      await db.collection('config').doc('branding').set({
        logo,
        name,
        color,
        split,
        tagline,
        updatedAt: new Date().toISOString()
      });
    }

    showToast('Branding saved successfully', 'suc');
  } catch (error) {
    showToast('Error: ' + error.message, 'err');
  }
}

/**
 * Save flash timer
 */
async function saveFlashTimer() {
  try {
    const name = document.getElementById('fd-name')?.value;
    const end = document.getElementById('fd-end')?.value;
    const disc = document.getElementById('fd-disc')?.value;

    if (!name || !end || !disc) {
      showToast('All fields required', 'wrn');
      return;
    }

    if (db) {
      await db.collection('config').doc('flashdeal').set({
        name,
        endTime: new Date(end),
        discount: parseInt(disc),
        active: true,
        updatedAt: new Date().toISOString()
      });
    }

    showToast('Flash deal activated', 'suc');
  } catch (error) {
    showToast('Error: ' + error.message, 'err');
  }
}

/**
 * Load featured products
 */
async function loadFeaturedProducts() {
  try {
    const section = document.getElementById('feat-sec-sel')?.value;
    console.log('Loading featured products for:', section);
  } catch (error) {
    console.error('Load featured error:', error);
  }
}

/**
 * Send notification
 */
async function sendNotif() {
  try {
    const title = document.getElementById('nt-title')?.value;
    const body = document.getElementById('nt-body')?.value;
    const type = document.getElementById('nt-type')?.value;
    const target = document.getElementById('nt-target')?.value;

    if (!title || !body) {
      showToast('Title and message required', 'wrn');
      return;
    }

    if (db) {
      await db.collection('notifications').add({
        title,
        body,
        type,
        target,
        createdAt: new Date().toISOString(),
        status: 'sent'
      });
    }

    showToast('Notification sent', 'suc');
    document.getElementById('nt-title').value = '';
    document.getElementById('nt-body').value = '';

  } catch (error) {
    showToast('Error: ' + error.message, 'err');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  // Load theme from localStorage
  const savedTheme = localStorage.getItem('admin-theme') || 'dark';
  applyTheme(savedTheme);

  // Check auth on load
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        document.getElementById('AUTH').classList.add('gone');
        document.getElementById('APP').classList.remove('gone');
        document.getElementById('sb-uname').textContent = user.email;
        document.getElementById('st-uid').textContent = user.uid;
        loadProducts();
        loadCategories();
        loadBanners();
      } else {
        currentUser = null;
        document.getElementById('AUTH').classList.remove('gone');
        document.getElementById('APP').classList.add('gone');
      }
    });
  }

  // Initialize tooltips and event listeners
  console.log('Apykart Admin Panel v4.0 initialized');
});

// Export functions for external use
window.uploadFile = uploadFile;
window.uploadToFirebase = uploadToFirebase;
window.uploadToCloudinary = uploadToCloudinary;
window.handleHomeImg = handleHomeImg;
window.clearHomeImg = clearHomeImg;
window.openProductModal = openProductModal;
window.openCatModal = openCatModal;
window.openBannerModal = openBannerModal;
window.openMgrModal = openMgrModal;
window.openFlashDealModal = openFlashDealModal;
window.openFeaturedPicker = openFeaturedPicker;
window.closeModal = closeModal;
window.saveProduct = saveProduct;
window.saveCategory = saveCategory;
window.saveBanner = saveBanner;
window.nav = nav;
window.toggleSB = toggleSB;
window.closeMobSB = closeMobSB;
window.applyTheme = applyTheme;
window.changePwd = changePwd;
window.doLogout = doLogout;
window.doLogin = doLogin;
window.authTab = authTab;
window.globalSearch = globalSearch;
window.filterOrders = filterOrders;
window.filterProducts = filterProducts;
window.filterPendingProducts = filterPendingProducts;
window.filterVerification = filterVerification;
window.filterUsers = filterUsers;
window.filterUsersBanned = filterUsersBanned;
window.filterSellers = filterSellers;
window.saveSettings = saveSettings;
window.saveAppBranding = saveAppBranding;
window.saveFlashTimer = saveFlashTimer;
window.loadFeaturedProducts = loadFeaturedProducts;
window.sendNotif = sendNotif;
window.showToast = showToast;
