class AIChatService {
    constructor() {
        this.API_URL = 'http://117.161.233.106:8000/v1/chat/completions?model=deepseek';
        this.chatHistory = []; // 添加对话历史数组
    }

    async sendMessage(message) {
        try {
            // 构建请求数据
            const requestData = {
                model: "llama3",
                stream: false,
                temperature: 0.1,
                top_p: 0.1,
                messages: [
                    {
                        role: "system",
                        content: "你是一个友善的AI助手，可以帮助回答用户关于编程、技术和其他问题。"
                    },
                    ...this.chatHistory, // 包含历史对话
                    {
                        role: "user",
                        content: message
                    }
                ]
            };

            console.log('Sending request:', requestData); // 调试日志

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // 调试日志

            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content;
                
                // 更新对话历史
                this.chatHistory.push(
                    { role: "user", content: message },
                    { role: "assistant", content: aiResponse }
                );
                
                // 保持历史记录在合理范围内
                if (this.chatHistory.length > 10) {
                    this.chatHistory = this.chatHistory.slice(-10);
                }
                
                return aiResponse;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }

    // 清除对话历史
    clearHistory() {
        this.chatHistory = [];
    }
}

// 初始化服务
document.addEventListener('DOMContentLoaded', () => {
    window.AIChatService = new AIChatService();
}); 