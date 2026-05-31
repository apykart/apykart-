import { HomePage } from '../pages/HomePage.js';
import { XplorPage } from '../pages/XplorPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { CartPage } from '../pages/CartPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { OrdersPage } from '../pages/OrdersPage.js';
import { OrderDetailsPage } from '../pages/OrderDetailsPage.js';
import { WalletPage } from '../pages/WalletPage.js';
import { AddressesPage } from '../pages/AddressesPage.js';
import { ReferPage } from '../pages/ReferPage.js';
import { HelpPage } from '../pages/HelpPage.js';
import { SellerDashboard } from '../pages/SellerDashboard.js';
import { CreatorDashboard } from '../pages/CreatorDashboard.js';
import { AdminDashboard } from '../pages/AdminDashboard.js';
import { UploadVideoPage } from '../pages/UploadVideoPage.js';

class Router {
  constructor() {
    this.routes = {
      home: HomePage,
      xplor: XplorPage,
      product: ProductPage,
      cart: CartPage,
      checkout: CheckoutPage,
      profile: ProfilePage,
      orders: OrdersPage,
      'order-details': OrderDetailsPage,
      wallet: WalletPage,
      addresses: AddressesPage,
      refer: ReferPage,
      help: HelpPage,
      seller: SellerDashboard,
      creator: CreatorDashboard,
      admin: AdminDashboard,
      'upload-video': UploadVideoPage
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
    const parts = path.split('/');
    const route = parts[0];
    const param = parts[1];

    const PageClass = this.routes[route];
    if (!PageClass) {
      this.navigate('home');
      return;
    }

    this.container.innerHTML = ''; // Clear previous content

    if ((route === 'product' || route === 'order-details') && param) {
      this.currentPage = new PageClass(this.container, param);
    } else {
      this.currentPage = new PageClass(this.container);
    }

    await this.currentPage.render();
  }

  navigate(route, params = {}) {
    let url = `/${route}`;
    if (params.id) url += `/${params.id}`;
    if (params.buyNowId) url += `?buyNowId=${params.buyNowId}`;
    if (params.category) url += `?category=${params.category}`;
    window.history.pushState({}, '', url);
    this.handleRoute();
  }

  refresh() {
    this.handleRoute();
  }
}

export const router = new Router();
