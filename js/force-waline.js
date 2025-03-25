// 强制加载 Waline 评论系统
(function() {
  console.log('强制加载 Waline 评论系统脚本执行中...');
  
  // 定义函数添加评论区域
  function addCommentArea() {
    // 判断当前页面类型
    const isPostPage = 
      document.body.classList.contains('post') || 
      window.location.pathname.match(/\/\d{4}\/\d{2}\/\d{2}\//) ||
      document.querySelector('.post-content') !== null;
      
    // 测试页面始终启用评论
    const isTestPage = window.location.pathname.includes('/comment/');
    
    // 如果不是文章页面或测试页面，不添加评论
    if (!isPostPage && !isTestPage) {
      console.log('当前页面不需要评论系统');
      return;
    }
    
    // 如果页面已有评论容器，不重复添加
    if (document.getElementById('waline-container')) {
      console.log('页面已存在评论容器');
      return;
    }
    
    console.log('准备添加评论容器...');
    
    // 查找可能的容器位置
    const containers = [
      document.querySelector('.post-content'),
      document.querySelector('article'),
      document.querySelector('.article-container'),
      document.querySelector('#article-container'),
      document.querySelector('main.layout'),
      document.querySelector('.post')
    ].filter(container => container !== null);
    
    if (containers.length > 0) {
      // 使用找到的第一个有效容器
      const targetContainer = containers[0];
      console.log('找到容器:', targetContainer);
      
      // 创建评论区域
      const commentSection = document.createElement('div');
      commentSection.className = 'waline-comment-section';
      commentSection.innerHTML = `
        <h2 class="comment-title"><i class="fas fa-comments"></i> 评论区</h2>
        <div id="waline-container"></div>
      `;
      
      // 添加到容器末尾
      targetContainer.appendChild(commentSection);
      console.log('已添加评论容器');
      
      // 初始化评论
      initWaline();
    } else {
      console.error('找不到合适的容器');
    }
  }
  
  // 初始化 Waline
  function initWaline() {
    // 检查 Waline 是否已加载
    if (typeof Waline === 'undefined') {
      console.log('Waline 未加载，尝试加载脚本...');
      
      // 加载 Waline 脚本
      const script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/@waline/client/dist/waline.js';
      script.onload = function() {
        console.log('Waline 脚本加载成功');
        loadWalineCss();
      };
      script.onerror = function() {
        console.error('Waline 脚本加载失败');
      };
      document.body.appendChild(script);
    } else {
      console.log('Waline 已加载，直接初始化');
      startWaline();
    }
  }
  
  // 加载 Waline CSS
  function loadWalineCss() {
    if (!document.querySelector('link[href*="waline.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '//cdn.jsdelivr.net/npm/@waline/client/dist/waline.css';
      link.onload = function() {
        console.log('Waline CSS 加载成功');
        startWaline();
      };
      document.head.appendChild(link);
    } else {
      startWaline();
    }
  }
  
  // 启动 Waline
  function startWaline() {
    if (document.getElementById('waline-container')) {
      console.log('初始化 Waline...');
      
      try {
        Waline.init({
          el: '#waline-container',
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
        console.log('Waline 评论系统初始化成功');
      } catch (error) {
        console.error('Waline 初始化失败:', error);
      }
    } else {
      console.error('评论容器不存在');
    }
  }
  
  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCommentArea);
  } else {
    addCommentArea();
  }
  
  // 为防止其他脚本冲突，延迟检查评论是否加载成功
  setTimeout(function() {
    const walineContainer = document.getElementById('waline-container');
    if (walineContainer && walineContainer.children.length === 0) {
      console.log('评论似乎未加载，尝试强制加载...');
      initWaline();
    }
  }, 3000);
})(); 