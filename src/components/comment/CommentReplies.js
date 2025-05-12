import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Avatar, Button, message, Skeleton, Tag } from 'antd';
import { UserOutlined, RetweetOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import CommentContentRenderer from './CommentContentRenderer';
import { getCommentReplies, createComment } from '../../services/comment';
import { AuthContext } from '../../store/authContext';
import CommentEditor from './CommentEditor';
import '../../styles/comment/commentSection.css';

const CommentReplies = ({ commentId, articleId, onCommentUpdate }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0
  });
  const [replying, setReplying] = useState(null); // 正在回复的评论ID
  const { user } = useContext(AuthContext);

  // 定义 loadReplies 函数
  const loadReplies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // 如果是管理员，显示所有回复，否则只显示已审核通过的回复
      const isAdmin = user && user.role === 'admin';
      const response = await getCommentReplies(
        commentId,
        page,
        pagination.pageSize,
        true,
        0,
        'asc',
        isAdmin // 管理员可以查看所有回复
      );

      if (response.code === 200 && response.data) {
        // 使用函数式更新，避免依赖于当前的 replies 状态
        setReplies(prevReplies => {
          if (page === 1) {
            return response.data.items;
          } else {
            return [...prevReplies, ...response.data.items];
          }
        });

        setPagination({
          page: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          totalPages: response.data.total_pages
        });
      } else {
        message.error(response.message || '获取回复失败');
      }
    } catch (error) {
      console.error('获取评论回复失败:', error);
      message.error('获取回复失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, [commentId, pagination.pageSize, user]);

  // 使用 loadReplies 函数
  useEffect(() => {
    if (commentId) {
      loadReplies();
    }
  }, [commentId, loadReplies]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      loadReplies(pagination.page + 1);
    }
  };

  const handleReplyClick = (replyId) => {
    if (!user) {
      message.info('请先登录后再回复');
      return;
    }
    setReplying(replying === replyId ? null : replyId);
  };

  const handleSubmitReply = async (replyId, parentAuthor, content) => {
    try {
      const response = await createComment({
        article_id: articleId,
        content,
        parent_id: replyId
      });

      if (response.code === 200 && response.data) {
        // 根据用户角色显示不同的提示信息
        if (user && user.role === 'admin') {
          message.success('回复成功，管理员回复已直接显示');
          // 管理员回复直接显示，重新加载回复列表
          loadReplies();
          onCommentUpdate && onCommentUpdate();
        } else {
          message.success('回复成功，等待管理员审核后显示');
          setTimeout(() => {
            message.info('您可以在头像下拉菜单中的"我的互动"-"我的评论"中查看评论审核状态', 5);
          }, 1000);
          // 普通用户回复需要审核，不会立即显示
          // 不需要重新加载回复列表
        }
        setReplying(null);
      } else {
        message.error(response.message || '回复失败');
      }
    } catch (error) {
      console.error('回复评论失败:', error);
      message.error('回复失败，请稍后再试');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染评论状态标签
  const renderStatusTag = (status) => {
    if (status === 0) {
      return (
        <Tag
          color="gold"
          icon={<ClockCircleOutlined />}
          style={{ marginLeft: 8, borderRadius: '12px', fontSize: '12px' }}
        >
          待审核
        </Tag>
      );
    } else if (status === 1) {
      return (
        <Tag
          color="green"
          icon={<CheckCircleOutlined />}
          style={{ marginLeft: 8, borderRadius: '12px', fontSize: '12px' }}
        >
          已通过
        </Tag>
      );
    } else if (status === 2) {
      return (
        <Tag
          color="red"
          icon={<CloseCircleOutlined />}
          style={{ marginLeft: 8, borderRadius: '12px', fontSize: '12px' }}
        >
          已拒绝
        </Tag>
      );
    }
    return null;
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="comment-replies">
        <Skeleton active avatar paragraph={{ rows: 1 }} />
        <Skeleton active avatar paragraph={{ rows: 1 }} />
      </div>
    );
  }

  return (
    <div className="comment-replies">
      {replies.length === 0 ? (
        <div style={{ padding: '12px 0', color: '#8c8c8c' }}>暂无回复</div>
      ) : (
        <>
          {replies.map(reply => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <Avatar
                  src={reply.avatar}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span className="reply-author">{reply.author}</span>

                {reply.parent_author && reply.parent_id !== commentId && (
                  <>
                    <span className="reply-to">回复</span>
                    <span className="reply-parent-author">{reply.parent_author}</span>
                  </>
                )}

                <span className="reply-time">{formatDate(reply.created_at)}</span>
                {user && user.role === 'admin' && renderStatusTag(reply.status)}
              </div>

              <div className="reply-content">
                <CommentContentRenderer content={reply.content} />
              </div>

              <div className="reply-actions">
                <Button
                  type="text"
                  icon={<RetweetOutlined />}
                  size="small"
                  onClick={() => handleReplyClick(reply.id)}
                >
                  回复
                </Button>
              </div>

              {replying === reply.id && (
                <div style={{ marginTop: 8, marginLeft: 32 }}>
                  <CommentEditor
                    articleId={articleId}
                    parentId={reply.id}
                    onSuccess={(content) => handleSubmitReply(reply.id, reply.author, content)}
                    onCancel={() => setReplying(null)}
                    placeholder={`回复 ${reply.author}...`}
                  />
                </div>
              )}
            </div>
          ))}

          {pagination.page < pagination.totalPages && (
            <div className="load-more-button">
              <Button
                type="link"
                onClick={handleLoadMore}
                loading={loading}
              >
                加载更多回复
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentReplies;
