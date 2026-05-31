export function formatPrice(price) {
  return `₹${Number(price).toLocaleString('en-IN')}`;
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  const container = document.getElementById('toastContainer');
  if (container) {
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function validateEmail(email) {
  return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
}

export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}
