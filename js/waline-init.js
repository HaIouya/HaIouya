document.addEventListener('DOMContentLoaded', function() {
  console.log('Waline初始化脚本已加载');
  
  // 如果页面上明确设置了不允许评论，则跳过初始化
  if (document.querySelector('meta[name="waline:disabled"]')) {
    console.log('页面禁用了评论功能');
    return;
  }
  
  // 1. 首先查找现有的评论容器
  let commentContainer = document.getElementById('waline-container');
  
  // 2. 如果没有找到评论容器，但页面需要评论，则创建一个
  if (!commentContainer) {
    // 判断是否是需要评论的页面类型
    const isCommentsPage = 
      // 测试页面总是需要评论
      window.location.pathname.includes('/comment/') || 
      // 检查是否有post类
      document.body.classList.contains('post') || 
      // 检查URL是否为文章格式
      window.location.pathname.match(/\/\d{4}\/\d{2}\/\d{2}\//) ||
      // 检查是否有文章内容区域
      document.querySelector('.post-content') !== null ||
      // 检查是否被显式标记为需要评论
      document.querySelector('meta[name="waline:enabled"]') !== null;
      
    console.log('是否为评论页面:', isCommentsPage);
    
    if (isCommentsPage) {
      // 寻找合适的容器来放置评论区
      const possibleContainers = [
        '.post-content', 
        'article', 
        '.article-container',
        '.card-widget',
        'main.layout',
        '#article-container',
        '.post'
      ];
      
      let articleContainer = null;
      for (const selector of possibleContainers) {
        articleContainer = document.querySelector(selector);
        if (articleContainer) {
          console.log('找到了合适的容器:', selector);
          break;
        }
      }
      
      if (articleContainer) {
        // 创建评论区标题
        const commentTitle = document.createElement('h2');
        commentTitle.className = 'comment-title';
        commentTitle.innerHTML = '<i class="fas fa-comments"></i> 评论区';
        articleContainer.appendChild(commentTitle);
        
        // 创建评论容器
        commentContainer = document.createElement('div');
        commentContainer.id = 'waline-container';
        articleContainer.appendChild(commentContainer);
        
        console.log('已自动创建评论容器');
      } else {
        console.error('找不到合适的容器来放置评论区，尝试添加到body');
        // 最后的尝试 - 添加到body末尾
        const container = document.createElement('div');
        container.className = 'waline-fallback-container';
        container.style.maxWidth = '800px';
        container.style.margin = '2rem auto';
        container.style.padding = '1rem';
        
        const commentTitle = document.createElement('h2');
        commentTitle.className = 'comment-title';
        commentTitle.innerHTML = '<i class="fas fa-comments"></i> 评论区';
        container.appendChild(commentTitle);
        
        commentContainer = document.createElement('div');
        commentContainer.id = 'waline-container';
        container.appendChild(commentContainer);
        
        document.body.appendChild(container);
        console.log('添加了备用评论容器到页面底部');
      }
    } else {
      console.log('当前页面不需要评论功能');
      return;
    }
  } else {
    console.log('页面上已存在评论容器');
  }
  
  // 初始化Waline前添加调试信息
  console.log('准备初始化Waline...');
  console.log('评论容器:', commentContainer);
  
  // 获取 Waline 服务端地址
  const serverURL = 'https://vercel-phi-dun.vercel.app/';
  
  try {
    // 初始化 Waline
    const walineInstance = Waline.init({
      el: '#waline-container',
      serverURL: serverURL,
      path: window.location.pathname,
      login: 'enable',
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick', 'mail'],
      lang: 'zh-CN',
      placeholder: '请留下您的评论~',
      avatar: 'monsterid',
      pageSize: 10,
      highlight: true,
      avatarForce: false,
      wordLimit: 200,
      pageview: true,
      comment: true,
      reaction: true,
      emoji: [
        'https://cdn.jsdelivr.net/gh/walinejs/emojis@1.0.0/weibo',
        'https://cdn.jsdelivr.net/gh/walinejs/emojis@1.0.0/bilibili'
      ],
      commentSorting: 'latest',
      dark: 'auto',
      search: false,
      texRenderer: false
    });
    
    console.log('Waline 评论系统已成功初始化');
    
    // 尝试更新评论计数
    if (typeof Waline.commentCount === 'function') {
      Waline.commentCount({
        serverURL: serverURL,
        path: window.location.pathname
      });
      console.log('评论计数功能已初始化');
    }
  } catch (error) {
    console.error('Waline 初始化失败:', error);
    
    // 显示错误信息给用户
    if (commentContainer) {
      commentContainer.innerHTML = `
        <div class="waline-error-notice" style="padding: 1rem; background: #ffebee; border-radius: 8px; color: #d32f2f;">
          <p><strong>评论加载失败</strong></p>
          <p>原因: ${error.message || '未知错误'}</p>
          <p>请刷新页面重试或联系网站管理员</p>
        </div>
      `;
    }
  }
});

// 为文章列表添加评论计数
function addCommentCount() {
  // 查找所有带有评论计数类的元素
  const countElements = document.querySelectorAll('.waline-comment-count');
  if (countElements.length === 0) {
    // 如果页面上没有评论计数元素，则尝试为文章标题或卡片添加
    const articleTitles = document.querySelectorAll('.article-title, .post-title, .post-header');
    
    articleTitles.forEach(title => {
      // 获取文章链接
      const linkElement = title.querySelector('a');
      if (linkElement) {
        const postUrl = linkElement.getAttribute('href');
        // 创建评论计数元素
        const countSpan = document.createElement('span');
        countSpan.className = 'waline-comment-count';
        countSpan.dataset.path = postUrl;
        // 添加评论图标
        countSpan.innerHTML = '<i class="fas fa-comment-dots"></i> <span>0</span>';
        title.appendChild(countSpan);
      }
    });
  }
  
  // 更新所有评论计数
  if (typeof Waline.commentCount === 'function') {
    Waline.commentCount({
      serverURL: 'https://vercel-2x5ytr7r7-haiouyas-projects.vercel.app/',
      path: window.location.pathname
    });
  }
} 