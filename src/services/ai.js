import api from './api';

// AI助手API服务函数

// 使用AI助手润色文章
export const polishArticle = (articleContent) => {
  // 此接口为SSE流式响应，需要特殊处理
  return {
    url: '/api/ai/polish',
    method: 'POST',
    data: { article_content: articleContent },  // 修正：包装成对象
  };
};

// 使用AI助手为文章生成摘要
export const generateSummary = (articleContent) => {
  // 此接口为SSE流式响应，需要特殊处理
  return {
    url: '/api/ai/summary',
    method: 'POST',
    data: { article_content: articleContent },  // 修正：包装成对象
  };
};

// 使用AI助手为文章生成标签
export const generateTags = (articleContent) => {
  return api.post('/api/ai/tag', { article_content: articleContent });  // 修正：包装成对象
};

// 使用AI助手为文章生成标题
export const generateTitles = (articleContent) => {
  return api.post('/api/ai/title', { article_content: articleContent });  // 修正：包装成对象
};

// 管理AI模型配置的API（如需使用）

// 获取AI模型配置列表（分页）
export const getModels = (params = {}) => {
  return api.get('/api/ai/models', { params });
};

// 获取指定ID的模型配置
export const getModelById = (id) => {
  return api.get(`/api/ai/models/${id}`);
};

// 创建新的模型配置
export const createModel = (data) => {
  return api.post('/api/ai/models', data);
};

// 更新模型配置
export const updateModel = (id, data) => {
  return api.put(`/api/ai/models/${id}`, data);
};

// 删除模型配置
export const deleteModel = (id) => {
  return api.delete(`/api/ai/models/${id}`);
};

// 重置特定模型的使用统计信息
export const resetModelStats = (id) => {
  return api.post(`/api/ai/models/${id}/reset`);
};

// 重置所有模型的使用统计信息
export const resetAllModelStats = () => {
  return api.post('/api/ai/models/reset');
};

// 获取所有AI模型的总体统计信息
export const getModelsOverview = () => {
  return api.get('/api/ai/models/overview');
};
