document.addEventListener('DOMContentLoaded', function() {
  console.log('直接加载评论组件启动');
  
  // 创建评论容器
  const walineContainer = document.createElement('div');
  walineContainer.className = 'waline-direct-container';
  walineContainer.style.cssText = 'max-width: 800px; margin: 3rem auto; padding: 0 1rem;';
  
  walineContainer.innerHTML = `
    <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold; border-left: 4px solid #6495ed; padding-left: 0.8rem;">
      <i class="fas fa-comments"></i> 评论区
    </h2>
    <div id="direct-waline" style="padding: 1.5rem; border-radius: 12px; background-color: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);"></div>
  `;
  
  // 添加到页面
  const targetContainer = document.querySelector('.post-content') || 
                         document.querySelector('article') || 
                         document.querySelector('.article-container') ||
                         document.querySelector('main.layout') ||
                         document.querySelector('main') ||
                         document.body;
                         
  if (targetContainer) {
    targetContainer.appendChild(walineContainer);
    console.log('评论容器已添加到页面');
    
    // 初始化评论
    if (typeof Waline !== 'undefined') {
      initDirectWaline();
    } else {
      console.log('Waline 未加载，正在加载脚本...');
      loadWalineScript();
    }
  }
  
  // 加载 Waline 脚本
  function loadWalineScript() {
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
          initDirectWaline();
        };
        document.head.appendChild(link);
      } else {
        initDirectWaline();
      }
    };
    document.body.appendChild(script);
  }
  
  // 初始化评论
  function initDirectWaline() {
    if (!document.getElementById('direct-waline')) {
      console.error('找不到评论容器');
      return;
    }
    
    try {
      Waline.init({
        el: '#direct-waline',
        serverURL: 'https://vercel-phi-dun.vercel.app/',
        path: window.location.pathname,
        lang: 'zh-CN',
        login: 'enable',
        meta: ['nick', 'mail', 'link'],
        requiredMeta: ['nick', 'mail'],
        placeholder: '请留下您的评论~',
        avatar: 'monsterid',
        pageSize: 10,
        highlight: true
      });
      console.log('直接评论组件初始化成功');
    } catch (error) {
      console.error('评论组件初始化失败:', error);
      document.getElementById('direct-waline').innerHTML = `
        <div style="padding: 1rem; background: #ffebee; border-radius: 8px; color: #d32f2f; text-align: center;">
          <p><strong>评论加载失败</strong></p>
          <p>${error.message || '未知错误'}</p>
          <button onclick="location.reload()" style="margin-top: 0.5rem; padding: 0.3rem 1rem; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  }
}); 