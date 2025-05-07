import React from 'react';
import { Skeleton, Pagination, Empty } from 'antd';
import CommentItem from './CommentItem';
import '../../styles/comment/commentSection.css';

const CommentList = ({ comments, loading, articleId, pagination, onPageChange, onCommentUpdate }) => {
  if (loading) {
    return (
      <div className="comment-list">
        <Skeleton active avatar paragraph={{ rows: 2 }} />
        <Skeleton active avatar paragraph={{ rows: 2 }} />
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="comment-list-empty">
        <Empty description="暂无评论，快来发表第一条评论吧！" />
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          articleId={articleId}
          onCommentUpdate={onCommentUpdate}
        />
      ))}

      {pagination && pagination.total > pagination.pageSize && (
        <div className="pagination-container">
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onPageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default CommentList;
