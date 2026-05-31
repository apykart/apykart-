import { approvedVideos } from '../services/videos.js';
import { showToast } from '../utils/helpers.js';
import { addToCart, buyNow } from '../services/cart.js';

export class XplorPage {
  constructor(container) {
    this.container = container;
    this.currentIndex = 0;
    this.videos = [];
    this.touchStartY = 0;
    this.isDragging = false;
    this.swipeInProgress = false;
  }

  render() {
    this.videos = approvedVideos;
    if (!this.videos.length) {
      this.container.innerHTML = `<div class="xplor-empty">No videos yet. Be the first to upload!</div>`;
      return;
    }
    this.buildFeed();
    this.attachEvents();
    this.playCurrent();
  }

  buildFeed() {
    // Only render 3 slides for performance (current, prev, next)
    const slides = this.getSlides();
    this.container.innerHTML = `
      <div class="xplor-wrapper" style="transform: translateY(-${this.currentIndex * 100}%);">
        ${slides.map(v => this.videoSlideHTML(v)).join('')}
      </div>
    `;
  }

  getSlides() {
    const slides = [];
    for (let i = -1; i <= 1; i++) {
      const idx = this.currentIndex + i;
      if (idx >= 0 && idx < this.videos.length) {
        slides.push({ idx, video: this.videos[idx] });
      }
    }
    return slides;
  }

  videoSlideHTML(video) {
    const discount = video.ogPrice > video.price ? Math.round((video.ogPrice - video.price) / video.ogPrice * 100) : 0;
    return `
      <div class="xplor-slide" data-idx="${video.id}">
        <video src="${video.videoUrl}" muted playsinline loop></video>
        <div class="xplor-overlay"></div>
        <div class="xplor-product-info">
          <div class="xplor-product-name">${video.productName}</div>
          <div class="xplor-product-price">₹${video.price.toLocaleString()} ${discount > 0 ? `<span class="xplor-price-badge">${discount}% OFF</span>` : ''}</div>
        </div>
        <div class="xplor-actions">
          <button class="xplor-buy-now" data-product="${video.productId}">Buy Now</button>
          <button class="xplor-add-cart" data-product="${video.productId}">Add to Cart</button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    this.container.querySelector('.xplor-wrapper').addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    });
    this.container.querySelector('.xplor-wrapper').addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(deltaY) > 60) {
        if (deltaY < 0 && this.currentIndex < this.videos.length - 1) {
          this.currentIndex++;
        } else if (deltaY > 0 && this.currentIndex > 0) {
          this.currentIndex--;
        }
        this.buildFeed();
        this.playCurrent();
      }
    });
    this.container.addEventListener('click', (e) => {
      const buyBtn = e.target.closest('.xplor-buy-now');
      const cartBtn = e.target.closest('.xplor-add-cart');
      if (buyBtn) buyNow(buyBtn.dataset.product);
      if (cartBtn) addToCart(cartBtn.dataset.product);
    });
  }

  playCurrent() {
    const currentSlide = this.container.querySelector(`.xplor-slide[data-idx="${this.videos[this.currentIndex].id}"]`);
    const video = currentSlide?.querySelector('video');
    if (video) video.play();
  }
      }
