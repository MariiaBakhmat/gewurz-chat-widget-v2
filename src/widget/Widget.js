import { CONFIG, getApiUrl } from './config.js';

export class GewurzWidget {
  constructor(options = {}) {
    // Об'єднуємо дефолтний конфіг з переданими опціями
    this.config = this.mergeConfig(CONFIG, options);
    
    // Стан віджета
    this.isOpen = false;
    this.isLoaded = false;
    this.elements = {};
    
    // Ініціалізація
    this.init();
  }
  
  // Об'єднання конфігурацій
  mergeConfig(defaultConfig, userConfig) {
    const merged = JSON.parse(JSON.stringify(defaultConfig)); // Deep clone
    
    // Простий merge для першого рівня
    Object.keys(userConfig).forEach(key => {
      if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        merged[key] = { ...merged[key], ...userConfig[key] };
      } else {
        merged[key] = userConfig[key];
      }
    });
    
    return merged;
  }
  
  // Головна ініціалізація
  init() {
    this.checkDependencies();
    this.createWidget();
    this.bindEvents();
    this.applyCustomPositioning();
    
    // Відкладена ініціалізація сповіщень
    if (this.config.behavior.showNotificationAfter > 0) {
      this.scheduleNotification();
    }
  }
  
  // Перевірка що віджет не дублюється
  checkDependencies() {
    if (window.GewurzChatLoaded) {
      console.warn('Gewürz Chat Widget already loaded');
      return false;
    }
    window.GewurzChatLoaded = true;
    return true;
  }
  
  // Створення HTML структури віджета
  createWidget() {
    // Створити основний контейнер
    const container = document.createElement('div');
    container.className = 'gwz-widget';
    container.setAttribute('data-gwz-widget', 'true');
    
    // HTML структура
    container.innerHTML = `
      <button class="gwz-widget__button" title="${this.config.texts.buttonTitle}">
        <img 
          src="${this.config.ui.iconUrl}" 
          alt="Gewürz Guru"
          onerror="this.style.display='none'; this.parentElement.innerHTML='💬';">
        <div class="gwz-widget__notification"></div>
      </button>
      
      <div class="gwz-widget__modal">
        <div class="gwz-widget__header">
          <button class="gwz-widget__close" title="Schließen">✕</button>
        </div>
        <iframe 
          class="gwz-widget__iframe" 
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
          loading="lazy">
        </iframe>
        <div class="gwz-widget__spinner" style="display: none;">
          <div class="gwz-widget__spinner-icon"></div>
        </div>
      </div>
    `;
    
    // Додати до DOM
    document.body.appendChild(container);
    
    // Зберегти посилання на елементи
    this.elements = {
      container,
      button: container.querySelector('.gwz-widget__button'),
      modal: container.querySelector('.gwz-widget__modal'),
      close: container.querySelector('.gwz-widget__close'),
      iframe: container.querySelector('.gwz-widget__iframe'),
      notification: container.querySelector('.gwz-widget__notification'),
      spinner: container.querySelector('.gwz-widget__spinner')
    };
  }
  
  // Прив'язка подій
  bindEvents() {
    // Відкрити/закрити по кліку на кнопку
    this.elements.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    
    // Закрити по кліку на хрестик
    this.elements.close.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });
    
    // Закрити по кліку поза модальним вікном (тільки на десктопі)
    if (this.config.behavior.closeOnClickOutside) {
      document.addEventListener('click', (e) => {
        if (window.innerWidth > 768 && 
            this.isOpen && 
            !this.elements.modal.contains(e.target) && 
            !this.elements.button.contains(e.target)) {
          this.close();
        }
      });
    }
    
    // Закрити по Escape
    if (this.config.behavior.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
    
    // Слухати повідомлення з iframe
    window.addEventListener('message', (event) => {
      this.handleIframeMessage(event);
    });
  }
  
  // Застосувати кастомне позиціювання
  applyCustomPositioning() {
    const { desktop, mobile } = this.config.ui;
    
    // Застосувати позиції через CSS custom properties
    const container = this.elements.container;
    
    // Десктоп позиції
    Object.entries(desktop.button).forEach(([prop, value]) => {
      container.style.setProperty(`--desktop-button-${prop}`, value);
    });
    
    Object.entries(desktop.chat).forEach(([prop, value]) => {
      container.style.setProperty(`--desktop-chat-${prop}`, value);
    });
    
    // Мобільні позиції
    Object.entries(mobile.button).forEach(([prop, value]) => {
      container.style.setProperty(`--mobile-button-${prop}`, value);
    });
    
    Object.entries(mobile.chat).forEach(([prop, value]) => {
      container.style.setProperty(`--mobile-chat-${prop}`, value);
    });
  }
  
  // Переключити стан (відкрити/закрити)
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  // Відкрити чат
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.elements.modal.classList.add('gwz-widget__modal--open');
    this.elements.button.classList.add('gwz-widget__button--hidden');
    
    // Приховати сповіщення
    this.hideNotification();
    
    // Завантажити чат якщо ще не завантажений
    if (!this.isLoaded) {
      this.loadChat();
    }
    
    // Trigger custom event
    this.dispatchEvent('gewurz:chat:opened');
  }
  
  // Закрити чат
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.elements.modal.classList.remove('gwz-widget__modal--open');
    this.elements.button.classList.remove('gwz-widget__button--hidden');
    
    // Trigger custom event
    this.dispatchEvent('gewurz:chat:closed');
  }
  
  // Завантажити чат в iframe
  loadChat() {
    this.showSpinner();
    
    // Підготувати конфіг для передачі в чат
    const chatConfig = {
      api: this.config.api,
      texts: this.config.texts
    };
    
    // Створити URL з конфігом
    const configParam = encodeURIComponent(JSON.stringify(chatConfig));
    const chatUrl = `${this.config.ui.chatUrl}?config=${configParam}`;
    
    // Завантажити
    this.elements.iframe.src = chatUrl;
    
    // Fallback для приховання спінера
    setTimeout(() => {
      this.hideSpinner();
    }, 5000);
    
    this.isLoaded = true;
  }
  
  // Показати спінер завантаження
  showSpinner() {
    this.elements.spinner.style.display = 'flex';
  }
  
  // Приховати спінер завантаження
  hideSpinner() {
    this.elements.spinner.style.display = 'none';
  }
  
  // Обробка повідомлень з iframe
  handleIframeMessage(event) {
    // Перевірити домен для безпеки
    // if (!event.origin.includes('gewurzguru.com')) return;
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'chat-loaded':
        this.hideSpinner();
        this.dispatchEvent('gewurz:chat:ready');
        break;
        
      case 'chat-message-sent':
        this.dispatchEvent('gewurz:message:sent', data);
        break;
        
      case 'chat-message-received':
        this.dispatchEvent('gewurz:message:received', data);
        break;
        
      default:
        // Невідомий тип повідомлення
        break;
    }
  }
  
  // Показати сповіщення
  showNotification() {
    this.elements.notification.classList.add('gwz-widget__notification--show');
    this.elements.button.classList.add('gwz-widget__button--pulse');
    
    // Прибрати анімацію пульсації через 3 секунди
    setTimeout(() => {
      this.elements.button.classList.remove('gwz-widget__button--pulse');
    }, 3000);
  }
  
  // Приховати сповіщення
  hideNotification() {
    this.elements.notification.classList.remove('gwz-widget__notification--show');
    this.elements.button.classList.remove('gwz-widget__button--pulse');
  }
  
  // Запланувати показ сповіщення
  scheduleNotification() {
    setTimeout(() => {
      if (!this.isOpen) {
        this.showNotification();
      }
    }, this.config.behavior.showNotificationAfter);
  }
  
  // Відправити кастомну подію
  dispatchEvent(eventName, detail = null) {
    const event = new CustomEvent(eventName, { 
      detail: { widget: this, data: detail } 
    });
    window.dispatchEvent(event);
  }
  
  // Публічні методи для API
  destroy() {
    if (this.elements.container) {
      this.elements.container.remove();
    }
    window.GewurzChatLoaded = false;
  }
  
  updateConfig(newConfig) {
    this.config = this.mergeConfig(this.config, newConfig);
    this.applyCustomPositioning();
  }
}
