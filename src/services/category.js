import api from './api';

// 获取分类列表（带分页）
export const getCategoriesPaginated = (params = {}) => {
  return api.get('/api/blog/categories/paginate', { params });
};

// 获取分类详情
export const getCategoryById = (id) => {
  return api.get(`/api/blog/categories/${id}`);
};

// 创建分类（仅管理员可用）
export const createCategory = (data) => {
  return api.post('/api/blog/categories', data);
};

// 更新分类（仅管理员可用）
export const updateCategory = (id, data) => {
  return api.put(`/api/blog/categories/${id}`, data);
};

// 删除分类（仅管理员可用）
export const deleteCategory = (id) => {
  return api.delete(`/api/blog/categories/${id}`);
};

// 获取所有分类（不分页，用于下拉框选择）
export const getAllCategories = () => {
  // 使用分页接口，但设置较大的 page_size 以获取所有分类
  return getCategoriesPaginated({ page: 1, page_size: 100 });
};
