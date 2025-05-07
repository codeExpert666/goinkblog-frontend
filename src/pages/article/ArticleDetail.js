import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Space,
  Divider,
  Button,
  message,
  Skeleton,
  Card,
  Typography,
  Row,
  Col,
  Modal,
  Avatar
} from 'antd';
import CategoryTag from '../../components/category/CategoryTag';
import TagDisplay from '../../components/tag/TagDisplay';
import CommentSection from '../../components/comment/CommentSection';
import ArticleContentRenderer from '../../components/article/ArticleContentRenderer';
import '../../styles/tag/tagStyles.css';
import '../../styles/article/article-content.css';

import {
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  TagOutlined
} from '@ant-design/icons';
import {
  getArticleById,
  toggleLikeArticle,
  toggleFavoriteArticle,
  deleteArticle,
  getFullCoverUrl,
  unpublishArticle
} from '../../services/article';
import { getFullAvatarUrl } from '../../services/auth';
import { AuthContext } from '../../store/authContext';


const { Title, Text } = Typography;
const { confirm } = Modal;

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  // 移除不必要的contentRendered状态
  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    like: false,
    favorite: false,
    delete: false,
    unpublish: false,
  });

  // 获取文章详情
  const fetchArticleDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getArticleById(id);

      if (response.data) {
        setArticle(response.data);
      } else {
        message.error('文章不存在');
        navigate('/articles');
      }
    } catch (error) {
      console.error('获取文章详情失败:', error);
      message.error('获取文章详情失败');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchArticleDetail();
    }
  }, [id, fetchArticleDetail]);

  // 当文章内容变化时，重置Markdown加载状态
  useEffect(() => {
    if (article && article.content) {
      setMarkdownLoading(true);
      
      // 添加一个安全超时，防止长时间加载
      const timer = setTimeout(() => {
        setMarkdownLoading(false);
      }, 100); // 0.1秒后自动取消加载状态
      
      return () => clearTimeout(timer);
    }
  }, [article]);

  // 点赞文章
  const handleLikeArticle = async () => {
    // 检查用户是否登录
    if (!user) {
      message.info('请先登录后再进行操作');
      navigate('/login');
      return;
    }

    setActionLoading(prev => ({ ...prev, like: true }));
    try {
      const response = await toggleLikeArticle(id);

      if (response.data !== undefined) {
        setArticle(prevArticle => ({
          ...prevArticle,
          like_count: response.data.interacted
            ? prevArticle.like_count + 1
            : prevArticle.like_count - 1,
          interactions: {
            ...prevArticle.interactions,
            liked: response.data.interacted
          }
        }));

        message.success(response.data.interacted ? '点赞成功' : '已取消点赞');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error('点赞操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }));
    }
  };

  // 收藏文章
  const handleFavoriteArticle = async () => {
    // 检查用户是否登录
    if (!user) {
      message.info('请先登录后再进行操作');
      navigate('/login');
      return;
    }

    setActionLoading(prev => ({ ...prev, favorite: true }));
    try {
      const response = await toggleFavoriteArticle(id);

      if (response.data !== undefined) {
        setArticle(prevArticle => ({
          ...prevArticle,
          favorite_count: response.data.interacted
            ? prevArticle.favorite_count + 1
            : prevArticle.favorite_count - 1,
          interactions: {
            ...prevArticle.interactions,
            favorited: response.data.interacted
          }
        }));

        message.success(response.data.interacted ? '收藏成功' : '已取消收藏');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, favorite: false }));
    }
  };

  // 删除文章
  const handleDeleteArticle = () => {
    confirm({
      title: '确定要删除这篇文章吗?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法恢复',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(prev => ({ ...prev, delete: true }));
        try {
          await deleteArticle(id);
          message.success('文章删除成功');
          navigate('/articles');
        } catch (error) {
          console.error('删除文章失败:', error);
          message.error('删除文章失败');
        } finally {
          setActionLoading(prev => ({ ...prev, delete: false }));
        }
      },
    });
  };

  // 撤回文章（转为草稿）
  const handleUnpublishArticle = () => {
    confirm({
      title: '确定要撤回这篇文章吗?',
      icon: <ExclamationCircleOutlined />,
      content: '撤回后文章将变为草稿状态，不再公开显示',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(prev => ({ ...prev, unpublish: true }));
        try {
          await unpublishArticle(id);
          message.success('文章已撤回至草稿箱');
          // 撤回成功后导航到用户的草稿箱页面
          navigate('/profile?tab=draft');
        } catch (error) {
          console.error('撤回文章失败:', error);
          message.error('撤回文章失败');
        } finally {
          setActionLoading(prev => ({ ...prev, unpublish: false }));
        }
      },
    });
  };



  if (loading) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (!article) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text>文章不存在或已被删除</Text>
        </div>
      </Card>
    );
  }

  const {
    title,
    content,
    author,
    author_id,
    author_avatar,
    created_at,
    updated_at,
    cover,
    category_id,
    tags = [],
    view_count,
    like_count,
    favorite_count,
    comment_count,
    interactions = {},
  } = article;

  const createdDate = new Date(created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = updated_at ? new Date(updated_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  const isAuthor = user && user.id === author_id;

  return (
    <div className="article-detail">
      <Card>
        <Row>
          <Col span={24}>
            {/* 文章标题 */}
            <Title level={2}>{title}</Title>

            {/* 文章元信息 */}
            <Space wrap split={<Divider type="vertical" />} style={{ margin: '16px 0' }}>
              <Space>
                <Avatar src={getFullAvatarUrl(author_avatar)} icon={<UserOutlined />} />
                <Text>{author}</Text>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <Text>{createdDate}</Text>
              </Space>
              <Space>
                <EyeOutlined />
                <Text>{view_count} 阅读</Text>
              </Space>
              <Space>
                {interactions.liked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
                <Text>{like_count} 点赞</Text>
              </Space>
              <Space>
                {interactions.favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                <Text>{favorite_count} 收藏</Text>
              </Space>
              <Space>
                <CommentOutlined />
                <Text>{comment_count} 评论</Text>
              </Space>
              {updatedDate && (
                <Text type="secondary">更新于 {updatedDate}</Text>
              )}
            </Space>

            {/* 分类和标签 */}
            <div className="tags-container" style={{ margin: '16px 0' }}>
              {/* 分类标签 */}
              <div className="category-container">
                {category_id ? (
                  <CategoryTag id={category_id} />
                ) : (
                  <div className="empty-category-hint"><AppstoreOutlined style={{ marginRight: '4px' }} />暂无分类</div>
                )}
              </div>

              {/* 文章标签 */}
              <div className="tags-wrapper">
                {tags && tags.length > 0 ? (
                  tags.map((tagId) => (
                    <TagDisplay key={tagId} id={tagId} />
                  ))
                ) : (
                  <div className="empty-tags-hint"><TagOutlined style={{ marginRight: '4px' }} />暂无标签</div>
                )}
              </div>
            </div>

            <Divider />

            {/* 文章封面 */}
            {cover && (
              <div style={{ margin: '0 0 24px 0' }}>
                <img
                  src={getFullCoverUrl(cover)}
                  alt={title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>
            )}

            {/* 文章内容 */}
            <div className="article-content-container">
              <Card 
                bordered={false} 
                className="article-content-card" 
                bodyStyle={{ padding: '16px' }}
              >
                <div className="article-content-body">
                  {!content ? (
                    <p>此文章暂无内容</p>
                  ) : (
                    <>
                      {markdownLoading && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                      )}
                      <div style={{ visibility: markdownLoading ? 'hidden' : 'visible', position: markdownLoading ? 'absolute' : 'static' }}>
                        <ArticleContentRenderer 
                          key={`article-${id}`} // 添加key确保在文章切换时组件重新挂载
                          content={content} 
                          onRendered={(toc) => {
                            // 目前不需要处理目录，但保留接口以备后用
                            console.log('文章内容渲染完成，生成的目录：', toc);
                            setTimeout(() => {
                              setMarkdownLoading(false);
                            }, 100); // 添加轻微延迟确保渲染完成
                          }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            <Divider />

            {/* 文章操作 */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button
                  type={user && interactions.liked ? 'primary' : 'default'}
                  icon={user && interactions.liked ? <LikeFilled /> : <LikeOutlined />}
                  onClick={handleLikeArticle}
                  loading={actionLoading.like}
                >
                  {user && interactions.liked ? '已点赞' : '点赞'}
                </Button>
                <Button
                  type={user && interactions.favorited ? 'primary' : 'default'}
                  icon={user && interactions.favorited ? <StarFilled /> : <StarOutlined />}
                  onClick={handleFavoriteArticle}
                  loading={actionLoading.favorite}
                >
                  {user && interactions.favorited ? '已收藏' : '收藏'}
                </Button>

              </Space>

              {isAuthor && (
                <Space>
                  <Button
                    type="primary"
                    ghost
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/articles/edit/${id}`)}
                  >
                    编辑
                  </Button>
                  <Button
                    type="default"
                    onClick={handleUnpublishArticle}
                    loading={actionLoading.unpublish}
                  >
                    撤回至草稿箱
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteArticle}
                    loading={actionLoading.delete}
                  >
                    删除
                  </Button>
                </Space>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 评论区 */}
      {article && (
        <CommentSection articleId={id} />
      )}
    </div>
  );
};

export default ArticleDetail;
