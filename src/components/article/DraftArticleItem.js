import React from 'react';
import { Card, Space, Avatar, Typography, Row, Col, Button } from 'antd';
import CategoryTag from '../category/CategoryTag';
import TagDisplay from '../tag/TagDisplay';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/article/articleCard.css';
import '../../styles/tag/tagStyles.css';

const { Meta } = Card;
const { Text, Title, Paragraph } = Typography;

const DraftArticleItem = ({ article, onPublish, onDelete }) => {
  const navigate = useNavigate();
  // 使用状态管理标签显示
  const {
    id,
    title,
    summary,
    author,
    author_avatar,
    cover,
    created_at,
    updated_at,
    tags = [],
    category_id,
  } = article;

  const updatedDate = updated_at ? new Date(updated_at) : new Date(created_at);
  const formattedDate = updatedDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 继续编辑草稿
  const handleEdit = (e) => {
    e.preventDefault();
    navigate(`/articles/edit/${id}`);
  };

  // 发布文章
  const handlePublish = (e) => {
    e.preventDefault();
    if (onPublish) onPublish(id);
  };

  // 删除草稿
  const handleDelete = (e) => {
    e.preventDefault();
    if (onDelete) onDelete(id);
  };

  return (
    <Card
      hoverable
      className="article-card draft-article-card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      cover={
        cover ? (
          <div style={{ position: 'relative' }}>
            <div style={{
              height: 200,
              backgroundImage: `url(${cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'grayscale(30%)',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px'
            }} />
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FileTextOutlined style={{ marginRight: 4 }} />
              草稿
            </div>
          </div>
        ) : (
          <div style={{
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            color: '#bfbfbf'
          }}>
            <FileTextOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <span>草稿文章</span>
          </div>
        )
      }
      actions={[
        <Button type="text" icon={<EditOutlined />} onClick={handleEdit}>
          继续编辑
        </Button>,
        <Button type="text" icon={<FileDoneOutlined />} onClick={handlePublish}>
          发布
        </Button>,
        <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDelete}>
          删除
        </Button>,
        <div className="article-author-info">
          <Space split={<span style={{ margin: '0 8px' }}>|</span>}>
            <Space>
              <Avatar
                src={author_avatar}
                icon={<UserOutlined />}
                size="small"
              />
              <Text type="secondary">{author}</Text>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <Text type="secondary">最后修改于 {formattedDate}</Text>
            </Space>
          </Space>
        </div>
      ]}
    >
      <Meta
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
        title={<Title level={4} ellipsis={{ rows: 1 }}>{title || '无标题草稿'}</Title>}
        description={
          <div>
            <Row gutter={[0, 12]}>
              <Col span={24}>
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 3 }}
                  style={{
                    minHeight: '4.5em', /* 约等于3行文本的高度 */
                    lineHeight: '1.5em',
                    marginBottom: '12px'
                  }}
                >
                  {summary || '暂无摘要'}
                </Paragraph>
              </Col>

              <Col span={24}>
                <div className="tags-container">
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
                      <>
                        {tags.map((tagId) => (
                          <TagDisplay key={tagId} id={tagId} />
                        ))}
                      </>
                    ) : (
                      <div className="empty-tags-hint"><TagOutlined style={{ marginRight: '4px' }} />暂无标签</div>
                    )}
                  </div>
                </div>
              </Col>


            </Row>
          </div>
        }
      />
    </Card>
  );
};

export default DraftArticleItem;
