import { userData, currentUser } from '../services/auth.js';
import { db } from '../services/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { showToast } from '../utils/helpers.js';

export class AddressesPage {
  constructor(container) {
    this.container = container;
    this.addresses = [];
    this.editingId = null;
  }

  render() {
    this.addresses = userData.addresses || [];
    this.container.innerHTML = `
      <div class="addresses-page">
        <h2>Saved Addresses</h2>
        <div class="addresses-list">
          ${this.addresses.map(addr => this.renderAddressCard(addr)).join('')}
        </div>
        <button class="add-address-btn">+ Add New Address</button>
      </div>
    `;

    // Attach event listeners after DOM is updated
    document.querySelector('.add-address-btn')?.addEventListener('click', () => this.openAddressForm());
    
    document.querySelectorAll('.edit-address').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        this.openAddressForm(id);
      });
    });
    
    document.querySelectorAll('.delete-address').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        await this.deleteAddress(id);
      });
    });
    
    document.querySelectorAll('.set-default').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        await this.setDefaultAddress(id);
      });
    });
  }

  renderAddressCard(addr) {
    return `
      <div class="address-card ${addr.isDefault ? 'default' : ''}">
        <div class="address-type">${addr.type || 'Home'}</div>
        <div class="address-name">${this.escapeHtml(addr.name)}</div>
        <div class="address-detail">${this.escapeHtml(addr.line1)}, ${this.escapeHtml(addr.city)}, ${this.escapeHtml(addr.state)} - ${this.escapeHtml(addr.pin)}</div>
        <div class="address-phone">📞 ${this.escapeHtml(addr.phone)}</div>
        <div class="address-actions">
          <button class="edit-address" data-id="${addr.id}">Edit</button>
          <button class="delete-address" data-id="${addr.id}">Delete</button>
          ${!addr.isDefault ? `<button class="set-default" data-id="${addr.id}">Set Default</button>` : ''}
        </div>
      </div>
    `;
  }

  openAddressForm(id = null) {
    this.editingId = id;
    const addr = id ? this.addresses.find(a => a.id === id) : null;
    const formHTML = `
      <div class="modal-overlay" id="addressModal">
        <div class="modal-content">
          <h3>${id ? 'Edit Address' : 'Add Address'}</h3>
          <input type="text" id="addrName" placeholder="Full Name" value="${this.escapeHtml(addr?.name || '')}">
          <input type="text" id="addrPhone" placeholder="Phone" value="${this.escapeHtml(addr?.phone || '')}">
          <input type="text" id="addrLine1" placeholder="Street, House No." value="${this.escapeHtml(addr?.line1 || '')}">
          <input type="text" id="addrCity" placeholder="City" value="${this.escapeHtml(addr?.city || '')}">
          <input type="text" id="addrState" placeholder="State" value="${this.escapeHtml(addr?.state || '')}">
          <input type="text" id="addrPin" placeholder="Pincode" value="${this.escapeHtml(addr?.pin || '')}">
          <select id="addrType">
            <option value="Home" ${addr?.type === 'Home' ? 'selected' : ''}>Home</option>
            <option value="Work" ${addr?.type === 'Work' ? 'selected' : ''}>Work</option>
            <option value="Other" ${addr?.type === 'Other' ? 'selected' : ''}>Other</option>
          </select>
          <div class="modal-buttons">
            <button id="saveAddressBtn">Save</button>
            <button id="closeModalBtn">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHTML);
    document.getElementById('saveAddressBtn')?.addEventListener('click', () => this.saveAddress());
    document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeModal());
  }

  async saveAddress() {
    const name = document.getElementById('addrName')?.value.trim();
    const phone = document.getElementById('addrPhone')?.value.trim();
    const line1 = document.getElementById('addrLine1')?.value.trim();
    const city = document.getElementById('addrCity')?.value.trim();
    const state = document.getElementById('addrState')?.value.trim();
    const pin = document.getElementById('addrPin')?.value.trim();
    const type = document.getElementById('addrType')?.value;

    if (!name || !phone || !line1 || !city || !state || !pin) {
      showToast('Please fill all fields', 'warn');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      showToast('Enter a valid 6-digit pincode', 'warn');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      showToast('Enter a valid 10-digit phone number', 'warn');
      return;
    }

    const newAddress = {
      id: this.editingId || `addr_${Date.now()}`,
      name,
      phone,
      line1,
      city,
      state,
      pin,
      type,
      isDefault: this.editingId
        ? (this.addresses.find(a => a.id === this.editingId)?.isDefault || false)
        : this.addresses.length === 0
    };

    let updatedAddresses;
    if (this.editingId) {
      updatedAddresses = this.addresses.map(a => a.id === this.editingId ? newAddress : a);
    } else {
      updatedAddresses = [...this.addresses, newAddress];
    }
    await this.updateAddresses(updatedAddresses);
    this.closeModal();
    this.render();
    showToast(this.editingId ? 'Address updated!' : 'Address added!', 'success');
  }

  async deleteAddress(id) {
    if (confirm('Delete this address?')) {
      const updated = this.addresses.filter(a => a.id !== id);
      await this.updateAddresses(updated);
      this.render();
      showToast('Address deleted', 'info');
    }
  }

  async setDefaultAddress(id) {
    const updated = this.addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    await this.updateAddresses(updated);
    this.render();
    showToast('Default address updated', 'success');
  }

  async updateAddresses(addresses) {
    if (!currentUser) {
      showToast('Please sign in to save addresses', 'warn');
      return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { addresses });
    userData.addresses = addresses;
  }

  closeModal() {
    document.getElementById('addressModal')?.remove();
  }

  // Simple XSS protection
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
}
