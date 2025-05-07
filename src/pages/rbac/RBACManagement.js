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
  Select,
  Divider
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ClearOutlined,
  LeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  SafetyOutlined,
  UserOutlined,
  EditOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  getPolicies,
  createPolicy,
  deletePolicy,
  enforcePermission
} from '../../services/rbac';
import { AuthContext } from '../../store/authContext';
import '../../styles/admin/adminCenter.css';
import '../../styles/rbac/rbacManagement.css';
import '../../styles/rbac/rbacModal.css';

const { Title, Text } = Typography;
const { Option } = Select;

const RBACManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增策略');
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [policyType, setPolicyType] = useState('p');
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();
  const [testResult, setTestResult] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter'],
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
  });

  // 查询条件状态
  const [queryForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState({
    type: undefined,
    subject: undefined,
    object: undefined,
    action: undefined
  });
  // 筛选表单中的策略类型
  const [filterPolicyType, setFilterPolicyType] = useState(undefined);



  // 检查是否有管理员权限
  const isAdmin = user && user.role === 'admin';

  // 获取策略列表
  const fetchData = async (page = 1, pageSize = 10, query = {}) => {
    setLoading(true);
    try {
      // 准备查询参数
      const params = {
        page,
        page_size: pageSize,
        ...query
      };

      // 获取策略列表
      const response = await getPolicies(params);
      if (response && response.data) {
        setPolicies(response.data.items || []);
        setPagination({
          current: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          position: ['bottomCenter'],
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        });
      }
    } catch (error) {
      console.error('获取RBAC策略数据失败:', error);
      message.error('获取RBAC策略数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize, queryParams);
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
    fetchData(1, pagination.pageSize, filteredValues);
  };

  // 重置查询
  const handleResetQuery = () => {
    queryForm.resetFields();
    setQueryParams({});
    // 重置策略类型状态
    setFilterPolicyType(undefined);
    fetchData(1, pagination.pageSize, {});
  };

  // 表格分页变化处理
  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize, queryParams);
  };

  // 打开新增策略模态框
  const handleAddPolicy = () => {
    form.resetFields();
    form.setFieldsValue({
      type: 'p',
    });
    setPolicyType('p');
    setModalTitle('新增策略');
    setModalVisible(true);
  };

  // 打开权限测试模态框
  const handleOpenTestModal = () => {
    testForm.resetFields();
    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行权限验证测试
  const handleTestPermission = async () => {
    try {
      // 先将测试结果设置为null，确保状态更新触发重新渲染
      setTestResult(null);

      const values = await testForm.validateFields();
      const response = await enforcePermission(values);

      if (response && response.data) {
        // 使用setTimeout确保状态更新在下一个事件循环中执行
        setTimeout(() => {
          setTestResult(response.data.allowed);
          message.success('权限测试执行成功');
        }, 0);
      }
    } catch (error) {
      console.error('权限测试失败:', error);
      message.error('权限测试失败');
    }
  };

  // 处理策略类型变更
  const handlePolicyTypeChange = (value) => {
    setPolicyType(value);
    // 当选择角色策略(g)时，清除动作字段
    if (value === 'g') {
      form.setFieldsValue({ action: undefined });
    }
  };

  // 保存策略
  const handleSavePolicy = async () => {
    try {
      // 获取表单字段值
      const values = await form.validateFields();

      // 如果是角色策略(g)，不需要action字段
      if (values.type === 'g') {
        delete values.action;
      }

      // 创建策略
      await createPolicy(values);
      message.success('策略创建成功');
      setModalVisible(false);

      // 刷新数据
      fetchData(pagination.current, pagination.pageSize, queryParams);
    } catch (error) {
      console.error('保存策略失败:', error);

      // 错误处理
      if (error.code === 409 || (error.response && error.response.status === 409)) {
        message.error('策略已存在');
      } else {
        message.error('保存策略失败');
      }
    }
  };

  // 删除策略
  const handleDeletePolicy = async (id) => {
    try {
      await deletePolicy(id);
      message.success('策略删除成功');

      // 刷新数据
      fetchData(pagination.current, pagination.pageSize, queryParams);
    } catch (error) {
      console.error('删除策略失败:', error);
      message.error('删除策略失败');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => (
        <Tag color={text === 'p' ? 'blue' : 'purple'}>
          {text === 'p' ? '权限' : '角色'}
        </Tag>
      )
    },
    {
      title: '主体',
      dataIndex: 'subject',
      key: 'subject',
      width: 200,
    },
    {
      title: '资源/角色',
      dataIndex: 'object',
      key: 'object',
      width: 200,
      render: (text, record) => (
        <span>
          {record.type === 'g' ? (
            <Tag color="purple">{text}</Tag>
          ) : (
            <Tag color="cyan">{text}</Tag>
          )}
        </span>
      )
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (text, record) => (
        record.type === 'p' ? (
          <Tag color="green">{text}</Tag>
        ) : (
          <span>-</span>
        )
      )
    },
    {
      title: '操作',
      key: 'operations',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="确定要删除这个策略吗?"
            onConfirm={() => handleDeletePolicy(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!isAdmin}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!isAdmin}
              title="删除策略"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="rbac-management">
      {/* 欢迎横幅 */}
      <div className="rbac-welcome-banner">
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
                <LockOutlined style={{ marginRight: 12 }} />
                权限管理
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              管理基于角色的访问控制策略，精确控制用户对系统资源的访问权限。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<LockOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#1890ff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>



      {/* 策略筛选表单 */}
      <Card
        className="rbac-filter-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>策略筛选</Title>
            <Tooltip title="可以通过多种条件筛选RBAC策略" placement="top">
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
          className="rbac-filter-form"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="type" label="策略类型">
                <Select
                  placeholder="请选择策略类型"
                  allowClear
                  onChange={(value) => {
                    setFilterPolicyType(value);
                    // 当选择角色策略时，清除动作字段
                    if (value === 'g') {
                      queryForm.setFieldValue('action', undefined);
                    }
                    // 当清除策略类型时，也需要重置状态
                    if (value === undefined) {
                      setFilterPolicyType(undefined);
                    }
                  }}
                >
                  <Option value="p">权限策略</Option>
                  <Option value="g">角色策略</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="subject" label="主体">
                <Input
                  placeholder="请输入主体"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="object" label="资源/角色">
                <Input
                  placeholder="请输入资源或角色"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="action" label="动作">
                <Select
                  placeholder="请选择HTTP请求方法"
                  allowClear
                  disabled={filterPolicyType === 'g'}
                >
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                  <Option value="PATCH">PATCH</Option>
                  <Option value="HEAD">HEAD</Option>
                  <Option value="OPTIONS">OPTIONS</Option>
                  <Option value="CONNECT">CONNECT</Option>
                  <Option value="TRACE">TRACE</Option>
                  <Option value="*">* (所有)</Option>
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

      {/* 策略表格卡片 */}
      <Card
        className="rbac-table-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>RBAC策略列表</Title>
            {!isAdmin && (
              <Tooltip title="只有管理员可以创建、编辑和删除RBAC策略">
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            )}
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleOpenTestModal}
              disabled={!isAdmin}
            >
              权限验证测试
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPolicy}
              disabled={!isAdmin}
              className="add-policy-button"
            >
              新增策略
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={policies}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          className="rbac-table"
          bordered={false}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* 策略配置模态框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSavePolicy}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        className="rbac-modal"
        destroyOnClose
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Tag color={policyType === 'p' ? 'blue' : 'purple'} style={{ padding: '5px 10px' }}>
                {policyType === 'p' ? (
                  <><SafetyOutlined /> 权限策略</>
                ) : (
                  <><TeamOutlined /> 角色策略</>
                )}
              </Tag>
            </div>
            <div>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleSavePolicy} style={{ marginLeft: 8 }}>保存</Button>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical">


          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="type"
                label="策略类型"
                rules={[{ required: true, message: '请选择策略类型' }]}
              >
                <Select
                  placeholder="请选择策略类型"
                  onChange={handlePolicyTypeChange}
                  suffixIcon={policyType === 'p' ? <SafetyOutlined /> : <TeamOutlined />}
                >
                  <Option value="p">权限策略 (p)</Option>
                  <Option value="g">角色策略 (g)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="主体"
                rules={[{ required: true, message: '请输入主体' }]}
              >
                <Input
                  placeholder="例如：alice, bob, admin_role"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="object"
                label={policyType === 'p' ? "资源" : "角色"}
                rules={[{ required: true, message: `请输入${policyType === 'p' ? "资源" : "角色"}` }]}
              >
                <Input
                  placeholder={policyType === 'p' ? "例如：data1, /api/users" : "例如：admin, editor"}
                  prefix={policyType === 'p' ? <ApiOutlined /> : <TeamOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="action"
            label="动作"
            rules={[{ required: policyType === 'p', message: '请选择HTTP请求方法' }]}
            style={{ display: policyType === 'p' ? 'block' : 'block', visibility: policyType === 'p' ? 'visible' : 'hidden', margin: policyType === 'p' ? '0 0 24px' : '0', height: policyType === 'p' ? 'auto' : '0' }}
          >
            <Select
              placeholder="请选择HTTP请求方法"
              disabled={policyType !== 'p'}
              suffixIcon={<EditOutlined />}
            >
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
              <Option value="HEAD">HEAD</Option>
              <Option value="OPTIONS">OPTIONS</Option>
              <Option value="CONNECT">CONNECT</Option>
              <Option value="TRACE">TRACE</Option>
              <Option value="*">* (所有)</Option>
            </Select>
          </Form.Item>

          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: 'bold' }}>提示：</span>
            {policyType === 'p'
              ? '权限策略使用主体-资源-动作三元组定义访问控制规则，主体可以是用户ID或角色名。'
              : '角色策略将用户与角色关联，使用户继承角色的所有权限，简化权限管理。'}
          </div>
        </Form>
      </Modal>

      {/* 权限测试模态框 */}
      <Modal
        title="权限验证测试"
        open={testModalVisible}
        onOk={handleTestPermission}
        onCancel={() => {
          setTestModalVisible(false);
          // 确保关闭模态框时重置测试结果
          setTestResult(null);
        }}
        okText="验证权限"
        cancelText="取消"
        className="rbac-test-modal"
        destroyOnClose
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {testResult !== null && (
                <Tag
                  color={testResult ? "success" : "error"}
                  className="test-result-tag"
                >
                  {testResult ? (
                    <><CheckCircleOutlined /> 允许访问</>
                  ) : (
                    <><CloseCircleOutlined /> 拒绝访问</>
                  )}
                </Tag>
              )}
            </div>
            <div>
              <Button onClick={() => {
                setTestModalVisible(false);
                setTestResult(null);
              }}>取消</Button>
              <Button
                type="primary"
                onClick={handleTestPermission}
                style={{ marginLeft: 8 }}
                icon={<SafetyOutlined />}
              >
                验证权限
              </Button>
            </div>
          </div>
        }
      >


        <Form form={testForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="主体"
                rules={[{ required: true, message: '请输入主体' }]}
              >
                <Input
                  placeholder="例如：alice, bob"
                  prefix={<UserOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="动作"
                rules={[{ required: true, message: '请选择HTTP请求方法' }]}
              >
                <Select
                  placeholder="请选择HTTP请求方法"
                  suffixIcon={<EditOutlined />}
                  allowClear
                >
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                  <Option value="PATCH">PATCH</Option>
                  <Option value="HEAD">HEAD</Option>
                  <Option value="OPTIONS">OPTIONS</Option>
                  <Option value="CONNECT">CONNECT</Option>
                  <Option value="TRACE">TRACE</Option>
                  <Option value="*">* (所有)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="object"
            label="资源"
            rules={[{ required: true, message: '请输入资源' }]}
          >
            <Input
              placeholder="例如：data1, /api/users"
              prefix={<ApiOutlined />}
              allowClear
            />
          </Form.Item>

          {testResult !== null && (
            <div className="test-result-container" key={`test-result-${Date.now()}`}>
              <Divider>测试结果</Divider>
              <div style={{ padding: '16px', backgroundColor: testResult ? '#f6ffed' : '#fff2f0', borderRadius: '4px', border: `1px solid ${testResult ? '#b7eb8f' : '#ffccc7'}` }}>
                <Title level={4} style={{ color: testResult ? '#52c41a' : '#ff4d4f', margin: 0 }}>
                  {testResult ? (
                    <><CheckCircleOutlined /> 访问已授权</>
                  ) : (
                    <><CloseCircleOutlined /> 访问被拒绝</>
                  )}
                </Title>
                <Text style={{ display: 'block', marginTop: '8px' }}>
                  {testResult
                    ? `主体 "${testForm.getFieldValue('subject')}" 被允许对资源 "${testForm.getFieldValue('object')}" 执行 "${testForm.getFieldValue('action')}" 操作。`
                    : `主体 "${testForm.getFieldValue('subject')}" 没有权限对资源 "${testForm.getFieldValue('object')}" 执行 "${testForm.getFieldValue('action')}" 操作。`
                  }
                </Text>
              </div>
            </div>
          )}

          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: 'bold' }}>提示：</span>
            权限测试基于Casbin的RBAC模型，会检查直接权限和通过角色继承的间接权限。
            系统会根据已配置的权限策略和角色策略来决定是否允许访问。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RBACManagement;
