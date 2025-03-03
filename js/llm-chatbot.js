class ChatBot {
  constructor() {
    this.container = null;
    this.chatHistory = null;
    this.input = null;
    this.API_ENDPOINT = 'http://117.161.233.106:8000/v1/chat/completions?model=deepseek';
    this.systemMessage = "你是一个友善的AI助手，可以帮助回答用户关于博客内容的问题。";
    this.chatMessages = this.loadChatHistory() || [];
    this.currentMessageDiv = null;
    this.thinkingContent = '';
    this.finalContent = '';
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isButtonDragging = false;
    this.buttonDragOffset = { x: 0, y: 0 };
    this.chatButton = null;
    this.mouseDownTime = 0;
    this.mouseDownPos = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.createChatInterface();
    this.createChatButton();
    this.bindEvents();
  }

  createChatButton() {
    const button = document.createElement('div');
    button.className = 'chatbot-button';
    button.innerHTML = '<i class="chatbot-button-icon fas fa-comment"></i>';
    document.body.appendChild(button);
    
    this.chatButton = button;
    
    button.addEventListener('mousedown', (e) => {
      this.mouseDownTime = Date.now();
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
      
      this.startButtonDragging(e);
    });

    button.addEventListener('mouseup', (e) => {
      const mouseUpTime = Date.now();
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - this.mouseDownPos.x, 2) + 
        Math.pow(e.clientY - this.mouseDownPos.y, 2)
      );
      
      if (mouseUpTime - this.mouseDownTime < 200 && dragDistance < 5) {
        this.container.style.right = '20px';
        this.container.classList.add('visible');
        button.style.display = 'none';
      }
      
      this.stopButtonDragging();
    });

    document.addEventListener('mousemove', (e) => this.dragButton(e));
  }

  startButtonDragging(e) {
    this.isButtonDragging = true;
    const rect = this.chatButton.getBoundingClientRect();
    this.buttonDragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  dragButton(e) {
    if (!this.isButtonDragging) return;
    
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - this.mouseDownPos.x, 2) + 
      Math.pow(e.clientY - this.mouseDownPos.y, 2)
    );
    
    if (dragDistance > 5) {
      const x = e.clientX - this.buttonDragOffset.x;
      const y = e.clientY - this.buttonDragOffset.y;
      
      const maxX = window.innerWidth - this.chatButton.offsetWidth;
      const maxY = window.innerHeight - this.chatButton.offsetHeight;
      
      this.chatButton.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
      this.chatButton.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
      this.chatButton.style.right = 'auto';
      this.chatButton.style.transform = 'none';
    }
  }

  stopButtonDragging() {
    this.isButtonDragging = false;
  }

  createChatInterface() {
    this.container = document.createElement('div');
    this.container.className = 'chatbot-container';
    
    const header = document.createElement('div');
    header.className = 'chatbot-header';
    header.innerHTML = `
      <span class="chatbot-title">博客助手</span>
      <div class="chatbot-controls">
        <button class="clear-history-button" title="清除聊天记录">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        <button class="chatbot-toggle">×</button>
      </div>
    `;
    
    this.chatHistory = document.createElement('div');
    this.chatHistory.className = 'chat-history';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chatbot-input-container';
    
    this.input = document.createElement('input');
    this.input.className = 'query-input';
    this.input.placeholder = '请输入您的问题...';
    
    const sendButton = document.createElement('button');
    sendButton.className = 'send-button';
    sendButton.innerHTML = '发送';
    
    inputContainer.appendChild(this.input);
    inputContainer.appendChild(sendButton);
    
    this.container.appendChild(header);
    this.container.appendChild(this.chatHistory);
    this.container.appendChild(inputContainer);
    document.body.appendChild(this.container);

    this.loadHistoryMessages();

    this.container.classList.remove('visible');
  }

  bindEvents() {
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleQuery();
      }
    });

    const sendButton = this.container.querySelector('.send-button');
    sendButton.addEventListener('click', () => {
      this.handleQuery();
    });

    const toggleBtn = this.container.querySelector('.chatbot-toggle');
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.container.style.right = '-380px';
      this.container.classList.remove('visible');
      
      if (this.chatButton) {
        this.chatButton.style.display = 'flex';
      }
    });

    const header = this.container.querySelector('.chatbot-header');
    header.addEventListener('mousedown', (e) => this.startDragging(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDragging());

    const clearButton = this.container.querySelector('.clear-history-button');
    clearButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('确定要清除所有聊天记录吗？')) {
        this.clearChatHistory();
      }
    });
  }

  clearChat() {
    this.chatMessages = [];
    this.chatHistory.innerHTML = '';
    this.thinkingContent = '';
    this.finalContent = '';
  }

  async handleQuery() {
    const query = this.input.value.trim();
    if (!query) return;

    this.addMessage(query, 'user');
    this.input.value = '';
    this.chatMessages.push({ role: "user", content: query });
    this.saveChatHistory();

    this.currentMessageDiv = this.addMessage('', 'assistant');
    let currentResponse = '';

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3",
          stream: true,
          temperature: 0.1,
          top_p: 0.1,
          messages: this.chatMessages
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data.trim() === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                currentResponse += content;
                this.updateMessageContent(currentResponse);
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      this.chatMessages.push({
        role: "assistant",
        content: currentResponse
      });
      this.saveChatHistory();

    } catch (error) {
      console.error('Chat API Error:', error);
      this.updateMessageContent('抱歉，请求发生错误，请稍后再试。');
    }
  }

  updateMessageContent(content) {
    if (this.currentMessageDiv) {
      let formattedContent = content;
      
      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
      if (thinkMatch) {
        const thinking = thinkMatch[1];
        const answer = thinkMatch[2];
        formattedContent = `
          <div class="thinking-section">
            <div class="thinking-label">🤔 思考过程：</div>
            <div class="thinking-content">${this.formatMessage(thinking)}</div>
          </div>
          <div class="answer-section">
            <div class="answer-label">💡 回答：</div>
            <div class="answer-content">${this.formatMessage(answer)}</div>
          </div>
        `;
      }
      
      this.currentMessageDiv.innerHTML = `<div class="message-content">${formattedContent}</div>`;
      this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
  }

  updateThinkingContent(content) {
    this.thinkingContent += content;
    this.currentMessageDiv.innerHTML = `
      <div class="thinking-section">
        <div class="thinking-label">🤔 思考过程：</div>
        <div class="thinking-content">${this.formatMessage(this.thinkingContent)}</div>
      </div>
    `;
    this.scrollToBottom();
  }

  updateFinalContent(content) {
    this.finalContent += content;
    this.currentMessageDiv.innerHTML = `
      ${this.thinkingContent ? `
        <div class="thinking-section">
          <div class="thinking-label">🤔 思考过程：</div>
          <div class="thinking-content">${this.formatMessage(this.thinkingContent)}</div>
        </div>
      ` : ''}
      <div class="answer-section">
        <div class="answer-label">💡 回答：</div>
        <div class="answer-content">${this.formatMessage(this.finalContent)}</div>
      </div>
    `;
    this.scrollToBottom();
  }

  createEmptyMessage(type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    this.chatHistory.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  scrollToBottom() {
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  formatMessage(content) {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  addMessage(content, type, shouldSave = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.innerHTML = `<div class="message-content">${this.formatMessage(content)}</div>`;
    this.chatHistory.appendChild(messageDiv);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;

    if (shouldSave) {
      this.saveChatHistory();
    }

    return messageDiv;
  }

  startDragging(e) {
    this.isDragging = true;
    const rect = this.container.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    const maxX = window.innerWidth - this.container.offsetWidth;
    const maxY = window.innerHeight - this.container.offsetHeight;
    
    this.container.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
    this.container.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
  }

  stopDragging() {
    this.isDragging = false;
  }

  saveChatHistory() {
    localStorage.setItem('chatbot_history', JSON.stringify(this.chatMessages));
  }

  loadChatHistory() {
    const history = localStorage.getItem('chatbot_history');
    return history ? JSON.parse(history) : null;
  }

  clearChatHistory() {
    this.chatMessages = [];
    this.chatHistory.innerHTML = '';
    localStorage.removeItem('chatbot_history');
  }

  loadHistoryMessages() {
    if (this.chatMessages && this.chatMessages.length > 0) {
      this.chatMessages.forEach(msg => {
        const content = msg.content;
        const type = msg.role === 'user' ? 'user' : 'assistant';
        this.addMessage(content, type, false);
      });
      this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
  }
}

const style = document.createElement('style');
style.textContent = `
  .chatbot-button {
    position: fixed;
    right: 20px;
    top: 50%; /* 垂直居中 */
    transform: translateY(-50%); /* 确保垂直居中 */
    width: 60px;
    height: 60px;
    background: #49b1f5;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab; /* 使用grab光标提示可拖动 */
    z-index: 999;
    transition: background 0.3s ease; /* 只对背景应用过渡效果，避免影响拖动 */
  }

  .chatbot-button:active {
    cursor: grabbing; /* 拖动时使用grabbing光标 */
  }

  .chatbot-button:hover {
    background: #3a8dc4;
  }

  .chatbot-button-icon {
    color: white;
    font-size: 24px;
    pointer-events: none; /* 防止图标干扰拖动 */
  }

  .chatbot-container {
    position: fixed !important;
    bottom: 20px !important;
    right: -380px !important; /* 默认隐藏在右侧，确保完全超出屏幕 */
    width: 350px !important;
    height: 500px !important;
    background: white !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    resize: both !important;
    min-width: 300px !important;
    min-height: 400px !important;
    z-index: 1000 !important;
    transition: all 0.3s ease !important;
  }

  .chatbot-container.visible {
    right: 20px !important; /* 显示时移动到屏幕内 */
  }

  .chatbot-header {
    padding: 12px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
    color: #333;
  }

  .chatbot-title {
    font-weight: bold;
    font-size: 16px;
    color: #2c3e50;
  }

  .chatbot-toggle {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 20px;
    color: #666;
    padding: 0 5px;
    transition: color 0.3s;
  }

  .chatbot-toggle:hover {
    color: #333;
  }

  .chatbot-resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 15px;
    height: 15px;
    cursor: se-resize;
    background: linear-gradient(135deg, transparent 50%, #2c3e50 50%);
    border-radius: 0 0 10px 0;
  }

  .chatbot-header:active {
    cursor: grabbing;
    background: #eef2f7;
  }

  .chat-message {
    margin-bottom: 10px;
    max-width: 85%;
    word-wrap: break-word;
  }

  .user-message {
    margin-left: auto;
    background: #e3f2fd;
    padding: 10px;
    border-radius: 12px 12px 2px 12px;
    color: #1a237e;
  }

  .assistant-message {
    margin-right: auto;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 12px 12px 12px 2px;
    color: #333;
  }

  .thinking-section {
    background: #fafafa;
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 8px;
    border-left: 3px solid #9e9e9e;
  }

  .thinking-label {
    color: #616161;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .thinking-content {
    color: #757575;
    font-style: italic;
    line-height: 1.4;
  }

  .answer-section {
    background: #fff;
    padding: 10px;
    border-radius: 8px;
    border-left: 3px solid #2196f3;
  }

  .answer-label {
    color: #1976d2;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .answer-content {
    color: #333;
    line-height: 1.4;
  }

  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background: #fff;
  }

  .chatbot-input-container {
    padding: 12px;
    border-top: 1px solid #e0e0e0;
    background: #fff;
  }

  .query-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    margin-right: 8px;
    font-size: 14px;
    transition: border-color 0.3s;
  }

  .query-input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .send-button {
    padding: 8px 16px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
    font-size: 14px;
  }

  .send-button:hover {
    background: #1976d2;
  }

  .chatbot-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .clear-history-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.3s;
  }

  .clear-history-button:hover {
    background: #e0e0e0;
    color: #333;
  }

  .clear-history-button svg {
    width: 16px;
    height: 16px;
  }

  .confirm-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1001;
  }

  .confirm-dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  }

  .confirm-dialog button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .confirm-dialog .confirm-yes {
    background: #f44336;
    color: white;
  }

  .confirm-dialog .confirm-no {
    background: #e0e0e0;
    color: #333;
  }
`;

document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
  new ChatBot();
}); 