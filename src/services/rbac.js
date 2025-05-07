import api from './api';

// 权限验证测试（仅管理员可用）
export const enforcePermission = (data) => {
  return api.post('/api/auth/rbac/enforce', data);
};

// 获取策略列表（仅管理员可用）
export const getPolicies = (params = {}) => {
  return api.get('/api/auth/rbac/policies', { params });
};

// 添加策略（仅管理员可用）
export const createPolicy = (data) => {
  return api.post('/api/auth/rbac/policy', data);
};

// 移除策略（仅管理员可用）
export const deletePolicy = (id) => {
  return api.delete(`/api/auth/rbac/policy/${id}`);
};
