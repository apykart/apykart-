import { products } from '../services/products.js';
import { categories } from '../data/categories.js';
import { renderProductCard } from '../components/ProductCard.js';
import { addToCart } from '../services/cart.js';
import { router } from '../utils/router.js';

export class HomePage {
  constructor(container) {
    this.container = container;
  }

  render() {
    const approvedProds = products.filter(p => p.status === 'approved');
    const deals = [...approvedProds].sort((a,b) => b.discount - a.discount).slice(0,8);
    const recommended = approvedProds.slice(0,8);

    this.container.innerHTML = `
      <div class="home-page">
        <div class="hero-carousel" id="heroCarousel"></div>
        <div class="categories-scroll" id="categoriesScroll"></div>
        <div class="section-header"><h2>⚡ Top Deals</h2><a onclick="router.navigate('search')">See All →</a></div>
        <div class="deals-scroll" id="dealsScroll"></div>
        <div class="section-header"><h2>🛍️ Recommended for You</h2><a onclick="router.navigate('search')">See All →</a></div>
        <div class="products-grid" id="homeGrid"></div>
      </div>
    `;
    this.renderHeroCarousel();
    this.renderCategories();
    this.renderDeals(deals);
    this.renderProducts(recommended);
  }

  renderHeroCarousel() {
    // Dynamic from Firestore banners – simplified
    const slides = [
      { tag: '🔥 Big Sale', title: 'Up to 70% Off', btn: 'Shop Now' }
    ];
    const container = document.getElementById('heroCarousel');
    container.innerHTML = slides.map(s => `<div class="hero-slide">${s.title}</div>`).join('');
  }

  renderCategories() {
    const container = document.getElementById('categoriesScroll');
    container.innerHTML = categories.map(c => `
      <div class="cat-chip" data-cat="${c.id}">
        <img src="${c.img}" alt="${c.label}" loading="lazy">
        <span>${c.label}</span>
      </div>
    `).join('');
    container.querySelectorAll('.cat-chip').forEach(el => {
      el.addEventListener('click', () => router.navigate('search', { category: el.dataset.cat }));
    });
  }

  renderDeals(deals) {
    const container = document.getElementById('dealsScroll');
    container.innerHTML = deals.map(p => `
      <div class="deal-card" data-id="${p.id}">
        <img src="${p.images?.[0] || p.img}" loading="lazy">
        <div class="deal-name">${p.name}</div>
        <div class="deal-price">${this.formatPrice(p.price)}</div>
      </div>
    `).join('');
    container.querySelectorAll('.deal-card').forEach(el => {
      el.addEventListener('click', () => router.navigate('product', { id: el.dataset.id }));
    });
  }

  renderProducts(products) {
    const container = document.getElementById('homeGrid');
    container.innerHTML = products.map(p => renderProductCard(p, { addToCart })).join('');
  }

  formatPrice(p) { return `₹${p.toLocaleString()}`; }
}
