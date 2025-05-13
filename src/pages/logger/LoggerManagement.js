import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Tooltip,
  Tag,
  Avatar,
  Row,
  Col,
  Form,
  Input,
  Select,
  DatePicker,
  Drawer,
  message,
  Empty,
  Alert
} from 'antd';
import GoErrorStack from '../../components/logger/GoErrorStack';
import {
  FileSearchOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  LeftOutlined,
  BugOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  UserOutlined,
  TagOutlined,
  FileTextOutlined,
  CodeOutlined,
  SwapOutlined,
  SyncOutlined,
  CopyOutlined,
  OrderedListOutlined,
  ApartmentOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import ReactJson from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { getLogs } from '../../services/logger';
import { AuthContext } from '../../store/authContext';
import '../../styles/admin/adminCenter.css';
import '../../styles/logger/loggerManagement.css';
import '../../styles/logger/goErrorStack.css';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 为了保持代码简洁，定义日志级别对应的颜色和图标
const levelConfig = {
  debug: {
    color: '#2f54eb',
    icon: <BugOutlined />,
    tagClassName: 'level-debug'
  },
  info: {
    color: '#1890ff',
    icon: <InfoCircleOutlined />,
    tagClassName: 'level-info'
  },
  warn: {
    color: '#faad14',
    icon: <ExclamationCircleOutlined />,
    tagClassName: 'level-warn'
  },
  error: {
    color: '#f5222d',
    icon: <CloseCircleOutlined />,
    tagClassName: 'level-error'
  },
  dpanic: {
    color: '#eb2f96',
    icon: <CloseCircleOutlined />,
    tagClassName: 'level-dpanic'
  },
  panic: {
    color: '#722ed1',
    icon: <CloseCircleOutlined />,
    tagClassName: 'level-panic'
  },
  fatal: {
    color: '#000000',
    icon: <CloseCircleOutlined />,
    tagClassName: 'level-fatal'
  }
};

const LoggerManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter'],
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
  });

  // 查询条件状态
  const [queryParams, setQueryParams] = useState({});
  const [timeRange, setTimeRange] = useState(null);

  // JSON数据展示相关状态
  const [jsonViewMode, setJsonViewMode] = useState('tree'); // tree 或 raw
  const [jsonParsedData, setJsonParsedData] = useState(null);

  // 检查是否有管理员权限
  const isAdmin = user && user.role === 'admin';

  // 获取日志列表 - 使用useCallback避免每次渲染都创建新函数
  const fetchData = React.useCallback(async (page = 1, pageSize = 10, query = {}) => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      // 准备查询参数
      const params = {
        page,
        page_size: pageSize,
        ...query
      };

      // 获取日志列表
      const response = await getLogs(params);
      if (response && response.data) {
        setLogs(response.data.items || []);
        setPagination({
          current: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          position: ['bottomCenter'],
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        });
      }
    } catch (error) {
      console.error('Failed to fetch log data:', error);
      message.error('获取日志数据失败');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData(1, pagination.pageSize, queryParams);
    }
  }, [pagination.pageSize, isAdmin, fetchData, queryParams]);

  // 处理查询
  const handleQuery = async (values) => {
    // 处理时间范围
    let queryValues = { ...values };
    if (timeRange && timeRange.length === 2) {
      queryValues.start_time = timeRange[0].format('YYYY-MM-DD HH:mm:ss');
      queryValues.end_time = timeRange[1].format('YYYY-MM-DD HH:mm:ss');
    }
    delete queryValues.time_range;

    // 过滤掉空值
    const filteredValues = Object.entries(queryValues).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    setQueryParams(filteredValues);
    // 查询时重置到第一页
    fetchData(1, pagination.pageSize, filteredValues);
  };

  // 重置查询
  const handleResetQuery = () => {
    form.resetFields();
    setTimeRange(null);
    setQueryParams({});
    fetchData(1, pagination.pageSize, {});
  };

  // 表格分页变化处理
  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize, queryParams);
  };

  // 递归解析JSON字符串字段
  const parseNestedJson = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => parseNestedJson(item));
    }

    // 处理对象
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      // 如果值是字符串，尝试解析为JSON
      if (typeof value === 'string' && value.trim() !== '') {
        try {
          // 检查是否可能是JSON字符串 (以 { 开头或 [ 开头)
          if ((value.trim().startsWith('{') && value.trim().endsWith('}')) ||
              (value.trim().startsWith('[') && value.trim().endsWith(']'))) {
            const parsedValue = JSON.parse(value);
            // 只有成功解析为对象或数组时才替换
            if (typeof parsedValue === 'object' && parsedValue !== null) {
              // 递归解析嵌套的JSON
              result[key] = parseNestedJson(parsedValue);
              return;
            }
          }
        } catch (e) {
          // 解析失败，保持原始字符串
        }
      }

      // 如果值是对象，递归解析
      if (value && typeof value === 'object') {
        result[key] = parseNestedJson(value);
        return;
      }

      // 其他情况保持原值
      result[key] = value;
    });

    return result;
  };

  // 查看日志详情
  const handleViewDetail = (record) => {
    setCurrentLog(record);
    setDrawerVisible(true);

    // 尝试解析JSON数据
    if (record.data && typeof record.data === 'string' && record.data.trim() !== '') {
      try {
        // 先解析顶层JSON
        const parsedData = JSON.parse(record.data);

        // 递归解析嵌套的JSON字符串
        const fullyParsedData = parseNestedJson(parsedData);
        setJsonParsedData(fullyParsedData);
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        setJsonParsedData(null);
      }
    } else {
      setJsonParsedData(null);
    }

    // 重置JSON视图状态
    setJsonViewMode('tree');
  };

  // 切换JSON视图模式
  const handleToggleJsonViewMode = () => {
    setJsonViewMode(prevMode => prevMode === 'tree' ? 'raw' : 'tree');
  };

  // 刷新日志列表
  const handleRefresh = () => {
    fetchData(pagination.current, pagination.pageSize, queryParams);
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (dates) => {
    setTimeRange(dates);
  };

  // 格式化日志时间
  const formatTime = (time) => {
    if (!time) return '-';
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
  };

  // 渲染日志级别标签
  const renderLevelTag = (level) => {
    const config = levelConfig[level?.toLowerCase()] || {
      color: '#8c8c8c',
      icon: <InfoCircleOutlined />,
      tagClassName: ''
    };

    return (
      <Tag
        icon={config.icon}
        className={`level-tag ${config.tagClassName}`}
      >
        {level?.toUpperCase() || 'UNKNOWN'}
      </Tag>
    );
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      ellipsis: true
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      ellipsis: true,
      render: (text) => <span>{formatTime(text)}</span>
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (text) => renderLevelTag(text)
    },
    {
      title: '标签',
      dataIndex: 'tag',
      key: 'tag',
      width: 110,
      ellipsis: true,
      render: (text) => (
        text ? (
          <Tag color="cyan" icon={<TagOutlined />}>
            {text}
          </Tag>
        ) : (
          '-'
        )
      )
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      ellipsis: true,
      render: (text, record) => (
        text ? (
          <span>
            <UserOutlined style={{ marginRight: 8 }} />
            {text}
          </span>
        ) : (
          record.user_id ? `用户 ID: ${record.user_id}` : '-'
        )
      )
    },
    {
      title: '追踪ID',
      dataIndex: 'trace_id',
      key: 'trace_id',
      width: 120,
      ellipsis: true,
      render: (text) => (
        text ? (
          <Tooltip title={text}>
            <Tag color="blue" icon={<SwapOutlined />}>
              {text.substring(0, 8)}...
            </Tag>
          </Tooltip>
        ) : (
          '-'
        )
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      width: 300,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'operations',
      width: 70,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<FileSearchOutlined />}
            onClick={() => handleViewDetail(record)}
            title="查看详情"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="logger-management">
      {/* 欢迎横幅 */}
      <div className="logger-welcome-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                icon={<LeftOutlined />}
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
                <FileSearchOutlined style={{ marginRight: 12 }} />
                系统日志
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              查看和搜索系统日志记录，帮助排查问题和监控系统状态。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<FileSearchOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#1890ff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* 如果不是管理员，显示无权限提示 */}
      {!isAdmin && (
        <Alert
          message="无权限查看日志"
          description="只有管理员才能访问系统日志功能。如需查看，请联系系统管理员。"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button type="primary" onClick={() => navigate('/admin')}>
              返回管理中心
            </Button>
          }
        />
      )}

      {/* 只有管理员可以查看以下内容 */}
      {isAdmin && (
        <>
          {/* 日志筛选表单 */}
          <Card
            className="logger-filter-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>日志筛选</Title>
                <Tooltip title="可以通过多种条件筛选系统日志" placement="top">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                </Tooltip>
              </div>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form
              form={form}
              onFinish={handleQuery}
              layout="horizontal"
              className="logger-filter-form"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6} lg={6}>
                  <Form.Item name="level" label="日志级别">
                    <Select
                      placeholder="请选择日志级别"
                      allowClear
                    >
                      <Option value="debug">DEBUG</Option>
                      <Option value="info">INFO</Option>
                      <Option value="warn">WARN</Option>
                      <Option value="error">ERROR</Option>
                      <Option value="dpanic">DPANIC</Option>
                      <Option value="panic">PANIC</Option>
                      <Option value="fatal">FATAL</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={6}>
                  <Form.Item name="trace_id" label="追踪ID">
                    <Input
                      placeholder="请输入追踪ID"
                      prefix={<SwapOutlined />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={6}>
                  <Form.Item name="username" label="用户名">
                    <Input
                      placeholder="请输入用户名关键词"
                      prefix={<UserOutlined />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={6}>
                  <Form.Item name="tag" label="日志标签">
                    <Select
                      placeholder="请选择日志标签"
                      allowClear
                    >
                      <Option value="main">main</Option>
                      <Option value="recovery">recovery</Option>
                      <Option value="request">request</Option>
                      <Option value="login">login</Option>
                      <Option value="logout">logout</Option>
                      <Option value="system">system</Option>
                      <Option value="operate">operate</Option>
                      <Option value="ai">ai</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={12} lg={12}>
                  <Form.Item name="message" label="日志消息">
                    <Input
                      placeholder="请输入日志消息关键词"
                      prefix={<SearchOutlined />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12}>
                  <Form.Item name="time_range" label="时间范围">
                    <RangePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder={['开始时间', '结束时间']}
                      onChange={handleTimeRangeChange}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24} style={{ textAlign: 'right' }}>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button style={{ marginLeft: 8 }} onClick={handleResetQuery} icon={<ClearOutlined />}>
                    重置
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* 日志表格卡片 */}
          <Card
            className="logger-table-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>系统日志列表</Title>
                <Tooltip title="系统自动记录的运行日志信息">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                </Tooltip>
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleRefresh}
              >
                刷新
              </Button>
            }
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={logs}
              pagination={pagination}
              loading={loading}
              onChange={handleTableChange}
              className="logger-table"
              bordered={false}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无日志数据"
                    className="logger-empty"
                  >
                    <Button type="primary" onClick={handleRefresh} icon={<SyncOutlined />}>
                      刷新数据
                    </Button>
                  </Empty>
                )
              }}
            />
          </Card>

          {/* 日志详情抽屉 */}
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FileSearchOutlined style={{ fontSize: '18px', marginRight: '8px', color: '#1890ff' }} />
                <span>日志详情</span>
                {currentLog && (
                  <Tag
                    style={{ marginLeft: '12px' }}
                    className={`level-tag ${levelConfig[currentLog.level?.toLowerCase()]?.tagClassName || ''}`}
                  >
                    {currentLog.level?.toUpperCase() || 'UNKNOWN'}
                  </Tag>
                )}
              </div>
            }
            width={720}
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            className="logger-detail-drawer"
            extra={
              <Button type="primary" onClick={() => setDrawerVisible(false)}>
                关闭
              </Button>
            }
          >
            {currentLog && (
              <div className="logger-detail-content">
                {/* 顶部状态栏 - 变色区域根据日志级别 */}
                <div
                  className={`logger-detail-header ${levelConfig[currentLog.level?.toLowerCase()]?.tagClassName || ''}`}
                >
                  <div className="logger-detail-header-id">
                    <div className="logger-detail-header-label">日志 ID</div>
                    <div className="logger-detail-header-value">{currentLog.id}</div>
                  </div>
                  <div className="logger-detail-header-time">
                    <div className="logger-detail-header-label">
                      <FieldTimeOutlined /> 记录时间
                    </div>
                    <div className="logger-detail-header-value">{formatTime(currentLog.created_at)}</div>
                  </div>
                </div>

                {/* 基础信息卡片 */}
                <Card
                  title={<div className="logger-detail-card-title"><InfoCircleOutlined /> 基础信息</div>}
                  className="logger-detail-card"
                  size="small"
                >
                  <div className="logger-detail-card-content">
                    {/* 用户信息 */}
                    {(currentLog.username || (currentLog.user_id && currentLog.user_id.toString().trim() !== '')) && (
                      <div className="logger-detail-item">
                        <div className="logger-detail-item-label">
                          <UserOutlined /> 用户信息
                        </div>
                        <div className="logger-detail-item-value">
                          {currentLog.username ? (
                            <span>{currentLog.username} {currentLog.user_id ? `(ID: ${currentLog.user_id})` : ''}</span>
                          ) : (
                            <span>{`用户 ID: ${currentLog.user_id}`}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 日志标签 */}
                    {(currentLog.tag && currentLog.tag.trim() !== '') && (
                      <div className="logger-detail-item">
                        <div className="logger-detail-item-label">
                          <TagOutlined /> 日志标签
                        </div>
                        <div className="logger-detail-item-value">
                          <Tag color="cyan">{currentLog.tag}</Tag>
                        </div>
                      </div>
                    )}

                    {/* 追踪ID */}
                    {(currentLog.trace_id && currentLog.trace_id.trim() !== '') && (
                      <div className="logger-detail-item">
                        <div className="logger-detail-item-label">
                          <SwapOutlined /> 追踪 ID
                        </div>
                        <div className="logger-detail-item-value">
                          <Tooltip title={currentLog.trace_id}>
                            <Tag color="blue">{currentLog.trace_id}</Tag>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 日志消息卡片 */}
                {(currentLog.message && currentLog.message.trim() !== '') && (
                  <Card
                    title={<div className="logger-detail-card-title"><FileTextOutlined /> 日志消息</div>}
                    className="logger-detail-card"
                    size="small"
                  >
                    <div className="logger-detail-message">
                      {currentLog.message}
                    </div>
                  </Card>
                )}

                {/* 日志数据区 */}
                {(currentLog.data && currentLog.data.trim && currentLog.data.trim() !== '') && (
                  <Card
                    title={
                      <div className="logger-detail-card-title">
                        <CodeOutlined /> 日志数据
                      </div>
                    }
                    className="logger-detail-card"
                    size="small"
                    style={{ marginTop: 16 }}
                    extra={
                      <Space>
                        {/* 视图模式切换 */}
                        <Tooltip title={jsonViewMode === 'tree' ? '切换到原始视图' : '切换到树形视图'}>
                          <Button
                            type="text"
                            icon={jsonViewMode === 'tree' ? <ApartmentOutlined /> : <OrderedListOutlined />}
                            size="small"
                            onClick={handleToggleJsonViewMode}
                          />
                        </Tooltip>

                        {/* 复制按钮 */}
                        <Tooltip title="复制内容">
                          <Button
                            type="text"
                            icon={<CopyOutlined />}
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(currentLog.data);
                              message.success('已复制到剪贴板');
                            }}
                          />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <div className="logger-detail-code-container">
                      {jsonViewMode === 'tree' ? (
                        <div className="json-viewer-container">
                          {jsonParsedData && (
                            <div>
                              <ReactJson
                                src={jsonParsedData}
                                name={null}
                                theme="winter-is-coming"
                                collapsed={false}
                                displayDataTypes={true}
                                enableClipboard={true}
                                displaySize={true}
                                indentWidth={2}
                                collapseStringsAfterLength={80}
                                iconStyle="circle"
                                shouldCollapse={false}
                                style={{
                                  backgroundColor: 'transparent',
                                  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className="logger-detail-code logger-detail-data">{currentLog.data}</pre>
                      )}
                    </div>
                  </Card>
                )}

                {/* 错误堆栈区 */}
                {(currentLog.stack && currentLog.stack.trim && currentLog.stack.trim() !== '') && (
                  <Card
                    title={<div className="logger-detail-card-title"><BugOutlined /> 错误堆栈</div>}
                    className="logger-detail-card"
                    size="small"
                    style={{ marginTop: 16 }}
                    styles={{ body: { padding: 0 } }}
                    extra={
                      <Tooltip title="复制完整堆栈">
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => {
                            GoErrorStack.utils.copyStackToClipboard(currentLog.stack);
                          }}
                        />
                      </Tooltip>
                    }
                  >
                    <GoErrorStack stackTrace={currentLog.stack} />
                  </Card>
                )}
              </div>
            )}
          </Drawer>
        </>
      )}
    </div>
  );
};

export default LoggerManagement;