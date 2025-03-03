class AIChat {
    constructor() {
        this.chatService = null;
        this.init();
    }

    init() {
        if (!window.AIChatService) {
            console.error('AIChatService not found');
            return;
        }
        this.chatService = window.AIChatService;
        this.createChatUI();
        this.bindEvents();
    }

    createChatUI() {
        // 检查是否已经存在聊天UI
        if (document.querySelector('.ai-chat-container')) {
            return;
        }

        const chatHTML = `
            <div class="ai-chat-toggle">
                <i class="fas fa-comments"></i>
            </div>
            <div class="ai-chat-container hidden">
                <div class="ai-chat-header">
                    <span>AI 助手</span>
                    <i class="fas fa-times" id="close-chat"></i>
                </div>
                <div class="ai-chat-messages"></div>
                <div class="ai-chat-input">
                    <input type="text" placeholder="输入您的问题...">
                    <button>发送</button>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.id = 'ai-chat-wrapper';
        div.innerHTML = chatHTML;
        document.body.appendChild(div);

        this.container = document.querySelector('.ai-chat-container');
        this.messagesContainer = document.querySelector('.ai-chat-messages');
        this.input = document.querySelector('.ai-chat-input input');
        this.sendButton = document.querySelector('.ai-chat-input button');
        this.toggleButton = document.querySelector('.ai-chat-toggle');
    }

    bindEvents() {
        if (!this.toggleButton || !this.container) {
            console.error('Chat elements not found');
            return;
        }

        this.toggleButton.addEventListener('click', () => {
            this.container.classList.toggle('hidden');
            this.toggleButton.style.display = 'none';
        });

        document.querySelector('#close-chat').addEventListener('click', () => {
            this.container.classList.add('hidden');
            this.toggleButton.style.display = 'flex';
        });

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.input.value = '';
        this.input.disabled = true;
        this.sendButton.disabled = true;

        try {
            const response = await this.chatService.sendMessage(message);
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('抱歉，发生了错误：' + (error.message || '请稍后重试'), 'error');
        } finally {
            this.input.disabled = false;
            this.sendButton.disabled = false;
            this.input.focus();
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = content;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// 确保在页面完全加载后初始化
window.addEventListener('load', () => {
    const chat = new AIChat();
    chat.init();

    // 绑定发送消息事件
    document.getElementById('sendButton').addEventListener('click', async () => {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (message) {
            try {
                input.value = '';
                await chat.sendMessage(message);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    });

    // 清理函数
    window.addEventListener('beforeunload', () => {
        chat.chatService.disconnect();
    });
}); 