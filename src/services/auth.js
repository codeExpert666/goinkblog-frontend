import api from './api';

// 获取验证码ID
export const getCaptchaId = () => {
  return api.get('/api/auth/captcha/id');
};

// 获取验证码图片URL (前端直接使用 img 标签加载图片)
export const getCaptchaImageUrl = (captchaId, reload = 0) => {
  // 添加时间戳防止浏览器缓存
  const timestamp = new Date().getTime();
  return `${api.defaults.baseURL}/api/auth/captcha/image?id=${captchaId}&reload=${reload}&t=${timestamp}`;
};

// 获取完整的头像URL
// 后端返回的是URL，通过 http://localhost:52443/URL 可以访问头像
export const getFullAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return '';
  
  // 如果已经是完整URL，直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // 确保URL以/开头
  const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
  return `${api.defaults.baseURL}${path}`;
};

// 用户登录
export const login = (data) => {
  return api.post('/api/auth/login', data);
};

// 用户注册
export const register = (data) => {
  return api.post('/api/auth/register', data);
};

// 获取当前用户信息
export const getCurrentUser = () => {
  return api.get('/api/auth/currentUser');
};

// 用户退出登录
export const logout = () => {
  return api.post('/api/auth/logout');
};

// 更新用户资料
export const updateProfile = (data) => {
  return api.put('/api/auth/profile', data);
};

// 上传用户头像
export const uploadAvatar = (formData) => {
  return api.post('/api/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
