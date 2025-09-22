// Сервіс для роботи з API
export class ApiService {
  constructor(config) {
    this.baseUrl = config.base;
    this.endpoints = config.endpoints;
  }

  // Завантажити історію чату
  async loadHistory(sessionId) {
    const url = `${this.baseUrl}${this.endpoints.history}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Відправити повідомлення
  async sendMessage(sessionId, message) {
    const url = `${this.baseUrl}${this.endpoints.ask}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, chatInput: message })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Оновити конфігурацію API
  updateConfig(newConfig) {
    this.baseUrl = newConfig.base;
    this.endpoints = newConfig.endpoints;
  }
}
