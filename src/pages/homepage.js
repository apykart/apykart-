import { products } from '../services/products.js';
import { addToCart } from '../services/cart.js';
import { router } from '../utils/router.js';
import { formatPrice } from '../utils/helpers.js';

export class HomePage {
  constructor(container) {
    this.container = container;
  }

  render() {
    const approvedProds = products.filter(p => p.status === 'approved' || p.status === 'active');
    const deals = [...approvedProds].sort((a,b) => b.discount - a.discount).slice(0,8);
    const recommended = approvedProds.slice(0,8);

    this.container.innerHTML = `
      <div class="home-page">
        <div class="hero-carousel" id="heroCarousel"></div>
        <div class="categories-scroll" id="categoriesScroll"></div>
        <div class="section-header"><h2>⚡ Top Deals</h2><a class="section-link" id="seeAllDeals">See All →</a></div>
        <div class="deals-scroll" id="dealsScroll"></div>
        <div class="section-header"><h2>🛍️ Recommended for You</h2><a class="section-link" id="seeAllRecommended">See All →</a></div>
        <div class="products-grid" id="homeGrid"></div>
      </div>
    `;

    this.renderHeroCarousel();
    this.renderCategories();
    this.renderDeals(deals);
    this.renderProducts(recommended);

    document.getElementById('seeAllDeals')?.addEventListener('click', () => router.navigate('search'));
    document.getElementById('seeAllRecommended')?.addEventListener('click', () => router.navigate('search'));
  }

  renderHeroCarousel() {
    const container = document.getElementById('heroCarousel');
    if (!container) return;
    container.innerHTML = `
      <div class="hero-slide active">
        <div class="hero-tag">🔥 Big Sale</div>
        <div class="hero-title">Up to 70% Off<br>Top Brands</div>
        <div class="hero-btn" id="heroShopBtn">Shop Now →</div>
      </div>
    `;
    document.getElementById('heroShopBtn')?.addEventListener('click', () => router.navigate('search'));
  }

  renderCategories() {
    const container = document.getElementById('categoriesScroll');
    if (!container) return;
    const categories = [
      { id: 'mobiles', label: 'Mobiles', icon: '📱' },
      { id: 'fashion', label: 'Fashion', icon: '👗' },
      { id: 'electronics', label: 'Electronics', icon: '💻' },
      { id: 'home', label: 'Home', icon: '🏠' }
    ];
    container.innerHTML = categories.map(c => `
      <div class="cat-chip" data-cat="${c.id}">
        <div class="cat-icon">${c.icon}</div>
        <div class="cat-label">${c.label}</div>
      </div>
    `).join('');
    document.querySelectorAll('.cat-chip').forEach(el => {
      el.addEventListener('click', () => router.navigate('search', { category: el.dataset.cat }));
    });
  }

  renderDeals(deals) {
    const container = document.getElementById('dealsScroll');
    if (!container) return;
    container.innerHTML = deals.map(p => `
      <div class="deal-card" data-id="${p.id}">
        <img src="${p.images?.[0] || p.img || ''}" alt="${p.name}" loading="lazy">
        <div class="deal-name">${p.name}</div>
        <div class="deal-price">${formatPrice(p.price)}</div>
      </div>
    `).join('');
    document.querySelectorAll('.deal-card').forEach(el => {
      el.addEventListener('click', () => router.navigate('product', { id: el.dataset.id }));
    });
  }

  renderProducts(productsList) {
    const container = document.getElementById('homeGrid');
    if (!container) return;
    container.innerHTML = productsList.map(p => `
      <div class="product-card" data-id="${p.id}">
        <img src="${p.images?.[0] || p.img || ''}" alt="${p.name}" loading="lazy">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${formatPrice(p.price)}</div>
          <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await addToCart(btn.dataset.id);
        alert('Added to cart');
      });
    });
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => router.navigate('product', { id: card.dataset.id }));
    });
  }
}
