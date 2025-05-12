import React, { useState, useContext } from 'react';
import { Avatar, Button, message, Skeleton, Tag } from 'antd';
import { UserOutlined, RetweetOutlined, UnorderedListOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import CommentContentRenderer from './CommentContentRenderer';
import { AuthContext } from '../../store/authContext';
import CommentEditor from './CommentEditor';
import CommentReplies from './CommentReplies';
import { createComment } from '../../services/comment';
import '../../styles/comment/commentSection.css';

const CommentItem = ({ comment, articleId, onCommentUpdate }) => {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  // 以下状态变量可能在将来的功能扩展中使用
  // const [loadingReplies, setLoadingReplies] = useState(false);
  const { user } = useContext(AuthContext);

  const handleReplyClick = () => {
    if (!user) {
      message.info('请先登录后再回复');
      return;
    }
    setReplying(!replying);
  };

  const handleShowReplies = () => {
    setShowReplies(true);
  };

  const handleSubmitReply = async (content) => {
    try {
      const response = await createComment({
        article_id: articleId,
        content,
        parent_id: comment.id
      });

      if (response.code === 200 && response.data) {
        // 根据用户角色显示不同的提示信息
        if (user && user.role === 'admin') {
          message.success('回复成功，管理员回复已直接显示');
          // 更新评论回复数并展示回复
          comment.reply_count += 1;
          setShowReplies(true);
          // 管理员回复直接显示，需要刷新评论列表
          onCommentUpdate && onCommentUpdate();
        } else {
          message.success('回复成功，等待管理员审核后显示');
          setTimeout(() => {
            message.info('您可以在头像下拉菜单中的"我的互动"-"我的评论"中查看评论审核状态', 5);
          }, 1000);
          // 普通用户回复需要审核，不会立即显示
          // 不需要更新回复数和展示回复
        }
        setReplying(false);
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

  if (!comment) {
    return <Skeleton active avatar paragraph={{ rows: 1 }} />;
  }

  return (
    <div className="comment-item">
      <div className="comment-header">
        <Avatar
          src={comment.avatar}
          icon={<UserOutlined />}
          size="default"
        />
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{formatDate(comment.created_at)}</span>
        {user && user.role === 'admin' && renderStatusTag(comment.status)}
      </div>

      <div className="comment-content">
        <CommentContentRenderer content={comment.content} />
      </div>

      <div className="comment-actions">
        <Button
          type="text"
          icon={<RetweetOutlined />}
          size="small"
          onClick={handleReplyClick}
        >
          回复
        </Button>

        {comment.reply_count > 0 && !showReplies && (
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            size="small"
            onClick={handleShowReplies}
          >
            查看{comment.reply_count}条回复
          </Button>
        )}
      </div>

      {replying && (
        <div style={{ marginTop: 16, marginLeft: 40 }}>
          <CommentEditor
            articleId={articleId}
            parentId={comment.id}
            onSuccess={handleSubmitReply}
            onCancel={() => setReplying(false)}
            placeholder={`回复 ${comment.author}...`}
          />
        </div>
      )}

      {showReplies && (
        <CommentReplies
          commentId={comment.id}
          articleId={articleId}
          onCommentUpdate={onCommentUpdate}
        />
      )}
    </div>
  );
};

export default CommentItem;
