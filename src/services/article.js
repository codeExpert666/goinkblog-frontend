import api from './api';

// 获取（搜索）文章列表
export const getArticles = (params = {}) => {
  return api.get('/api/blog/articles', { params });
};

// 获取文章详情
export const getArticleById = (id) => {
  return api.get(`/api/blog/articles/${id}`);
};

// 创建文章
export const createArticle = (data) => {
  return api.post('/api/blog/articles', data);
};

// 更新文章
export const updateArticle = (id, data) => {
  return api.put(`/api/blog/articles/${id}`, data);
};

// 删除文章
export const deleteArticle = (id) => {
  return api.delete(`/api/blog/articles/${id}`);
};

// 发布草稿文章
export const publishDraft = (id) => {
  // 使用updateArticle更新文章状态为published
  return updateArticle(id, { status: 'published' });
};

// 撤回已发布文章（转为草稿）
export const unpublishArticle = (id) => {
  // 使用updateArticle更新文章状态为draft
  return updateArticle(id, { status: 'draft' });
};

// 点赞/取消点赞文章
export const toggleLikeArticle = (id) => {
  return api.post(`/api/blog/articles/${id}/like`);
};

// 收藏/取消收藏文章
export const toggleFavoriteArticle = (id) => {
  return api.post(`/api/blog/articles/${id}/favorite`);
};

// 获取用户收藏的文章
export const getUserFavoriteArticles = (params = {}) => {
  return api.get('/api/blog/articles/favorites', { params });
};

// 获取用户点赞的文章
export const getUserLikedArticles = (params = {}) => {
  return api.get('/api/blog/articles/liked', { params });
};

// 获取用户评论过的文章
export const getUserCommentedArticles = (params = {}) => {
  return api.get('/api/blog/articles/commented', { params });
};

// 获取用户浏览历史
export const getUserHistoryArticles = (params = {}) => {
  return api.get('/api/blog/articles/history', { params });
};

// 获取热门文章
export const getHotArticles = (limit = 10) => {
  return api.get('/api/blog/articles/hot', { params: { limit } });
};

// 获取最新文章
export const getLatestArticles = (limit = 10) => {
  return api.get('/api/blog/articles/latest', { params: { limit } });
};

// 上传文章封面
export const uploadArticleCover = (formData) => {
  return api.post('/api/blog/articles/upload-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
