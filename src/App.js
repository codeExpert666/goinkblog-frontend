import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/user/UserProfile';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import ArticleList from './pages/article/ArticleList';
import ArticleDetail from './pages/article/ArticleDetail';
import ArticleEditor from './pages/article/ArticleEditor';
import UserInteraction from './pages/user/UserInteraction';

import SearchPage from './pages/article/SearchPage';
import AdminCenter from './pages/admin/AdminCenter';

// Services
import { getCurrentUser } from './services/auth';
import { getAllCategories } from './services/category';
import categoryCache from './services/categoryCache';

// Context
import { AuthContext } from './store/authContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 预加载分类数据
  const preloadCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response.data && response.data.items) {
        // 将分类数据添加到缓存
        categoryCache.addCategories(response.data.items);
      }
    } catch (error) {
      console.error('Failed to preload categories:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // 预加载分类数据
    preloadCategories();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data) {
        // 直接使用后端返回的用户信息，包括avatar URL
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    message.success('登录成功');
    navigate('/');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    message.success('已退出登录');
    // Force navigation to home page with replace to ensure history is updated correctly
    navigate('/', { replace: true });
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Protected route component - 保护需要登录才能访问的页面
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (loading) return <div>加载中...</div>;

    if (!user) {
      message.error('请先登录');
      return <Navigate to="/login" />;
    }

    // 如果页面需要管理员权限，检查用户是否为管理员
    if (requireAdmin && (!user.role || user.role !== 'admin')) {
      message.error('您没有权限访问此页面');
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <ConfigProvider locale={zhCN}>
      <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          {/* 需要登录的路由 */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArticleEditor />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArticleEditor />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/articles"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserInteraction />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/comments"
            element={
              <ProtectedRoute>
                <Navigate to="/user/articles?tab=comments" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminCenter />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 公开路由 - 不需要登录也可访问 */}
          <Route
            path="/"
            element={
              <Layout>
                <ArticleList />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SearchPage />
              </Layout>
            }
          />
          <Route
            path="/articles"
            element={
              <Layout>
                <ArticleList />
              </Layout>
            }
          />
          <Route
            path="/articles/:id"
            element={
              <Layout>
                <ArticleDetail />
              </Layout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthContext.Provider>
    </ConfigProvider>
  );
}

export default App;
