import axios from 'axios';
import { message } from 'antd';

const API_URL = 'http://192.168.5.88:52443';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 配置数组参数的序列化方式，确保后端能正确接收
  paramsSerializer: {
    indexes: null // 不使用索引，例如 category_ids=1&category_ids=2
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response;

      // 如果是401未授权错误，可能是token过期，清除本地存储并跳转到登录页
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      // 如果是429请求过于频繁错误，直接显示错误信息
      if (status === 429) {
        // 显示后端返回的错误信息
        const errorMessage = typeof data === 'string' ? data : '请求过于频繁，请稍后再试';
        message.error(errorMessage);
      }

      return Promise.reject(data || error);
    }
    return Promise.reject(error);
  }
);

export default api;
