// 全局变量存储聊天历史
let chatHistory = [];

// 切换聊天界面显示/隐藏
function toggleChat() {
  const chatContainer = document.getElementById('chatContainer');
  chatContainer.classList.toggle('show');
}

// 自动调整输入框高度
const userInput = document.getElementById('userInput');
userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// 发送消息到 AI API
async function sendMessage() {
  const userInput = document.getElementById('userInput');
  const message = userInput.value.trim();
  
  if (!message) return;

  try {
    // 显示用户消息
    addMessage(message, 'user');
    userInput.value = '';

    // 直接请求 AI 服务 API
    const response = await fetch('http://117.161.233.106:8000/v1/chat/completions?model=deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3",
        stream: false,
        temperature: 0.1,
        top_p: 0.1,
        messages: [
          {
            role: "system",
            content: "你是一个友善的AI助手，可以帮助回答用户关于编程、技术和其他问题。"
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // 显示 AI 响应
      addMessage(data.choices[0].message.content, 'assistant');
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage('抱歉，我遇到了一些问题，请稍后再试。', 'error');
  }
}

// 显示 AI 正在输入的指示器
function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message assistant typing';
  typingDiv.id = 'typingIndicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  const icon = document.createElement('i');
  icon.className = 'fas fa-robot';
  avatar.appendChild(icon);
  
  const content = document.createElement('div');
  content.className = 'content typing-content';
  content.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(content);
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 隐藏 AI 正在输入的指示器
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// 添加消息到聊天界面
function addMessage(content, type) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  const icon = document.createElement('i');
  icon.className = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
  avatar.appendChild(icon);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  
  // 支持 markdown 和代码高亮
  if (type === 'assistant') {
    contentDiv.innerHTML = marked.parse(content);
    // 代码高亮
    contentDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });
  } else {
    contentDiv.textContent = content;
  }
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 按回车发送消息
document.getElementById('userInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}); 