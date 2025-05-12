import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Tooltip,
  Upload,
  Modal,
  message,
  Input,
  Dropdown,
  Space,
  Divider,
  Radio
} from 'antd';
import {
  SendOutlined,
  EditOutlined,
  EyeOutlined,
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  LinkOutlined,
  PictureOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  TableOutlined,
  CodeOutlined,
  HighlightOutlined,
  UndoOutlined,
  RedoOutlined,
  FontSizeOutlined,
  BlockOutlined,
  CloudUploadOutlined,
  CheckOutlined,
  BarsOutlined,
  LineOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import uploadArticleCover from '../../services/article';
import EnhancedMarkdownHelper from './EnhancedMarkdownHelper';
import ArticleContentRenderer from './ArticleContentRenderer';

import '../../styles/article/enhancedMarkdownEditor.css';

const { TextArea } = Input;

// 编辑历史记录类
class EditHistory {
  constructor(initialContent = '') {
    this.history = [initialContent];
    this.currentIndex = 0;
  }

  // 添加新的编辑记录
  addEdit(content) {
    // 如果当前不在最后，则删除当前之后的所有记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 如果内容与当前内容相同，则不添加
    if (content === this.getCurrentContent()) {
      return;
    }

    this.history.push(content);
    this.currentIndex = this.history.length - 1;

    // 限制历史记录长度，避免内存占用过大
    if (this.history.length > 50) {
      this.history = this.history.slice(this.history.length - 50);
      this.currentIndex = this.history.length - 1;
    }
  }

  // 获取当前内容
  getCurrentContent() {
    return this.history[this.currentIndex];
  }

  // 撤销
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentContent();
    }
    return null;
  }

  // 重做
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.getCurrentContent();
    }
    return null;
  }

  // 检查是否可以撤销
  canUndo() {
    return this.currentIndex > 0;
  }

  // 检查是否可以重做
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

// 增强的Markdown编辑器组件
const EnhancedMarkdownEditor = ({
  initialValue = '',
  onChange,
  height = 500,
  placeholder = '请输入文章内容...',
  autoFocus = false,
  onSave = null
}) => {
  // 状态
  const [content, setContent] = useState(initialValue);
  const [activeView, setActiveView] = useState('edit'); // 'edit', 'preview', or 'split'
  const [editHistory] = useState(new EditHistory(initialValue));
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [codeBlockModalVisible, setCodeBlockModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeaders, setTableHeaders] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs
  const textAreaRef = useRef(null);
  const editorContainerRef = useRef(null);
  const originalStyles = useRef(null);

  // 初始值变化时更新内容
  useEffect(() => {
    // 仅在组件初始化或initialValue由外部明确改变时更新，
    // 而不是响应内部content变化导致的initialValue变化
    if (initialValue !== prevInitialValueRef.current) {
      setContent(initialValue);
      editHistory.addEdit(initialValue);
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, editHistory]);

  // 使用ref跟踪上一次的initialValue值
  const prevInitialValueRef = useRef(initialValue);

  // 当内容变化时，触发onChange回调
  useEffect(() => {
    if (onChange && content !== prevContentRef.current) {
      onChange(content);
      prevContentRef.current = content;
    }
  }, [content, onChange, editHistory]);

  // 使用ref跟踪上一次的content值
  const prevContentRef = useRef(content);

  // 切换全屏模式 - 使用useCallback避免每次渲染都创建新函数
  // 定义在useEffect之前，避免"在定义前使用"的警告
  const toggleFullscreen = React.useCallback(() => {
    const container = editorContainerRef.current;

    // 如果容器元素不存在，直接返回
    if (!container) {
      console.warn('Editor container element not found');
      return;
    }

    // 使用CSS类来切换全屏模式，而不是直接操作style
    if (!fullscreen) {
      // 进入全屏模式

      // 记录原始滚动位置和样式
      originalStyles.current = {
        scrollTop: window.scrollY,
        overflow: document.body.style.overflow,
        height: height // 记录原始高度设置
      };

      // 防止页面滚动
      document.body.style.overflow = 'hidden';

      // 添加全屏类
      container.classList.add('fullscreen');

      setFullscreen(true);
    } else {
      // 退出全屏模式

      // 在移除全屏前，先锁定高度，防止闪烁
      const editorContent = container.querySelector('.article-editor-content');
      const preview = container.querySelector('.article-preview');
      const splitView = container.querySelector('.article-split-view');
      const textArea = textAreaRef.current?.resizableTextArea?.textArea;

      // 保存当前高度并锁定
      const originalHeight = `${originalStyles.current?.height || height}px`;

      if (editorContent) editorContent.style.height = originalHeight;
      if (preview) preview.style.height = originalHeight;
      if (splitView) splitView.style.height = originalHeight;
      if (textArea) textArea.style.height = originalHeight;

      // 添加过渡类，设置 CSS 变量
      container.style.setProperty('--exit-height', originalHeight);
      container.classList.add('exiting-fullscreen');

      // 先移除全屏类，保持高度锁定
      container.classList.remove('fullscreen');

      // 在过渡完成后移除过渡类
      setTimeout(() => {
        container.classList.remove('exiting-fullscreen');
      }, 300); // 略大于 CSS 过渡时间

      // 恢复页面滚动
      if (originalStyles.current) {
        document.body.style.overflow = originalStyles.current.overflow || '';
        window.scrollTo(0, originalStyles.current.scrollTop || 0);
      }

      // 然后更新状态
      setFullscreen(false);
    }
  }, [fullscreen, height]);

  // 全屏模式处理
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && fullscreen) {
        toggleFullscreen();
      }
    };

    // 保存当前的editorContainerRef值，以便在清理函数中使用
    const containerRef = editorContainerRef.current;

    if (fullscreen) {
      document.addEventListener('keydown', handleEsc);
    } else {
      document.removeEventListener('keydown', handleEsc);
    }

    return () => {
      // 清理事件监听器
      document.removeEventListener('keydown', handleEsc);

      // 如果组件卸载时处于全屏状态，恢复正常状态
      if (fullscreen && containerRef) {
        containerRef.classList.remove('fullscreen');

        // 恢复页面滚动
        if (originalStyles.current) {
          document.body.style.overflow = originalStyles.current.overflow || '';
        }
      }
    };
  }, [fullscreen, toggleFullscreen]);

  // 保存编辑历史
  const saveHistory = (newContent) => {
    editHistory.addEdit(newContent);
  };

  // 内容变更处理
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // 定时保存历史，避免频繁保存
    debounceHistorySave(newContent);
  };

  // 防抖保存历史记录
  const debounceHistorySave = (() => {
    let timer = null;
    return (newContent) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        saveHistory(newContent);
      }, 1000);
    };
  })();

  // 撤销操作
  const handleUndo = () => {
    const prevContent = editHistory.undo();
    if (prevContent !== null) {
      setContent(prevContent);
    }
  };

  // 重做操作
  const handleRedo = () => {
    const nextContent = editHistory.redo();
    if (nextContent !== null) {
      setContent(nextContent);
    }
  };

  // 插入Markdown语法
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
    saveHistory(newContent);

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
        } else if (insertion.includes('\n\n')) {
          // 对于代码块等，将光标放在中间
          newCursorPos = start + insertion.indexOf('\n') + 1;
        } else {
          // 否则，将光标放在插入内容的末尾
          newCursorPos = start + insertion.length;
        }
      }
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // 处理图片上传
  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();

    // 修改表单字段名称，使用'cover'而不是'image'
    formData.append('cover', file);

    setUploading(true);

    try {
      const response = await uploadArticleCover(formData);

      if (response.data && response.data.url) {
        // 获取完整的URL
        const fullUrl = response.data.url;

        // 插入图片Markdown
        const imageMarkdown = `![${file.name}](${fullUrl})`;
        insertMarkdown(imageMarkdown, '');
        onSuccess(response, file);
        message.success('图片上传成功');
      } else {
        message.error('图片上传失败');
        onError(new Error('上传失败'));
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败: ' + (error.message || '未知错误'));
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  // 显示图片插入模态框
  const showImageModal = () => {
    setImageUrl('');
    setImageAlt('');
    setImageModalVisible(true);
  };

  // 处理图片URL插入
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) {
      message.warning('请输入图片URL');
      return;
    }

    // 检查URL格式是否有效
    let finalUrl = imageUrl.trim();
    try {
      // 尝试创建URL对象，如果成功，说明URL格式有效
      new URL(finalUrl);
    } catch (e) {
      // 如果URL无效，检查是否是相对路径
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        message.warning('请输入有效的图片URL，应以http://或https://开头');
        return;
      }
    }

    const imageMarkdown = `![${imageAlt || '图片'}](${finalUrl})`;
    insertMarkdown(imageMarkdown, '');
    setImageModalVisible(false);
  };

  // 显示表格插入模态框
  const showTableModal = () => {
    setTableRows(3);
    setTableCols(3);
    setTableHeaders(true);
    setTableModalVisible(true);
  };

  // 显示代码块语言选择模态框
  const showCodeBlockModal = () => {
    setSelectedLanguage('javascript'); // 默认选择 JavaScript
    setCodeBlockModalVisible(true);
  };

  // 处理代码块插入
  const handleInsertCodeBlock = () => {
    const codeBlockMarkdown = (text) => {
      // 如果已经有内容，将其放入代码块中
      if(text) {
        return `\`\`\`${selectedLanguage}\n${text}\n\`\`\``;
      } else {
        // 否则创建一个带有语言标记的空代码块并将光标放在中间
        return `\`\`\`${selectedLanguage}\n\n\`\`\``;
      }
    };

    insertMarkdown(codeBlockMarkdown, '');
    setCodeBlockModalVisible(false);
  };

  // 创建表格Markdown
  const createTableMarkdown = () => {
    let tableMarkdown = '';

    // 创建表头
    if (tableHeaders) {
      tableMarkdown += '|';
      for (let i = 0; i < tableCols; i++) {
        tableMarkdown += ` 表头 ${i + 1} |`;
      }
      tableMarkdown += '\n|';

      // 分隔行
      for (let i = 0; i < tableCols; i++) {
        tableMarkdown += ' --- |';
      }
      tableMarkdown += '\n';
    }

    // 创建数据行
    for (let i = 0; i < tableRows; i++) {
      tableMarkdown += '|';
      for (let j = 0; j < tableCols; j++) {
        tableMarkdown += ` 单元格 |`;
      }
      tableMarkdown += '\n';
    }

    return tableMarkdown;
  };

  // 处理表格插入
  const handleInsertTable = () => {
    const tableMarkdown = createTableMarkdown();
    insertMarkdown(tableMarkdown, '');
    setTableModalVisible(false);
  };

  // 处理保存操作
  const handleSave = async () => {
    if (!content.trim()) {
      message.warning('文章内容不能为空');
      return;
    }

    if (onSave) {
      setSaving(true);
      try {
        await onSave(content);
        message.success('保存成功');
      } catch (error) {
        console.error('保存失败:', error);
        message.error('保存失败，请稍后再试');
      } finally {
        setSaving(false);
      }
    }
  };

  // 标题下拉菜单
  const headingMenu = {
    items: [
      { key: '1', label: '一级标题' },
      { key: '2', label: '二级标题' },
      { key: '3', label: '三级标题' },
      { key: '4', label: '四级标题' },
      { key: '5', label: '五级标题' },
      { key: '6', label: '六级标题' },
    ],
    onClick: ({ key }) => {
      const level = parseInt(key);
      const headingMarks = '#'.repeat(level);
      insertMarkdown(`${headingMarks} $1`, '标题');
    }
  };

  // 渲染 Markdown 工具栏
  const renderMarkdownToolbar = () => {
    return (
      <div className="article-markdown-toolbar">
        <div className="article-markdown-toolbar-left">
          <Tooltip title="撤销">
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={!editHistory.canUndo()}
            />
          </Tooltip>

          <Tooltip title="重做">
            <Button
              type="text"
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={!editHistory.canRedo()}
            />
          </Tooltip>

          <Dropdown menu={headingMenu} trigger={['click']}>
            <Button
              type="text"
              icon={<FontSizeOutlined />}
            />
          </Dropdown>

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

          <Tooltip title="删除线">
            <Button
              type="text"
              icon={<StrikethroughOutlined />}
              onClick={() => insertMarkdown('~~$1~~', '删除线文字')}
            />
          </Tooltip>

          <Tooltip title="链接">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => insertMarkdown('[$1](链接地址)', '链接文字')}
            />
          </Tooltip>

          <Tooltip title="图片">
            <Button
              type="text"
              icon={<PictureOutlined />}
              onClick={showImageModal}
            />
          </Tooltip>

          <Tooltip title="上传图片">
            <Upload
              customRequest={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button
                type="text"
                icon={<CloudUploadOutlined />}
                loading={uploading}
              />
            </Upload>
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

          <Tooltip title="任务列表">
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={() => insertMarkdown('- [ ] $1', '任务项')}
            />
          </Tooltip>

          <Tooltip title="引用">
            <Button
              type="text"
              icon={<BlockOutlined />}
              onClick={() => insertMarkdown('> $1', '引用文字')}
            />
          </Tooltip>

          <Tooltip title="表格">
            <Button
              type="text"
              icon={<TableOutlined />}
              onClick={showTableModal}
            />
          </Tooltip>

          <Tooltip title="水平分割线">
            <Button
              type="text"
              icon={<LineOutlined />}
              onClick={() => insertMarkdown('\n---\n', '')}
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
              onClick={() => showCodeBlockModal()}
            />
          </Tooltip>
        </div>

        <div className="article-markdown-toolbar-right">
          {/* 视图切换按钮 */}
          <Space>
            <Tooltip title="编辑模式">
              <Button
                type={activeView === 'edit' ? 'primary' : 'text'}
                icon={<EditOutlined />}
                onClick={() => setActiveView('edit')}
              >
                编辑
              </Button>
            </Tooltip>

            <Tooltip title="预览模式">
              <Button
                type={activeView === 'preview' ? 'primary' : 'text'}
                icon={<EyeOutlined />}
                onClick={() => setActiveView('preview')}
              >
                预览
              </Button>
            </Tooltip>

            <Tooltip title="分屏模式">
              <Button
                type={activeView === 'split' ? 'primary' : 'text'}
                icon={<BarsOutlined />}
                onClick={() => setActiveView('split')}
              >
                分屏
              </Button>
            </Tooltip>

            <Divider type="vertical" />

            {/* Markdown帮助按钮 */}
            <EnhancedMarkdownHelper />

            <Tooltip title={fullscreen ? '退出全屏' : '全屏编辑'}>
              <Button
                type="text"
                icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    );
  };

  // 渲染编辑器内容
  const renderEditorContent = () => {
    switch (activeView) {
      case 'preview':
        return (
          <div className="article-preview" style={{ height: `${height}px` }}>
            {content ? (
              <ArticleContentRenderer content={content} />
            ) : (
              <div className="empty-preview">预览区域为空，请在编辑区域输入内容</div>
            )}
          </div>
        );
      case 'split':
        return (
          <div className="article-split-view" style={{ height: fullscreen ? '100%' : `${height}px` }}>
            <div className="article-split-editor">
              <TextArea
                ref={textAreaRef}
                className="article-textarea"
                value={content}
                onChange={handleContentChange}
                placeholder={placeholder}
                autoSize={false}
                style={{
                  height: '100%',
                  resize: 'none',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div className="article-split-preview">
              {content ? (
                <ArticleContentRenderer content={content} />
              ) : (
                <div className="empty-preview">预览区域为空，请在编辑区域输入内容</div>
              )}
            </div>
          </div>
        );
      case 'edit':
      default:
        return (
          <TextArea
            className="article-textarea"
            ref={textAreaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            autoSize={false}
            style={{
              height: `${height}px`,
              resize: 'none',
              padding: '12px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'monospace'
            }}
            autoFocus={autoFocus}
          />
        );
    }
  };

  return (
    <div className="article-editor" ref={editorContainerRef}>
      {/* 工具栏独立放置 */}
      <div className="article-markdown-toolbar-container">
        {renderMarkdownToolbar()}
      </div>

      {/* 编辑器内容区域 */}
      <div className="article-editor-content-container">
        <div className="article-editor-content">
          {renderEditorContent()}
        </div>
      </div>

      {onSave && (
        <div className="article-editor-actions">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!content.trim()}
          >
            保存文章内容
          </Button>
        </div>
      )}

      {/* 图片URL插入模态框 */}
      <Modal
        title="插入图片链接"
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        onOk={handleInsertImageUrl}
        okText="插入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="图片URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Input
            placeholder="图片描述（可选）"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
        </div>
      </Modal>

      {/* 表格插入模态框 */}
      <Modal
        title="插入表格"
        open={tableModalVisible}
        onCancel={() => setTableModalVisible(false)}
        onOk={handleInsertTable}
        okText="插入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>行数:</span>
            <Input
              type="number"
              value={tableRows}
              onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
              style={{ width: 100 }}
              min={1}
              max={20}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>列数:</span>
            <Input
              type="number"
              value={tableCols}
              onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
              style={{ width: 100 }}
              min={1}
              max={10}
            />
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={tableHeaders}
                onChange={(e) => setTableHeaders(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>包含表头</span>
            </label>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div>预览:</div>
          <div style={{
            border: '1px solid #d9d9d9',
            padding: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            marginTop: '8px'
          }}>
            {createTableMarkdown()}
          </div>
        </div>
      </Modal>

      {/* 代码块语言选择模态框 */}
      <Modal
        title="选择代码块语言"
        open={codeBlockModalVisible}
        onCancel={() => setCodeBlockModalVisible(false)}
        onOk={handleInsertCodeBlock}
        okText="插入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <Radio value="javascript">JavaScript</Radio>
            <Radio value="typescript">TypeScript</Radio>
            <Radio value="html">HTML</Radio>
            <Radio value="css">CSS</Radio>
            <Radio value="java">Java</Radio>
            <Radio value="python">Python</Radio>
            <Radio value="go">Go</Radio>
            <Radio value="php">PHP</Radio>
            <Radio value="c">C</Radio>
            <Radio value="cpp">C++</Radio>
            <Radio value="csharp">C#</Radio>
            <Radio value="ruby">Ruby</Radio>
            <Radio value="swift">Swift</Radio>
            <Radio value="kotlin">Kotlin</Radio>
            <Radio value="rust">Rust</Radio>
            <Radio value="sql">SQL</Radio>
            <Radio value="bash">Bash</Radio>
            <Radio value="json">JSON</Radio>
            <Radio value="yaml">YAML</Radio>
            <Radio value="markdown">Markdown</Radio>
            <Radio value="plaintext">纯文本</Radio>
          </Radio.Group>
        </div>
        <div style={{ marginTop: 16 }}>
          <div>预览:</div>
          <pre style={{
            border: '1px solid #d9d9d9',
            padding: '8px',
            maxHeight: '100px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            marginTop: '8px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
{`\`\`\`${selectedLanguage}
// 在此处输入代码
\`\`\``}
          </pre>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedMarkdownEditor;