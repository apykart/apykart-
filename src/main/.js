import './styles/global.css';
import { initAuth } from './services/auth.js';
import { initProductsListener } from './services/products.js';
import { initVideosListener } from './services/videos.js';
import { router } from './utils/router.js';

// Make products and videos available globally for pages that need them
let productsGlobal = [];
let videosGlobal = [];

window.addEventListener('products-updated', (e) => {
  productsGlobal = e.detail;
  window.products = productsGlobal;
});

window.addEventListener('videos-updated', (e) => {
  videosGlobal = e.detail;
  window.approvedVideos = videosGlobal;
});

initAuth();
initProductsListener();
initVideosListener();

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  router.init(app);
});
