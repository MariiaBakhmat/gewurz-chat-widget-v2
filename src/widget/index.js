import { GewurzWidget } from './Widget.js';
import { CONFIG } from './config.js';
import './styles/widget.scss';

// Самозапускна функція для ініціалізації віджета
(function() {
  'use strict';
  
  // Перевірити що віджет не завантажений двічі
  if (window.GewurzChatLoaded) {
    console.warn('Gewürz Chat Widget already loaded');
    return;
  }

  // Знайти скрипт тег для отримання налаштувань
  const scriptTag = document.currentScript || 
    document.querySelector('script[src*="widget"]') ||
    document.querySelector('script[data-gewurz-widget]');

  // Витягти налаштування з data-атрибутів скрипта
  function getConfigFromScript() {
    if (!scriptTag) return {};
    
    const config = {};
    
    // Позиціювання кнопки (десктоп)
    const desktopButton = {};
    if (scriptTag.getAttribute('data-bottom')) desktopButton.bottom = scriptTag.getAttribute('data-bottom');
    if (scriptTag.getAttribute('data-right')) desktopButton.right = scriptTag.getAttribute('data-right');
    if (scriptTag.getAttribute('data-left')) desktopButton.left = scriptTag.getAttribute('data-left');
    if (scriptTag.getAttribute('data-top')) desktopButton.top = scriptTag.getAttribute('data-top');
    
    // Позиціювання чату (десктоп)
    const desktopChat = {};
    if (scriptTag.getAttribute('data-chat-bottom')) desktopChat.bottom = scriptTag.getAttribute('data-chat-bottom');
    if (scriptTag.getAttribute('data-chat-right')) desktopChat.right = scriptTag.getAttribute('data-chat-right');
    if (scriptTag.getAttribute('data-chat-left')) desktopChat.left = scriptTag.getAttribute('data-chat-left');
    if (scriptTag.getAttribute('data-chat-top')) desktopChat.top = scriptTag.getAttribute('data-chat-top');
    if (scriptTag.getAttribute('data-chat-width')) desktopChat.width = scriptTag.getAttribute('data-chat-width');
    if (scriptTag.getAttribute('data-chat-height')) desktopChat.height = scriptTag.getAttribute('data-chat-height');
    
    // Позиціювання кнопки (мобільна)
    const mobileButton = {};
    if (scriptTag.getAttribute('data-mobile-bottom')) mobileButton.bottom = scriptTag.getAttribute('data-mobile-bottom');
    if (scriptTag.getAttribute('data-mobile-right')) mobileButton.right = scriptTag.getAttribute('data-mobile-right');
    if (scriptTag.getAttribute('data-mobile-left')) mobileButton.left = scriptTag.getAttribute('data-mobile-left');
    if (scriptTag.getAttribute('data-mobile-top')) mobileButton.top = scriptTag.getAttribute('data-mobile-top');
    
    // Позиціювання чату (мобільна)
    const mobileChat = {};
    if (scriptTag.getAttribute('data-mobile-chat-bottom')) mobileChat.bottom = scriptTag.getAttribute('data-mobile-chat-bottom');
    if (scriptTag.getAttribute('data-mobile-chat-right')) mobileChat.right = scriptTag.getAttribute('data-mobile-chat-right');
    if (scriptTag.getAttribute('data-mobile-chat-left')) mobileChat.left = scriptTag.getAttribute('data-mobile-chat-left');
    if (scriptTag.getAttribute('data-mobile-chat-top')) mobileChat.top = scriptTag.getAttribute('data-mobile-chat-top');
    
    // API налаштування
    if (scriptTag.getAttribute('data-api-base')) {
      config.api = {
        base: scriptTag.getAttribute('data-api-base')
      };
    }
    
    // UI налаштування
    const ui = {};
    if (scriptTag.getAttribute('data-icon-url')) ui.iconUrl = scriptTag.getAttribute('data-icon-url');
    if (scriptTag.getAttribute('data-chat-url')) ui.chatUrl = scriptTag.getAttribute('data-chat-url');
    
    // Поведінка
    const behavior = {};
    if (scriptTag.getAttribute('data-show-notification')) {
      behavior.showNotificationAfter = parseInt(scriptTag.getAttribute('data-show-notification')) || 0;
    }
    if (scriptTag.getAttribute('data-auto-open')) {
      behavior.autoOpenDelay = parseInt(scriptTag.getAttribute('data-auto-open')) || 0;
    }
    
    // Збірка конфігу
    if (Object.keys(desktopButton).length || Object.keys(desktopChat).length || 
        Object.keys(mobileButton).length || Object.keys(mobileChat).length) {
      config.ui = {
        ...ui,
        desktop: {
          button: desktopButton,
          chat: desktopChat
        },
        mobile: {
          button: mobileButton,
          chat: mobileChat
        }
      };
    } else if (Object.keys(ui).length) {
      config.ui = ui;
    }
    
    if (Object.keys(behavior).length) {
      config.behavior = behavior;
    }
    
    return config;
  }

  // Ініціалізація віджета
  function initWidget() {
    try {
      // Отримати кастомну конфігурацію
      const scriptConfig = getConfigFromScript();
      
      // Створити віджет з об'єднаною конфігурацією
      const widget = new GewurzWidget(scriptConfig);
      
      // Глобальний API для віджета
      window.GewurzChat = {
        // Методи керування
        open: () => widget.open(),
        close: () => widget.close(),
        toggle: () => widget.toggle(),
        destroy: () => widget.destroy(),
        
        // Стан
        isOpen: () => widget.isOpen,
        isLoaded: () => widget.isLoaded,
        
        // Конфігурація
        getConfig: () => widget.config,
        updateConfig: (newConfig) => widget.updateConfig(newConfig),
        
        // Посилання на екземпляр
        widget: widget
      };
      
      // Відправити подію готовності
      window.dispatchEvent(new CustomEvent('gewurz-chat-ready', { 
        detail: { widget, api: window.GewurzChat } 
      }));
      
      console.log('Gewürz Chat Widget loaded successfully');
      
    } catch (error) {
      console.error('Failed to initialize Gewürz Chat Widget:', error);
    }
  }

  // Дочекатись готовності DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    // DOM вже готовий
    initWidget();
  }

})();

// ES6 експорт для модульного використання (якщо потрібно)
export { GewurzWidget, CONFIG } from './Widget.js';
export { getApiUrl } from './config.js';
