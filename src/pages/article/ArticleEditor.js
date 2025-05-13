import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb, message, Spin } from 'antd';
import { HomeOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons';
import {
  getArticleById,
  createArticle,
  updateArticle
} from '../../services/article';
import ArticleEditorComponent from '../../components/article/ArticleEditor';

const { Title } = Typography;

const ArticleEditorPage = () => {
  const { id } = useParams(); // 如果存在id，则为编辑模式，否则为创建模式
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // 获取文章详情
  const fetchArticleDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getArticleById(id);

      if (response.data) {
        // 确保标签数据正确映射到tag_ids字段
        const articleData = response.data;
        if (articleData.tags && Array.isArray(articleData.tags)) {
          articleData.tag_ids = articleData.tags;
        }
        setArticle(articleData);
      } else {
        message.error('文章不存在');
        navigate('/articles');
      }
    } catch (error) {
      console.error('Failed to get article details:', error);
      message.error('获取文章详情失败');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditMode) {
      fetchArticleDetail();
    }
  }, [isEditMode, fetchArticleDetail]);

  // 处理创建或更新文章
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 判断是草稿还是已发布文章
      const isDraft = values.status === 'draft';

      if (isEditMode) {
        // 更新文章
        await updateArticle(id, values);
        message.success(isDraft ? '草稿保存成功' : '文章更新成功');

        // 根据状态决定跳转
        if (isDraft) {
          // 如果是草稿，跳转到草稿箱
          navigate('/profile?tab=draft');
        } else {
          // 如果是发布状态，跳转到文章详情
          navigate(`/articles/${id}`);
        }
      } else {
        // 创建文章
        const response = await createArticle(values);
        const newArticleId = response.data.id;
        message.success(isDraft ? '草稿保存成功' : '文章发布成功');

        // 根据状态决定跳转
        if (isDraft) {
          // 如果是草稿，跳转到草稿箱
          navigate('/profile?tab=draft');
        } else {
          // 如果是发布状态，跳转到文章详情
          navigate(`/articles/${newArticleId}`);
        }
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      message.error('保存文章失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="article-editor-page">
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
          <span>首页</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/articles">
          <span>文章列表</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEditMode ? <EditOutlined /> : <FileAddOutlined />}
          <span>{isEditMode ? '编辑文章' : '创建文章'}</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* 标题 */}
      <Title level={3}>
        {isEditMode ? '编辑文章' : '创建文章'}
      </Title>

      {/* 编辑器 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <ArticleEditorComponent
          initialValues={article || {}}
          onFinish={handleSubmit}
          loading={submitting}
          mode={isEditMode ? 'edit' : 'create'}
        />
      )}
    </div>
  );
};

export default ArticleEditorPage;
