/**
 * Delicious Burger - Main JavaScript
 * Modern and complete functionality for a restaurant website
 */

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
        const placeholderElement = document.getElementById(placeholder);
        if (placeholderElement) {
            placeholderElement.innerHTML = `<p>Error loading content.</p>`;
        }
    }
};

const setActiveLink = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.menu__item, .desktop-menu__item');
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
    await loadComponent('/templates/_header.html', 'header-placeholder');
    setActiveLink();
    await loadComponent('/templates/_footer.html', 'footer-placeholder');
};


// ===== APPLICATION STATE =====
class AppState {
  constructor() {
    this.cart = this.loadCart();
    this.menuData = [];
    this.isLoading = false;
    this.searchResults = [];
    this.activeCategory = 'all';
  }

  // Cart management
  loadCart() {
    try {
      const stored = localStorage.getItem('deliciousBurgerCart');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cart:', error);
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
    const itemKey = `${item.id}_${JSON.stringify(item.customizations || {})}`;
    
    if (this.cart[itemKey]) {
      this.cart[itemKey].quantity += 1;
    } else {
      this.cart[itemKey] = {
        ...item,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
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
    if (this.cart[itemKey] && quantity > 0) {
      this.cart[itemKey].quantity = quantity;
      this.saveCart();
    } else if (quantity <= 0) {
      this.removeFromCart(itemKey);
    }
  }

  getCartTotal() {
    let total = 0;
    Object.values(this.cart).forEach(item => {
      total += item.price * item.quantity;
    });
    return total;
  }

  getCartItemCount() {
    let count = 0;
    Object.values(this.cart).forEach(item => {
      count += item.quantity;
    });
    return count;
  }

  updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
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

// ===== MENU DATA =====
const MENU_DATA = [
  {
    id: 'burger-classico',
    name: 'Burger Clássico',
    description: 'Pão brioche, blend Angus 180g, queijo prato, alface, tomate, maionese da casa.',
    price: 29.90,
    category: 'burgers',
    image: 'Imagens/chess-burger.jpg',
    ingredients: ['pão brioche', 'blend angus', 'queijo prato', 'alface', 'tomate', 'maionese'],
    popular: true
  },
  {
    id: 'burger-bacon',
    name: 'Burger Bacon',
    description: 'Pão australiano, blend Angus 180g, queijo cheddar, bacon crocante, cebola caramelizada.',
    price: 34.90,
    category: 'burgers',
    image: 'Imagens/Xbacon.jpg',
    ingredients: ['pão australiano', 'blend angus', 'queijo cheddar', 'bacon', 'cebola caramelizada'],
    popular: true
  },
  {
    id: 'burger-veggie',
    name: 'Burger Veggie',
    description: 'Pão integral, burger de grão-de-bico, queijo minas, rúcula, tomate, maionese vegana.',
    price: 27.90,
    category: 'burgers',
    image: 'Imagens/receita-de-x-tudo.jpg',
    ingredients: ['pão integral', 'burger grão-de-bico', 'queijo minas', 'rúcula', 'tomate', 'maionese vegana'],
    vegetarian: true
  },
  {
    id: 'burger-duplo',
    name: 'Burger Duplo',
    description: 'Pão brioche, 2x blend Angus 180g, queijo cheddar duplo, bacon, picles especiais.',
    price: 42.90,
    category: 'burgers',
    image: 'Imagens/chess-burger.jpg',
    ingredients: ['pão brioche', 'duplo blend angus', 'queijo cheddar duplo', 'bacon', 'picles'],
    popular: true
  },
  {
    id: 'batata-rustica',
    name: 'Batata Rústica',
    description: 'Batatas cortadas à mão, tempero especial da casa, maionese artesanal.',
    price: 16.90,
    category: 'acompanhamentos',
    image: 'Imagens/chess-burger.jpg',
    ingredients: ['batata rústica', 'tempero especial', 'maionese artesanal']
  },
  {
    id: 'refrigerante',
    name: 'Refrigerantes',
    description: 'Coca-Cola, Pepsi, Guaraná Antarctica, Sprite - 350ml gelado.',
    price: 6.90,
    category: 'bebidas',
    image: 'Imagens/chess-burger.jpg',
    ingredients: ['coca-cola', 'pepsi', 'guaraná', 'sprite']
  },
  {
    id: 'milkshake-chocolate',
    name: 'Milkshake Chocolate',
    description: 'Sorvete cremoso de baunilha, calda de chocolate, chantilly e granulado.',
    price: 18.90,
    category: 'sobremesas',
    image: 'Imagens/chess-burger.jpg',
    ingredients: ['sorvete baunilha', 'calda chocolate', 'chantilly', 'granulado']
  }
];

// ===== NOTIFICATION SYSTEM =====
class NotificationSystem {
  static show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Fechar notificação">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove
    const removeNotification = () => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 300);
    };

    // Close button event
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', removeNotification);

    // Auto remove after duration
    setTimeout(removeNotification, duration);
  }
}

// ===== SEARCH FUNCTIONALITY =====
class MenuSearch {
  constructor(searchInput, resultsContainer, menuData) {
    this.searchInput = searchInput;
    this.resultsContainer = resultsContainer;
    this.menuData = menuData;
    this.debounceDelay = 300;
    this.currentQuery = '';
    
    this.init();
  }
  
  init() {
    if (!this.searchInput || !this.resultsContainer) return;
    
    this.searchInput.addEventListener('input', 
      this.debounce(this.performSearch.bind(this), this.debounceDelay)
    );
    
    // Clear search
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSearch();
      }
    });
  }
  
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
  
  performSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    this.currentQuery = query;
    
    if (!query) {
      this.showAllItems();
      return;
    }
    
    const filteredItems = this.menuData.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );
    
    this.renderResults(filteredItems);
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('search', query);
    window.history.replaceState({}, '', url);
  }
  
  clearSearch() {
    this.searchInput.value = '';
    this.currentQuery = '';
    this.showAllItems();
    
    // Clear URL search param
    const url = new URL(window.location);
    url.searchParams.delete('search');
    window.history.replaceState({}, '', url);
  }
  
  showAllItems() {
    this.renderResults(this.menuData);
  }
  
  renderResults(items) {
    if (!this.resultsContainer) return;
    
    this.resultsContainer.innerHTML = '';
    
    if (items.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="no-results">
          <h3>Nenhum item encontrado</h3>
          <p>Tente buscar por outro termo ou explore nosso cardápio completo.</p>
          <button class="btn btn-secondary" onclick="menuSearch.clearSearch()">
            Ver todos os itens
          </button>
        </div>
      `;
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
      const itemElement = this.createMenuItemElement(item);
      fragment.appendChild(itemElement);
    });
    
    this.resultsContainer.appendChild(fragment);
    
    // Lazy load images
    this.initLazyLoading();
  }
  
  createMenuItemElement(item) {
    const article = document.createElement('article');
    article.className = 'menu-card glass-hover';
    article.dataset.category = item.category;
    
    const badges = [];
    if (item.popular) badges.push('<span class="badge badge-popular">Popular</span>');
    if (item.vegetarian) badges.push('<span class="badge badge-vegetarian">Vegetariano</span>');
    
    article.innerHTML = `
      <div class="menu-card-image-container">
        <img 
          src="${item.image}" 
          alt="${item.name}"
          class="menu-card-image"
          loading="lazy"
          data-src="${item.image}"
        >
        ${badges.length > 0 ? `<div class="menu-card-badges">${badges.join('')}</div>` : ''}
      </div>
      <div class="menu-card-content">
        <h3 class="menu-card-title">${item.name}</h3>
        <p class="menu-card-description">${item.description}</p>
        <div class="menu-card-footer">
          <span class="menu-card-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
          <button 
            class="btn btn-secondary add-to-cart" 
            data-item-id="${item.id}"
            aria-label="Adicionar ${item.name} ao carrinho"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
            </svg>
            Adicionar
          </button>
        </div>
      </div>
    `;
    
    return article;
  }
  
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}

// ===== FORM VALIDATION =====
class FormValidator {
  constructor(form) {
    this.form = form;
    this.rules = {
      name: { 
        required: true, 
        minLength: 2,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/
      },
      email: { 
        required: true, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      phone: { 
        required: true, 
        pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
      },
      message: { 
        required: true, 
        minLength: 10,
        maxLength: 1000
      }
    };
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    Object.keys(this.rules).forEach(fieldName => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.addEventListener('input', () => this.validateField(fieldName));
        field.addEventListener('blur', () => this.validateField(fieldName));
        
        // Phone formatting
        if (fieldName === 'phone') {
          field.addEventListener('input', this.formatPhone.bind(this));
        }
      }
    });
  }
  
  formatPhone(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length >= 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 6) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 2) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    
    event.target.value = value;
  }
  
  validateField(fieldName) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    const rule = this.rules[fieldName];
    const value = field.value.trim();
    
    this.clearFieldError(field);
    
    if (rule.required && !value) {
      this.setFieldError(field, `${this.getFieldLabel(field)} é obrigatório`);
      return false;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      this.setFieldError(field, this.getPatternMessage(fieldName));
      return false;
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      this.setFieldError(field, `Mínimo ${rule.minLength} caracteres`);
      return false;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      this.setFieldError(field, `Máximo ${rule.maxLength} caracteres`);
      return false;
    }
    
    this.setFieldSuccess(field);
    return true;
  }
  
  validateForm() {
    let isValid = true;
    
    Object.keys(this.rules).forEach(fieldName => {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  handleSubmit(event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      NotificationSystem.show('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    // Show loading state
    const submitButton = this.form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    // Simulate form submission
    setTimeout(() => {
      NotificationSystem.show('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success', 5000);
      this.form.reset();
      
      // Reset button
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      
      // Clear validation states
      this.form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
        field.classList.remove('valid', 'error');
      });
    }, 2000);
  }
  
  setFieldError(field, message) {
    field.classList.remove('valid');
    field.classList.add('error');
    
    let errorElement = field.parentElement.querySelector('.form-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  setFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('valid');
    
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  clearFieldError(field) {
    field.classList.remove('error', 'valid');
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }
  
  getPatternMessage(fieldName) {
    const messages = {
      name: 'Nome deve conter apenas letras',
      email: 'Digite um e-mail válido',
      phone: 'Digite um telefone válido: (11) 99999-9999'
    };
    
    return messages[fieldName] || 'Formato inválido';
  }
}

// ===== MOBILE NAVIGATION =====
class MobileNavigation {
  constructor() {
    this.toggleButton = document.querySelector('.mobile-menu-toggle');
    this.mobileNav = document.querySelector('.mobile-nav');
    this.navLinks = document.querySelectorAll('.mobile-nav-link');
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    if (!this.toggleButton || !this.mobileNav) return;
    
    this.toggleButton.addEventListener('click', this.toggle.bind(this));
    
    // Close on link click
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.close();
      });
    });
    
    // Close on outside click
    document.addEventListener('click', (event) => {
      if (this.isOpen && 
          !this.mobileNav.contains(event.target) && 
          !this.toggleButton.contains(event.target)) {
        this.close();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    this.isOpen = true;
    this.toggleButton.classList.add('active');
    this.toggleButton.setAttribute('aria-expanded', 'true');
    this.mobileNav.classList.add('active');
    this.mobileNav.setAttribute('aria-hidden', 'false');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.isOpen = false;
    this.toggleButton.classList.remove('active');
    this.toggleButton.setAttribute('aria-expanded', 'false');
    this.mobileNav.classList.remove('active');
    this.mobileNav.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// ===== SMOOTH SCROLLING =====
class SmoothScroll {
  constructor() {
    this.init();
  }
  
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        
        const target = document.querySelector(href);
        if (target) {
          const headerHeight = document.querySelector('.site-header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

// ===== SCROLL EFFECTS =====
class ScrollEffects {
  constructor() {
    this.header = document.querySelector('.site-header');
    this.lastScrollY = window.scrollY;
    this.ticking = false;
    
    this.init();
  }
  
  init() {
    if (!this.header) return;
    
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateHeader();
          this.ticking = false;
        });
        this.ticking = true;
      }
    });
  }
  
  updateHeader() {
    const currentScrollY = window.scrollY;
    
    // Add/remove scrolled class
    if (currentScrollY > 50) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
    
    // Hide/show header based on scroll direction
    if (currentScrollY > this.lastScrollY && currentScrollY > 200) {
      this.header.style.transform = 'translateY(-100%)';
    } else {
      this.header.style.transform = 'translateY(0)';
    }
    
    this.lastScrollY = currentScrollY;
  }
}

// ===== CART MODAL =====
class CartModal {
  constructor() {
    this.modal = null;
    this.createModal();
    this.init();
  }
  
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'cart-modal';
    this.modal.innerHTML = `
      <div class="cart-modal-overlay"></div>
      <div class="cart-modal-content">
        <div class="cart-modal-header">
          <h2>Seu Carrinho</h2>
          <button class="cart-modal-close" aria-label="Fechar carrinho">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="cart-modal-body">
          <div class="cart-items"></div>
          <div class="cart-total">
            <div class="cart-total-row">
              <span>Total:</span>
              <span class="cart-total-amount">R$ 0,00</span>
            </div>
          </div>
        </div>
        <div class="cart-modal-footer">
          <button class="btn btn-ghost" onclick="cartModal.clearCart()">
            Limpar Carrinho
          </button>
          <button class="btn btn-primary" onclick="cartModal.checkout()">
            Finalizar Pedido
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
  }
  
  init() {
    // Open cart modal
    const cartIcon = document.querySelector('.header-icon[aria-label*="carrinho"]');
    if (cartIcon) {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }
    
    // Close modal events
    const closeBtn = this.modal.querySelector('.cart-modal-close');
    const overlay = this.modal.querySelector('.cart-modal-overlay');
    
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', () => this.close());
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }
  
  open() {
    this.updateCartDisplay();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  updateCartDisplay() {
    const cartItems = this.modal.querySelector('.cart-items');
    const cartTotal = this.modal.querySelector('.cart-total-amount');
    
    cartItems.innerHTML = '';
    
    if (Object.keys(appState.cart).length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <p>Seu carrinho está vazio</p>
          <button class="btn btn-secondary" onclick="cartModal.close()">
            Explorar Cardápio
          </button>
        </div>
      `;
      cartTotal.textContent = 'R$ 0,00';
      return;
    }
    
    Object.entries(appState.cart).forEach(([itemKey, item]) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="cartModal.updateQuantity('${itemKey}', ${item.quantity - 1})">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn" onclick="cartModal.updateQuantity('${itemKey}', ${item.quantity + 1})">+</button>
          <button class="remove-btn" onclick="cartModal.removeItem('${itemKey}')" aria-label="Remover item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
      cartItems.appendChild(itemElement);
    });
    
    cartTotal.textContent = `R$ ${appState.getCartTotal().toFixed(2).replace('.', ',')}`;
  }
  
  updateQuantity(itemKey, quantity) {
    appState.updateCartQuantity(itemKey, quantity);
    this.updateCartDisplay();
  }
  
  removeItem(itemKey) {
    appState.removeFromCart(itemKey);
    this.updateCartDisplay();
  }
  
  clearCart() {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      appState.clearCart();
      this.updateCartDisplay();
    }
  }
  
  checkout() {
    if (Object.keys(appState.cart).length === 0) {
      NotificationSystem.show('Adicione itens ao carrinho antes de finalizar', 'error');
      return;
    }
    
    // Simple checkout simulation
    const total = appState.getCartTotal();
    const itemCount = appState.getCartItemCount();
    
    NotificationSystem.show(
      `Pedido de ${itemCount} itens (R$ ${total.toFixed(2).replace('.', ',')}) enviado! Entraremos em contato para confirmar.`,
      'success',
      7000
    );
    
    appState.clearCart();
    this.close();
    this.updateCartDisplay();
  }
}

// ===== INTERSECTION OBSERVER ANIMATIONS =====
class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.init();
  }
  
  init() {
    if (!('IntersectionObserver' in window)) return;
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );
    
    // Observe elements
    document.querySelectorAll('.card, .menu-card, .contact-card').forEach(el => {
      el.classList.add('fade-in');
      this.observer.observe(el);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        this.observer.unobserve(entry.target);
      }
    });
  }
}

// ===== INITIALIZE APPLICATION =====
class App {
  constructor() {
    this.appState = new AppState();
    this.components = {};
    
    this.init();
  }
  
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initComponents());
    } else {
      this.initComponents();
    }
  }
  
  async initComponents() {
    // Load header and footer first
    await loadHTMLPartials();
  
    // Initialize core components
    this.components.mobileNav = new MobileNavigation();
    this.components.smoothScroll = new SmoothScroll();
    this.components.scrollEffects = new ScrollEffects();
    this.components.scrollAnimations = new ScrollAnimations();
    this.components.cartModal = new CartModal();
    
    // Initialize menu search if on menu page
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('menu-results') || document.querySelector('.menu-grid');
    
    if (searchInput && resultsContainer) {
      this.components.menuSearch = new MenuSearch(searchInput, resultsContainer, MENU_DATA);
      // Initialize with all menu data
      this.components.menuSearch.renderResults(MENU_DATA);
    }
    
    // Initialize forms
    document.querySelectorAll('form').forEach(form => {
      if (!form.classList.contains('form-sub')) { // Skip newsletter forms
        this.components[`form_${form.id}`] = new FormValidator(form);
      }
    });
    
    // Initialize cart functionality
    this.initCartButtons();
    
    // Update initial cart display
    this.appState.updateCartDisplay();
    
    // Handle URL search parameter
    this.handleURLSearch();
    
    // Initialize service worker if available
    this.initServiceWorker();
    
    console.log('Delicious Burger app initialized successfully!');
  }
  
  initCartButtons() {
    document.addEventListener('click', (event) => {
      const addButton = event.target.closest('.add-to-cart');
      if (addButton) {
        event.preventDefault();
        
        const itemId = addButton.dataset.itemId;
        const menuItem = MENU_DATA.find(item => item.id === itemId);
        
        if (menuItem) {
          this.appState.addToCart(menuItem);
        }
      }
    });
  }
  
  handleURLSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery && this.components.menuSearch) {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = searchQuery;
        this.components.menuSearch.performSearch({ target: { value: searchQuery } });
      }
    }
  }
  
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }
}

// ===== GLOBAL VARIABLES =====
let appState;
let app;
let cartModal;
let menuSearch;

// ===== INITIALIZE WHEN DOM IS READY =====
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  appState = app.appState;
  cartModal = app.components.cartModal;
  menuSearch = app.components.menuSearch;
});

// ===== UTILITY FUNCTIONS =====
function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatPhone(phone) {
  return phone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// ===== PERFORMANCE MONITORING =====
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log(`LCP: ${entry.startTime}ms`);
      }
      if (entry.entryType === 'first-input') {
        console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
      }
    }
  });
  
  observer.observe({entryTypes: ['largest-contentful-paint', 'first-input']});
}