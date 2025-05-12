import React, { useState, useContext, useEffect, useCallback } from 'react';
import { LockOutlined } from '@ant-design/icons';
import '../../styles/user/userProfile.css';
import {
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Tabs,
  Button,
  Form,
  Input,
  Upload,
  message,
  Spin,
  Modal,
  Badge,
  Space,
  Tag,
  Tooltip,
  Progress,
  Radio
} from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  UploadOutlined,
  FileTextOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  StarOutlined,
  LikeOutlined,
  CommentOutlined,
  CalendarOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  EyeOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../store/authContext';
import { updateProfile, uploadAvatar } from '../../services/auth';
import {
  getArticles,
  publishDraft,
  deleteArticle,
  toggleLikeArticle,
  toggleFavoriteArticle
} from '../../services/article';
import { getUserArticleStats, getUserCategoryDistribution, getUserArticleVisits } from '../../services/stat';
import ArticleList from '../../components/article/ArticleList';
import DraftArticleList from '../../components/article/DraftArticleList';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { confirm } = Modal;

const UserProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [basicForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 从URL查询参数中获取tab值
  const getTabFromQuery = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') === 'draft' ? 'draft' : 'published';
  }, [location.search]);

  // 状态
  const [publishedLoading, setPublishedLoading] = useState(false); // 已发布文章加载状态
  const [draftLoading, setDraftLoading] = useState(false); // 草稿文章加载状态
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [articleTab, setArticleTab] = useState(getTabFromQuery);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // 文章数据
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [draftArticles, setDraftArticles] = useState([]);
  const [articleCounts, setArticleCounts] = useState({
    published: 0,
    draft: 0
  });

  // 新增统计数据
  const [articleStats, setArticleStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFavorites: 0
  });

  // 分类分布数据
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // 访问量趋势数据
  const [visitTrend, setVisitTrend] = useState([]);
  const [visitDays, setVisitDays] = useState(7); // 默认查看7天数据
  const [loadingVisits, setLoadingVisits] = useState(false);


  // 分页
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
    total: 0,
  });

  // 初始化用户数据
  const resetFormToUserData = useCallback(() => {
    if (user) {
      setAvatarUrl(user.avatar);
      basicForm.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
      });
    }
  }, [user, basicForm]);

  // 加载用户数据
  useEffect(() => {
    resetFormToUserData();
  }, [resetFormToUserData]);

  // 只在组件初始加载时从URL获取选项卡值
  useEffect(() => {
    const tabFromQuery = getTabFromQuery();
    setArticleTab(tabFromQuery);
  }, [getTabFromQuery]); // 添加getTabFromQuery作为依赖

  // 监听外部导航到本页面的情况（从其他页面跳转过来）
  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    // 只有在路径变化（从其他页面导航过来）时才执行
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      const tabFromQuery = getTabFromQuery();
      setArticleTab(tabFromQuery);
    }
  }, [location, getTabFromQuery]);

  // 定义 fetchUserStats 函数
  const fetchUserStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      // 并行请求统计API
      const [statsResponse, categoryResponse] = await Promise.all([
        getUserArticleStats(),
        getUserCategoryDistribution()
      ]);

      if (statsResponse.code === 200 && statsResponse.data) {
        setArticleStats(statsResponse.data);
      }

      if (categoryResponse.code === 200 && categoryResponse.data) {
        setCategoryDistribution(categoryResponse.data);
      }
    } catch (error) {
      console.error('获取用户统计信息失败:', error);
      message.error('获取统计信息失败');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 定义获取访问量趋势数据的函数
  const fetchVisitTrend = useCallback(async (days = 7) => {
    setLoadingVisits(true);
    try {
      const response = await getUserArticleVisits(days);

      if (response.code === 200 && response.data) {
        // 处理数据，确保日期格式适合图表显示
        const formattedData = response.data.items.map(item => ({
          date: item.date.substring(5), // 只显示月-日部分
          visits: item.visit_count
        }));

        setVisitTrend(formattedData);
      }
    } catch (error) {
      console.error('获取访问量趋势数据失败:', error);
      message.error('获取访问量趋势数据失败');
    } finally {
      setLoadingVisits(false);
    }
  }, []);

  // 定义 fetchArticles 函数
  // 使用 useRef 来存储 pagination 的当前值，避免依赖循环
  const paginationRef = React.useRef(pagination);
  React.useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const fetchArticles = useCallback(async (status, params = {}) => {
    // 只设置当前选项卡对应的loading状态，而不是整个页面
    if (status === 'published') {
      setPublishedLoading(true);
    } else {
      setDraftLoading(true);
    }

    try {
      const { page = paginationRef.current.current } = params;
      const response = await getArticles({
        author: 'current',
        status,
        page,
        page_size: 9,
      });

      if (response.data) {
        if (status === 'published') {
          setPublishedArticles(response.data.items || []);
        } else {
          setDraftArticles(response.data.items || []);
        }

        setPagination({
          current: response.data.page || 1,
          pageSize: paginationRef.current.pageSize,
          total: response.data.total || 0,
        });
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      message.error('获取文章列表失败');
    } finally {
      // 只关闭当前选项卡对应的loading状态
      if (status === 'published') {
        setPublishedLoading(false);
      } else {
        setDraftLoading(false);
      }
    }
  }, []);

  // 加载统计数据
  useEffect(() => {
    fetchUserStats();
    fetchVisitTrend(visitDays);
  }, [fetchUserStats, fetchVisitTrend, visitDays]);

  // 获取文章计数
  const fetchArticleCounts = useCallback(async () => {
    try {
      const [draftResponse, publishedResponse] = await Promise.all([
        getArticles({
          author: 'current',
          status: 'draft',
          page: 1,
          page_size: 1
        }),
        getArticles({
          author: 'current',
          status: 'published',
          page: 1,
          page_size: 1
        })
      ]);

      setArticleCounts({
        draft: draftResponse.data?.total || 0,
        published: publishedResponse.data?.total || 0
      });
    } catch (error) {
      console.error('获取文章计数失败:', error);
    }
  }, []);

  // 不再需要存储 articleTab 的当前值，因为我们直接使用 articleTab 状态

  // 加载文章计数
  useEffect(() => {
    fetchArticleCounts();
  }, [fetchArticleCounts]);

  // 在选项卡切换时加载相应数据
  const prevTabRef = React.useRef(articleTab);
  useEffect(() => {
    // 初始加载或选项卡变化时加载相应数据
    fetchArticles(articleTab);
    prevTabRef.current = articleTab;
  }, [articleTab, fetchArticles]);

  // 切换编辑模式
  const toggleEditMode = () => {
    if (editMode) {
      resetFormToUserData();
    }
    setEditMode(!editMode);
  };

  // 更新个人资料
  const handleUpdateProfile = async (values) => {
    setProfileLoading(true);
    try {
      const result = await updateProfile({
        ...values,
        avatar: user.avatar
      });

      if (result.code === 200 && result.data) {
        updateUser(result.data);
        message.success('个人资料已更新');
        setEditMode(false);
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error(error.message || '更新个人资料失败，请重试');
      resetFormToUserData();
    } finally {
      setProfileLoading(false);
    }
  };

  // 头像上传前检查
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
    }

    return isImage && isLt2M;
  };

  // 上传头像
  const handleAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);

      if (result.code === 200 && result.data) {
        const avatarUrl = result.data.url;
        setAvatarUrl(avatarUrl);

        updateUser({
          ...user,
          avatar: avatarUrl
        });

        await updateProfile({
          avatar: avatarUrl
        });

        onSuccess('上传成功');
        message.success('头像上传成功');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      onError(error);
      message.error('头像上传失败，请重试');
      setAvatarUrl(user.avatar);
    } finally {
      setUploading(false);
    }
  };

  // 处理文章分页变化
  const handlePageChange = (page) => {
    // 使用当前活动的选项卡
    fetchArticles(articleTab, { page });
  };

  // 发布草稿文章
  const handlePublishDraft = async (articleId) => {
    try {
      await publishDraft(articleId);
      message.success('文章发布成功！');

      setDraftArticles(prevArticles =>
        prevArticles.filter(article => article.id !== articleId)
      );

      fetchArticleCounts();
      fetchArticles(articleTab, { page: paginationRef.current.current });
    } catch (error) {
      console.error('发布文章失败:', error);
      message.error('发布文章失败');
    }
  };

  // 删除草稿文章
  const handleDeleteDraft = async (articleId) => {
    try {
      await deleteArticle(articleId);
      message.success('草稿已删除');

      setDraftArticles(prevArticles =>
        prevArticles.filter(article => article.id !== articleId)
      );

      fetchArticleCounts();
      fetchArticles(articleTab, { page: paginationRef.current.current });
    } catch (error) {
      console.error('删除草稿失败:', error);
      message.error('删除草稿失败');
    }
  };

  // 点赞文章
  const handleLikeArticle = async (articleId) => {
    try {
      const response = await toggleLikeArticle(articleId);

      if (response.data !== undefined) {
        setPublishedArticles(prevArticles =>
          prevArticles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  like_count: response.data.interacted
                    ? article.like_count + 1
                    : article.like_count - 1,
                  interactions: {
                    ...article.interactions,
                    liked: response.data.interacted
                  }
                }
              : article
          )
        );

        message.success(response.data.interacted ? '点赞成功' : '已取消点赞');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error('点赞操作失败');
    }
  };

  // 收藏文章
  const handleFavoriteArticle = async (articleId) => {
    try {
      const response = await toggleFavoriteArticle(articleId);

      if (response.data !== undefined) {
        setPublishedArticles(prevArticles =>
          prevArticles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  favorite_count: response.data.interacted
                    ? article.favorite_count + 1
                    : article.favorite_count - 1,
                  interactions: {
                    ...article.interactions,
                    favorited: response.data.interacted
                  }
                }
              : article
          )
        );

        message.success(response.data.interacted ? '收藏成功' : '已取消收藏');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    }
  };

  // 跳转到文章详情
  const handleCommentArticle = (articleId) => {
    navigate(`/articles/${articleId}`);
  };



  // 处理密码修改
  const handleUpdatePassword = async (values) => {
    setPasswordLoading(true);
    try {
      // 移除确认密码字段
      const { confirmPassword, ...passwordData } = values;

      const result = await updateProfile(passwordData);

      if (result.code === 200) {
        message.success('密码已更新');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      message.error(error.message || '更新密码失败，请重试');
      // 更新失败时，重置密码表单
      passwordForm.resetFields();
    } finally {
      setPasswordLoading(false);
    }
  };

  // 密码校验
  const validatePassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致'));
    },
  });

  // 确认发布对话框
  const showPublishConfirm = (id, title) => {
    confirm({
      title: '确定要发布这篇文章吗？',
      icon: <ExclamationCircleOutlined />,
      content: `一旦发布，文章《${title || '无标题'}》将对所有人可见`,
      okText: '发布',
      cancelText: '取消',
      onOk() {
        handlePublishDraft(id);
      },
    });
  };

  // 确认删除对话框
  const showDeleteConfirm = (id, title) => {
    confirm({
      title: '确定要删除这篇草稿吗？',
      icon: <ExclamationCircleOutlined />,
      content: `删除后将无法恢复《${title || '无标题'}》`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        handleDeleteDraft(id);
      },
    });
  };

  // 如果用户未登录，显示提示信息
  if (!user) {
    return (
      <div style={{ textAlign: 'center', margin: '100px 0' }}>
        <Title level={3}>请先登录</Title>
        <Button type="primary" onClick={() => navigate('/login')}>
          前往登录
        </Button>
      </div>
    );
  }

  // 获取用户注册时间的格式化字符串
  const registerDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('zh-CN')
    : '未知';

  return (
    <div className="user-profile-page" style={{ padding: '20px 0' }}>
      <Row gutter={24}>
        {/* 左侧个人信息 */}
        <Col xs={24} sm={24} md={8} lg={7} xl={6}>
          <Card
            bordered={false}
            className="profile-card"
          >
            <div className="profile-avatar-container">
              <Spin spinning={uploading}>
                <Avatar
                  size={120}
                  src={avatarUrl}
                  icon={<UserOutlined />}
                  className="profile-avatar"
                />
              </Spin>
            </div>
            <Spin spinning={profileLoading}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {!editMode && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Title level={3} style={{ margin: 0 }}>{user.username}</Title>
                      {user.role === 'admin' && (
                        <Tag color="blue" icon={<CrownOutlined />} style={{ marginLeft: 8 }}>
                          管理员
                        </Tag>
                      )}
                    </div>
                    <Paragraph type="secondary" style={{ marginTop: 12 }}>
                      <MailOutlined style={{ marginRight: 8 }} />
                      {user.email}
                    </Paragraph>

                    <div className="register-date">
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      注册时间: {registerDate}
                    </div>
                  </div>
                )}

                {/* 用户简介 */}
                {!editMode && (
                  <div style={{ margin: '20px 0' }}>
                    <Card className="bio-card">
                      <Paragraph className="bio-text">
                        {user.bio || '这个人很懒，还没有写简介...'}
                      </Paragraph>
                    </Card>
                  </div>
                )}

                {/* 编辑模式表单 */}
                {editMode && (
                  <div style={{ textAlign: 'left', marginTop: 20 }}>
                    <Form
                      form={basicForm}
                      layout="vertical"
                      onFinish={handleUpdateProfile}
                    >
                      <Form.Item
                        name="username"
                        label="用户名"
                        rules={[
                          { required: true, message: '请输入用户名' },
                          { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' }
                        ]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>

                      <Form.Item
                        name="email"
                        label="邮箱地址"
                        rules={[
                          { required: true, message: '请输入邮箱地址' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>

                      <Form.Item
                        name="bio"
                        label="个人简介"
                      >
                        <TextArea rows={4} placeholder="介绍一下你自己..." />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ marginRight: 10 }}>
                          保存
                        </Button>
                        <Button onClick={toggleEditMode}>
                          取消
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                )}

                {/* 非编辑模式显示编辑按钮和上传头像选项 */}
                {!editMode && (
                  <div style={{ marginTop: 15 }} className="profile-actions">
                    <Space>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={toggleEditMode}
                      >
                        编辑资料
                      </Button>

                      <Upload
                        name="avatar"
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        customRequest={handleAvatarUpload}
                      >
                        <Button icon={<UploadOutlined />} loading={uploading}>
                          更换头像
                        </Button>
                      </Upload>

                      <Button
                        icon={<LockOutlined />}
                        onClick={() => setPasswordModalVisible(true)}
                      >
                        修改密码
                      </Button>
                    </Space>
                  </div>
                )}
              </div>
            </Spin>
          </Card>

          {/* 统计信息卡片 */}
          {!editMode && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>数据统计</span>
                  <Tooltip title="刷新统计">
                    <Button type="text" icon={<ReloadOutlined />} onClick={fetchUserStats} loading={loadingStats} size="small" />
                  </Tooltip>
                </div>
              }
              bordered={false}
              style={{ marginTop: 16 }}
              className="stats-card"
            >
              <Spin spinning={loadingStats}>
                {/* 文章状态数据 */}
                <div className="stat-section">
                  <div className="stat-section-title">
                    <FileTextOutlined /> 文章状态
                  </div>
                  <div className="compact-stats-grid">
                    <div className="compact-stat-item">
                      <div className="compact-stat-icon" style={{ backgroundColor: 'rgba(82, 196, 26, 0.15)' }}>
                        <FileDoneOutlined style={{ color: '#52c41a' }} />
                      </div>
                      <div className="compact-stat-content">
                        <div className="compact-stat-value">{articleCounts.published}</div>
                        <div className="compact-stat-title">已发布</div>
                      </div>
                    </div>
                    <div className="compact-stat-item">
                      <div className="compact-stat-icon" style={{ backgroundColor: 'rgba(250, 173, 20, 0.15)' }}>
                        <FileAddOutlined style={{ color: '#faad14' }} />
                      </div>
                      <div className="compact-stat-content">
                        <div className="compact-stat-value">{articleCounts.draft}</div>
                        <div className="compact-stat-title">草稿箱</div>
                      </div>
                    </div>
                  </div>
                </div>



                {/* 互动数据 */}
                <div className="stat-section">
                  <div className="stat-section-title">
                    <BarChartOutlined /> 互动数据
                  </div>

                  {/* 互动数据进度条 */}
                  <div className="interaction-bars">
                    <div className="interaction-bar-item">
                      <div className="interaction-bar-header">
                        <div className="interaction-icon" style={{ backgroundColor: 'rgba(24, 144, 255, 0.15)' }}>
                          <EyeOutlined style={{ color: '#1890ff' }} />
                        </div>
                        <div className="interaction-label">阅读量</div>
                        <div className="interaction-value">{articleStats.totalViews}</div>
                      </div>
                      <Progress
                        percent={Math.min(100, articleStats.totalViews > 0 ? 100 : 0)}
                        showInfo={false}
                        strokeColor="#1890ff"
                        trailColor="rgba(24, 144, 255, 0.1)"
                        size="small"
                      />
                    </div>

                    <div className="interaction-bar-item">
                      <div className="interaction-bar-header">
                        <div className="interaction-icon" style={{ backgroundColor: 'rgba(235, 47, 150, 0.15)' }}>
                          <LikeOutlined style={{ color: '#eb2f96' }} />
                        </div>
                        <div className="interaction-label">点赞数</div>
                        <div className="interaction-value">{articleStats.totalLikes}</div>
                      </div>
                      <Progress
                        percent={Math.min(100, articleStats.totalViews > 0 ? articleStats.totalLikes / articleStats.totalViews * 100 : 0)}
                        showInfo={false}
                        strokeColor="#eb2f96"
                        trailColor="rgba(235, 47, 150, 0.1)"
                        size="small"
                      />
                    </div>

                    <div className="interaction-bar-item">
                      <div className="interaction-bar-header">
                        <div className="interaction-icon" style={{ backgroundColor: 'rgba(114, 46, 209, 0.15)' }}>
                          <StarOutlined style={{ color: '#722ed1' }} />
                        </div>
                        <div className="interaction-label">收藏数</div>
                        <div className="interaction-value">{articleStats.totalFavorites}</div>
                      </div>
                      <Progress
                        percent={Math.min(100, articleStats.totalViews > 0 ? articleStats.totalFavorites / articleStats.totalViews * 100 : 0)}
                        showInfo={false}
                        strokeColor="#722ed1"
                        trailColor="rgba(114, 46, 209, 0.1)"
                        size="small"
                      />
                    </div>

                    <div className="interaction-bar-item">
                      <div className="interaction-bar-header">
                        <div className="interaction-icon" style={{ backgroundColor: 'rgba(19, 194, 194, 0.15)' }}>
                          <CommentOutlined style={{ color: '#13c2c2' }} />
                        </div>
                        <div className="interaction-label">评论数</div>
                        <div className="interaction-value">{articleStats.totalComments}</div>
                      </div>
                      <Progress
                        percent={Math.min(100, articleStats.totalViews > 0 ? articleStats.totalComments / articleStats.totalViews * 100 : 0)}
                        showInfo={false}
                        strokeColor="#13c2c2"
                        trailColor="rgba(19, 194, 194, 0.1)"
                        size="small"
                      />
                    </div>
                  </div>
                </div>

                {/* 访问量趋势图 */}
                <div className="stat-section">
                  <div className="stat-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <EyeOutlined /> 访问量趋势
                    </div>
                    <Radio.Group
                      value={visitDays}
                      onChange={(e) => setVisitDays(e.target.value)}
                      size="small"
                      buttonStyle="solid"
                    >
                      <Radio.Button value={7}>7天</Radio.Button>
                      <Radio.Button value={14}>14天</Radio.Button>
                      <Radio.Button value={30}>30天</Radio.Button>
                    </Radio.Group>
                  </div>

                  <Spin spinning={loadingVisits}>
                    {visitTrend.length > 0 ? (
                      <div style={{ width: '100%', height: 200, marginTop: 16}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={visitTrend}
                            margin={{ top: 5, right: 20, left: -35, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9d9d9" />
                            <defs>
                              <linearGradient id="visitColorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12, fill: '#595959' }}
                              tickMargin={8}
                              axisLine={{ stroke: '#bfbfbf' }}
                              padding={{ left: 10, right: 0 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 12, fill: '#595959' }}
                              axisLine={{ stroke: '#bfbfbf' }}
                              tickLine={{ stroke: '#bfbfbf' }}
                            />
                            <RechartsTooltip
                              formatter={(value) => [`${value} 次访问`, '访问量']}
                              labelFormatter={(label) => `日期: ${label}`}
                              contentStyle={{
                                fontSize: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                border: 'none',
                                padding: '8px 12px'
                              }}
                              itemStyle={{ color: '#595959' }}
                              labelStyle={{ color: '#262626', fontWeight: 500 }}
                              cursor={{ stroke: '#e8e8e8', strokeDasharray: '5 5' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="visits"
                              stroke="#1890ff"
                              strokeWidth={2}
                              dot={{ r: 3, fill: '#1890ff', strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 0, fill: '#1890ff' }}
                              name="访问量"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text type="secondary">暂无访问量数据</Text>
                      </div>
                    )}
                  </Spin>
                </div>

                {/* 分类分布 */}
                {categoryDistribution.length > 0 && (
                  <div className="stat-section">
                    <div className="stat-section-title">
                      <AppstoreOutlined /> 分类分布
                    </div>

                    {/* 计算总数 */}
                    {(() => {
                      const total = categoryDistribution.reduce((sum, cat) => sum + cat.count, 0);

                      // 颜色数组
                      const colors = ['#1890ff', '#52c41a', '#eb2f96', '#faad14', '#722ed1', '#13c2c2', '#fa541c', '#f759ab', '#7cb305', '#08979c', '#096dd9', '#d46b08', '#389e0d', '#cf1322'];

                      // 排序分类，使大的分类在前面
                      const sortedCategories = [...categoryDistribution].sort((a, b) => b.count - a.count);

                      return (
                        <>
                          {/* GitHub风格进度条 */}
                          <div className="github-style-bar">
                            {sortedCategories.map((category, index) => {
                              const percent = total > 0 ? (category.count / total) * 100 : 0;
                              const color = colors[index % colors.length];

                              return (
                                <Tooltip
                                  key={category.name}
                                  title={`${category.name}: ${category.count} 篇 (${Math.round(percent)}%)`}
                                  color={color}
                                >
                                  <div
                                    className="category-segment"
                                    style={{
                                      width: `${percent}%`,
                                      backgroundColor: color,
                                    }}
                                  />
                                </Tooltip>
                              );
                            })}
                          </div>

                          {/* 分类图例 */}
                          <div className="category-legend" style={{ marginTop: 16 }}>
                            {sortedCategories.map((category, index) => {
                              const color = colors[index % colors.length];
                              const percent = total > 0 ? (category.count / total) * 100 : 0;

                              return (
                                <div key={category.name} className="legend-item">
                                  <span className="color-dot" style={{ backgroundColor: color }}></span>
                                  <span className="category-name">{category.name}</span>
                                  <span className="category-percent">{Math.round(percent)}%</span>
                                  <span className="category-count">({category.count})</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}

                    {categoryDistribution.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text type="secondary">暂无分类数据</Text>
                      </div>
                    )}
                  </div>
                )}

                {/* 数据统计卡片底部间距 */}
                <div className="stats-bottom-spacing"></div>
              </Spin>

              {/* 写文章按钮 */}
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/articles/create')}
                  block
                >
                  写文章
                </Button>
              </div>
            </Card>
          )}
        </Col>

        {/* 右侧文章列表 */}
        <Col xs={24} sm={24} md={16} lg={17} xl={18}>
          <Card bordered={false} className="articles-card">
            <Tabs
              activeKey={articleTab}
              onChange={(key) => {
                // 只更新选项卡状态，不再修改URL
                setArticleTab(key);

                // 静默更新URL，不触发路由变化（可选）
                if ((key === 'draft' && !location.search.includes('tab=draft')) ||
                    (key === 'published' && location.search.includes('tab=draft'))) {
                  const newUrl = `${location.pathname}${key === 'draft' ? '?tab=draft' : ''}`;
                  window.history.replaceState(null, '', newUrl);
                }
              }}
              tabBarStyle={{ marginBottom: 16 }}
            >
              <TabPane
                tab={
                  <span>
                    <FileDoneOutlined />
                    <span style={{ marginRight: 8 }}>已发布文章</span>
                    <Badge count={articleCounts.published} style={{ backgroundColor: '#52c41a' }} />
                  </span>
                }
                key="published"
              >
                    <ArticleList
                      articles={publishedArticles}
                      loading={publishedLoading}
                      pagination={{
                        ...pagination,
                        pageSize: 9
                      }}
                      onChange={handlePageChange}
                      onLike={handleLikeArticle}
                      onFavorite={handleFavoriteArticle}
                      onComment={handleCommentArticle}
                      emptyText="你还没有发布任何文章"
                      maxVisibleTags={5}
                      grid={{
                        gutter: 16,
                        xs: 1,
                        sm: 1,
                        md: 1,
                        lg: 2,
                        xl: 2,
                        xxl: 3
                      }}
                    />
                  </TabPane>

              <TabPane
                tab={
                  <span>
                    <FileAddOutlined />
                    <span style={{ marginRight: 8 }}>草稿文章</span>
                    <Badge count={articleCounts.draft} style={{ backgroundColor: '#faad14' }} />
                  </span>
                }
                key="draft"
              >
                <DraftArticleList
                  articles={draftArticles}
                  loading={draftLoading}
                  pagination={{
                    ...pagination,
                    pageSize: 9
                  }}
                  onChange={handlePageChange}
                  onPublish={(id) => showPublishConfirm(id, draftArticles.find(a => a.id === id)?.title)}
                  onDelete={(id) => showDeleteConfirm(id, draftArticles.find(a => a.id === id)?.title)}
                  emptyText="你还没有保存任何草稿"
                  maxVisibleTags={5}
                  grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 1,
                    md: 1,
                    lg: 2,
                    xl: 2,
                    xxl: 3
                  }}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* 密码修改模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={passwordLoading}>
          <Form
            form={passwordForm}
            name="password-form"
            layout="vertical"
            onFinish={handleUpdatePassword}
          >
            <Form.Item
              name="old_password"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少为6个字符' }
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认新密码' },
                validatePassword
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button
                style={{ marginRight: 8 }}
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                确认修改
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default UserProfile;
