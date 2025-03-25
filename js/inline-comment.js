// 内联评论加载脚本
(function() {
  // 立即在页面上创建评论占位符
  document.write(`
    <div class="waline-comment-section" style="margin-top: 3rem;">
      <h2 class="comment-title" style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold; border-left: 4px solid #6495ed; padding-left: 0.8rem;">
        <i class="fas fa-comments"></i> 评论区
      </h2>
      <div id="inline-waline-container" style="margin-top: 1.5rem; padding: 1.5rem; border-radius: 12px; background-color: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);"></div>
    </div>
  `);
  
  // 页面加载完成后初始化评论
  window.addEventListener('load', function() {
    const commentContainer = document.getElementById('inline-waline-container');
    if (!commentContainer) return;
    
    // 检查是否已加载 Waline
    if (typeof Waline === 'undefined') {
      console.log('正在加载 Waline...');
      loadWalineResources();
    } else {
      console.log('Waline 已加载，直接初始化');
      initInlineWaline();
    }
  });
  
  // 加载 Waline 资源
  function loadWalineResources() {
    // 加载 JS
    const script = document.createElement('script');
    script.src = '//cdn.jsdelivr.net/npm/@waline/client/dist/waline.js';
    script.onload = function() {
      console.log('Waline 脚本加载成功');
      
      // 加载 CSS
      if (!document.querySelector('link[href*="waline.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '//cdn.jsdelivr.net/npm/@waline/client/dist/waline.css';
        link.onload = function() {
          console.log('Waline CSS 加载成功');
          initInlineWaline();
        };
        document.head.appendChild(link);
      } else {
        initInlineWaline();
      }
    };
    script.onerror = function() {
      console.error('Waline 脚本加载失败');
      showError('评论系统加载失败，请刷新页面重试');
    };
    document.body.appendChild(script);
  }
  
  // 初始化内联评论
  function initInlineWaline() {
    const container = document.getElementById('inline-waline-container');
    if (!container) return;
    
    try {
      Waline.init({
        el: '#inline-waline-container',
        serverURL: 'https://vercel-phi-dun.vercel.app/',
        path: window.location.pathname,
        login: 'enable',
        meta: ['nick', 'mail', 'link'],
        requiredMeta: ['nick', 'mail'],
        lang: 'zh-CN',
        placeholder: '请留下您的评论~',
        avatar: 'monsterid',
        pageSize: 10,
        highlight: true
      });
      console.log('内联评论已初始化');
    } catch (error) {
      console.error('内联评论初始化失败:', error);
      showError(error.message || '评论系统初始化失败');
    }
  }
  
  // 显示错误信息
  function showError(message) {
    const container = document.getElementById('inline-waline-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 1rem; background: #ffebee; border-radius: 8px; color: #d32f2f; text-align: center;">
          <p><strong>评论加载失败</strong></p>
          <p>${message}</p>
          <button onclick="location.reload()" style="margin-top: 0.5rem; padding: 0.3rem 1rem; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  }
})(); 