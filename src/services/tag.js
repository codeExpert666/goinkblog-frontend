import api from './api';

// 获取所有标签
export const getAllTags = () => {
  return api.get('/api/blog/tags');
};

// 获取标签详情
export const getTagById = (id) => {
  return api.get(`/api/blog/tags/${id}`);
};

// 创建标签
export const createTag = (data) => {
  return api.post('/api/blog/tags', data);
};

// 更新标签（仅管理员可用）
export const updateTag = (id, data) => {
  return api.put(`/api/blog/tags/${id}`, data);
};

// 删除标签（仅管理员可用）
export const deleteTag = (id) => {
  return api.delete(`/api/blog/tags/${id}`);
};

// 获取热门标签
export const getHotTags = (limit = 10) => {
  return api.get('/api/blog/tags/hot', { params: { limit } });
};

// 获取标签列表（带分页）
export const getTagsPaginated = (params = {}) => {
  return api.get('/api/blog/tags/paginate', { params });
};

// 获取完整的标签URL（如果后端返回的是相对路径）
export const getFullTagUrl = (tagUrl) => {
  if (!tagUrl) return '';
  
  // 如果已经是完整URL，直接返回
  if (tagUrl.startsWith('http://') || tagUrl.startsWith('https://')) {
    return tagUrl;
  }
  
  // 确保URL以/开头
  const path = tagUrl.startsWith('/') ? tagUrl : `/${tagUrl}`;
  return `${api.defaults.baseURL}${path}`;
};
