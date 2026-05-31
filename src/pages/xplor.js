import { approvedVideos } from '../services/videos.js';
import { addToCart } from '../services/cart.js';
import { router } from '../utils/router.js';
import { formatPrice, showToast } from '../utils/helpers.js';

export class XplorPage {
  constructor(container) {
    this.container = container;
    this.currentIndex = 0;
    this.videos = [];
  }

  render() {
    this.videos = approvedVideos;
    if (!this.videos.length) {
      this.container.innerHTML = '<div class="xplor-empty">No videos yet. Upload your first video!</div>';
      return;
    }
    this.buildFeed();
    this.attachEvents();
    this.playCurrent();
  }

  buildFeed() {
    this.container.innerHTML = `
      <div class="xplor-wrapper" style="transform: translateY(-${this.currentIndex * 100}%);">
        ${this.videos.map((v, i) => this.videoSlideHTML(v, i)).join('')}
      </div>
    `;
  }

  videoSlideHTML(video, idx) {
    const discount = video.ogPrice > video.price ? Math.round((video.ogPrice - video.price) / video.ogPrice * 100) : 0;
    return `
      <div class="xplor-slide" data-idx="${idx}">
        <video src="${video.videoUrl}" muted playsinline loop></video>
        <div class="xplor-overlay"></div>
        <div class="xplor-product-info">
          <div class="xplor-product-name">${video.productName}</div>
          <div class="xplor-product-price">${formatPrice(video.price)} ${discount > 0 ? `<span class="xplor-price-badge">${discount}% OFF</span>` : ''}</div>
        </div>
        <div class="xplor-actions">
          <button class="xplor-buy-now" data-product="${video.productId}">Buy Now</button>
          <button class="xplor-add-cart" data-product="${video.productId}">Add to Cart</button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const wrapper = this.container.querySelector('.xplor-wrapper');
    let startY = 0;
    wrapper.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; });
    wrapper.addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].clientY - startY;
      if (Math.abs(deltaY) > 60) {
        if (deltaY < 0 && this.currentIndex < this.videos.length - 1) this.currentIndex++;
        else if (deltaY > 0 && this.currentIndex > 0) this.currentIndex--;
        this.buildFeed();
        this.playCurrent();
      }
    });
    this.container.addEventListener('click', (e) => {
      const buyBtn = e.target.closest('.xplor-buy-now');
      const cartBtn = e.target.closest('.xplor-add-cart');
      if (buyBtn) router.navigate('checkout', { buyNowId: buyBtn.dataset.product });
      if (cartBtn) { addToCart(cartBtn.dataset.product); showToast('Added to cart'); }
    });
  }

  playCurrent() {
    const currentSlide = this.container.querySelector(`.xplor-slide[data-idx="${this.currentIndex}"]`);
    const video = currentSlide?.querySelector('video');
    if (video) video.play();
  }
}
