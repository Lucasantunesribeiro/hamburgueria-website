/**
 * Delicious Burger - Main JavaScript
 * Modern and complete functionality for a restaurant website
 */

// ===== DATA FETCHER =====
const fetchMenuData = async () => {
    try {
        const response = await fetch('assets/data/menu.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch menu.json: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching menu data:', error);
        return [];
    }
};

// ===== TEMPLATE LOADER =====
const loadComponent = async (url, placeholder) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        const placeholderElement = document.getElementById(placeholder);
        if (placeholderElement) {
            placeholderElement.innerHTML = text;
        }
    } catch (error) {
        console.error(`Error loading component from ${url}:`, error);
        if (document.getElementById(placeholder)) {
            document.getElementById(placeholder).innerHTML = `<p>Error loading content.</p>`;
        }
    }
};

const setActiveLink = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.desktop-menu__item, .mobile-nav .menu__item');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

const loadHTMLPartials = async () => {
    await Promise.all([
        loadComponent('templates/_header.html', 'header-placeholder'),
        loadComponent('templates/_footer.html', 'footer-placeholder')
    ]);
    setActiveLink();
};

// ===== APPLICATION STATE =====
class AppState {
  constructor() {
    this.cart = this.loadCart();
    this.menuData = [];
  }

  setMenuData(data) {
    this.menuData = data;
  }

  loadCart() {
    try {
      const stored = localStorage.getItem('deliciousBurgerCart');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cart:', error);
      localStorage.removeItem('deliciousBurgerCart');
      return {};
    }
  }

  saveCart() {
    try {
      localStorage.setItem('deliciousBurgerCart', JSON.stringify(this.cart));
      this.updateCartDisplay();
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  addToCart(item) {
    const itemKey = item.id;
    if (this.cart[itemKey]) {
      this.cart[itemKey].quantity++;
    } else {
      this.cart[itemKey] = { ...item, quantity: 1 };
    }
    this.saveCart();
    NotificationSystem.show(`${item.name} adicionado ao carrinho!`, 'success');
  }

  removeFromCart(itemKey) {
    if (this.cart[itemKey]) {
      delete this.cart[itemKey];
      this.saveCart();
      NotificationSystem.show('Item removido do carrinho', 'success');
    }
  }

  updateCartQuantity(itemKey, quantity) {
    if (this.cart[itemKey]) {
      if (quantity > 0) {
        this.cart[itemKey].quantity = quantity;
      } else {
        delete this.cart[itemKey];
      }
      this.saveCart();
    }
  }

  getCartTotal() {
    return Object.values(this.cart).reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getCartItemCount() {
    return Object.values(this.cart).reduce((total, item) => total + item.quantity, 0);
  }

  updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.querySelector('.cart-total-amount');
    
    if (cartCount) {
      const count = this.getCartItemCount();
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
    
    if (cartTotal) {
      cartTotal.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
    }
  }

  clearCart() {
    this.cart = {};
    this.saveCart();
    NotificationSystem.show('Carrinho limpo!', 'success');
  }
}

// ===== NOTIFICATION SYSTEM =====
class NotificationSystem {
  static show(message, type = 'info', duration = 3000) {
    const container = document.body;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span class="notification-message">${message}</span><button class="notification-close">&times;</button>`;
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);

    const removeNotification = () => {
      notification.classList.remove('show');
      setTimeout(() => {
          if(container.contains(notification)) {
              container.removeChild(notification);
          }
    }, 500);
    };

    notification.querySelector('.notification-close').addEventListener('click', removeNotification);
    setTimeout(removeNotification, duration);
  }
}

// ===== CART MODAL =====
class CartModal {
    constructor(appState) {
        this.appState = appState;
        this.modal = null;
        this.createModal();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'cart-modal';
        this.modal.innerHTML = `
            <div class="cart-modal-overlay"></div>
            <div class="cart-modal-content">
                <div class="cart-modal-header"><h2>Seu Carrinho</h2><button class="cart-modal-close">&times;</button></div>
                <div class="cart-modal-body"><div class="cart-items"></div></div>
                <div class="cart-modal-footer">
                    <div class="cart-total"><div class="cart-total-row"><span>Total:</span><span class="cart-total-amount">R$ 0,00</span></div></div>
                    <button class="btn btn-secondary clear-cart-btn">Limpar Carrinho</button>
                    <button class="btn btn-primary checkout-btn">Finalizar Pedido</button>
                </div>
            </div>`;
        document.body.appendChild(this.modal);
    }

    initEventListeners() {
        const cartIcon = document.querySelector('.header-icon[aria-label*="carrinho"]');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        }
        this.modal.querySelector('.cart-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.cart-modal-overlay').addEventListener('click', () => this.close());
        this.modal.querySelector('.clear-cart-btn').addEventListener('click', () => this.clearCart());
        this.modal.querySelector('.checkout-btn').addEventListener('click', () => this.checkout());
        this.modal.querySelector('.cart-items').addEventListener('click', (e) => {
            const target = e.target;
            const itemKey = target.dataset.itemKey;
            if (!itemKey || !this.appState.cart[itemKey]) return;

            if (target.classList.contains('quantity-btn-plus')) {
                this.appState.updateCartQuantity(itemKey, this.appState.cart[itemKey].quantity + 1);
            } else if (target.classList.contains('quantity-btn-minus')) {
                this.appState.updateCartQuantity(itemKey, this.appState.cart[itemKey].quantity - 1);
            } else if (target.classList.contains('remove-btn')) {
                this.appState.removeFromCart(itemKey);
            }
            this.update();
        });
    }

    open() { this.update(); this.modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    close() { this.modal.classList.remove('active'); document.body.style.overflow = ''; }

    update() {
        const container = this.modal.querySelector('.cart-items');
        container.innerHTML = '';
        if (Object.keys(this.appState.cart).length === 0) {
            container.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
        } else {
            Object.entries(this.appState.cart).forEach(([key, item]) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-info"><h4>${item.name}</h4><p class="cart-item-price">R$ ${item.price.toFixed(2)}</p></div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn-minus" data-item-key="${key}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn-plus" data-item-key="${key}">+</button>
                        <button class="remove-btn" data-item-key="${key}">&times;</button>
                    </div>`;
                container.appendChild(itemEl);
            });
        }
        this.modal.querySelector('.cart-total-amount').textContent = `R$ ${this.appState.getCartTotal().toFixed(2)}`;
        this.appState.updateCartDisplay();
    }

    clearCart() { if (confirm('Tem certeza?')) { this.appState.clearCart(); this.update(); } }
    checkout() { if (Object.keys(this.appState.cart).length === 0) { NotificationSystem.show('Seu carrinho está vazio!', 'error'); return; } NotificationSystem.show('Pedido enviado com sucesso!', 'success'); this.appState.clearCart(); this.close(); }
}

// ===== SEARCH FUNCTIONALITY =====
class MenuSearch {
    constructor(app, renderCallback) {
        this.appState = app.appState;
        this.renderCallback = renderCallback;
        this.searchContainer = null;
        this.searchInput = null;
        this.searchOpenBtn = null;
        this.searchCloseBtn = null;
    }

    init() {
        this.searchContainer = document.getElementById('search-container');
        this.searchInput = document.getElementById('search-input');
        this.searchOpenBtn = document.querySelector('.header-icon[aria-label*="busca"]');
        this.searchCloseBtn = document.getElementById('search-close-btn');

        if (this.searchOpenBtn) {
            this.searchOpenBtn.addEventListener('click', (e) => { e.preventDefault(); this.open(); });
        }
        if (this.searchCloseBtn) {
            this.searchCloseBtn.addEventListener('click', () => this.close());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce((e) => this.performSearch(e.target.value), 300));
        }
    }

    open() { this.searchContainer.classList.add('active'); this.searchInput.focus(); }
    close() { this.searchContainer.classList.remove('active'); this.searchInput.value = ''; this.renderCallback(this.appState.menuData); }
    
    performSearch(query) {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) {
            this.renderCallback(this.appState.menuData);
            return;
        }
        const results = this.appState.menuData.filter(item => 
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery) ||
            (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(normalizedQuery)))
        );
        this.renderCallback(results);
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// ===== FORM VALIDATOR =====
class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.inputs = this.form.querySelectorAll('[required]');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validate()) {
                NotificationSystem.show('Mensagem enviada com sucesso!', 'success');
                this.form.reset();
            } else {
                NotificationSystem.show('Por favor, preencha todos os campos corretamente.', 'error');
            }
        });
    }

    validate() {
        let isValid = true;
        this.inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '#ccc';
            }
        });
        return isValid;
    }
}


// ===== MAIN APP LOGIC =====
class App {
    constructor() {
        this.appState = new AppState();
        this.cartModal = new CartModal(this.appState);
        this.menuSearch = new MenuSearch(this, (items) => this.renderMenu(items));
        this.init();
    }

    async init() {
        await loadHTMLPartials();
        
        this.cartModal.initEventListeners();
        this.menuSearch.init();
        this.initMobileMenu();

        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            new FormValidator(contactForm);
        }

        const menuData = await fetchMenuData();
        this.appState.setMenuData(menuData);
        
        if (document.querySelector('.menu-grid')) {
            this.renderMenu(this.appState.menuData);
        }

        this.initAddToCartButtons();
    }
    
    renderMenu(items) {
        const container = document.querySelector('.menu-grid');
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item-card';
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="menu-item-card__image">
                <div class="menu-item-card-content">
                    <h3 class="menu-item-card__name">${item.name}</h3>
                    <p class="menu-item-card__description">${item.description}</p>
                </div>
                <div class="menu-item-card-footer">
                    <span class="menu-item-card__price">R$ ${item.price.toFixed(2)}</span>
                    <button class="btn btn-secondary add-to-cart" data-item-id="${item.id}">Pedir agora</button>
                </div>`;
            container.appendChild(itemEl);
        });
    }

    initAddToCartButtons() {
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const itemId = e.target.dataset.itemId;
                const item = this.appState.menuData.find(m => m.id === itemId);
                if (item) {
                    this.appState.addToCart(item);
                    this.cartModal.update();
                }
            }
        });
    }
    
    initMobileMenu() {
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav');
        if (toggleButton && mobileNav) {
            toggleButton.addEventListener('click', () => mobileNav.classList.toggle('active'));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
