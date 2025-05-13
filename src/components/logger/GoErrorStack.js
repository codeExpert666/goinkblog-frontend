import React from 'react';
import { message } from 'antd';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github.css';

// 注册一个简单的语法高亮规则用于 Golang 错误堆栈
hljs.registerLanguage('gostack', () => ({
  contains: [
    {
      // 错误消息
      className: 'error-message',
      begin: /^(panic:|error:|fatal:).*/,
      end: /$/,
      relevance: 10
    },
    {
      // Goroutine 信息
      className: 'goroutine-info',
      begin: /^goroutine \d+ \[\w+\]:/,
      end: /$/,
      relevance: 8
    },
    {
      // 函数调用
      className: 'function-call',
      begin: /^[^\s].*\.[^.]+\(.+\)/,
      end: /$/,
      relevance: 6
    },
    {
      // 文件路径
      className: 'file-path',
      begin: /^\s+\/.*:\d+/,
      end: /$/,
      relevance: 7
    },
    {
      // 行号和偏移量高亮
      className: 'line-number',
      begin: /:\d+( \+0x[0-9a-f]+)?/,
      relevance: 5
    },
    {
      // 创建时间高亮
      className: 'timestamp',
      begin: /\d{4}(\/|-)\d{2}(\/|-)\d{2} \d{2}:\d{2}:\d{2}/,
      relevance: 5
    }
  ]
}));

const GoErrorStack = ({ stackTrace }) => {
  // 高亮处理代码
  const highlightCode = (code) => {
    if (!code) return '';
    
    try {
      const highlighted = hljs.highlight(code, { language: 'gostack' }).value;
      return highlighted;
    } catch (error) {
      console.error('Failed to highlight:', error);
      return code;
    }
  };

  // 渲染代码行，为每一行添加行号
  const renderCodeWithLineNumbers = (lines) => {
    return (
      <table className="go-error-stack-code-table">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="go-error-stack-line">
              <td className="go-error-stack-line-number">{index + 1}</td>
              <td 
                className={`go-error-stack-line-content ${index === 0 ? 'go-error-stack-error-message' : ''}`}
                dangerouslySetInnerHTML={{ __html: highlightCode(line) }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 如果没有堆栈信息则显示提示
  if (!stackTrace) {
    return <div className="go-error-stack-empty">无错误堆栈信息</div>;
  }

  const lines = stackTrace.split('\n');

  return (
    <div className="go-error-stack-container">
      <div className="go-error-stack-code-container">
        {renderCodeWithLineNumbers(lines)}
      </div>
    </div>
  );
};

// 暴露一些方法供外部调用
GoErrorStack.utils = {
  // 复制堆栈的方法
  copyStackToClipboard: (stackTrace) => {
    if (stackTrace) {
      navigator.clipboard.writeText(stackTrace);
      message.success('已复制完整错误堆栈到剪贴板');
      return true;
    }
    return false;
  }
};

export default GoErrorStack;