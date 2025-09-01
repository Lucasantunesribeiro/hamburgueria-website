/**
 * Delicious Burger - Main JavaScript
 * Modern and complete functionality for a restaurant website
 * Fully responsive with mobile-first approach
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
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Fechar notificação">&times;</button>
      </div>
    `;
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
                <div class="cart-modal-header">
                    <h2>Seu Carrinho</h2>
                    <button class="cart-modal-close" aria-label="Fechar carrinho">&times;</button>
                </div>
                <div class="cart-modal-body">
                    <div class="cart-items"></div>
                </div>
                <div class="cart-modal-footer">
                    <div class="cart-total">
                        <div class="cart-total-row">
                            <span>Total:</span>
                            <span class="cart-total-amount">R$ 0,00</span>
                        </div>
                    </div>
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
        
        // Handle cart item interactions
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

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open() { 
        this.update(); 
        this.modal.classList.add('active'); 
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const closeBtn = this.modal.querySelector('.cart-modal-close');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 100);
        }
    }
    
    close() { 
        this.modal.classList.remove('active'); 
        document.body.style.overflow = '';
    }

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
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">R$ ${item.price.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn-minus" data-item-key="${key}" aria-label="Diminuir quantidade">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn-plus" data-item-key="${key}" aria-label="Aumentar quantidade">+</button>
                        <button class="remove-btn" data-item-key="${key}" aria-label="Remover item">&times;</button>
                    </div>`;
                container.appendChild(itemEl);
            });
        }
        
        this.modal.querySelector('.cart-total-amount').textContent = `R$ ${this.appState.getCartTotal().toFixed(2)}`;
        this.appState.updateCartDisplay();
    }

    clearCart() { 
        if (confirm('Tem certeza que deseja limpar o carrinho?')) { 
            this.appState.clearCart(); 
            this.update(); 
        } 
    }
    
    checkout() { 
        if (Object.keys(this.appState.cart).length === 0) { 
            NotificationSystem.show('Seu carrinho está vazio!', 'error'); 
            return; 
        } 
        NotificationSystem.show('Pedido enviado com sucesso!', 'success'); 
        this.appState.clearCart(); 
        this.close(); 
    }
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
            this.searchOpenBtn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                this.open(); 
            });
        }
        
        if (this.searchCloseBtn) {
            this.searchCloseBtn.addEventListener('click', () => this.close());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce((e) => this.performSearch(e.target.value), 300));
            
            // Handle search on enter key
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    open() { 
        this.searchContainer.classList.add('active'); 
        this.searchInput.focus();
        
        // Close mobile menu if open
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileNav && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
    }
    
    close() { 
        this.searchContainer.classList.remove('active'); 
        this.searchInput.value = ''; 
        this.renderCallback(this.appState.menuData); 
    }
    
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

// ===== MOBILE MENU MANAGEMENT =====
class MobileMenuManager {
    constructor() {
        this.mobileNav = null;
        this.mobileToggle = null;
        this.isOpen = false;
    }

    init() {
        this.mobileNav = document.querySelector('.mobile-nav');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (this.mobileToggle && this.mobileNav) {
            this.mobileToggle.addEventListener('click', () => this.toggle());
            
            // Close menu when clicking on a link
            const mobileLinks = this.mobileNav.querySelectorAll('.menu__item');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isOpen && 
                    !this.mobileNav.contains(e.target) && 
                    !this.mobileToggle.contains(e.target)) {
                    this.close();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.mobileNav.classList.add('active');
        this.mobileToggle.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const firstLink = this.mobileNav.querySelector('.menu__item');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }

    close() {
        this.mobileNav.classList.remove('active');
        this.mobileToggle.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        if (this.mobileToggle) {
            this.mobileToggle.focus();
        }
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
        
        // Real-time validation
        this.inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(input) {
        const isValid = input.value.trim() !== '';
        if (!isValid) {
            input.style.borderColor = 'red';
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.style.borderColor = '#ccc';
            input.setAttribute('aria-invalid', 'false');
        }
        return isValid;
    }

    clearFieldError(input) {
        input.style.borderColor = '#ccc';
        input.setAttribute('aria-invalid', 'false');
    }

    validate() {
        let isValid = true;
        this.inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }
}

// ===== TOUCH GESTURE SUPPORT =====
class TouchGestureManager {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.init();
    }

    init() {
        // Swipe to close mobile menu
        document.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!this.startX || !this.startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = this.startX - endX;
            const diffY = this.startY - endY;

            // Swipe left to close mobile menu
            if (diffX > 50 && Math.abs(diffY) < 50) {
                const mobileNav = document.querySelector('.mobile-nav');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    const mobileMenuManager = new MobileMenuManager();
                    mobileMenuManager.close();
                }
            }

            this.startX = 0;
            this.startY = 0;
        });
    }
}

// ===== MAIN APP LOGIC =====
class App {
    constructor() {
        this.appState = new AppState();
        this.cartModal = new CartModal(this.appState);
        this.menuSearch = new MenuSearch(this, (items) => this.renderMenu(items));
        this.mobileMenuManager = new MobileMenuManager();
        this.touchGestureManager = new TouchGestureManager();
        this.init();
    }

    async init() {
        await loadHTMLPartials();
        
        this.cartModal.initEventListeners();
        this.menuSearch.init();
        this.mobileMenuManager.init();

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
        this.initAccessibilityFeatures();
    }
    
    renderMenu(items) {
        const container = document.querySelector('.menu-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>Nenhum item encontrado</h3>
                    <p>Tente ajustar sua busca.</p>
                </div>
            `;
            return;
        }
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item-card';
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="menu-item-card__image" loading="lazy">
                <div class="menu-item-card-content">
                    <h3 class="menu-item-card__name">${item.name}</h3>
                    <p class="menu-item-card__description">${item.description}</p>
                </div>
                <div class="menu-item-card-footer">
                    <span class="menu-item-card__price">R$ ${item.price.toFixed(2)}</span>
                    <button class="btn btn-secondary add-to-cart" data-item-id="${item.id}" aria-label="Adicionar ${item.name} ao carrinho">
                        Pedir agora
                    </button>
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
    
    initAccessibilityFeatures() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Pular para o conteúdo principal';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
        `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content id
        const main = document.querySelector('main');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Handle service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
