import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Tabs,
  message,
  Card,
  Button,
  List,
  Avatar,
  Tag,
  Popconfirm,
  Empty,
  Pagination,
  Badge,
  Spin
} from 'antd';
import CommentContentRenderer from '../../components/comment/CommentContentRenderer';
import {
  StarOutlined,
  HistoryOutlined,
  LikeOutlined,
  CommentOutlined,
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FileTextOutlined,
  LinkOutlined
} from '@ant-design/icons';
import {
  getUserFavoriteArticles,
  getUserLikedArticles,
  getUserHistoryArticles,
  toggleLikeArticle,
  toggleFavoriteArticle
} from '../../services/article';
import { getUserComments, deleteComment } from '../../services/comment';
import { AuthContext } from '../../store/authContext';
import { getFullAvatarUrl } from '../../services/auth';
import ArticleList from '../../components/article/ArticleList';
import '../../styles/article/articleCard.css';
import '../../styles/user/userInteraction.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const UserInteractionPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'favorites';

  // 交互数据状态
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [likedItems, setLikedItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [comments, setComments] = useState([]);

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 统计数据
  const [interactionStats, setInteractionStats] = useState({
    favorites: 0,
    likes: 0,
    comments: 0,
    history: 0
  });

  // 分页
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });

  const [commentsPagination, setCommentsPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0
  });

  // 创建引用以避免依赖循环
  const commentsPaginationRef = useRef(commentsPagination);
  useEffect(() => {
    commentsPaginationRef.current = commentsPagination;
  }, [commentsPagination]);

  // 获取统计数据
  const fetchInteractionStats = useCallback(async () => {
    if (!user) return;

    try {
      // 获取各项交互数据的统计
      const [favoritesRes, likesRes, historyRes, commentsRes] = await Promise.all([
        getUserFavoriteArticles({ page: 1, page_size: 1 }),
        getUserLikedArticles({ page: 1, page_size: 1 }),
        getUserHistoryArticles({ page: 1, page_size: 1 }),
        getUserComments(1, 1)
      ]);

      setInteractionStats({
        favorites: favoritesRes.data?.total || 0,
        likes: likesRes.data?.total || 0,
        history: historyRes.data?.total || 0,
        comments: commentsRes.data?.total || 0
      });
    } catch (error) {
      console.error('获取互动统计数据失败:', error);
      message.error('获取统计数据失败');
    }
  }, [user]);

  // 获取互动内容 - 根据不同类型
  const fetchInteractions = useCallback(async (type, params = {}) => {
    setLoading(true);
    try {
      const { page = 1 } = params;
      let response;

      // 根据类型调用不同的API
      switch (type) {
        case 'favorites':
          response = await getUserFavoriteArticles({ page, page_size: pagination.pageSize });
          if (response.data) {
            setFavoriteItems(response.data.items || []);
            setPagination({
              current: response.data.page || 1,
              pageSize: pagination.pageSize,
              total: response.data.total || 0,
            });
          }
          break;

        case 'likes':
          response = await getUserLikedArticles({ page, page_size: pagination.pageSize });
          if (response.data) {
            setLikedItems(response.data.items || []);
            setPagination({
              current: response.data.page || 1,
              pageSize: pagination.pageSize,
              total: response.data.total || 0,
            });
          }
          break;

        case 'history':
          response = await getUserHistoryArticles({ page, page_size: pagination.pageSize });
          if (response.data) {
            setHistoryItems(response.data.items || []);
            setPagination({
              current: response.data.page || 1,
              pageSize: pagination.pageSize,
              total: response.data.total || 0,
            });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('获取互动内容失败:', error);
      message.error('获取互动内容失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, setFavoriteItems, setLikedItems, setHistoryItems, setPagination]);

  // 切换主标签页
  const handleTabChange = (key) => {
    const newParams = new URLSearchParams();
    newParams.set('tab', key);
    navigate(`/user/articles?${newParams.toString()}`);
  };

  // 获取用户评论
  const fetchUserComments = useCallback(async (page) => {
    if (!user) return;

    setCommentsLoading(true);
    try {
      // 使用传入的page参数或者从commentsPaginationRef中获取
      const currentPagination = commentsPaginationRef.current;
      const currentPage = page !== undefined ? page : currentPagination.current;
      const pageSize = currentPagination.pageSize;

      const response = await getUserComments(
        currentPage,
        pageSize
      );

      if (response.code === 200) {
        setComments(response.data.items || []);
        setCommentsPagination({
          ...currentPagination,
          current: currentPage,
          total: response.data.total
        });
      } else {
        message.error(response.message || '获取评论失败');
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      message.error('获取评论失败');
    } finally {
      setCommentsLoading(false);
    }
  }, [user]);

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await deleteComment(commentId);

      if (response.code === 200) {
        message.success('评论已删除');
        fetchUserComments(commentsPagination.current); // 使用当前页码
        fetchInteractionStats();  // 刷新统计数据
      } else {
        message.error(response.message || '删除评论失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      message.error('删除评论失败');
    }
  };

  // 评论分页变化
  const handleCommentsPageChange = (page) => {
    // 先将列表设置为加载状态，以提供视觉反馈
    setCommentsLoading(true);

    // 不需要再清空评论列表了，因为我们已经修改了条件渲染逻辑
    // 直接调用fetchUserComments并传入页码，避免状态更新延迟问题
    fetchUserComments(page);
  };

  // 渲染评论状态标签
  const renderStatusTag = (status) => {
    if (status === 0) {
      return (
        <Tag
          color="orange"
          icon={<ExclamationCircleOutlined />}
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          待审核
        </Tag>
      );
    } else if (status === 1) {
      return (
        <Tag
          color="green"
          icon={<CheckCircleOutlined />}
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          已通过
        </Tag>
      );
    } else if (status === 2) {
      return (
        <Tag
          color="red"
          icon={<CloseCircleOutlined />}
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          已拒绝
        </Tag>
      );
    }
    return null;
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchInteractionStats();

    if (activeTab === 'comments') {
      fetchUserComments(1); // 确保第一次加载时使用第1页
    } else {
      fetchInteractions(activeTab, { page: 1 });
    }
  }, [activeTab, fetchUserComments, fetchInteractionStats, fetchInteractions]);

  // 注意：我们不再需要这个useEffect来监听分页变化
  // 因为现在直接在handleCommentsPageChange中调用fetchUserComments

  // 分页变化时重新获取数据
  const handlePageChange = (page) => {
    setPagination({
      ...pagination,
      current: page
    });
    fetchInteractions(activeTab, { page });
  };

  // 点赞内容
  const handleLikeItem = async (itemId) => {
    try {
      const response = await toggleLikeArticle(itemId);

      if (response.data !== undefined) {
        // 根据当前激活标签，更新相应的内容列表
        if (activeTab === 'favorites') {
          setFavoriteItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    like_count: response.data.interacted
                      ? item.like_count + 1
                      : item.like_count - 1,
                    interactions: {
                      ...item.interactions,
                      liked: response.data.interacted
                    }
                  }
                : item
            )
          );
        } else if (activeTab === 'likes') {
          setLikedItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    like_count: response.data.interacted
                      ? item.like_count + 1
                      : item.like_count - 1,
                    interactions: {
                      ...item.interactions,
                      liked: response.data.interacted
                    }
                  }
                : item
            )
          );
        } else if (activeTab === 'history') {
          setHistoryItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    like_count: response.data.interacted
                      ? item.like_count + 1
                      : item.like_count - 1,
                    interactions: {
                      ...item.interactions,
                      liked: response.data.interacted
                    }
                  }
                : item
            )
          );
        }

        message.success(response.data.interacted ? '点赞成功' : '已取消点赞');

        // 如果是在"点赞"标签页并且取消了点赞，刷新列表和统计数据
        if (activeTab === 'likes' && !response.data.interacted) {
          fetchInteractions(activeTab, { page: pagination.current });
          fetchInteractionStats();
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error('点赞操作失败');
    }
  };

  // 收藏内容
  const handleFavoriteItem = async (itemId) => {
    try {
      const response = await toggleFavoriteArticle(itemId);

      if (response.data !== undefined) {
        // 根据当前激活标签，更新相应的内容列表
        if (activeTab === 'favorites') {
          setFavoriteItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    favorite_count: response.data.interacted
                      ? item.favorite_count + 1
                      : item.favorite_count - 1,
                    interactions: {
                      ...item.interactions,
                      favorited: response.data.interacted
                    }
                  }
                : item
            )
          );
        } else if (activeTab === 'likes') {
          setLikedItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    favorite_count: response.data.interacted
                      ? item.favorite_count + 1
                      : item.favorite_count - 1,
                    interactions: {
                      ...item.interactions,
                      favorited: response.data.interacted
                    }
                  }
                : item
            )
          );
        } else if (activeTab === 'history') {
          setHistoryItems(prevItems =>
            prevItems.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    favorite_count: response.data.interacted
                      ? item.favorite_count + 1
                      : item.favorite_count - 1,
                    interactions: {
                      ...item.interactions,
                      favorited: response.data.interacted
                    }
                  }
                : item
            )
          );
        }

        message.success(response.data.interacted ? '收藏成功' : '已取消收藏');

        // 如果是在"收藏"标签页并且取消了收藏，刷新列表和统计数据
        if (activeTab === 'favorites' && !response.data.interacted) {
          fetchInteractions(activeTab, { page: pagination.current });
          fetchInteractionStats();
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    }
  };

  // 评论内容
  const handleCommentItem = (itemId) => {
    // 跳转到文章详情页
    navigate(`/articles/${itemId}`);
  };

  // 如果用户未登录，显示提示信息
  if (!user) {
    return (
      <div style={{ textAlign: 'center', margin: '100px 0' }}>
        <Title level={3}>请先登录</Title>
        <Button type="primary" onClick={() => navigate('/login')}>
          前往登录
        </Button>
      </div>
    );
  }

  return (
    <div className="user-interaction-page">
      <Card bordered={false} className="interaction-card interaction-content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>我的互动</Title>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate('/search')}
          >
            探索发现
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarStyle={{ marginBottom: 16 }}
          className="interaction-tabs"
        >
          <TabPane
            tab={
              <span>
                <StarOutlined />
                <span style={{ marginRight: 8 }}>我的收藏</span>
                <Badge count={interactionStats.favorites} style={{ backgroundColor: '#722ed1' }} />
              </span>
            }
            key="favorites"
          >
            <ArticleList
              articles={favoriteItems}
              loading={loading}
              pagination={pagination}
              onChange={handlePageChange}
              onLike={handleLikeItem}
              onFavorite={handleFavoriteItem}
              onComment={handleCommentItem}
              emptyText="您还没有收藏任何文章"
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4
              }}
              maxVisibleTags={5}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <LikeOutlined />
                <span style={{ marginRight: 8 }}>我的点赞</span>
                <Badge count={interactionStats.likes} style={{ backgroundColor: '#eb2f96' }} />
              </span>
            }
            key="likes"
          >
            <ArticleList
              articles={likedItems}
              loading={loading}
              pagination={pagination}
              onChange={handlePageChange}
              onLike={handleLikeItem}
              onFavorite={handleFavoriteItem}
              onComment={handleCommentItem}
              emptyText="您还没有点赞任何文章"
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4
              }}
              maxVisibleTags={5}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                <span style={{ marginRight: 8 }}>浏览历史</span>
                <Badge count={interactionStats.history} style={{ backgroundColor: '#1890ff' }} />
              </span>
            }
            key="history"
          >
            <ArticleList
              articles={historyItems}
              loading={loading}
              pagination={pagination}
              onChange={handlePageChange}
              onLike={handleLikeItem}
              onFavorite={handleFavoriteItem}
              onComment={handleCommentItem}
              emptyText="您还没有浏览记录"
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4
              }}
              maxVisibleTags={5}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CommentOutlined />
                <span style={{ marginRight: 8 }}>我的评论</span>
                <Badge count={interactionStats.comments} style={{ backgroundColor: '#13c2c2' }} />
              </span>
            }
            key="comments"
          >
            {commentsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" tip="加载中..." />
              </div>
            ) : comments.length > 0 ? (
              <div className="comment-list-container">
                <List
                  itemLayout="vertical"
                  dataSource={comments}
                  renderItem={comment => (
                    <List.Item
                      key={comment.id}
                      className="comment-list-item"
                      actions={[]}
                    >
                      <div className="user-interaction-comment-header">
                        <Avatar
                          src={getFullAvatarUrl(user.avatar)}
                          icon={<UserOutlined />}
                          size="large"
                          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                        />
                        <div className="comment-user-info">
                          <Text strong style={{ fontSize: '16px', marginRight: 12 }}>{user.username}</Text>
                          <Text type="secondary" style={{ fontSize: '13px' }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            评论于 {new Date(comment.created_at).toLocaleString('zh-CN')}
                          </Text>
                        </div>
                        <div className="comment-status">
                          {renderStatusTag(comment.status)}
                        </div>
                      </div>

                      <div className="markdown-content-wrapper">
                        <CommentContentRenderer content={comment.content} />
                      </div>

                      <div className="comment-article-info">
                        <div className="article-info-left">
                          <FileTextOutlined className="article-icon" />
                          <Text type="secondary" className="article-source-label">回复文章：</Text>
                          <Text className="article-title" ellipsis={{ tooltip: comment.article_title }}>
                            {comment.article_title}
                          </Text>
                        </div>
                        <div className="article-actions">
                          <Button
                            type="link"
                            icon={<LinkOutlined />}
                            size="small"
                            className="view-article-link"
                            onClick={() => navigate(`/articles/${comment.article_id}`)}
                          >
                            查看文章
                          </Button>
                          <Popconfirm
                            title="确定要删除这条评论吗？"
                            onConfirm={() => handleDeleteComment(comment.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                            >
                              删除评论
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>

                      {comment.status === 2 && comment.review_remark && (
                        <div className="comment-review-remark">
                          <Text>{comment.review_remark}</Text>
                        </div>
                      )}
                    </List.Item>
                  )}
                />
                {commentsPagination.total > commentsPagination.pageSize && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <Pagination
                      current={commentsPagination.current}
                      pageSize={commentsPagination.pageSize}
                      total={commentsPagination.total}
                      onChange={handleCommentsPageChange}
                      showSizeChanger={false}
                      showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 条`}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Empty description="您还没有发表过评论" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserInteractionPage;
