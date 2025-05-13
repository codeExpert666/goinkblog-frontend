import React, { useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
// 直接引入一个明显的高对比度样式，确保效果可见
import 'highlight.js/styles/atom-one-dark.css';
import '../../styles/article/article-content.css';
import '../../styles/article/code-highlight.css';

// 禁用hljs自动检测，强制指定语言
hljs.configure({
  languages: ['javascript', 'html', 'css', 'python', 'java', 'go', 'bash', 'json', 'typescript', 'php', 'c', 'cpp'],
  classPrefix: 'hljs-'  // 确保类前缀一致
});

// 注册 DOMPurify 钩子，确保高亮类名被保留
DOMPurify.addHook('afterSanitizeAttributes', function(node) {
  // 不需要做任何操作，DOMPurify 已经保留了类名
});

// 配置marked选项，保证与最新版本兼容
const markedOptions = {
  breaks: true,        // 开启换行支持
  gfm: true,           // 开启GitHub风格Markdown
  headerIds: true,     // 自动为标题添加ID
  mangle: false,       // 不转义HTML标签中的引号
  sanitize: false,     // 关闭默认的sanitize，使用DOMPurify
  highlight: function(code, lang) {
    if (!lang || lang === '') {
      lang = 'plaintext';
    }

    try {
      // 确保语言参数有效
      if (hljs.getLanguage(lang)) {
        const result = hljs.highlight(code, { language: lang }).value;
        return result;
      } else {
        // 如果语言不支持，使用自动检测
        return hljs.highlightAuto(code).value;
      }
    } catch (e) {
      console.error('Code highlighting error:', e);
      // 如果高亮失败，返回未处理的代码
      return code;
    }
  },
  langPrefix: 'language-', // 使用简单的前缀避免冲突
};

marked.setOptions(markedOptions);

// 配置自定义渲染器
const renderer = new marked.Renderer();

// 为标题添加锚点
renderer.heading = function(text, level) {
  const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  return `
    <h${level} id="${escapedText}" class="article-heading">
      <a class="anchor" href="#${escapedText}">
        <span class="header-link"></span>
      </a>
      ${text}
    </h${level}>
  `;
};

// 为图片添加响应式处理
renderer.image = function(href, title, text) {
  return `
    <figure class="article-image">
      <img src="${href}" alt="${text}" ${title ? `title="${title}"` : ''} loading="lazy" />
      ${title ? `<figcaption>${title}</figcaption>` : ''}
    </figure>
  `;
};

// 为表格添加容器
renderer.table = function(header, body) {
  return `
    <div class="article-table-container">
      <table class="article-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
};

// 设置渲染器
marked.use({ renderer });

const ArticleContentRenderer = ({ content = '', onRendered = null }) => {
  useEffect(() => {
    // 实现图片点击放大功能
    const setupImageZoom = () => {
      const articleImages = document.querySelectorAll('.article-markdown-content img');

      articleImages.forEach(img => {
        img.addEventListener('click', function() {
          // 创建模态框
          const modal = document.createElement('div');
          modal.className = 'article-image-modal';
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100vw';
          modal.style.height = '100vh';
          modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          modal.style.display = 'flex';
          modal.style.justifyContent = 'center';
          modal.style.alignItems = 'center';
          modal.style.zIndex = '9999';

          // 创建大图
          const enlargedImg = document.createElement('img');
          enlargedImg.src = this.src;
          enlargedImg.style.maxWidth = '90%';
          enlargedImg.style.maxHeight = '90%';
          enlargedImg.style.objectFit = 'contain';

          // 添加关闭事件
          modal.addEventListener('click', function() {
            document.body.removeChild(modal);
          });

          modal.appendChild(enlargedImg);
          document.body.appendChild(modal);
        });

        // 添加可点击提示
        img.style.cursor = 'zoom-in';
      });
    };

    // 实现代码块功能和手动触发代码高亮
    const setupCodeHighlight = () => {
      const codeBlocks = document.querySelectorAll('.article-markdown-content pre code');

      // 直接调用 hljs 手动高亮所有代码块
      const applyManualHighlight = () => {
        if (codeBlocks.length === 0) {
          return;
        }

        codeBlocks.forEach((codeBlock, index) => {
          // 确保代码块有正确的类
          codeBlock.classList.add('hljs');

          // 获取语言类
          let language = '';
          for (let cls of codeBlock.classList) {
            if (cls.startsWith('language-')) {
              language = cls.replace('language-', '');
              break;
            }
          }

          // 强制重新应用高亮
          try {
            const originalCode = codeBlock.textContent || '';
            // 如果没有内容，跳过
            if (!originalCode.trim()) {
              return;
            }

            let result;
            if (language && hljs.getLanguage(language)) {
              // 使用指定语言
              result = hljs.highlight(originalCode, { language }).value;
            } else {
              // 自动检测语言
              result = hljs.highlightAuto(originalCode).value;
            }

            // 强制更新代码块内容
            codeBlock.innerHTML = result;

            // 为父元素添加语言标识类以便样式应用
            const preElement = codeBlock.parentElement;
            if (preElement && language) {
              preElement.classList.add(`language-${language}`);
            }
          } catch (e) {
            console.error('Manual code highlighting failed:', e);
          }
        });

        // 尝试修复样式问题
        document.querySelectorAll('pre .hljs').forEach(el => {
          // 确保内部元素能够继承样式
          el.style.backgroundColor = 'inherit';
          el.style.padding = '0';
        });
      };

      // 立即应用高亮，然后延迟再次应用以确保成功
      applyManualHighlight();
      setTimeout(applyManualHighlight, 500);

      codeBlocks.forEach(codeBlock => {
        // 添加复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.textContent = '复制';
        copyButton.style.position = 'absolute';
        copyButton.style.top = '5px';
        copyButton.style.right = '5px';
        copyButton.style.padding = '4px 8px';
        copyButton.style.fontSize = '12px';
        copyButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        copyButton.style.color = '#ddd';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '4px';
        copyButton.style.cursor = 'pointer';

        copyButton.addEventListener('click', function(e) {
          e.stopPropagation();

          const code = codeBlock.textContent;
          navigator.clipboard.writeText(code).then(
            () => {
              // 更改按钮文本表示复制成功
              copyButton.textContent = '已复制';
              setTimeout(() => {
                copyButton.textContent = '复制';
              }, 2000);
            },
            () => {
              copyButton.textContent = '复制失败';
              setTimeout(() => {
                copyButton.textContent = '复制';
              }, 2000);
            }
          );
        });

        // 将代码块父元素设置为相对定位
        const preElement = codeBlock.parentElement;
        if (preElement) {
          preElement.style.position = 'relative';
          preElement.appendChild(copyButton);
        }

        // 添加语言标签
        let language = '';
        for (let cls of codeBlock.classList) {
          if (cls.startsWith('language-')) {
            language = cls.replace('language-', '');
            break;
          }
        }

        if (language && language !== 'plaintext') {
          const languageLabel = document.createElement('div');
          languageLabel.className = 'code-language-label';
          languageLabel.textContent = language;
          languageLabel.style.position = 'absolute';
          languageLabel.style.top = '5px';
          languageLabel.style.left = '5px';
          languageLabel.style.padding = '2px 5px';
          languageLabel.style.fontSize = '12px';
          languageLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          languageLabel.style.color = '#ddd';
          languageLabel.style.borderRadius = '3px';

          if (preElement) {
            preElement.appendChild(languageLabel);
          }
        }
      });
    };

    // 生成目录
    const generateTOC = () => {
      const headings = Array.from(document.querySelectorAll('.article-markdown-content h1, .article-markdown-content h2, .article-markdown-content h3'));

      if (headings.length > 0 && typeof onRendered === 'function') {
        const toc = headings.map(heading => {
          const id = heading.id;
          const text = heading.textContent;
          const level = parseInt(heading.tagName[1]);

          return { id, text, level };
        });

        onRendered(toc);
      }
    };

    // 运行增强功能
    if (content) {
      setTimeout(() => {
        setupImageZoom();
        setupCodeHighlight();
        generateTOC();
      }, 0);
    }
  }, [content, onRendered]);

  // 安全渲染Markdown内容
  const renderMarkdown = () => {
    if (!content) return '';

    // 先使用marked处理Markdown
    const htmlContent = marked(content);

    // 配置 DOMPurify，确保保留代码高亮相关的类名和属性
    const purifyConfig = {
      ADD_ATTR: ['target', 'class', 'style'],
      ADD_TAGS: ['iframe', 'pre', 'code', 'span'],
      FORBID_TAGS: ['script'],
      FORBID_ATTR: ['onerror', 'onclick'],
      ALLOW_DATA_ATTR: true,
      USE_PROFILES: {
        html: true,
        svg: false,
        svgFilters: false
      },
      KEEP_CONTENT: true
    };

    // 使用DOMPurify净化HTML，防止XSS攻击
    const sanitizedHtml = DOMPurify.sanitize(htmlContent, purifyConfig);

    return sanitizedHtml;
  };

  return (
    <div
      className="article-markdown-content"
      dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
    />
  );
};

export default ArticleContentRenderer;
