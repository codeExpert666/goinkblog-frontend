import api from './api';

// 获取文章的顶级评论
export const getArticleComments = (articleId, page = 1, pageSize = 10, sortByCreate = 'desc', showAll = false) => {
  return api.get(`/api/comment/article/${articleId}`, {
    params: {
      page,
      page_size: pageSize,
      sort_by_create: sortByCreate,
      show_all: showAll // 管理员可以查看所有评论，包括未审核和已拒绝的
    }
  });
};

// 获取顶级评论的回复
export const getCommentReplies = (commentId, page = 1, pageSize = 10, includeReplies = true, maxDepth = 0, sortByCreate = 'asc', showAll = false) => {
  return api.get(`/api/comment/${commentId}/replies`, {
    params: {
      page,
      page_size: pageSize,
      include_replies: includeReplies,
      max_depth: maxDepth,
      sort_by_create: sortByCreate,
      show_all: showAll // 管理员可以查看所有回复，包括未审核和已拒绝的
    }
  });
};

// 创建评论
export const createComment = (data) => {
  // 将 article_id 从字符串转换为数字类型
  if (data.article_id !== undefined) {
    data = {
      ...data,
      article_id: parseInt(data.article_id, 10)
    };
  }
  return api.post('/api/comment', data);
};

// 获取评论详情
export const getCommentDetail = (commentId) => {
  return api.get(`/api/comment/${commentId}`);
};

// 删除评论
export const deleteComment = (commentId) => {
  return api.delete(`/api/comment/${commentId}`);
};

// 获取用户评论
export const getUserComments = (page = 1, pageSize = 10) => {
  return api.get('/api/comment/user', {
    params: {
      page,
      page_size: pageSize
    }
  });
};

// 获取评论审核列表（管理员）
export const getCommentsForReview = (params) => {
  return api.get('/api/comment/review', {
    params
  });
};

// 审核评论（管理员）
export const reviewComment = (data) => {
  return api.post('/api/comment/review', data);
};
