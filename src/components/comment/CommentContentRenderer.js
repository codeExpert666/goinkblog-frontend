import React from 'react';
import { marked } from 'marked';
import '../../styles/article/article-content.css';
import '../../styles/comment/commentSection.css';

// 配置marked选项
marked.setOptions({
  breaks: true, // 开启换行支持
  gfm: true,    // 开启GitHub风格Markdown
  sanitize: false, // 关闭默认的sanitize，使用DOMPurify
});

const CommentContentRenderer = ({ content = '' }) => {
  if (!content) {
    return null;
  }

  // 渲染Markdown内容
  const htmlContent = marked(content || '');

  return (
    <div
      className="comment-markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default CommentContentRenderer;