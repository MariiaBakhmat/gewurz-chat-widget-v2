// Конфігурація віджета
export const CONFIG = {
  // API налаштування
  api: {
    // Поки що залишаємо n8n URLs для тестування
    base: 'https://n8n.beinf.ai',
    endpoints: {
      history: '/webhook/da1ae5d0-bfe1-4835-bb72-07f0b869ffc0',
      ask: '/webhook/5af2b924-aedb-4d7f-828a-3858c9b1f9f6'
    }
    
    // Коли будуть готові продакшн API, просто замінити на:
    // base: 'https://api.gewurzguru.com',
    // endpoints: {
    //   history: '/api/chat/history',
    //   ask: '/api/chat/ask'
    // }
  },
  
  // UI налаштування
  ui: {
    iconUrl: 'https://github.com/MariiaBakhmat/GewGur_widget/raw/main/Group%20112.webp',
    chatUrl: './chat.html', // Відносний шлях до зібраного chat.html
    
    // Позиціонування для десктопу
    desktop: {
      button: {
        bottom: '60px',
        right: '125px',
        left: 'auto',
        top: 'auto'
      },
      chat: {
        bottom: '80px',
        right: '20px',
        left: 'auto',
        top: 'auto',
        width: '400px',
        height: '522px'
      }
    },
    
    // Позиціонування для мобільних
    mobile: {
      button: {
        bottom: '90px',
        right: '10px',
        left: 'auto',
        top: 'auto'
      },
      chat: {
        bottom: '80px',
        right: '10px',
        left: '10px',
        top: '20px'
      }
    }
  },
  
  // Налаштування поведінки
  behavior: {
    showNotificationAfter: 0, // мс, 0 = не показувати
    autoOpenDelay: 0, // мс, 0 = не відкривати автоматично
    closeOnClickOutside: true,
    closeOnEscape: true
  },
  
  // Тексти (для подальшої локалізації)
  texts: {
    buttonTitle: 'Gewürz Guru Chat',
    errorMessage: 'Hoppla, da ist etwas schiefgelaufen. Bitte versuche es später erneut oder wende dich an den Support!',
    welcomeMessage: 'Hey! Ich bin der Gewürz Guru – dein Helfer beim Einkaufen. Ich bin noch neu hier, aber ich kann dir schon jetzt helfen, den richtigen Tee oder das perfekte Gewürz zu finden!',
    placeholder: 'Schreib eine Nachricht...'
  }
};

// Функція для отримання повних URL
export function getApiUrl(endpoint) {
  return `${CONFIG.api.base}${CONFIG.api.endpoints[endpoint]}`;
}

// Функція для перевизначення конфігу (для різних середовищ)
export function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
}
