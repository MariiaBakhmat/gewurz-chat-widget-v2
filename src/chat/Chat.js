import './styles/chat.scss';

class ChatApp {
  constructor() {
    // Елементи DOM
    this.chatHistory = document.getElementById("gwz-chat-history");
    this.userInput = document.getElementById("gwz-user-input");
    this.sendButton = document.getElementById("gwz-send-button");
    
    // Конфігурація (отримуємо з URL параметрів)
    this.config = this.getConfigFromURL();
    
    // Стан чату
    this.sessionId = this.getOrCreateSessionId();
    this.isWaitingForResponse = false;
    
    // Ініціалізація
    this.init();
  }

  // Отримати конфігурацію з URL параметрів
  getConfigFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    
    if (configParam) {
      try {
        return JSON.parse(decodeURIComponent(configParam));
      } catch (e) {
        console.warn('Failed to parse chat config:', e);
      }
    }
    
    // Fallback конфігурація
    return {
      api: {
        base: 'https://n8n.beinf.ai',
        endpoints: {
          history: '/webhook/da1ae5d0-bfe1-4835-bb72-07f0b869ffc0',
          ask: '/webhook/5af2b924-aedb-4d7f-828a-3858c9b1f9f6'
        }
      },
      texts: {
        placeholder: 'Schreib eine Nachricht...',
        welcomeMessage: 'Hey! Ich bin der Gewürz Guru – dein Helfer beim Einkaufen. Ich bin noch neu hier, aber ich kann dir schon jetzt helfen, den richtigen Tee oder das perfekte Gewürz zu finden!',
        errorMessage: 'Hoppla, da ist etwas schiefgelaufen. Bitte versuche es später erneut oder wende dich an den Support!'
      }
    };
  }

  // Отримати або створити session ID
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  }

  // Ініціалізація чату
  async init() {
    // Встановити placeholder з конфігу
    this.userInput.placeholder = this.config.texts.placeholder;
    
    // Прив'язати події
    this.bindEvents();
    
    // Завантажити історію
    await this.loadHistory();
    
    // Повідомити батьківський віджет що чат готовий
    this.notifyParent('chat-loaded');
  }

  // Прив'язка подій
  bindEvents() {
    // Відправка повідомлення по кліку
    this.sendButton.addEventListener("click", () => {
      if (!this.isWaitingForResponse) {
        this.sendMessage();
      }
    });

    // Відправка повідомлення по Enter
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !this.isWaitingForResponse) {
        this.sendMessage();
      }
    });

    // Фокус на поле вводу коли iframe стає активним
    window.addEventListener('focus', () => {
      this.userInput.focus();
    });
  }

  // Завантажити історію чату
  async loadHistory() {
    try {
      const historyUrl = `${this.config.api.base}${this.config.api.endpoints.history}`;
      
      const response = await fetch(historyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: this.sessionId }),
      });
      
      const data = await response.json();
      
      if (Array.isArray(data.history) && data.history.length > 0) {
        data.history.forEach(({ sender, text }) => {
          this.appendMessage(sender, text);
        });
      } else {
        // Показати привітальне повідомлення
        this.appendMessage("bot", this.config.texts.welcomeMessage);
      }
      
    } catch (error) {
      console.error("Error loading chat history:", error);
      this.appendMessage("bot", this.config.texts.errorMessage);
    }
  }

  // Відправити повідомлення
  async sendMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Встановити стан очікування
    this.isWaitingForResponse = true;
    this.sendButton.disabled = true;

    // Додати повідомлення користувача
    this.appendMessage("user", message);
    this.userInput.value = "";

    // Показати індикатор завантаження
    const loadingMessage = this.showLoadingMessage();

    // Повідомити батьківський віджет
    this.notifyParent('chat-message-sent', { message });

    try {
      const askUrl = `${this.config.api.base}${this.config.api.endpoints.ask}`;
      
      const response = await fetch(askUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: this.sessionId, 
          chatInput: message 
        }),
      });
      
      const data = await response.json();
      const botResponse = data.text || this.config.texts.errorMessage;
      
      // Додати відповідь бота
      this.appendMessage("bot", botResponse);
      
      // Повідомити батьківський віджет
      this.notifyParent('chat-message-received', { message: botResponse });
      
    } catch (error) {
      console.error("Error sending message:", error);
      this.appendMessage("bot", this.config.texts.errorMessage);
    } finally {
      // Видалити індикатор завантаження
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Скинути стан очікування
      this.isWaitingForResponse = false;
      this.sendButton.disabled = false;
      this.userInput.focus();
    }
  }

  // Додати повідомлення до чату
  appendMessage(sender, message) {
    const container = document.createElement("div");
    container.classList.add("gwz-message", `gwz-message--${sender}`);

    const bubble = document.createElement("div");
    bubble.classList.add("gwz-message__bubble");
    
    if (sender === "bot") {
      // Обробка markdown для повідомлень бота
      const processedMessage = this.parseMarkdown(message);
      bubble.innerHTML = processedMessage;
      
      // Додати аватар бота
      const avatar = document.createElement("img");
      avatar.classList.add("gwz-message__avatar");
      avatar.src = "https://github.com/MariiaBakhmat/GewGur_widget/blob/main/avatar_small_agent.webp?raw=true";
      avatar.alt = "Bot Avatar";
      container.appendChild(avatar);
    } else {
      // Звичайний текст для повідомлень користувача
      bubble.textContent = message;
    }

    container.appendChild(bubble);
    this.chatHistory.appendChild(container);
    
    // Прокрутити до низу
    this.scrollToBottom();
  }

  // Показати повідомлення завантаження
  showLoadingMessage() {
    const container = document.createElement("div");
    container.classList.add("gwz-message", "gwz-message--bot", "gwz-message--loading");

    const avatar = document.createElement("img");
    avatar.classList.add("gwz-message__avatar");
    avatar.src = "https://github.com/MariiaBakhmat/GewGur_widget/blob/main/avatar_small_agent.webp?raw=true";
    avatar.alt = "Bot Avatar";

    const bubble = document.createElement("div");
    bubble.classList.add("gwz-message__bubble");
    bubble.textContent = ".....";

    container.appendChild(avatar);
    container.appendChild(bubble);
    this.chatHistory.appendChild(container);
    
    this.scrollToBottom();

    return container;
  }

  // Обробка простого markdown
  parseMarkdown(text) {
    // Жирний текст
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Посилання
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return text;
  }

  // Прокрутити чат до низу
  scrollToBottom() {
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  // Повідомити батьківський віджет
  notifyParent(type, data = null) {
    window.parent.postMessage({ type, data }, '*');
  }

  // Публічні методи для зовнішнього API (якщо потрібно)
  addMessage(sender, message) {
    this.appendMessage(sender, message);
  }

  clearHistory() {
    this.chatHistory.innerHTML = '';
    localStorage.removeItem('sessionId');
    this.sessionId = this.getOrCreateSessionId();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Оновити placeholder якщо змінився
    if (newConfig.texts && newConfig.texts.placeholder) {
      this.userInput.placeholder = newConfig.texts.placeholder;
    }
  }
}

// Ініціалізація чату коли DOM готовий
document.addEventListener('DOMContentLoaded', () => {
  window.chatApp = new ChatApp();
});

// Експорт для можливого використання в тестах
export default ChatApp;
