import React, { useContext } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space, Button, message } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  EditOutlined,
  LoginOutlined,
  UserAddOutlined,
  BookOutlined,
  SearchOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../store/authContext';
import { logout as logoutService } from '../services/auth';

const { Header, Content, Footer } = AntLayout;

const Layout = ({ children }) => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logoutService();
      logout();
    } catch (error) {
      message.error('退出登录失败，请重试');
      console.error('Logout failed:', error);
    }
  };

  // 根据用户角色生成下拉菜单
  const getUserMenu = () => {
    const baseMenu = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'my-interactions',
        icon: <BookOutlined />,
        label: '互动中心',
        onClick: () => navigate('/user/articles?tab=favorites'),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ];

    // 只有管理员可以看到管理中心选项
    const isAdmin = user && user.role === 'admin';
    if (isAdmin) {
      // 在退出登录前插入管理中心选项
      baseMenu.splice(baseMenu.length - 1, 0, {
        key: 'admin-center',
        icon: <AppstoreOutlined />,
        label: '管理中心',
        onClick: () => navigate('/admin'),
      });
    }

    return baseMenu;
  };

  // 获取用户菜单
  const userMenu = getUserMenu();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const { pathname } = location;
    if (pathname === '/') return 'home';
    if (pathname === '/search') return 'search';
    if (pathname.startsWith('/articles/create')) return 'write';
    return '';
  };

  // 根据用户是否登录生成不同的菜单项
  const getMenuItems = () => {
    const commonItems = [
      {
        key: 'home',
        icon: <HomeOutlined />,
        label: <Link to="/">首页</Link>,
      },
      {
        key: 'search',
        icon: <SearchOutlined />,
        label: <Link to="/search">搜索</Link>,
      }
    ];

    if (!user) {
      return commonItems;
    }

    // 所有登录用户都可以看到写文章菜单
    const loggedInItems = [
      ...commonItems,
      {
        key: 'write',
        icon: <EditOutlined />,
        label: <Link to="/articles/create">写文章</Link>,
      }
    ];

    return loggedInItems;
  };

  return (
    <AntLayout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo" style={{ fontSize: '18px', fontWeight: 'bold' }}>
            <Link to="/" style={{ color: '#1890ff', textDecoration: 'none' }}>GoInk Blog</Link>
          </div>
          <Menu
            mode="horizontal"
            items={getMenuItems()}
            style={{ flex: 1, marginLeft: 20 }}
            selectedKeys={[getSelectedKey()]}
          />
          <div>
            {loading ? (
              // 加载中不显示任何内容
              <span>加载中...</span>
            ) : user ? (
              // 已登录：显示用户信息和下拉菜单
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar src={user.avatar} icon={<UserOutlined />} />
                  <span>{user.username}</span>
                </Space>
              </Dropdown>
            ) : (
              // 未登录：显示登录和注册按钮
              <Space>
                <Button icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/register')}>
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Header>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 131px)' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        GoInk Blog ©{new Date().getFullYear()} Created with React & Ant Design
      </Footer>
    </AntLayout>
  );
};

export default Layout;
