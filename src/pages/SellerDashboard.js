import { userData, currentUser } from '../services/auth.js';
import { db } from '../services/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary.js';
import { showToast } from '../utils/helpers.js';

export class SellerDashboard {
  constructor(container) {
    this.container = container;
    this.activeTab = 'overview';
  }

  render() {
    const verification = userData.sellerVerification || {};
    const status = verification.status || 'pending';

    if (status !== 'approved') {
      this.renderPendingStatus(status);
      return;
    }

    this.container.innerHTML = `
      <div class="seller-dashboard">
        <div class="seller-tabs">${this.renderTabs()}</div>
        <div class="seller-content" id="sellerContent"></div>
      </div>
    `;
    this.attachTabEvents();
    this.renderTabContent(this.activeTab);
  }

  renderTabs() {
    return ['overview', 'products', 'add-product', 'earnings', 'withdraw'].map(tab =>
      `<button class="tab-btn ${this.activeTab === tab ? 'active' : ''}" data-tab="${tab}">${tab}</button>`
    ).join('');
  }

  async renderTabContent(tab) {
    const contentDiv = document.getElementById('sellerContent');
    if (tab === 'overview') contentDiv.innerHTML = this.renderOverview();
    else if (tab === 'products') contentDiv.innerHTML = this.renderProducts();
    else if (tab === 'add-product') contentDiv.innerHTML = await this.renderAddProductForm();
    else if (tab === 'earnings') contentDiv.innerHTML = this.renderEarnings();
    else if (tab === 'withdraw') contentDiv.innerHTML = this.renderWithdraw();
  }

  renderOverview() {
    const earnings = userData.sellerEarnings || [];
    const total = earnings.reduce((s, e) => s + e.net_earning, 0);
    const available = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.net_earning, 0);
    return `<div class="stats"><div>Total: ₹${total}</div><div>Available: ₹${available}</div></div>`;
  }

  renderProducts() {
    const myProducts = userData.sellerProducts || [];
    return `<div class="product-list">${myProducts.map(p => `<div>${p.name} - ₹${p.price}</div>`).join('')}</div>`;
  }

  async renderAddProductForm() {
    return `
      <div class="add-product-form">
        <input type="text" id="prodName" placeholder="Product name">
        <input type="number" id="prodPrice" placeholder="Price">
        <input type="file" id="prodImages" accept="image/*" multiple>
        <textarea id="prodDesc" placeholder="Description"></textarea>
        <button id="submitProductBtn">Submit for Approval</button>
      </div>
    `;
    // Attach event after mount (simplified)
  }

  async submitProduct() {
    const name = document.getElementById('prodName').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const desc = document.getElementById('prodDesc').value;
    const files = Array.from(document.getElementById('prodImages').files);
    const imageUrls = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file, null, 'image');
      imageUrls.push(url);
    }
    const product = {
      name, price, description: desc, images: imageUrls,
      sellerId: currentUser.uid, status: 'pending', createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'products'), product);
    showToast('Product submitted for approval');
  }

  renderEarnings() { return '<div>Transaction history here</div>'; }
  renderWithdraw() { return '<div>Withdrawal requests</div>'; }

  renderPendingStatus(status) {
    const msg = status === 'pending' ? 'Your seller verification is pending approval.' : 'Verification rejected. Please re-apply.';
    this.container.innerHTML = `<div class="seller-pending">${msg}</div>`;
  }

  attachTabEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });
    const submitBtn = document.getElementById('submitProductBtn');
    if (submitBtn) submitBtn.addEventListener('click', () => this.submitProduct());
  }
}
