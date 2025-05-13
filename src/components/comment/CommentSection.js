import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, message, Divider } from 'antd';
import { CommentOutlined, LoginOutlined } from '@ant-design/icons';
// import { Link } from 'react-router-dom';
import { getArticleComments, createComment } from '../../services/comment';
import { AuthContext } from '../../store/authContext';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';
import '../../styles/comment/commentSection.css';

const CommentSection = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const { user } = useContext(AuthContext);

  // 定义 loadComments 函数
  const loadComments = React.useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // 如果是管理员，显示所有评论，否则只显示已审核通过的评论
      const isAdmin = user && user.role === 'admin';
      const response = await getArticleComments(
        articleId,
        page,
        pagination.pageSize,
        'desc',
        isAdmin // 管理员可以查看所有评论
      );

      if (response.code === 200 && response.data) {
        setComments(response.data.items);
        setPagination({
          page: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          totalPages: response.data.total_pages
        });
      } else {
        message.error(response.message || '获取评论失败');
      }
    } catch (error) {
      console.error('Failed to get article replys:', error);
      message.error('获取评论失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, [articleId, pagination.pageSize, user]);

  // 使用 loadComments 函数
  useEffect(() => {
    if (articleId) {
      loadComments();
    }
  }, [articleId, loadComments]);

  const handlePageChange = (page) => {
    loadComments(page);
  };

  const handleCreateComment = async (content) => {
    try {
      const response = await createComment({
        article_id: articleId,
        content
      });

      if (response.code === 200 && response.data) {
        // 根据用户角色显示不同的提示信息
        if (user && user.role === 'admin') {
          message.success('评论发表成功，管理员评论已直接通过审核');
          // 管理员评论直接通过审核，重新加载第一页评论
          loadComments(1);
        } else {
          message.success('评论发表成功，等待管理员审核后显示');
          setTimeout(() => {
            message.info('您可以在头像下拉菜单中的"我的互动"-"我的评论"中查看评论审核状态', 5);
          }, 100);
          // 普通用户评论需要审核，不需要立即刷新评论列表，因为新评论不会显示
          // 这里可以选择不刷新，或者仍然刷新以显示最新的已审核评论
        }
      } else {
        message.error(response.message || '评论发表失败');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      message.error('评论发表失败，请稍后再试');
    }
  };

  return (
    <Card className="comment-section">
      <div className="comment-section-header">
        <h3 className="comment-count">
          <CommentOutlined style={{ marginRight: 8 }} />
          评论区
        </h3>
      </div>

      <Divider />

      {!user && (
        <div className="login-notice">
          <Button
            type="primary"
            icon={<LoginOutlined />}
            href="/login"
          >
            登录后发表评论
          </Button>
        </div>
      )}

      {user && (
        <CommentEditor
          articleId={articleId}
          onSuccess={handleCreateComment}
        />
      )}

      <CommentList
        comments={comments}
        loading={loading}
        articleId={articleId}
        pagination={pagination}
        onPageChange={handlePageChange}
        onCommentUpdate={() => loadComments(pagination.page)}
      />
    </Card>
  );
};

export default CommentSection;
