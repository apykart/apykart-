import './styles/global.css';
import { initAuth } from './services/auth.js';
import { initProductsListener, products } from './services/products.js';
import { initVideosListener, approvedVideos } from './services/videos.js';
import { router } from './utils/router.js';

// Expose to window for some components (temporary, can be refactored later)
window.products = products;
window.approvedVideos = approvedVideos;

// Initialize Firebase listeners
initAuth();
initProductsListener();
initVideosListener();

// Start router after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  router.init(app);
});
