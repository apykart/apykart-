import './styles/global.css';
import { initProductsListener } from './services/products.js';
import { initVideosListener } from './services/videos.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase.js';
import { HomePage } from './pages/HomePage.js';
import { XplorPage } from './pages/XplorPage.js';
import { router } from './utils/router.js';

// Initialize realtime listeners
initProductsListener();
initVideosListener();

// Handle authentication
onAuthStateChanged(auth, (user) => {
  window.currentUser = user;
  router.refresh();
});

// Start app
const appRoot = document.getElementById('app');
router.init(appRoot);
