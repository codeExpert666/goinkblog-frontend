import api from './api';

// 获取日志列表（仅管理员可用）
export const getLogs = (params = {}) => {
  return api.get('/api/stat/logger', { params });
};
