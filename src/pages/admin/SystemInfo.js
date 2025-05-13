import React, { useContext, useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Result, Tooltip, Badge, Spin, Progress, Avatar, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  AppstoreOutlined,
  BarChartOutlined,
  ControlOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  HddOutlined,
  ArrowLeftOutlined,
  DatabaseOutlined,
  TableOutlined,
  TagsOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  FundOutlined,
  NodeIndexOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  RocketOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../store/authContext';
import { getSystemInfo, getCPUInfo, getMemoryInfo, getDiskInfo, getGoRuntimeInfo, getDatabaseInfo, getCacheInfo } from '../../services/stat';
import '../../styles/admin/adminCenter.css';
import '../../styles/ai/aiConfigManagement.css';
import '../../styles/admin/systemInfo.css';

const { Title, Text } = Typography;

const SystemInfo = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState(null);
  const [cpuInfo, setCpuInfo] = useState(null);
  const [memoryInfo, setMemoryInfo] = useState(null);
  const [diskInfo, setDiskInfo] = useState(null);
  const [goRuntimeInfo, setGoRuntimeInfo] = useState(null);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  const [loading, setLoading] = useState({system: false, cpu: false, memory: false, disk: false, goRuntime: false, database: false, cache: false});

  // 检查是否是管理员
  const isAdmin = user && user.role === 'admin';
  
  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 获取系统信息和CPU信息
  useEffect(() => {
    if (isAdmin) {
      const fetchSystemInfo = async () => {
        setLoading(prev => ({...prev, system: true}));
        try {
          const response = await getSystemInfo();
          setSystemInfo(response.data);
        } catch (error) {
          console.error('Failed to get system information:', error);
        } finally {
          setLoading(prev => ({...prev, system: false}));
        }
      };

      const fetchCPUInfo = async () => {
        setLoading(prev => ({...prev, cpu: true}));
        try {
          const response = await getCPUInfo();
          setCpuInfo(response.data);
        } catch (error) {
          console.error('Failed to get CPU information:', error);
        } finally {
          setLoading(prev => ({...prev, cpu: false}));
        }
      };

      const fetchMemoryInfo = async () => {
        setLoading(prev => ({...prev, memory: true}));
        try {
          const response = await getMemoryInfo();
          setMemoryInfo(response.data);
        } catch (error) {
          console.error('Failed to get memory information:', error);
        } finally {
          setLoading(prev => ({...prev, memory: false}));
        }
      };

      const fetchDiskInfo = async () => {
        setLoading(prev => ({...prev, disk: true}));
        try {
          const response = await getDiskInfo();
          setDiskInfo(response.data);
        } catch (error) {
          console.error('Failed to get disk information:', error);
        } finally {
          setLoading(prev => ({...prev, disk: false}));
        }
      };

      const fetchGoRuntimeInfo = async () => {
        setLoading(prev => ({...prev, goRuntime: true}));
        try {
          const response = await getGoRuntimeInfo();
          setGoRuntimeInfo(response.data);
        } catch (error) {
          console.error('Failed to get GO runtime information:', error);
        } finally {
          setLoading(prev => ({...prev, goRuntime: false}));
        }
      };

      const fetchDatabaseInfo = async () => {
        setLoading(prev => ({...prev, database: true}));
        try {
          const response = await getDatabaseInfo();
          setDatabaseInfo(response.data);
        } catch (error) {
          console.error('Failed to get database information:', error);
        } finally {
          setLoading(prev => ({...prev, database: false}));
        }
      };

      const fetchCacheInfo = async () => {
        setLoading(prev => ({...prev, cache: true}));
        try {
          const response = await getCacheInfo();
          setCacheInfo(response.data);
        } catch (error) {
          console.error('Failed to get cache information:', error);
        } finally {
          setLoading(prev => ({...prev, cache: false}));
        }
      };

      fetchSystemInfo();
      fetchCPUInfo();
      fetchMemoryInfo();
      fetchDiskInfo();
      fetchGoRuntimeInfo();
      fetchDatabaseInfo();
      fetchCacheInfo();

      // 每300秒刷新一次系统资源信息以获取最新状态
      const infoInterval = setInterval(() => {
        fetchCPUInfo();
        fetchMemoryInfo();
        fetchDiskInfo();
        fetchGoRuntimeInfo();
        fetchDatabaseInfo();
        fetchCacheInfo();
      }, 300000);

      return () => {
        clearInterval(infoInterval);
      };
    }
  }, [isAdmin]);

  // 准备CPU核心使用率数据用于图表展示
  const prepareCpuCoreData = () => {
    if (!cpuInfo || !cpuInfo.per_core_percent) return [];

    return cpuInfo.per_core_percent.map((usage, index) => ({
      name: `核心 ${index + 1}`,
      usage: usage
    }));
  };

  // 格式化运行时间（秒转为天时分秒）
  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '未知';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days}天 ${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`;
  };

  // 格式化磁盘容量为人类易读的格式
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return '未知';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 将纳秒转换为毫秒
  const nsToMs = (nanoseconds) => {
    if (!nanoseconds && nanoseconds !== 0) return '未知';
    // 1毫秒 = 1,000,000纳秒
    return (nanoseconds / 1000000).toFixed(2);
  };

  // 将字节转换为MB
  const bytesToMB = (bytes) => {
    if (!bytes && bytes !== 0) return '未知';
    // 1MB = 1,048,576字节
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  // 准备磁盘IO数据
  const prepareDiskIOData = () => {
    if (!diskInfo) return [];

    return [
      { name: '读取操作', value: diskInfo.io_counters_read_count },
      { name: '写入操作', value: diskInfo.io_counters_write_count }
    ];
  };

  // 准备磁盘IO字节数据
  const prepareDiskIOBytesData = () => {
    if (!diskInfo) return [];

    return [
      { name: '读取字节', value: diskInfo.io_counters_read_bytes },
      { name: '写入字节', value: diskInfo.io_counters_write_bytes }
    ];
  };



  if (!isAdmin) {
    return (
      <Card>
        <Result
          status="403"
          title="无权访问"
          subTitle="抱歉，您没有权限访问系统信息页面"
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
      <div className="system-info-welcome-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin')}
                style={{
                  color: '#fff',
                  fontSize: '14px',
                  marginRight: '16px',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s'
                }}
                className="back-button"
              >
                <span style={{ marginLeft: '4px' }}>返回</span>
              </Button>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <DesktopOutlined style={{ marginRight: 12 }} />
                系统信息
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              查看服务器和系统运行状态信息，实时监控系统性能。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<DesktopOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#13c2c2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* 系统信息 */}
      <div style={{ marginBottom: '24px' }}>
        {loading.system ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : systemInfo ? (
          <>
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
          </>
        ) : (
          <Result
            status="warning"
            title="无法获取系统信息"
            subTitle="请检查系统服务是否正常运行"
          />
        )}
      </div>

      {/* CPU信息 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <HddOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          CPU 信息
        </Title>
        {loading.cpu ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : cpuInfo ? (
          <>
            <Row gutter={[16, 24]}>
              <Col span={24} lg={8}>
                <Card
                  className="cpu-info-box"
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                    borderRadius: '8px',
                    height: '100%'
                  }}
                >
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <Card
                        style={{
                          background: 'rgb(204 199 122)',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}
                      >
                        <div style={{ textAlign: 'center', color: 'white' }}>
                          <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>CPU 型号</h3>
                          <div style={{ fontSize: '16px', fontWeight: '500' }}>{cpuInfo.model_name}</div>
                        </div>
                      </Card>
                    </Col>

                    <Col span={8}>
                      <Card style={{ textAlign: 'center', borderRadius: '8px', height: '100%' }}>
                        <Statistic
                          title={<span style={{ fontSize: '14px' }}>核心数</span>}
                          value={cpuInfo.cores}
                          suffix="核心"
                          valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>

                    <Col span={8}>
                      <Card style={{ textAlign: 'center', borderRadius: '8px', height: '100%' }}>
                        <Statistic
                          title={<span style={{ fontSize: '14px' }}>主频</span>}
                          value={cpuInfo.frequency.toFixed(2)}
                          suffix="MHz"
                          valueStyle={{ color: '#eb2f96', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>

                    <Col span={8}>
                      <Card style={{ textAlign: 'center', borderRadius: '8px', height: '100%' }}>
                        <Statistic
                          title={<span style={{ fontSize: '14px' }}>缓存</span>}
                          value={cpuInfo.cache_size}
                          suffix="KB"
                          valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Card
                      style={{
                        borderRadius: '8px',
                        background: cpuInfo.usage_percent > 80 ? 'rgba(245, 34, 45, 0.05)' :
                                   cpuInfo.usage_percent > 60 ? 'rgba(250, 173, 20, 0.05)' :
                                   'rgba(82, 196, 26, 0.05)'
                      }}
                    >
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>CPU 使用率</span>}
                        value={cpuInfo.usage_percent}
                        precision={1}
                        valueStyle={{
                          color: cpuInfo.usage_percent > 80 ? '#cf1322' : cpuInfo.usage_percent > 60 ? '#faad14' : '#3f8600',
                          fontSize: '24px',
                          fontWeight: 'bold'
                        }}
                        suffix="%"
                      />
                      <Progress
                        percent={cpuInfo.usage_percent}
                        status={
                          cpuInfo.usage_percent > 80 ? 'exception' :
                          cpuInfo.usage_percent > 60 ? 'warning' : 'success'
                        }
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': cpuInfo.usage_percent > 80 ? '#cf1322' : cpuInfo.usage_percent > 60 ? '#faad14' : '#52c41a',
                        }}
                        strokeWidth={10}
                        style={{ marginTop: '8px' }}
                      />
                    </Card>
                  </div>
                </Card>
              </Col>

              <Col span={24} lg={16}>
                <Card
                  className="cpu-chart-container"
                  style={{
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      各核心使用率
                    </Title>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={prepareCpuCoreData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis
                        domain={[0, 100]}
                        label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, '使用率']}
                        contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                      />
                      <Bar
                        dataKey="usage"
                        name="使用率"
                        fill="#1890ff"
                        background={{ fill: '#f5f5f5' }}
                        radius={[4, 4, 0, 0]}
                      >
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Result
            status="info"
            title="CPU信息不可用"
            subTitle="无法获取CPU信息或您没有足够的权限"
          />
        )}
      </div>

      {/* 内存信息 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <HddOutlined style={{ marginRight: '12px', color: '#eb2f96' }} />
          内存信息
        </Title>
        {loading.memory ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : memoryInfo ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12}>
              <Card
                title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>物理内存使用情况</Title>}
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', height: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '已使用', value: memoryInfo.used, fill: '#ff4d4f' },
                              { name: '可用', value: memoryInfo.available, fill: '#52c41a' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                            labelLine={true}
                            startAngle={90}
                            endAngle={-270}
                          >
                          </Pie>
                          <Tooltip formatter={(value) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                          <Statistic
                            title={<span style={{ fontSize: '14px' }}>总内存</span>}
                            value={(memoryInfo.total / (1024 * 1024 * 1024)).toFixed(2)}
                            suffix="GB"
                            valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                          <Statistic
                            title={<span style={{ fontSize: '14px' }}>已使用</span>}
                            value={(memoryInfo.used / (1024 * 1024 * 1024)).toFixed(2)}
                            suffix="GB"
                            valueStyle={{ color: '#ff4d4f', fontSize: '16px' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                          <Statistic
                            title={<span style={{ fontSize: '14px' }}>可用</span>}
                            value={(memoryInfo.available / (1024 * 1024 * 1024)).toFixed(2)}
                            suffix="GB"
                            valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Card
                title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>交换分区使用情况</Title>}
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', height: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      {memoryInfo.swap_total === 0 ? (
                        <div style={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          background: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: '8px',
                          padding: '20px'
                        }}>
                          <HddOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                          <Text style={{ fontSize: '16px', color: '#8c8c8c' }}>系统未配置交换分区</Text>
                          <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px' }}>
                            当前服务器没有启用交换分区功能
                          </Text>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: '已使用', value: memoryInfo.swap_used, fill: '#722ed1' },
                                { name: '空闲', value: memoryInfo.swap_free, fill: '#13c2c2' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={0}
                              outerRadius={80}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                              labelLine={true}
                              startAngle={90}
                              endAngle={-270}
                            >
                            </Pie>
                            <Tooltip formatter={(value) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <Row gutter={[16, 16]}>
                      {memoryInfo.swap_total === 0 ? (
                        <Col span={24}>
                          <Card style={{ textAlign: 'center', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.02)' }}>
                            <Text style={{ fontSize: '14px', color: '#8c8c8c' }}>
                              系统未配置交换分区，所有数值为 0
                            </Text>
                          </Card>
                        </Col>
                      ) : (
                        <>
                          <Col span={8}>
                            <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                              <Statistic
                                title={<span style={{ fontSize: '14px' }}>总大小</span>}
                                value={(memoryInfo.swap_total / (1024 * 1024 * 1024)).toFixed(2)}
                                suffix="GB"
                                valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                              <Statistic
                                title={<span style={{ fontSize: '14px' }}>已使用</span>}
                                value={(memoryInfo.swap_used / (1024 * 1024 * 1024)).toFixed(2)}
                                suffix="GB"
                                valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                              <Statistic
                                title={<span style={{ fontSize: '14px' }}>可用</span>}
                                value={(memoryInfo.swap_free / (1024 * 1024 * 1024)).toFixed(2)}
                                suffix="GB"
                                valueStyle={{ color: '#13c2c2', fontSize: '16px' }}
                              />
                            </Card>
                          </Col>
                        </>
                      )}
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        ) : (
          <Result
            status="info"
            title="内存信息不可用"
            subTitle="无法获取内存信息或您没有足够的权限"
          />
        )}
      </div>

          {/* 磁盘信息 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ margin: '0 0 16px 0' }}>
              <HddOutlined style={{ marginRight: '12px', color: '#fa8c16' }} />
              磁盘信息
            </Title>
              {loading.disk ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="large" />
                </div>
              ) : diskInfo ? (
                <>
                  <Row gutter={[16, 24]}>
                    <Col span={24}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Card
                            title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>磁盘IO操作计数</Title>}
                            style={{
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                              borderRadius: '8px',
                              height: '100%'
                            }}
                            bordered={false}
                          >
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                              <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                  <Pie
                                    data={prepareDiskIOData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {prepareDiskIOData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1890ff' : '#fa8c16'} />
                                    ))}
                                  </Pie>
                                  <Legend />
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                                  <Statistic
                                    title={<span style={{ fontSize: '14px' }}>读取次数</span>}
                                    value={diskInfo.io_counters_read_count.toLocaleString()}
                                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                                  />
                                </Card>
                              </Col>
                              <Col span={12}>
                                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                                  <Statistic
                                    title={<span style={{ fontSize: '14px' }}>写入次数</span>}
                                    value={diskInfo.io_counters_write_count.toLocaleString()}
                                    valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                                  />
                                </Card>
                              </Col>
                            </Row>
                          </Card>
                        </Col>

                        <Col xs={24} md={12}>
                          <Card
                            title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>磁盘IO字节传输</Title>}
                            style={{
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                              borderRadius: '8px',
                              height: '100%'
                            }}
                            bordered={false}
                          >
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                              <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                  data={prepareDiskIOBytesData()}
                                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  layout="vertical"
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis type="number" tickFormatter={(value) => formatBytes(value, 0)} />
                                  <YAxis type="category" dataKey="name" width={80} />
                                  <RechartsTooltip formatter={(value) => formatBytes(value)} />
                                  <Bar dataKey="value" name="IO字节" barSize={30}>
                                    {prepareDiskIOBytesData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? '#13c2c2' : '#722ed1'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                                  <Statistic
                                    title={<span style={{ fontSize: '14px' }}>读取字节</span>}
                                    value={formatBytes(diskInfo.io_counters_read_bytes)}
                                    valueStyle={{ color: '#13c2c2', fontSize: '16px' }}
                                  />
                                </Card>
                              </Col>
                              <Col span={12}>
                                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                                  <Statistic
                                    title={<span style={{ fontSize: '14px' }}>写入字节</span>}
                                    value={formatBytes(diskInfo.io_counters_write_bytes)}
                                    valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                                  />
                                </Card>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      </Row>
                    </Col>

                    <Col span={24}>
                      <Card
                        title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>磁盘分区使用情况</Title>}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px' }}
                        bordered={false}
                      >
                        <Row gutter={[16, 16]}>
                          {diskInfo.partitions.map((partition, index) => (
                            <Col xs={24} sm={24} md={12} lg={8} key={index}>
                              <Card
                                hoverable
                                style={{
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                                  background: partition.usage_percent > 90 ? 'rgba(245, 34, 45, 0.05)' :
                                             partition.usage_percent > 70 ? 'rgba(250, 173, 20, 0.05)' :
                                             'rgba(82, 196, 26, 0.05)',
                                  position: 'relative'
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  zIndex: 1
                                }}>
                                  <Badge
                                    status="processing"
                                    color={
                                      partition.usage_percent > 90 ? '#cf1322' :
                                      partition.usage_percent > 70 ? '#faad14' : '#52c41a'
                                    }
                                    size="default"
                                    style={{ transform: 'scale(1.5)', transformOrigin: 'left top' }}
                                  />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <Title level={5} style={{ margin: '0 0 16px 0' }}>
                                    {partition.mountpoint}
                                  </Title>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                  <Progress
                                    percent={parseFloat(partition.usage_percent.toFixed(2))}
                                    status={
                                      partition.usage_percent > 90 ? 'exception' :
                                      partition.usage_percent > 70 ? 'warning' : 'success'
                                    }
                                    strokeColor={{
                                      '0%': '#108ee9',
                                      '100%': partition.usage_percent > 90 ? '#cf1322' :
                                              partition.usage_percent > 70 ? '#faad14' : '#52c41a',
                                    }}
                                    strokeWidth={10}
                                  />
                                </div>
                                <Row gutter={[8, 8]}>
                                  <Col span={8}>
                                    <Statistic
                                      title={<span style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>总容量</span>}
                                      value={formatBytes(partition.total)}
                                      valueStyle={{ fontSize: '14px', color: '#1890ff', textAlign: 'center' }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title={<span style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>已使用</span>}
                                      value={formatBytes(partition.used)}
                                      valueStyle={{ fontSize: '14px', color: '#ff4d4f', textAlign: 'center' }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title={<span style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>可用</span>}
                                      value={formatBytes(partition.free)}
                                      valueStyle={{ fontSize: '14px', color: '#52c41a', textAlign: 'center' }}
                                    />
                                  </Col>
                                </Row>
                                <div style={{ marginTop: '16px', fontSize: '12px', color: '#8c8c8c', textAlign: 'center' }}>
                                  <Row>
                                    <Col span={12} style={{ textAlign: 'center' }}>设备: {partition.device}</Col>
                                    <Col span={12} style={{ textAlign: 'center' }}>文件系统: {partition.fstype}</Col>
                                  </Row>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : (
                <Result
                  status="info"
                  title="磁盘信息不可用"
                  subTitle="无法获取磁盘信息或您没有足够的权限"
                />
              )}

          </div>

          {/* GO运行时信息 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ margin: '0 0 16px 0' }}>
              <ControlOutlined style={{ marginRight: '12px', color: '#13c2c2' }} />
              GO 运行时信息
            </Title>

              {loading.goRuntime ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="large" />
                </div>
              ) : goRuntimeInfo ? (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><CodeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />GO版本</span>}
                        value={goRuntimeInfo.version}
                        valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><ThunderboltOutlined style={{ marginRight: '8px', color: '#52c41a' }} />Goroutines</span>}
                        value={goRuntimeInfo.goroutines}
                        valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><DeleteOutlined style={{ marginRight: '8px', color: '#722ed1' }} />GC计数</span>}
                        value={goRuntimeInfo.gc_count}
                        valueStyle={{ color: '#722ed1', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><PauseCircleOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />GC暂停(ms)</span>}
                        value={nsToMs(goRuntimeInfo.gc_pause_ns)}
                        valueStyle={{ color: '#fa8c16', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><NodeIndexOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />堆对象数</span>}
                        value={goRuntimeInfo.heap_objects}
                        valueStyle={{ color: '#eb2f96', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                    <Card className="go-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><FundOutlined style={{ marginRight: '8px', color: '#13c2c2' }} />堆分配(MB)</span>}
                        value={bytesToMB(goRuntimeInfo.heap_alloc)}
                        valueStyle={{ color: '#13c2c2', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Result
                  status="info"
                  title="GO运行时信息不可用"
                  subTitle="无法获取GO运行时信息或您没有足够的权限"
                />
              )}
            </div>

          {/* 数据库信息 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ margin: '0 0 16px 0' }}>
              <DatabaseOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
              数据库信息
            </Title>

            {loading.database ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
              </div>
            ) : databaseInfo ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><DatabaseOutlined style={{ marginRight: '8px', color: '#1890ff' }} />数据库类型</span>}
                        value={databaseInfo.db_type}
                        valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><InfoCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />版本</span>}
                        value={databaseInfo.version}
                        valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><ClockCircleOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />运行时间</span>}
                        value={formatUptime(databaseInfo.uptime)}
                        valueStyle={{ color: '#fa8c16', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><HddOutlined style={{ marginRight: '8px', color: '#13c2c2' }} />数据库大小</span>}
                        value={formatBytes(databaseInfo.db_size)}
                        valueStyle={{ color: '#13c2c2', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><TableOutlined style={{ marginRight: '8px', color: '#1890ff' }} />表数量</span>}
                        value={databaseInfo.table_count}
                        valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                    <Card className="db-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                      <Statistic
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><TagsOutlined style={{ marginRight: '8px', color: '#52c41a' }} />索引数量</span>}
                        value={databaseInfo.index_count}
                        valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  {/* 连接池使用情况 */}
                  <Col xs={24} sm={24} md={12}>
                    <Card
                      title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>连接池使用情况</Title>}
                      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', height: '100%' }}
                    >
                      <div className="pool-info-container" style={{ padding: '0px' }}>
                        {/* 连接数可视化 */}
                        <div style={{ marginBottom: '30px' }}>
                          {/* 可视化进度条，展示连接数之间的关系 */}
                          <div style={{ marginBottom: '55px' }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: '16px', fontWeight: 500, color: '#722ed1' }}>活跃连接数: {databaseInfo.pool.open}</Text>
                              <Text style={{ fontSize: '16px', fontWeight: 500, color: '#1890ff' }}>最大连接数: {databaseInfo.pool.max_open}</Text>
                            </div>
                            <div style={{ background: '#f5f5f5', borderRadius: '8px', height: '40px', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                              {/* 最大连接数范围 */}
                              <div style={{ 
                                width: '100%', 
                                height: '40px', 
                                borderRadius: '8px',
                                border: '1px solid #e8e8e8',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                {/* 已用连接 */}
                                <div style={{ 
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: `${(databaseInfo.pool.in_use / databaseInfo.pool.max_open) * 100}%`,
                                  height: '100%',
                                  background: '#ff4d4f',
                                  transition: 'width 0.3s ease'
                                }}></div>
                                {/* 空闲连接 */}
                                <div style={{ 
                                  position: 'absolute',
                                  left: `${(databaseInfo.pool.in_use / databaseInfo.pool.max_open) * 100}%`,
                                  top: 0,
                                  width: `${(databaseInfo.pool.idle / databaseInfo.pool.max_open) * 100}%`,
                                  height: '100%',
                                  background: '#52c41a',
                                  transition: 'width 0.3s ease'
                                }}></div>
                              </div>
                              
                              {/* 图例 */}
                              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '14px', fontSize: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginRight: '24px' }}>
                                  <div style={{ width: '16px', height: '16px', background: '#ff4d4f', marginRight: '8px', borderRadius: '3px' }}></div>
                                  <span style={{ color: 'rgba(255, 77, 79, 0.75)', fontWeight: 400, fontSize: '13px' }}>已用连接: {databaseInfo.pool.in_use}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <div style={{ width: '16px', height: '16px', background: '#52c41a', marginRight: '8px', borderRadius: '3px' }}></div>
                                  <span style={{ color: 'rgba(82, 196, 26, 0.75)', fontWeight: 400, fontSize: '13px' }}>空闲连接: {databaseInfo.pool.idle}</span>
                                </div>
                              </div>
                              {
                                <div style={{ 
                                  marginTop: '12px', 
                                  marginBottom: '20px', 
                                  padding: '8px 12px', 
                                  background: databaseInfo.pool.wait_count > 0 ? 'rgba(250, 173, 20, 0.1)' : 'rgba(82, 196, 26, 0.1)', 
                                  borderRadius: '6px',
                                  borderLeft: databaseInfo.pool.wait_count > 0 ? '4px solid #faad14' : '4px solid #52c41a',
                                  fontSize: '14px',
                                  position: 'relative',
                                  zIndex: 10
                                }}>
                                  {databaseInfo.pool.wait_count > 0 ? (
                                    <>
                                      <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                                      <span style={{ color: '#faad14', fontWeight: 500 }}>等待连接数: {databaseInfo.pool.wait_count}</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                                      <span style={{ color: '#52c41a', fontWeight: 500 }}>暂无数据库请求等待连接</span>
                                    </>
                                  )}
                                </div>
                              }
                            </div>
                          </div>
                          
                          {/* 空闲连接与最大空闲连接的关系 */}
                          <div style={{ height: '40px', clear: 'both' }}></div>
                          <div style={{ marginBottom: '30px', marginTop: '0px', position: 'relative', zIndex: 1 }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: '16px', fontWeight: 500, color: '#52c41a' }}>空闲连接数: {databaseInfo.pool.idle}</Text>
                              <Text style={{ fontSize: '16px', fontWeight: 500, color: '#1890ff' }}>最大空闲连接数: {databaseInfo.pool.max_idle}</Text>
                            </div>
                            <Progress 
                              percent={Math.round((databaseInfo.pool.idle / databaseInfo.pool.max_idle) * 100)} 
                              strokeColor="#52c41a"
                              status="normal"
                              showInfo={true}
                              strokeWidth={12}
                              style={{ height: '28px' }}
                              format={percent => <span style={{ color: '#52c41a', fontWeight: 500 }}>{percent}%</span>}
                            />
                          </div>
                        </div>
                        
                        {/* 连接池状态指标卡片 */}
                        <Row gutter={[16, 16]} style={{ marginTop: '20px', marginBottom: '30px' }}>
                          <Col span={6}>
                            <Card 
                              style={{ 
                                borderRadius: '8px', 
                                height: '100%', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                padding: '10px'
                              }}
                            >
                              <Statistic 
                                title={<span style={{ fontSize: '15px', fontWeight: 600, display: 'block', textAlign: 'center' }}>活跃连接比例</span>}
                                value={Math.round((databaseInfo.pool.open / databaseInfo.pool.max_open) * 100)}
                                suffix="%"
                                valueStyle={{ 
                                  color: databaseInfo.pool.open / databaseInfo.pool.max_open > 0.8 ? '#cf1322' : 
                                         databaseInfo.pool.open / databaseInfo.pool.max_open > 0.6 ? '#faad14' : '#52c41a',
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}
                                prefix={<DatabaseOutlined style={{ marginRight: '5px' }} />}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card 
                              style={{ 
                                borderRadius: '8px', 
                                height: '100%', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                padding: '10px'
                              }}
                            >
                              <Statistic 
                                title={<span style={{ fontSize: '15px', fontWeight: 600, display: 'block', textAlign: 'center' }}>空闲比例</span>}
                                value={databaseInfo.pool.open > 0 ? Math.round((databaseInfo.pool.idle / databaseInfo.pool.open) * 100) : 0}
                                suffix="%"
                                valueStyle={{ 
                                  color: '#13c2c2',
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}
                                prefix={<NodeIndexOutlined style={{ marginRight: '5px' }} />}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card 
                              style={{ 
                                borderRadius: '8px', 
                                height: '100%', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                padding: '10px'
                              }}
                            >
                              <Statistic 
                                title={<span style={{ fontSize: '15px', fontWeight: 600, display: 'block', textAlign: 'center' }}>最大生命周期</span>}
                                value={databaseInfo.pool.max_lifetime}
                                suffix="秒"
                                valueStyle={{ 
                                  color: '#722ed1',
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}
                                prefix={<ClockCircleOutlined style={{ marginRight: '5px' }} />}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card 
                              style={{ 
                                borderRadius: '8px', 
                                height: '100%', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                padding: '10px'
                              }}
                            >
                              <Statistic 
                                title={<span style={{ fontSize: '15px', fontWeight: 600, display: 'block', textAlign: 'center' }}>最大空闲时间</span>}
                                value={databaseInfo.pool.max_idle_time}
                                suffix="秒"
                                valueStyle={{ 
                                  color: '#eb2f96',
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}
                                prefix={<PauseCircleOutlined style={{ marginRight: '5px' }} />}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </Card>
                          </Col>
                        </Row>
                        

                      </div>
                    </Card>
                  </Col>
                  
                  {/* 数据库性能指标 */}
                  <Col xs={24} sm={24} md={12}>
                    <Card
                      title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>数据库性能指标</Title>}
                      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', height: '100%', overflowY: 'auto' }}
                      bodyStyle={{ padding: '12px 20px' }}
                    >
                      {/* 高亮指标展示区域 */}
                      <Row gutter={[16, 16]}>
                        {/* 缓存命中率 - 使用Progress环形进度条 */}
                        <Col xs={24} sm={12}>
                          <Card
                            style={{ 
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', 
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>缓存命中率</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                              <Progress 
                                type="circle" 
                                percent={parseFloat(databaseInfo.cache_hit_rate.toFixed(1))} 
                                width={120}
                                strokeColor={{
                                  '0%': '#108ee9',
                                  '100%': '#1890ff'
                                }}
                                strokeWidth={10}
                                format={(percent) => `${percent}%`}
                              />
                            </div>
                          </Card>
                        </Col>
                        
                        {/* QPS - 使用Gauge效果 */}
                        <Col xs={24} sm={12}>
                          <Card
                            style={{ 
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', 
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>QPS (每秒查询数)</div>
                            </div>
                            <ResponsiveContainer width="100%" height={140}>
                              <PieChart>
                                {/* 添加阈值标记 */}
                                <defs>
                                  <linearGradient id="qpsColorGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#52c41a" />
                                    <stop offset="25%" stopColor="#52c41a" />
                                    <stop offset="50%" stopColor="#faad14" />
                                    <stop offset="75%" stopColor="#f5222d" />
                                  </linearGradient>
                                </defs>
                                
                                {/* 背景圆环 */}
                                <Pie
                                  dataKey="value"
                                  startAngle={180}
                                  endAngle={0}
                                  data={[{ name: 'background', value: 100 }]}
                                  cx="50%"
                                  cy="85%"
                                  outerRadius={100}
                                  innerRadius={80}
                                  fill="#f5f5f5"
                                />
                                
                                {/* 主要数据圆环 */}
                                <Pie
                                  dataKey="value"
                                  startAngle={180}
                                  endAngle={180 - Math.min(databaseInfo.qps, 100) / 100 * 180}
                                  data={[{ name: 'QPS', value: databaseInfo.qps }]}
                                  cx="50%"
                                  cy="85%"
                                  outerRadius={100}
                                  innerRadius={80}
                                  fill={databaseInfo.qps < 25 ? '#52c41a' : databaseInfo.qps < 50 ? '#9FDB1D' : databaseInfo.qps < 75 ? '#faad14' : '#f5222d'}
                                  paddingAngle={0}
                                />
                                
                                {/* 负载状态文本 */}
                                <text
                                  x="50%"
                                  y="60%"
                                  textAnchor="middle"
                                  fill={databaseInfo.qps < 25 ? '#52c41a' : databaseInfo.qps < 50 ? '#9FDB1D' : databaseInfo.qps < 75 ? '#faad14' : '#f5222d'}
                                  fontSize="15"
                                  fontWeight="bold"
                                >
                                  {databaseInfo.qps < 25 ? '负载轻微' : databaseInfo.qps < 50 ? '负载正常' : databaseInfo.qps < 75 ? '负载较高' : '负载警告'}
                                </text>
                                
                                {/* QPS数值 */}
                                <text
                                  x="50%"
                                  y="80%"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    fill: databaseInfo.qps < 25 ? '#52c41a' : databaseInfo.qps < 50 ? '#9FDB1D' : databaseInfo.qps < 75 ? '#faad14' : '#f5222d'
                                  }}
                                >
                                  {databaseInfo.qps.toFixed(1)}
                                </text>
                              </PieChart>
                            </ResponsiveContainer>
                          </Card>
                        </Col>
                      </Row>
                      
                      {/* 主要性能指标 - 使用BarChart */}
                      <Row style={{ marginTop: '16px' }}>
                        <Col span={24}>
                          <Card
                            style={{ 
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', 
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <Tag color="#faad14" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                慢查询阈值: <span style={{ fontWeight: 'bold' }}>{databaseInfo.slow_query_threshold}秒</span>
                              </Tag>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: '8px' }}>
                                (查询执行时间超过此阈值将被记录为慢查询)
                              </div>
                            </div>
                            
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart
                                data={[
                                  {
                                    name: '慢查询数量',
                                    value: databaseInfo.slow_query_count,
                                    fill: '#ff4d4f'
                                  },
                                  {
                                    name: '活跃事务数',
                                    value: databaseInfo.active_transactions,
                                    fill: '#1890ff'
                                  }
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  width={90} 
                                  tick={{ fontSize: 12 }}
                                />
                                <RechartsTooltip 
                                  formatter={(value, name, props) => {
                                    if (props.payload.name === '慢查询数量') {
                                      return [`${value}条`, '最近一小时'];
                                    } else {
                                      return [`${value}个`, '活跃事务'];
                                    }
                                  }}
                                  labelFormatter={() => ''}
                                />
                                <Bar 
                                  dataKey="value" 
                                  name="值"
                                  fill="#8884d8"
                                  barSize={20}
                                  background={{ fill: '#eee' }}
                                  label={{
                                    position: 'right',
                                    fill: '#666',
                                    fontSize: 12,
                                    formatter: (value) => {
                                      return value;
                                    }
                                  }}
                                >
                                  <Cell key="cell-0" fill="#ff4d4f" />
                                  <Cell key="cell-1" fill="#1890ff" />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Card>
                        </Col>
                      </Row>
                      

                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Result
                status="info"
                title="数据库信息不可用"
                subTitle="无法获取数据库信息或您没有足够的权限"
              />
            )}
          </div>

      {/* 缓存信息 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>
          <CloudOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          缓存信息
        </Title>

        {loading.cache ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : cacheInfo ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><CloudOutlined style={{ marginRight: '8px', color: '#1890ff' }} />缓存类型</span>}
                  value={cacheInfo.cache_type}
                  valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: '500' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><InfoCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />版本</span>}
                  value={cacheInfo.version}
                  valueStyle={{ color: '#52c41a', fontSize: '18px', fontWeight: '500' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><RocketOutlined style={{ marginRight: '8px', color: '#722ed1' }} />命中率</span>}
                  value={(cacheInfo.hit_rate || 0).toFixed(2)}
                  suffix="%"
                  valueStyle={{ color: '#722ed1', fontSize: '18px', fontWeight: '500' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><ControlOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />客户端数</span>}
                  value={cacheInfo.connected_clients}
                  valueStyle={{ color: '#fa8c16', fontSize: '18px', fontWeight: '500' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}><KeyOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />键数量</span>}
                  value={cacheInfo.key_count}
                  valueStyle={{ color: '#eb2f96', fontSize: '18px', fontWeight: '500' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="cache-info-item" hoverable style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderRadius: '8px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    <FundOutlined style={{ marginRight: '8px', color: '#13c2c2' }} />内存使用
                  </span>
                  <Row gutter={8} align="middle" justify="center">
                    <Col span={12} style={{ borderRight: '1px solid #f0f0f0' }}>
                      <div style={{ padding: '0 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>当前:</div>
                        <div style={{ color: '#13c2c2', fontSize: '18px', fontWeight: '500' }}>{formatBytes(cacheInfo.used_memory)}</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ padding: '0 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>峰值:</div>
                        <div style={{ color: '#fa8c16', fontSize: '18px', fontWeight: '500' }}>{formatBytes(cacheInfo.used_memory_peak)}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Result
            status="info"
            title="缓存信息不可用"
            subTitle="无法获取缓存信息或您没有足够的权限"
          />
        )}
      </div>
    </div>
  );
};
export default SystemInfo;
