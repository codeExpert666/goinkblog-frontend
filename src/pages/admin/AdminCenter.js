import React, { useContext } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Avatar, Space, Result, Spin, Tooltip, Select } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  CommentOutlined,
  BarChartOutlined,
  NotificationOutlined,
  FileTextOutlined,
  LikeOutlined,
  StarOutlined,
  TagsOutlined,
  ControlOutlined,
  RobotOutlined,
  LockOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  HddOutlined
} from '@ant-design/icons';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { getSystemInfo, getSiteOverview, getAPIAccessTrend, getUserActivityTrend, getCategoryDistribution, getArticleCreationTimeStats } from '../../services/stat';
import { AuthContext } from '../../store/authContext';
import CategoryManagement from '../category/CategoryManagement';
import TagManagement from '../tag/TagManagement';
import CommentManagement from '../comment/CommentManagement';
import AIConfigManagement from '../ai/AIConfigManagement';
import RBACManagement from '../rbac/RBACManagement';
import LoggerManagement from '../logger/LoggerManagement';
import SystemInfo from './SystemInfo';
import '../../styles/admin/adminCenter.css';

const { Title, Text } = Typography;

// 扩展的颜色数组，为分类提供更多可选颜色
const CATEGORY_COLORS = [
  '#1890ff', '#52c41a', '#722ed1', '#faad14',
  '#811a53', '#a35606', '#13c2c2', '#486802',
  '#ea0b8e', '#096dd9', '#389e0d', '#531dab',
  '#e88ebd', '#ecae64', '#096a66', '#a0d911',
  '#9254de', '#8da4ec', '#ff4d4f', '#a7ef7d',
  '#2f54eb', '#ff7a45', '#bae637', '#1b5483'
];

const AdminCenter = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = React.useState(null);
  const [siteOverview, setSiteOverview] = React.useState(null);
  const [overviewLoading, setOverviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [apiTrendData, setApiTrendData] = React.useState([]);
  const [apiTrendLoading, setApiTrendLoading] = React.useState(false);
  const [apiTrendDays, setApiTrendDays] = React.useState(7);
  const [userActivityData, setUserActivityData] = React.useState([]);
  const [userActivityLoading, setUserActivityLoading] = React.useState(false);
  const [userActivityDays, setUserActivityDays] = React.useState(7);
  const [categoryDistData, setCategoryDistData] = React.useState([]);
  const [categoryDistLoading, setCategoryDistLoading] = React.useState(false);
  const [articleCreationData, setArticleCreationData] = React.useState([]);
  const [articleCreationLoading, setArticleCreationLoading] = React.useState(false);
  const [articleCreationDays, setArticleCreationDays] = React.useState(30);
  // 创建统一的分类颜色映射
  const [categoryColorMap, setCategoryColorMap] = React.useState({});
  
  // 检查是否是管理员
  const isAdmin = user && user.role === 'admin';
  
  // 获取系统信息和网站概览数据
  React.useEffect(() => {
    if (isAdmin) {
      const fetchSystemInfo = async () => {
        setLoading(true);
        try {
          const response = await getSystemInfo();
          setSystemInfo(response.data);
        } catch (error) {
          console.error('获取系统信息失败:', error);
        } finally {
          setLoading(false);
        }
      };

      const fetchSiteOverview = async () => {
        setOverviewLoading(true);
        try {
          const response = await getSiteOverview();
          setSiteOverview(response.data);
        } catch (error) {
          console.error('获取网站概览数据失败:', error);
        } finally {
          setOverviewLoading(false);
        }
      };

      const fetchApiTrend = async () => {
        setApiTrendLoading(true);
        try {
          const response = await getAPIAccessTrend(apiTrendDays);
          setApiTrendData(response.data || []);
        } catch (error) {
          console.error('获取API访问趋势数据失败:', error);
        } finally {
          setApiTrendLoading(false);
        }
      };

      const fetchUserActivity = async () => {
        setUserActivityLoading(true);
        try {
          const response = await getUserActivityTrend(userActivityDays);
          setUserActivityData(response.data || []);
        } catch (error) {
          console.error('获取用户活跃度数据失败:', error);
        } finally {
          setUserActivityLoading(false);
        }
      };
      
      const fetchCategoryDistribution = async () => {
        setCategoryDistLoading(true);
        try {
          const response = await getCategoryDistribution();
          const categories = response.data || [];
          
          // 更新分类颜色映射
          const colorMap = {};
          categories.forEach((category, index) => {
            if (!colorMap[category.name]) {
              colorMap[category.name] = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            }
          });
          
          setCategoryDistData(categories);
          setCategoryColorMap(prevMap => ({ ...prevMap, ...colorMap }));
        } catch (error) {
          console.error('获取文章分类分布数据失败:', error);
        } finally {
          setCategoryDistLoading(false);
        }
      };
      
      const fetchArticleCreationStats = async () => {
        setArticleCreationLoading(true);
        try {
          const response = await getArticleCreationTimeStats(articleCreationDays);
          
          // 首先收集所有可能的分类名称
          const allCategories = new Set();
          response.data.forEach(item => {
            if (item.categories) {
              Object.keys(item.categories).forEach(category => {
                allCategories.add(category);
              });
            }
          });
          
          // 处理数据，为堆叠柱状图做准备
          const processedData = response.data.map(item => {
            // 先创建基础对象，包含日期和总数
            const result = {
              date: item.date,
              total: item.count
            };
            
            // 确保每个数据点都包含所有分类的键，如果没有该分类则设置为0
            allCategories.forEach(category => {
              result[category] = (item.categories && item.categories[category]) || 0;
            });
            
            return result;
          });
          
          setArticleCreationData(processedData || []);
        } catch (error) {
          console.error('获取文章创作时间统计数据失败:', error);
        } finally {
          setArticleCreationLoading(false);
        }
      };

      fetchSystemInfo();
      fetchSiteOverview();
      fetchApiTrend();
      fetchUserActivity();
      fetchCategoryDistribution();
      fetchArticleCreationStats();
    }
  }, [isAdmin, apiTrendDays, userActivityDays, articleCreationDays]);

  // 格式化运行时间（秒转为天时分秒）
  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '未知';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days}天 ${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`;
  };

  // 网站概览数据
  const statsData = siteOverview ? {
    articles: siteOverview.total_articles,
    users: siteOverview.total_users,
    comments: siteOverview.total_comments,
    views: siteOverview.total_views,
    likes: siteOverview.total_likes,
    favorites: siteOverview.total_favorites
  } : {
    articles: 0,
    users: 0,
    comments: 0,
    views: 0,
    likes: 0,
    favorites: 0
  };

  // 管理中心功能项
  const adminFeatures = [
    {
      key: 'rbac',
      icon: <LockOutlined />,
      title: '权限管理',
      description: '管理 RBAC 权限策略',
      onClick: () => navigate('/admin/rbac'),
      disabled: false,
      note: '用户管理即将上线',
    },
    {
      key: 'categories',
      icon: <AppstoreOutlined />,
      title: '分类管理',
      description: '管理博客文章分类',
      onClick: () => navigate('/admin/categories'),
    },
    {
      key: 'tags',
      icon: <TagsOutlined />,
      title: '标签管理',
      description: '管理博客文章标签',
      onClick: () => navigate('/admin/tags'),
      disabled: false,
    },
    {
      key: 'comments',
      icon: <CommentOutlined />,
      title: '评论管理',
      description: '审核和管理用户评论',
      onClick: () => navigate('/admin/comments'),
      disabled: false,
    },
    {
      key: 'logs',
      icon: <BarChartOutlined />,
      title: '日志管理',
      description: '查看和分析系统日志',
      onClick: () => navigate('/admin/logs'),
      disabled: false,
    },
    {
      key: 'ai-config',
      icon: <RobotOutlined />,
      title: 'AI助手配置',
      description: '管理AI模型配置与参数',
      onClick: () => navigate('/admin/ai-config'),
      disabled: false,
    },
    {
      key: 'articles',
      icon: <FileTextOutlined />,
      title: '文章管理',
      description: '管理所有博客文章',
      onClick: () => navigate('/admin/articles'),
      disabled: true,
    },
    {
      key: 'notifications',
      icon: <NotificationOutlined />,
      title: '通知管理',
      description: '发布和管理系统通知',
      onClick: () => navigate('/admin/notifications'),
      disabled: true,
    },
  ];

  const location = useLocation();
  const isSubRoute = location.pathname !== '/admin';

  // 检查是否有子路由
  if (isSubRoute) {
    return (
      <Routes>
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="tags" element={<TagManagement />} />
        <Route path="comments" element={<CommentManagement />} />
        <Route path="ai-config" element={<AIConfigManagement />} />
        <Route path="rbac" element={<RBACManagement />} />
        <Route path="logs" element={<LoggerManagement />} />
        <Route path="system-info" element={<SystemInfo />} />
        <Route path="*" element={<Result
          status="404"
          title="页面不存在"
          subTitle="抱歉，您访问的管理页面不存在"
          extra={
            <Button type="primary" onClick={() => navigate('/admin')}>
              返回管理中心
            </Button>
          }
        />} />
      </Routes>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <Result
          status="403"
          title="无权访问"
          subTitle="抱歉，您没有权限访问管理中心页面"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="admin-center">
      {/* 欢迎横幅 */}
      <div className="welcome-banner" style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
        borderRadius: '8px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              <DashboardOutlined style={{ marginRight: 12 }} />
              管理中心
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              欢迎回来，{user?.username || '管理员'}！今天是您的幸运日，博客系统运行良好。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{ backgroundColor: '#f56a00', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)', marginTop: '8px' }}
          />
        </div>
      </div>

      {/* 数据概览卡片 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <BarChartOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
          数据概览
        </Title>
        {overviewLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="加载数据中..." />
          </div>
        ) : (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%)',
                  border: '1px solid rgba(24, 144, 255, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />文章总数</span>}
                  value={statsData.articles}
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%)',
                  border: '1px solid rgba(82, 196, 26, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><UserOutlined style={{ marginRight: '8px', color: '#52c41a' }} />用户总数</span>}
                  value={statsData.users}
                  valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(235, 47, 150, 0.1) 0%, rgba(235, 47, 150, 0.05) 100%)',
                  border: '1px solid rgba(235, 47, 150, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><LikeOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />点赞总数</span>}
                  value={statsData.likes}
                  valueStyle={{ color: '#eb2f96', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(250, 140, 22, 0.1) 0%, rgba(250, 140, 22, 0.05) 100%)',
                  border: '1px solid rgba(250, 140, 22, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><StarOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />收藏总数</span>}
                  value={statsData.favorites}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(250, 173, 20, 0.05) 100%)',
                  border: '1px solid rgba(250, 173, 20, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><CommentOutlined style={{ marginRight: '8px', color: '#faad14' }} />评论总数</span>}
                  value={statsData.comments}
                  valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card
                className="stat-card"
                hoverable
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.1) 0%, rgba(114, 46, 209, 0.05) 100%)',
                  border: '1px solid rgba(114, 46, 209, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><BarChartOutlined style={{ marginRight: '8px', color: '#13c2c2' }} />访问量</span>}
                  value={statsData.views}
                  valueStyle={{ color: '#13c2c2', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* 文章分类分布图表 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <AppstoreOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          文章统计
        </Title>
        
        <Row gutter={[16, 16]} style={{ maxHeight: '500px'}}>
          {/* 文章分类分布图表 */}
          <Col xs={24} lg={12}>
            {categoryDistLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin tip="加载数据中..." />
              </div>
            ) : categoryDistData.length > 0 ? (
              <Card 
                className="article-category-dist-card" 
                title="文章分类分布" 
                bordered={false}
                style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '400px', flex: 1}}>
                  <ResponsiveContainer width="90%" height="90%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={categoryDistData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {categoryDistData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={categoryColorMap[entry.name] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Legend layout="vertical" align="right" verticalAlign="middle" />
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} 篇文章`, 
                          `分类: ${props.payload.name}`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card title="文章分类分布" bordered={false}>
                <Result
                  status="info"
                  title="暂无数据"
                  subTitle="目前没有文章分类分布数据"
                />
              </Card>
            )}
          </Col>
          
          {/* 文章创作时间统计图表 */}
          <Col xs={24} lg={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>文章创作时间统计</span>
                    <Space>
                      <span>查看天数: </span>
                      <Select
                        defaultValue={30}
                        style={{ width: 120 }}
                        onChange={(value) => setArticleCreationDays(value)}
                        options={[
                          { value: 7, label: '最近7天' },
                          { value: 14, label: '最近14天' },
                          { value: 30, label: '最近30天' },
                          { value: 90, label: '最近90天' }
                        ]}
                      />
                    </Space>
                  </div>
                }
                bordered={false}
                className="article-creation-time-card"
                style={{ width: '100%', height: '500px', display: 'flex', flexDirection: 'column' }}
              >
                {articleCreationLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin tip="加载数据中..." />
                  </div>
                ) : articleCreationData.length > 0 ? (
                  <div style={{ height: '400px', flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={articleCreationData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          scale="band" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.substring(5)} // 只显示月-日
                        />
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          tick={{ fontSize: 12 }}
                          label={{ value: '文章数量', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                        <RechartsTooltip
                          formatter={(value, name, props) => {
                            if (name === 'total') {
                              return [`${value}篇`, '总文章数'];
                            } else {
                              return [`${value}篇`, `${name}类文章`];
                            }
                          }}
                          labelFormatter={(label) => `日期: ${label}`}
                        />
                        <Legend />
                        
                        {/* 动态生成所有分类的条形图 */}
                        {articleCreationData.length > 0 && 
                          // 提取所有分类（排除date和total字段）
                          [...new Set(
                            articleCreationData.flatMap(item => 
                              Object.keys(item).filter(key => key !== 'date' && key !== 'total')
                            )
                          )].map((category) => {
                            // 为每个分类计算一个稳定的哈希值作为颜色索引
                            let hashCode = 0;
                            for (let i = 0; i < category.length; i++) {
                              hashCode = ((hashCode << 5) - hashCode) + category.charCodeAt(i);
                              hashCode = hashCode & hashCode; // Convert to 32bit integer
                            }
                            // 确保哈希值为正数
                            hashCode = Math.abs(hashCode);
                            // 使用分类名称的哈希值来确定颜色索引，确保每个分类都有唯一且稳定的颜色
                            const colorIndex = hashCode % CATEGORY_COLORS.length;
                            
                            return (
                              <Bar 
                                key={category}
                                dataKey={category}
                                name={category}
                                stackId="a"
                                fill={categoryColorMap[category] || CATEGORY_COLORS[colorIndex]}
                                yAxisId="left"
                              />
                            );
                          })
                        }
                        
                        {/* 总文章数的线形图 */}
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#ff7300"
                          yAxisId="left"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Result
                    status="info"
                    title="暂无数据"
                    subTitle="目前没有文章创作时间统计数据"
                  />
                )}
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* 用户活跃度图表 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
            用户活跃度趋势
          </Title>
          <Space>
            <span>查看天数: </span>
            <Select
              defaultValue={7}
              style={{ width: 120 }}
              onChange={(value) => setUserActivityDays(value)}
              options={[
                { value: 7, label: '最近7天' },
                { value: 14, label: '最近14天' },
                { value: 30, label: '最近30天' },
                { value: 90, label: '最近90天' }
              ]}
            />
          </Space>
        </div>
        
        {userActivityLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载数据中..." />
          </div>
        ) : userActivityData.length > 0 ? (
          <Card className="user-activity-card" bordered={false}>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userActivityData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.substring(5)} // 只显示月-日
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 'auto']}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      switch(name) {
                        case 'user_count': return [value, '活跃用户数'];
                        default: return [value, name];
                      }
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <defs>
                    <linearGradient id="colorUserCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="user_count" 
                    stroke="#52c41a" 
                    fillOpacity={1} 
                    fill="url(#colorUserCount)" 
                    name="活跃用户数"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Result
            status="info"
            title="暂无数据"
            subTitle="目前没有用户活跃度数据"
          />
        )}
      </div>

      {/* API访问趋势图表 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            API访问趋势
          </Title>
          <Space>
            <span>查看天数: </span>
            <Select
              defaultValue={7}
              style={{ width: 120 }}
              onChange={(value) => setApiTrendDays(value)}
              options={[
                { value: 7, label: '最近7天' },
                { value: 14, label: '最近14天' },
                { value: 30, label: '最近30天' },
                { value: 90, label: '最近90天' }
              ]}
            />
          </Space>
        </div>
        
        {apiTrendLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载数据中..." />
          </div>
        ) : apiTrendData.length > 0 ? (
          <Row gutter={[16, 0]}>
            {/* 总请求和成功请求图表 */}
            <Col xs={24} md={12}>
              <Card className="api-trend-card" title="总请求/成功请求" bordered={false}>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={apiTrendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => value.substring(5)} // 只显示月-日
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          switch(name) {
                            case 'total_count': return [`${value}`, '总请求数'];
                            case 'success_count': return [`${value}`, '成功请求数'];
                            default: return [value, name];
                          }
                        }}
                        labelFormatter={(label) => `日期: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_count" 
                        stroke="#8884d8" 
                        activeDot={{ r: 6 }} 
                        name="总请求数"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success_count" 
                        stroke="#82ca9d" 
                        name="成功请求数"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            
            {/* 错误请求图表 */}
            <Col xs={24} md={12}>
              <Card className="api-trend-card" title="错误请求" bordered={false}>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={apiTrendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => value.substring(5)} // 只显示月-日
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          switch(name) {
                            case 'client_error_count': return [`${value}`, '客户端错误'];
                            case 'server_error_count': return [`${value}`, '服务端错误'];
                            default: return [value, name];
                          }
                        }}
                        labelFormatter={(label) => `日期: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="client_error_count" 
                        stroke="#ffc658" 
                        name="客户端错误"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="server_error_count" 
                        stroke="#ff8042" 
                        name="服务端错误"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            
            {/* 错误率百分比图表 */}
            <Col xs={24} style={{ maxHeight: '415px' }}>
              <Card className="api-trend-card" title="错误率百分比" bordered={false}>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={apiTrendData.map(item => ({
                        ...item,
                        date: item.date.substring(5), // 只显示月-日
                        client_error_rate: item.total_count > 0 ? parseFloat(((item.client_error_count / item.total_count) * 100).toFixed(2)) : 0,
                        server_error_rate: item.total_count > 0 ? parseFloat(((item.server_error_count / item.total_count) * 100).toFixed(2)) : 0
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 12 }}
                        domain={[0, 'auto']}
                      />
                      <RechartsTooltip
                        formatter={(value, name) => {
                          switch(name) {
                            case 'client_error_rate': return [`${value}%`, '客户端错误率'];
                            case 'server_error_rate': return [`${value}%`, '服务端错误率'];
                            default: return [value, name];
                          }
                        }}
                        labelFormatter={(label) => `日期: ${label}`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="client_error_rate" 
                        name="客户端错误率" 
                        fill="#ffc658" 
                        stackId="a"
                        barSize={20}
                      />
                      <Bar 
                        dataKey="server_error_rate" 
                        name="服务端错误率" 
                        fill="#ff8042" 
                        stackId="a"
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Result
            status="info"
            title="暂无数据"
            subTitle="目前没有API访问趋势数据"
          />
        )}
      </div>

      {/* 管理功能块 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <ControlOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          管理功能
        </Title>
        <Row gutter={[16, 16]}>
          {adminFeatures.map(feature => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={feature.key}>
              <Card
                hoverable={!feature.disabled}
                className={`admin-feature-card ${feature.disabled ? 'disabled' : ''}`}
                onClick={!feature.disabled ? feature.onClick : undefined}
              >
                <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <Title level={5} style={{ margin: 0 }}>{feature.title}</Title>
                  <Text type="secondary">{feature.description}</Text>
                  {feature.disabled && <Text type="warning">(即将上线)</Text>}
                  {feature.note && <Text type="warning">({feature.note})</Text>}
                </Space>
              </Card>
            </Col>
          ))}
          </Row>
      </div>

      {/* 系统信息 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            <DesktopOutlined style={{ marginRight: '12px', color: '#13c2c2' }} />
            系统信息
          </Title>
          <Button 
            type="link" 
            onClick={() => navigate('/admin/system-info')} 
            style={{ fontSize: '14px', padding: '4px 0' }}
          >
            查看更多 &gt;
          </Button>
        </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : systemInfo ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><DesktopOutlined style={{ marginRight: '8px', color: '#1890ff' }} />主机名</span>}
                    value={systemInfo.hostname}
                    valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: '500' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <div className="tooltip-wrapper">
                    <Tooltip title="系统已运行时间" getPopupContainer={(trigger) => trigger.parentNode}>
                      <div>
                        <Statistic
                          title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><ClockCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />运行时间</span>}
                          value={formatUptime(systemInfo.uptime)}
                          valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                        />
                      </div>
                    </Tooltip>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><AppstoreOutlined style={{ marginRight: '8px', color: '#722ed1' }} />系统平台</span>}
                    value={`${systemInfo.platform} (${systemInfo.platform_version})`}
                    valueStyle={{ color: '#722ed1', fontSize: '18px', fontWeight: '500' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><ControlOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />内核版本</span>}
                    value={systemInfo.kernel_version}
                    valueStyle={{ color: '#fa8c16', fontSize: '18px', fontWeight: '500' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><HddOutlined style={{ marginRight: '8px', color: '#faad14' }} />系统架构</span>}
                    value={systemInfo.architecture}
                    valueStyle={{ color: '#faad14', fontSize: '18px', fontWeight: '500' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="system-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><BarChartOutlined style={{ marginRight: '8px', color: '#52c41a' }} />进程数量</span>}
                    value={systemInfo.process_count}
                    valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                  />
                </Card>
              </Col>
            </Row>
          ) : (
            <Result
              status="warning"
              title="无法获取系统信息"
              subTitle="请检查系统服务是否正常运行"
            />
          )}
      </div>
    </div>
  );
};

export default AdminCenter;
