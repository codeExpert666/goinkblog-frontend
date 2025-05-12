import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Card,
  Divider,
  Radio
} from 'antd';
import CategorySelect from '../category/CategorySelect';
import TagSelect from '../tag/TagSelect';
import {
  SaveOutlined,
  SendOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PictureOutlined
} from '@ant-design/icons';
import uploadArticleCover from '../../services/article';
import EnhancedMarkdownEditor from './EnhancedMarkdownEditor';
import AIAssistant from './AIAssistant';

const { TextArea } = Input;

const ArticleEditor = ({
  initialValues = {},
  onFinish,
  loading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [form] = Form.useForm();
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverUrl, setCoverUrl] = useState(initialValues.cover || '');
  const [status, setStatus] = useState(initialValues.status || 'draft');
  const [content, setContent] = useState(initialValues.content || '');

  // 移除 AI 助手可见性状态，因为现在由组件内部控制

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // 不设置content，因为它由EnhancedMarkdownEditor管理
        content: undefined
      });
      setCoverUrl(initialValues.cover || '');
      setStatus(initialValues.status || 'draft');
      setContent(initialValues.content || '');
    }
  }, [form, initialValues]);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    // 由于content由EnhancedMarkdownEditor组件管理，需要手动设置表单值
    form.setFieldsValue({ content: newContent });
  };

  const handleSubmit = (values) => {
    // 确保content被正确提交
    const formData = {
      ...values,
      content, // 使用state中的content值
      cover: coverUrl,
      status,
    };

    onFinish(formData);
  };

  const handleUploadCover = async (options) => {
    const { file } = options;
    const formData = new FormData();
    formData.append('cover', file);

    setCoverLoading(true);

    try {
      const response = await uploadArticleCover(formData);
      if (response.data && response.data.url) {
        setCoverUrl(response.data.url);
        message.success('封面上传成功');
      } else {
        message.error('封面上传失败');
      }
    } catch (error) {
      console.error('封面上传失败:', error);
      message.error('封面上传失败');
    } finally {
      setCoverLoading(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverUrl('');
  };

  // 移除 AI 助手可见性控制函数

  // 处理AI助手润色文章的回调
  const handlePolishedContent = (polishedContent) => {
    // 使用函数式更新来避免不必要的重复更新
    setContent(currentContent => {
      // 只有当内容真正变化时才更新表单
      if (currentContent !== polishedContent) {
        form.setFieldsValue({ content: polishedContent });
        return polishedContent;
      }
      return currentContent;
    });
  };

  // 处理AI助手生成摘要的回调
  const handleSummaryGenerated = (summary) => {
    form.setFieldsValue({ summary });
  };

  // AI助手组件内部已处理标签生成功能

  // 处理AI助手生成标题的回调
  const handleTitleSelected = (title) => {
    form.setFieldsValue({ title });
  };


  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...initialValues,
          // 不设置content初始值，由EnhancedMarkdownEditor管理
          content: undefined
        }}
      >
      <Card bordered={false}>
        <Form.Item
          name="title"
          label="文章标题"
          rules={[{ required: true, message: '请输入文章标题' }]}
        >
          <Input
            placeholder="请输入文章标题"
            size="large"
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item label="文章封面">
          <div style={{ display: 'flex', marginBottom: 16 }}>
            <Upload
              name="cover"
              listType="picture-card"
              showUploadList={false}
              customRequest={handleUploadCover}
              accept="image/*"
            >
              {coverUrl ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={coverUrl}
                    alt="文章封面"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{ padding: 8 }}>
                  {coverLoading ? <LoadingOutlined /> : <PictureOutlined />}
                  <div style={{ marginTop: 8 }}>上传封面</div>
                </div>
              )}
            </Upload>
            {coverUrl && (
              <Button
                style={{ marginLeft: 16 }}
                danger
                onClick={handleRemoveCover}
                icon={<DeleteOutlined />}
              >
                移除封面
              </Button>
            )}
          </div>
        </Form.Item>

        {/* 使用增强Markdown编辑器替代原来的TextArea */}
        <Form.Item
          name="content"
          label="文章内容"
          rules={[{ required: true, message: '请输入文章内容' }]}
          // 注意：虽然这里设置了name，但实际值由EnhancedMarkdownEditor组件管理
        >
          <EnhancedMarkdownEditor
            initialValue={content}
            onChange={handleContentChange}
            height={500}
            placeholder="请输入文章内容..."
            autoFocus
          />
        </Form.Item>

        {/* AI助手悬浮窗组件 - 移到表单内部，但与 Form.Item 平级 */}

        <Form.Item
          name="summary"
          label="文章摘要"
        >
          <TextArea
            placeholder="请输入文章摘要（如不填写，将自动提取文章内容前200字）"
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item name="category_id" label="文章分类">
          <CategorySelect placeholder="请选择文章分类" />
        </Form.Item>

        <Form.Item
          name="tag_ids"
          label="文章标签"
          extra="最多可添加6个标签，可以选择已有标签或输入创建新标签"
        >
          <TagSelect
            placeholder="请输入或选择标签"
            maxTagCount={6}
          />
        </Form.Item>

        <Divider />

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Radio.Group
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="draft">存为草稿</Radio.Button>
              <Radio.Button value="published">立即发布</Radio.Button>
            </Radio.Group>

            <Button
              type="primary"
              icon={status === 'draft' ? <SaveOutlined /> : <SendOutlined />}
              loading={loading}
              htmlType="submit"
            >
              {status === 'draft' ? '保存草稿' : '发布文章'}
            </Button>
          </div>
        </Form.Item>
      </Card>
      </Form>

      {/* AI助手悬浮窗组件 */}
      <AIAssistant
        articleContent={content}
        onPolish={handlePolishedContent}
        onSummaryGenerated={handleSummaryGenerated}
        onTitleSelected={handleTitleSelected}
        form={form}  // 传递表单引用
      />
    </>
  );
};

export default ArticleEditor;