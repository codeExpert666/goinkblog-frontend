import React, { useContext, useMemo } from 'react';
import { AuthContext } from '../../store/authContext';
import { Card, Space, Avatar, Typography } from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  CommentOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CategoryTag from '../category/CategoryTag';
import TagDisplay from '../tag/TagDisplay';
import '../../styles/article/articleCard.css';
import '../../styles/tag/tagStyles.css';

const { Text, Title, Paragraph } = Typography;

const ArticleItem = ({ article, showActions = true, onLike, onFavorite, onComment }) => {
  const { user } = useContext(AuthContext);
  // 使用状态管理标签显示
  const {
    id,
    title,
    summary,
    author,
    author_avatar,
    cover,
    created_at,
    view_count,
    like_count,
    favorite_count,
    comment_count,
    tags = [],
    category_id,
    interactions = {},
  } = article;

  // 使用useMemo缓存日期格式化结果
  const createdDate = useMemo(() => {
    return new Date(created_at).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [created_at]);

  // 处理点赞事件
  const handleLike = (e) => {
    e.preventDefault();
    if (onLike) onLike(id);
  };

  // 处理收藏事件
  const handleFavorite = (e) => {
    e.preventDefault();
    if (onFavorite) onFavorite(id);
  };

  // 处理评论事件
  const handleComment = (e) => {
    e.preventDefault();
    if (onComment) onComment(id);
  };

  return (
    <Card
      hoverable
      className="article-card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      cover={
        cover ? (
          <Link to={`/articles/${id}`}>
            <div style={{
              height: 250,
              backgroundImage: `url(${cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px'
            }} />
          </Link>
        ) : null
      }
      actions={[
        ...(showActions ? [
          <Space>
            <EyeOutlined />
            {view_count}
          </Space>,
          <Space onClick={handleLike}>
            {user && interactions.liked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
            {like_count}
          </Space>,
          <Space onClick={handleFavorite}>
            {user && interactions.favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            {favorite_count}
          </Space>,
          <Space onClick={handleComment}>
            <CommentOutlined />
            {comment_count}
          </Space>
        ] : []),
        <div className="article-author-info">
          <Space split={<span style={{ margin: '0 8px' }}>|</span>}>
            <Space>
              <Avatar
                src={author_avatar}
                icon={<UserOutlined />}
                size="small"
                style={{
                  transition: 'all 0.3s ease-in-out',
                  backgroundColor: author_avatar ? 'transparent' : '#1890ff'
                }}
              />
              <Text type="secondary">{author}</Text>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <Text type="secondary">{createdDate}</Text>
            </Space>
          </Space>
        </div>
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* 标题和摘要部分放在Link中 */}
        <Link to={`/articles/${id}`} style={{ marginBottom: '12px' }}>
          <Title level={4} ellipsis={{ rows: 1 }}>{title}</Title>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 3 }}
            style={{
              minHeight: '4.5em', /* 约等于3行文本的高度 */
              lineHeight: '1.5em',
              marginBottom: '0'
            }}
          >
            {summary || '暂无摘要'}
          </Paragraph>
        </Link>

        {/* 标签和分类部分放在Link外面 */}
        <div className="tags-container">
          {/* 分类标签 */}
          <div className="category-container">
            {category_id ? (
              <CategoryTag id={category_id} />
            ) : (
              <div className="empty-category-hint">
                <AppstoreOutlined style={{ marginRight: '4px' }} />暂无分类
              </div>
            )}
          </div>

          {/* 文章标签 */}
          <div className="tags-wrapper">
            {tags && tags.length > 0 ? (
              <>
                {tags.map((tagId) => (
                  <TagDisplay key={tagId} id={tagId} />
                ))}
              </>
            ) : (
              <div className="empty-tags-hint">
                <TagOutlined style={{ marginRight: '4px' }} />暂无标签
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ArticleItem;
