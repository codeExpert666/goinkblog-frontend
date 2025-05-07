import api from './api';

/**
 * 获取网站概览统计信息（仅管理员可用）
 * @returns {Promise} 包含网站概览统计信息的Promise
 */
export const getSiteOverview = async () => {
  return api.get('/api/stat/overview');
};

/**
 * 获取用户文章统计信息
 * @returns {Promise} 包含用户文章统计信息的Promise
 */
export const getUserArticleStats = async () => {
  return api.get('/api/stat/user/articles');
};

/**
 * 获取用户文章分类分布
 * @returns {Promise} 包含用户文章分类分布的Promise
 */
export const getUserCategoryDistribution = async () => {
  return api.get('/api/stat/user/categories');
};

/**
 * 获取用户文章访问量变化趋势
 * @param {number} days 查询的天数，默认为7天
 * @returns {Promise} 包含用户文章访问量变化趋势的Promise
 */
export const getUserArticleVisits = async (days = 7) => {
  return api.get(`/api/stat/user/articles/visits?days=${days}`);
};

/**
 * 获取评论统计数据（仅管理员可用）
 * @returns {Promise} 包含评论统计数据的Promise
 */
export const getCommentStatistics = async () => {
  return api.get('/api/stat/comments');
};

/**
 * 获取系统信息（仅管理员可用）
 * @returns {Promise} 包含系统信息的Promise
 */
export const getSystemInfo = async () => {
  return api.get('/api/stat/system');
};

/**
 * 获取CPU信息（仅管理员可用）
 * @returns {Promise} 包含CPU信息的Promise
 */
export const getCPUInfo = async () => {
  return api.get('/api/stat/cpu');
};

/**
 * 获取内存信息（仅管理员可用）
 * @returns {Promise} 包含内存信息的Promise
 */
export const getMemoryInfo = async () => {
  return api.get('/api/stat/memory');
};

/**
 * 获取磁盘信息（仅管理员可用）
 * @returns {Promise} 包含磁盘信息的Promise
 */
export const getDiskInfo = async () => {
  return api.get('/api/stat/disk');
};

/**
 * 获取 GO 运行时信息（仅管理员可用）
 * @returns {Promise} 包含 GO 运行时信息的Promise
 */
export const getGoRuntimeInfo = async () => {
  return api.get('/api/stat/go');
};

/**
 * 获取数据库信息（仅管理员可用）
 * @returns {Promise} 包含数据库信息的Promise
 */
export const getDatabaseInfo = async () => {
  return api.get('/api/stat/db');
};

/**
 * 获取缓存信息（仅管理员可用）
 * @returns {Promise} 包含缓存信息的Promise
 */
export const getCacheInfo = async () => {
  return api.get('/api/stat/cache');
};

/**
 * 获取API访问趋势数据（仅管理员可用）
 * @param {number} days 查询的天数，默认为7天
 * @returns {Promise} 包含API访问趋势数据的Promise
 */
export const getAPIAccessTrend = async (days = 7) => {
  return api.get(`/api/stat/visits?days=${days}`);
};

/**
 * 获取用户活跃度数据（仅管理员可用）
 * @param {number} days 查询的天数，默认为7天
 * @returns {Promise} 包含用户活跃度数据的Promise
 */
export const getUserActivityTrend = async (days = 7) => {
  return api.get(`/api/stat/activity?days=${days}`);
};

/**
 * 获取文章分类分布
 * @returns {Promise} 包含文章分类分布数据的Promise
 */
export const getCategoryDistribution = async () => {
  return api.get('/api/stat/categories');
};

/**
 * 获取文章创作时间统计（仅管理员可用）
 * @param {number} days 查询的天数，默认为30天
 * @returns {Promise} 包含文章创作时间统计数据的Promise
 */
export const getArticleCreationTimeStats = async (days = 30) => {
  return api.get(`/api/stat/articles/creation?days=${days}`);
};
