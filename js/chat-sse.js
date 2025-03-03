class ChatSSE {
    constructor() {
        this.API_URL = 'http://117.161.233.106:8000/v1/chat/completions?model=deepseek';
        this.eventSource = null;
        this.messageQueue = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryInterval = 2000; // 2秒
    }

    async connect() {
        try {
            
            // 创建 EventSource 连接
            this.eventSource = new EventSource('/api/chat-stream');
            
            this.eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                this.handleError();
            };

            this.eventSource.onopen = () => {
                console.log('SSE Connection established');
                this.retryCount = 0;
            };
        } catch (error) {
            console.error('Failed to establish SSE connection:', error);
            this.handleError();
        }
    }

    handleError() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying connection in ${this.retryInterval}ms... (Attempt ${this.retryCount})`);
            setTimeout(() => this.connect(), this.retryInterval);
        } else {
            console.error('Max retries reached. Please refresh the page.');
        }
    }

    async sendMessage(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    handleMessage(data) {
        // 处理接收到的消息
        if (data.type === 'message') {
            this.messageQueue.push(data);
            this.processMessageQueue();
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.displayMessage(message);
        }
    }

    displayMessage(message) {
        // 实现消息显示逻辑
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-${message.role === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="content">${marked.parse(message.content)}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
} 