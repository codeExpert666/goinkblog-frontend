import React, { useState, useContext, useRef } from 'react';
import { Input, Button, message, Tabs, Tooltip } from 'antd';
import {
  SendOutlined,
  EditOutlined,
  EyeOutlined,
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  HighlightOutlined
} from '@ant-design/icons';
import CommentContentRenderer from './CommentContentRenderer';
import MarkdownHelper from './MarkdownHelper';
import { AuthContext } from '../../store/authContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/comment/commentSection.css';

const { TextArea } = Input;

const CommentEditor = ({ articleId, parentId = null, onSuccess, onCancel, placeholder = '写下你的评论...' }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const textAreaRef = useRef(null);

  // Markdown 工具栏插入函数
  const insertMarkdown = (markdownTemplate, defaultText = '') => {
    // 简化插入逻辑，避免DOM操作
    // 获取当前选择的文本位置
    const textArea = textAreaRef.current?.resizableTextArea?.textArea;
    if (!textArea) {
      // 如果无法获取DOM元素，则简单地在末尾追加内容
      const insertion = typeof markdownTemplate === 'function'
        ? markdownTemplate(defaultText)
        : markdownTemplate.replace('$1', defaultText);
      setContent(content + insertion);
      return;
    }

    // 获取当前选择的文本，或使用默认值
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    // 构建要插入的文本
    let insertion = '';
    if (typeof markdownTemplate === 'function') {
      insertion = markdownTemplate(selectedText);
    } else {
      insertion = markdownTemplate.replace('$1', selectedText);
    }

    // 更新内容
    const newContent = content.substring(0, start) + insertion + content.substring(end);
    setContent(newContent);

    // 更新后重新聚焦并设置光标位置
    setTimeout(() => {
      textArea.focus();
      // 计算新的光标位置
      let newCursorPos;
      if (selectedText) {
        // 如果有选择文本，将光标放在插入文本的末尾
        newCursorPos = start + insertion.length;
      } else {
        // 如果没有选择文本，尝试将光标放在合适的位置
        // 例如，对于链接 [文本](URL)，将光标放在文本和URL之间
        if (insertion.includes('](')) {
          newCursorPos = start + insertion.indexOf('](') + 2;
        } else {
          // 否则，将光标放在插入内容的末尾
          newCursorPos = start + insertion.length;
        }
      }
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleSubmit = async () => {
    if (!user) {
      message.info('请先登录后再评论');
      navigate('/login');
      return;
    }

    if (!content.trim()) {
      message.warning('评论内容不能为空');
      return;
    }

    setSubmitting(true);

    try {
      // 此处应该调用评论创建API，由于我们将这部分逻辑移到了父组件中
      onSuccess && onSuccess(content);
      setContent('');
    } catch (error) {
      console.error('发表评论失败:', error);
      message.error('发表评论失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染 Markdown 工具栏
  const renderMarkdownToolbar = () => {
    return (
      <div className="comment-markdown-toolbar">
        <Tooltip title="加粗">
          <Button
            type="text"
            icon={<BoldOutlined />}
            onClick={() => insertMarkdown('**$1**', '粗体文字')}
          />
        </Tooltip>

        <Tooltip title="斜体">
          <Button
            type="text"
            icon={<ItalicOutlined />}
            onClick={() => insertMarkdown('*$1*', '斜体文字')}
          />
        </Tooltip>

        <Tooltip title="链接">
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => insertMarkdown('[$1](链接地址)', '链接文字')}
          />
        </Tooltip>

        <Tooltip title="无序列表">
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => insertMarkdown('- $1', '列表项')}
          />
        </Tooltip>

        <Tooltip title="有序列表">
          <Button
            type="text"
            icon={<OrderedListOutlined />}
            onClick={() => insertMarkdown('1. $1', '列表项')}
          />
        </Tooltip>

        <Tooltip title="行内代码">
          <Button
            type="text"
            icon={<HighlightOutlined />}
            onClick={() => insertMarkdown('`$1`', '代码')}
          />
        </Tooltip>

        <Tooltip title="代码块">
          <Button
            type="text"
            icon={<CodeOutlined />}
            onClick={() => insertMarkdown((text) => {
              // 如果已经有内容，将其放入代码块中
              if(text) {
                return '```\n' + text + '\n```';
              } else {
                // 否则创建一个带有语言标记的空代码块并将光标放在中间
                return '```javascript\n\n```';
              }
            }, '')}
          />
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="comment-editor">
      <div className="comment-editor-header">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="comment-tabs"
          items={[
            {
              key: 'edit',
              label: (
                <span>
                  <EditOutlined />
                  编辑
                </span>
              ),
              children: (
                <>
                  {renderMarkdownToolbar()}
                  <TextArea
                    className="comment-textarea"
                    ref={textAreaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    disabled={!user}
                  />
                </>
              )
            },
            {
              key: 'preview',
              label: (
                <span>
                  <EyeOutlined />
                  预览
                </span>
              ),
              children: (
                <div className="comment-preview">
                  {content ? (
                    <CommentContentRenderer content={content} />
                  ) : (
                    <div className="empty-preview">预览区域为空，请在编辑区域输入内容</div>
                  )}
                </div>
              )
            }
          ]}
        />
        <div className="markdown-helper">
          <MarkdownHelper />
        </div>
      </div>

      <div className="comment-editor-actions">
        <div style={{ width: '100%' }}>
          {user && (
            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#888', textAlign: 'right' }}>
              {user.role === 'admin' ?
                '管理员评论将直接显示' :
                '评论需要管理员审核后才会显示，可在头像下拉菜单中的"我的互动"-"我的评论"中查看审核状态'}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button
                style={{ marginRight: 8 }}
                onClick={onCancel}
              >
                取消
              </Button>
            )}
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!content.trim() || !user}
            >
              发表评论
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
