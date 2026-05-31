import { HomePage } from '../pages/HomePage.js';
import { XplorPage } from '../pages/XplorPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { CartPage } from '../pages/CartPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { SellerDashboard } from '../pages/SellerDashboard.js';
import { CreatorDashboard } from '../pages/CreatorDashboard.js';
import { AdminDashboard } from '../pages/AdminDashboard.js';
import { OrdersPage } from '../pages/OrdersPage.js';

class Router {
  constructor() {
    this.routes = {
      home: HomePage,
      xplor: XplorPage,
      product: ProductPage,
      cart: CartPage,
      checkout: CheckoutPage,
      profile: ProfilePage,
      seller: SellerDashboard,
      creator: CreatorDashboard,
      admin: AdminDashboard,
      orders: OrdersPage
    };
    this.currentPage = null;
    this.container = null;
  }

  init(container) {
    this.container = container;
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname.slice(1) || 'home';
    const [route, param] = path.split('/');
    const PageClass = this.routes[route];
    if (!PageClass) return this.navigate('home');

    this.container.innerHTML = '';
    if (route === 'product' && param) {
      this.currentPage = new PageClass(this.container, param);
    } else {
      this.currentPage = new PageClass(this.container);
    }
    await this.currentPage.render();
  }

  navigate(route, params = {}) {
    let url = `/${route}`;
    if (params.id) url += `/${params.id}`;
    window.history.pushState({}, '', url);
    this.handleRoute();
  }

  refresh() {
    this.handleRoute();
  }
}

export const router = new Router();
