import { uploadVideo } from '../services/cloudinary.js';
import { db, auth } from '../services/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { showToast } from '../utils/helpers.js';
import { router } from '../utils/router.js';

export class UploadVideoPage {
  constructor(container) {
    this.container = container;
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.isUploading = false;
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-page">
        <h2>Upload Product Video</h2>
        <div class="upload-dropzone" id="dropzone">
          <div class="upload-icon">🎬</div>
          <p>Click or drag & drop your video</p>
          <p class="small">MP4, MOV up to 100MB</p>
          <input type="file" id="videoInput" accept="video/mp4,video/quicktime" style="display:none">
        </div>
        <div class="upload-form" style="display:none">
          <input type="text" id="videoTitle" placeholder="Video Title (e.g., Unboxing iPhone 15)">
          <textarea id="videoDesc" placeholder="Description (optional)"></textarea>
          <select id="productSelect">
            <option value="">Select Product</option>
            ${(window.products || []).filter(p => p.status === 'approved').map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <div class="progress-bar" style="display:none"><div class="progress-fill"></div><span class="progress-text">0%</span></div>
          <button id="submitUploadBtn" disabled>Upload Video</button>
        </div>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('videoInput');
    const uploadForm = document.querySelector('.upload-form');
    const submitBtn = document.getElementById('submitUploadBtn');
    const titleInput = document.getElementById('videoTitle');
    const productSelect = document.getElementById('productSelect');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) this.handleFile(file);
      else showToast('Please drop a video file', 'warn');
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) this.handleFile(e.target.files[0]);
    });

    const validateForm = () => {
      const isValid = this.selectedFile && titleInput.value.trim() && productSelect.value;
      submitBtn.disabled = !isValid;
    };
    titleInput.addEventListener('input', validateForm);
    productSelect.addEventListener('change', validateForm);
    submitBtn.addEventListener('click', () => this.upload());
  }

  handleFile(file) {
    if (file.size > 100 * 1024 * 1024) {
      showToast('File too large. Max 100MB', 'warn');
      return;
    }
    this.selectedFile = file;
    document.querySelector('.upload-dropzone').style.display = 'none';
    document.querySelector('.upload-form').style.display = 'block';
    // Optionally show video preview
    const preview = document.createElement('video');
    preview.src = URL.createObjectURL(file);
    preview.controls = true;
    preview.style.maxWidth = '100%';
    preview.style.marginBottom = '1rem';
    document.querySelector('.upload-form').prepend(preview);
  }

  async upload() {
    if (!auth.currentUser) {
      showToast('Please sign in first', 'warn');
      return;
    }
    const title = document.getElementById('videoTitle').value.trim();
    const desc = document.getElementById('videoDesc').value.trim();
    const productId = document.getElementById('productSelect').value;
    if (!title || !productId) return;

    const product = window.products.find(p => p.id === productId);
    this.isUploading = true;
    const submitBtn = document.getElementById('submitUploadBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    document.querySelector('.progress-bar').style.display = 'block';

    try {
      const videoUrl = await uploadVideo(this.selectedFile, (percent) => {
        this.uploadProgress = percent;
        document.querySelector('.progress-fill').style.width = `${percent}%`;
        document.querySelector('.progress-text').textContent = `${percent}%`;
      });
      await addDoc(collection(db, 'videos'), {
        title,
        description: desc,
        productId,
        productName: product.name,
        price: product.price,
        videoUrl,
        status: 'pending',
        uploaderUid: auth.currentUser.uid,
        uploaderName: auth.currentUser.displayName || 'Creator',
        createdAt: serverTimestamp(),
        views: 0
      });
      showToast('Video uploaded! Pending admin approval.');
      router.navigate('creator');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      this.isUploading = false;
    }
  }
}
