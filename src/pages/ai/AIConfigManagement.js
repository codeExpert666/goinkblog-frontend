import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Typography,
  Tooltip,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic,
  InputNumber,
  Select,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  ApiOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  ClearOutlined,
  LeftOutlined,
  ClockCircleOutlined,
  KeyOutlined
} from '@ant-design/icons';
import {
  getModels,
  createModel,
  updateModel,
  deleteModel,
  resetModelStats,
  resetAllModelStats,
  getModelsOverview
} from '../../services/ai';
import { AuthContext } from '../../store/authContext';
import '../../styles/admin/adminCenter.css';
import '../../styles/ai/aiConfigManagement.css';
import '../../styles/ai/aiModal.css';

const { Title, Text } = Typography;
const { Option } = Select;

const AIConfigManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增AI模型配置');
  const [currentModel, setCurrentModel] = useState(null);
  const [isModelActive, setIsModelActive] = useState(true); // 新增状态跟踪
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter'],
  });
  const [sortState, setSortState] = useState({
    sort_by_weight: undefined,
    sort_by_rpm: undefined,
    sort_by_current_tokens: undefined,
    sort_by_success_count: undefined,
    sort_by_failure_count: undefined,
    sort_by_avg_latency: undefined,
  });

  // 查询条件状态
  const [queryForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState({
    provider: undefined,
    model: undefined,
    active: undefined
  });
  // 存储后端返回的统计数据
  const [statsData, setStatsData] = useState({
    total_models: 0,
    active_models: 0,
    total_requests: 0,
    total_success: 0,
    total_failure: 0,
    overall_success_rate: 0,
    overall_avg_latency: 0,
    total_available_tokens: 0,
    most_used_model: {},
    most_successful_model: {},
    fastest_model: {}
  });

  // 检查是否有管理员权限
  const isAdmin = user && user.role === 'admin';

  // 获取模型列表和概览数据
  const fetchData = async (page = 1, pageSize = 10, sorters = {}, query = {}) => {
    setLoading(true);
    setStatsLoading(true);
    try {
      // 准备排序和查询参数
      const params = {
        page,
        page_size: pageSize,
        ...sorters,
        ...query
      };

      // 获取模型列表
      const response = await getModels(params);
      if (response && response.data) {
        setModels(response.data.models || []);
        setPagination({
          current: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          position: ['bottomCenter'],
        });
      }

      // 获取统计数据
      const statsResponse = await getModelsOverview();
      if (statsResponse && statsResponse.data) {
        setStatsData(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI model data:', error);
      message.error('获取AI模型数据失败');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize, {}, queryParams);
  }, [pagination.pageSize, queryParams]);

  // 处理查询
  const handleQuery = async (values) => {
    // 过滤掉空值
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    setQueryParams(filteredValues);
    // 查询时重置到第一页
    fetchData(1, pagination.pageSize, sortState, filteredValues);
  };

  // 重置查询
  const handleResetQuery = () => {
    queryForm.resetFields();
    setQueryParams({});
    fetchData(1, pagination.pageSize, sortState, {});
  };

  // 自定义列排序处理
  const handleColumnSort = (field) => {
    // 创建新的排序状态
    const newSortState = { ...sortState };

    // 根据列字段确定要更新的排序状态属性
    let sortKey = `sort_by_${field}`;

    // 循环切换排序状态：无 -> 升序 -> 降序 -> 无
    if (!newSortState[sortKey]) {
      newSortState[sortKey] = 'asc';
    } else if (newSortState[sortKey] === 'asc') {
      newSortState[sortKey] = 'desc';
    } else {
      newSortState[sortKey] = undefined;
    }

    // 更新排序状态
    setSortState(newSortState);

    // 构建API所需的排序参数
    const sortParams = {};
    Object.entries(newSortState).forEach(([key, value]) => {
      if (value) {
        sortParams[key] = value;
      }
    });

    fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
  };

  // 表格分页变化处理
  const handleTableChange = (pagination) => {
    const sortParams = {};
    Object.entries(sortState).forEach(([key, value]) => {
      if (value) {
        sortParams[key] = value;
      }
    });

    fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
  };

  // 打开新增模型模态框
  const handleAddModel = () => {
    form.resetFields();
    form.setFieldsValue({
      provider: 'openai',
      temperature: 0.7,
      timeout: 30,
      active: true,
      rpm: 10,
      weight: 100
    });
    setCurrentModel(null);
    setIsModelActive(true); // 设置默认为启用状态
    setModalTitle('新增AI模型配置');
    setModalVisible(true);
  };

  // 打开编辑模型模态框
  const handleEditModel = (record) => {
    form.setFieldsValue({
      provider: record.provider,
      api_key: record.api_key,
      endpoint: record.endpoint,
      model_name: record.model_name,
      temperature: record.temperature,
      timeout: record.timeout,
      active: record.active,
      description: record.description,
      rpm: record.rpm,
      weight: record.weight
    });
    setCurrentModel(record);
    // 设置模型的启用/禁用状态，用于模态框底部的开关
    setIsModelActive(record.active);
    setModalTitle('编辑AI模型配置');
    setModalVisible(true);
  };

  // 保存模型配置
  const handleSaveModel = async () => {
    try {
      // 获取表单字段值
      const values = await form.validateFields();

      // 使用isModelActive状态值设置active字段
      values.active = isModelActive;

      if (currentModel) {
        // 更新模型
        await updateModel(currentModel.id, values);
        message.success('AI模型配置更新成功');
      } else {
        // 新增模型
        await createModel(values);
        message.success('AI模型配置创建成功');
      }

      setModalVisible(false);

      // 保留当前的排序状态
      const sortParams = {};
      Object.entries(sortState).forEach(([key, value]) => {
        if (value) {
          sortParams[key] = value;
        }
      });

      fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
    } catch (error) {
      console.error('Failed to save AI model config:', error);

      // 错误处理
      if (error.code === 409 || (error.response && error.response.status === 409)) {
        message.error('模型配置已存在，请检查模型名称和提供商');
      } else {
        message.error('保存AI模型配置失败');
      }
    }
  };

  // 删除模型配置
  const handleDeleteModel = async (id) => {
    try {
      await deleteModel(id);
      message.success('AI模型配置删除成功');

      // 保留当前的排序状态
      const sortParams = {};
      Object.entries(sortState).forEach(([key, value]) => {
        if (value) {
          sortParams[key] = value;
        }
      });

      fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
    } catch (error) {
      console.error('Failed to delete AI model config:', error);
      message.error('删除AI模型配置失败');
    }
  };

  // 重置单个模型统计
  const handleResetModelStats = async (id) => {
    try {
      await resetModelStats(id);
      message.success('模型统计数据已重置');

      // 保留当前的排序状态
      const sortParams = {};
      Object.entries(sortState).forEach(([key, value]) => {
        if (value) {
          sortParams[key] = value;
        }
      });

      fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
    } catch (error) {
      console.error('Failed to reset model statistics data:', error);
      message.error('重置模型统计数据失败');
    }
  };

  // 重置所有模型统计
  const handleResetAllStats = async () => {
    Modal.confirm({
      title: '重置所有模型统计',
      icon: <ExclamationCircleOutlined />,
      content: '确定要重置所有AI模型的使用统计数据吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await resetAllModelStats();
          message.success('所有模型统计数据已重置');

          // 保留当前的排序状态
          const sortParams = {};
          Object.entries(sortState).forEach(([key, value]) => {
            if (value) {
              sortParams[key] = value;
            }
          });

          fetchData(pagination.current, pagination.pageSize, sortParams, queryParams);
        } catch (error) {
          console.error('Failed to reset all model statistics data:', error);
          message.error('重置所有模型统计数据失败');
        }
      },
      okText: '确定',
      cancelText: '取消',
    });
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (text) => (
        <Tag color={text === 'openai' ? 'green' : 'blue'}>
          {text.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('weight')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          权重
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_weight ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_weight ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_weight === 'asc' ? '↑' : (sortState.sort_by_weight === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('rpm')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          RPM
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_rpm ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_rpm ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_rpm === 'asc' ? '↑' : (sortState.sort_by_rpm === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'rpm',
      key: 'rpm',
      width: 80,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('current_tokens')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          可用令牌
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_current_tokens ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_current_tokens ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_current_tokens === 'asc' ? '↑' : (sortState.sort_by_current_tokens === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'current_tokens',
      key: 'current_tokens',
      width: 100,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('success_count')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          成功数
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_success_count ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_success_count ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_success_count === 'asc' ? '↑' : (sortState.sort_by_success_count === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'success_count',
      key: 'success_count',
      width: 100,
      render: (text) => <Tag color="success">{text}</Tag>,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('failure_count')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          失败数
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_failure_count ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_failure_count ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_failure_count === 'asc' ? '↑' : (sortState.sort_by_failure_count === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 100,
      render: (text) => <Tag color="error">{text}</Tag>,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('avg_latency')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          平均延迟(ms)
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_avg_latency ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_avg_latency ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_avg_latency === 'asc' ? '↑' : (sortState.sort_by_avg_latency === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'avg_latency',
      key: 'avg_latency',
      width: 120,
      render: (text) => text ? text.toFixed(2) : '-',
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditModel(record)}
            disabled={!isAdmin}
            title="编辑模型配置"
          />
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={() => handleResetModelStats(record.id)}
            disabled={!isAdmin}
            title="重置统计数据"
          />
          <Popconfirm
            title="确定要删除这个模型配置吗?"
            onConfirm={() => handleDeleteModel(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!isAdmin}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!isAdmin}
              title="删除模型配置"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="ai-config-management">
      {/* 欢迎横幅 */}
      <div className="welcome-banner">
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
                <RobotOutlined style={{ marginRight: 12 }} />
                AI助手配置
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              管理AI大语言模型配置，优化内容生成与智能交互体验。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<RobotOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#722ed1',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* 数据概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="模型总数"
              value={statsData.total_models}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              其中 {statsData.active_models} 个模型处于启用状态
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="总请求数"
              value={statsData.total_requests}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              成功率: {statsData.overall_success_rate ? `${statsData.overall_success_rate.toFixed(2)}%` : '0%'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="平均延迟"
              value={statsData.overall_avg_latency ? statsData.overall_avg_latency.toFixed(2) : 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="可用令牌总数"
              value={statsData.total_available_tokens}
              prefix={<KeyOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={12} xl={8}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="使用最多的模型"
              value={statsData.most_used_model?.model_name || '-'}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
            {statsData.most_used_model?.request_count > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                共 {statsData.most_used_model?.request_count || 0} 次请求
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={12} xl={8}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="最成功的模型"
              value={statsData.most_successful_model?.model_name || '-'}
              valueStyle={{ color: '#52c41a', fontSize: '16px' }}
            />
            {statsData.most_successful_model?.success_rate && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                成功率: {statsData.most_successful_model?.success_rate.toFixed(2)}%
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={12} xl={8}>
          <Card className="stat-card" loading={statsLoading}>
            <Statistic
              title="最快的模型"
              value={statsData.fastest_model?.model_name || '-'}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
            {statsData.fastest_model?.avg_latency && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                平均延迟: {statsData.fastest_model?.avg_latency.toFixed(2)}ms
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 模型筛选表单 */}
      <Card
        className="ai-filter-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>模型筛选</Title>
            <Tooltip title="可以通过多种条件筛选AI模型" placement="top">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
        style={{ marginBottom: '24px' }}
      >
        <Form
          form={queryForm}
          onFinish={handleQuery}
          layout="horizontal"
          className="ai-filter-form"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="provider" label="提供商">
                <Select placeholder="请选择提供商" allowClear>
                  <Option value="openai">OpenAI</Option>
                  <Option value="local">本地模型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="model_name" label="模型名称">
                <Input
                  placeholder="请输入模型名称"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="active" label="模型状态">
                <Select placeholder="模型状态" allowClear>
                  <Option value="true">启用</Option>
                  <Option value="false">禁用</Option>
                </Select>
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

      {/* 模型表格卡片 */}
      <Card
        className="ai-table-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>AI模型配置列表</Title>
            {!isAdmin && (
              <Tooltip title="只有管理员可以创建、编辑和删除AI模型配置">
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            )}
            <Tooltip title="点击列标题可以进行排序">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetAllStats}
              disabled={!isAdmin}
            >
              重置所有统计
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddModel}
              disabled={!isAdmin}
              className="add-ai-button"
            >
              新增模型配置
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={models}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          className="ai-table"
          bordered={false}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 模型配置模态框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveModel}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        className="ai-modal"
        destroyOnClose
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ marginRight: '8px' }}>状态:</span>
              <Switch
                checked={isModelActive}
                onChange={(checked) => {
                  setIsModelActive(checked);
                  form.setFieldsValue({ active: checked });
                }}
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </div>
            <div>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSaveModel} style={{ marginLeft: 8 }}>保存</Button>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="provider"
                label="提供商"
                rules={[{ required: true, message: '请选择提供商' }]}
              >
                <Select
                  placeholder="请选择提供商"
                  onChange={(value) => {
                    if (value === 'local') {
                      form.setFieldsValue({
                        api_key: 'ollama',
                        endpoint: 'http://localhost:11434/v1/chat/completions'
                      });
                    }
                  }}
                >
                  <Option value="openai">OpenAI</Option>
                  <Option value="local">本地模型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model_name"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="例如：gpt-4-turbo, claude-3-opus" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="api_key"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password placeholder="请输入API密钥" />
          </Form.Item>

          <Form.Item
            name="endpoint"
            label="API端点"
            rules={[
              { required: true, message: '请输入API端点' },
              {
                type: 'url',
                message: '请输入有效的URL地址',
                warningOnly: true
              }
            ]}
          >
            <Input placeholder="例如：https://api.openai.com/v1/chat/completions" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="temperature"
                label="温度参数"
                rules={[{ required: true, message: '请输入温度参数' }]}
              >
                <InputNumber
                  min={0}
                  max={2}
                  step={0.1}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeout"
                label="超时时间(秒)"
                rules={[{ required: true, message: '请输入超时时间' }]}
              >
                <InputNumber
                  min={1}
                  max={300}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rpm"
                label="每分钟最大请求数"
                rules={[{ required: true, message: '请输入每分钟最大请求数' }]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="权重"
                rules={[{ required: true, message: '请输入权重' }]}
              >
                <InputNumber
                  min={1}
                  max={500}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入模型描述"
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={200}
              showCount
            />
          </Form.Item>

          {/* 注意：active字段已移至模态框底部的footer中 */}
          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '8px' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            模型配置将用于系统智能助手功能，请确保API密钥和端点的正确性。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AIConfigManagement;