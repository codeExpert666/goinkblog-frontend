import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
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
  Select,
  DatePicker,
  Result
} from 'antd';
import CommentContentRenderer from '../../components/comment/CommentContentRenderer';
import {
  CommentOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { getCommentsForReview, reviewComment } from '../../services/comment';
import { getCommentStatistics } from '../../services/stat';
import { AuthContext } from '../../store/authContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/comment/commentManagement.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const CommentManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentComment, setCurrentComment] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter']
  });
  const [sortState, setSortState] = useState({
    sort_by: 'create',
    sort_order: 'desc',
  });
  // 存储统计数据
  const [statsData, setStatsData] = useState({
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0,
    rejectedComments: 0,
  });

  // 拒绝模态框状态
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectCommentId, setRejectCommentId] = useState(null);

  // 检查是否有管理员权限
  const isAdmin = user && user.role === 'admin';

  // 获取评论统计数据
  const fetchCommentStats = useCallback(async () => {
    try {
      const response = await getCommentStatistics();
      if (response.code === 200 && response.data) {
        setStatsData({
          totalComments: response.data.total_comments || 0,
          pendingComments: response.data.pending_comments || 0,
          approvedComments: response.data.passed_comments || 0,
          rejectedComments: response.data.rejected_comments || 0,
        });
      } else {
        console.error('获取评论统计数据失败:', response.message);
      }
    } catch (error) {
      console.error('获取评论统计数据失败:', error);
    }
  }, []);

  // 获取评论列表
  const fetchComments = useCallback(async (page = 1, pageSize = 10, filters = {}) => {
    setLoading(true);
    try {
      // 准备请求参数
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortState.sort_by,
        sort_order: sortState.sort_order,
        ...filters
      };

      // 处理时间范围参数
      if (filters.create_time_range && filters.create_time_range.length === 2) {
        params.create_start_time = filters.create_time_range[0].format('YYYY-MM-DDTHH:mm:ssZ');
        params.create_end_time = filters.create_time_range[1].format('YYYY-MM-DDTHH:mm:ssZ');
        delete params.create_time_range;
      }

      if (filters.review_time_range && filters.review_time_range.length === 2) {
        params.review_start_time = filters.review_time_range[0].format('YYYY-MM-DDTHH:mm:ssZ');
        params.review_end_time = filters.review_time_range[1].format('YYYY-MM-DDTHH:mm:ssZ');
        delete params.review_time_range;
      }

      const response = await getCommentsForReview(params);

      if (response.code === 200 && response.data) {
        setComments(response.data.items);
        setPagination({
          current: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total,
          position: ['bottomCenter']
        });

        // 获取最新的评论统计数据
        fetchCommentStats();
      } else {
        message.error(response.message || '获取评论列表失败');
      }
    } catch (error) {
      console.error('获取评论列表失败:', error);
      message.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  }, [sortState.sort_by, sortState.sort_order, fetchCommentStats]);

  useEffect(() => {
    if (isAdmin) {
      fetchCommentStats();
      fetchComments();
    }
  }, [isAdmin, fetchComments, fetchCommentStats]);

  // 自定义列排序处理
  const handleColumnSort = (field) => {
    let sortBy = 'create';
    if (field === 'created_at') {
      sortBy = 'create';
    } else if (field === 'reviewed_at') {
      sortBy = 'review';
    }

    // 如果当前排序字段与点击的相同，则切换排序顺序
    if (sortState.sort_by === sortBy) {
      setSortState({
        sort_by: sortBy,
        sort_order: sortState.sort_order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // 否则，设置新的排序字段，默认降序
      setSortState({
        sort_by: sortBy,
        sort_order: 'desc',
      });
    }

    // 获取表单中的筛选条件
    const formValues = form.getFieldsValue();
    fetchComments(pagination.current, pagination.pageSize, formValues);
  };

  // 表格分页变化处理
  const handleTableChange = (pagination) => {
    // 获取表单中的筛选条件
    const formValues = form.getFieldsValue();
    fetchComments(pagination.current, pagination.pageSize, formValues);
  };

  // 查看评论详情
  const handleViewComment = (record) => {
    setCurrentComment(record);
    setViewModalVisible(true);
  };

  // 审核评论 - 通过
  const handleReviewComment = (commentId, status) => {
    // 只处理通过评论的情况
    if (status !== 1) return;

    confirm({
      title: '确定要通过此评论吗？',
      icon: <ExclamationCircleOutlined />,
      content: '审核后将显示在前台',
      onOk: async () => {
        try {
          const response = await reviewComment({
            comment_id: commentId,
            status: 1,
          });

          if (response.code === 200) {
            message.success('评论审核通过成功');
            // 刷新评论列表和统计数据
            fetchCommentStats();
            const formValues = form.getFieldsValue();
            fetchComments(pagination.current, pagination.pageSize, formValues);
          } else {
            message.error(response.message || '评论审核通过失败');
          }
        } catch (error) {
          console.error('评论审核通过失败:', error);
          message.error('评论审核通过失败');
        }
      },
    });
  };

  // 审核评论 - 拒绝（带备注）
  const handleRejectComment = (commentId) => {
    // 设置要拒绝的评论 ID
    setRejectCommentId(commentId);
    // 重置拒绝理由
    setRejectReason('');
    // 显示拒绝模态框
    setRejectModalVisible(true);
  };

  // 处理拒绝提交
  const handleRejectSubmit = async () => {
    if (!rejectCommentId) return;

    setRejectLoading(true);
    try {
      const response = await reviewComment({
        comment_id: rejectCommentId,
        status: 2, // 拒绝状态
        review_remark: rejectReason, // 添加审核备注
      });

      if (response.code === 200) {
        message.success('评论已拒绝');
        // 关闭模态框
        setRejectModalVisible(false);
        // 重置状态
        setRejectCommentId(null);
        setRejectReason('');
        // 刷新评论列表和统计数据
        fetchCommentStats();
        const formValues = form.getFieldsValue();
        fetchComments(pagination.current, pagination.pageSize, formValues);
      } else {
        message.error(response.message || '评论拒绝失败');
      }
    } catch (error) {
      console.error('评论拒绝失败:', error);
      message.error('评论拒绝失败');
    } finally {
      setRejectLoading(false);
    }
  };

  // 注意：后端API不支持重置评论状态，只支持通过或拒绝操作

  // 表单查询
  const handleSearch = (values) => {
    // 重置分页到第一页
    fetchComments(1, pagination.pageSize, values);
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setSortState({
      sort_by: 'create',
      sort_order: 'desc',
    });
    fetchComments(1, pagination.pageSize, {});
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 250,
      render: (text, record) => (
        <Tooltip title="点击查看详情" placement="top">
          <Button
            type="link"
            onClick={() => handleViewComment(record)}
            style={{ padding: 0, height: 'auto', textAlign: 'left' }}
          >
            <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
              {text}
            </Paragraph>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '文章ID',
      dataIndex: 'article_id',
      key: 'article_id',
      width: 100,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: '文章标题',
      dataIndex: 'article_title',
      key: 'article_title',
      ellipsis: true,
      width: 200,
      render: (text) => (
        <Tooltip title={text} placement="topLeft" style={{ maxWidth: '500px' }}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '评论者ID',
      dataIndex: 'author_id',
      key: 'author_id',
      width: 100,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: '评论作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (text) => <span>{text}</span>,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('created_at')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          评论时间
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by === 'create' ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by === 'create' ? 'bold' : 'normal'
          }}>
            {sortState.sort_by === 'create' && (sortState.sort_order === 'asc' ? '↑' : '↓')}
          </span>
        </div>
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        let color = 'default';
        let text = '未知';
        let icon = null;

        switch (status) {
          case 0:
            color = 'gold';
            text = '待审核';
            icon = <ClockCircleOutlined />;
            break;
          case 1:
            color = 'green';
            text = '已通过';
            icon = <CheckCircleOutlined />;
            break;
          case 2:
            color = 'red';
            text = '已拒绝';
            icon = <CloseCircleOutlined />;
            break;
          default:
            break;
        }

        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('reviewed_at')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          审核时间
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by === 'review' ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by === 'review' ? 'bold' : 'normal'
          }}>
            {sortState.sort_by === 'review' && (sortState.sort_order === 'asc' ? '↑' : '↓')}
          </span>
        </div>
      ),
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      width: 170,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },

    {
      title: '审核人',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 120,
      render: (text) => text ? <span>{text}</span> : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 0 ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReviewComment(record.id, 1)}
                title="通过评论"
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectComment(record.id)}
                title="拒绝评论"
              >
                拒绝
              </Button>
            </>
          ) : (
            <Button
              type="default"
              size="small"
              disabled
              title="已审核评论无需操作"
            >
              暂无可用操作
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <Card>
        <Result
          status="403"
          title="无权访问"
          subTitle="抱歉，您没有权限访问评论管理页面"
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
    <div className="comment-management">
      {/* 欢迎横幅 */}
      <div className="comment-welcome-banner">
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
                <CommentOutlined style={{ marginRight: 12 }} />
                评论管理
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              在这里审核和管理用户评论，维护健康的讨论环境。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<CommentOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#faad14',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* 数据概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="评论总数"
              value={statsData.totalComments}
              prefix={<CommentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="待审核"
              value={statsData.pendingComments}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="已通过"
              value={statsData.approvedComments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="已拒绝"
              value={statsData.rejectedComments}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 评论筛选表单 */}
      <Card
        className="comment-filter-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>评论筛选</Title>
            <Tooltip title="可以通过多种条件筛选评论" placement="top">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
      >
        <Form
          form={form}
          onFinish={handleSearch}
          layout="horizontal"
          className="comment-filter-form"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input
                  placeholder="评论内容/文章标题/作者"
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="评论状态" allowClear>
                  <Option value={0}>待审核</Option>
                  <Option value={1}>已通过</Option>
                  <Option value={2}>已拒绝</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={12}>
              <Form.Item name="create_time_range" label="评论时间">
                <RangePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="article_id" label="文章ID">
                <Input placeholder="文章ID" type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="author_id" label="作者ID">
                <Input placeholder="作者ID" type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item name="review_time_range" label="审核时间">
                <RangePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={handleReset}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 评论列表卡片 */}
      <Card
        className="comment-table-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>评论列表</Title>
            <Tooltip title="点击列标题可以进行排序" placement="top">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
        style={{ marginTop: '16px' }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={comments}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          className="comment-table"
          bordered={false}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 评论详情模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CommentOutlined style={{ marginRight: 8, color: '#fff' }} />
            <span>评论详情</span>
            {currentComment && (
              <>
                {(() => {
                  let color = 'default';
                  let text = '未知';
                  let icon = null;

                  switch (currentComment.status) {
                    case 0:
                      color = 'gold';
                      text = '待审核';
                      icon = <ClockCircleOutlined />;
                      break;
                    case 1:
                      color = 'green';
                      text = '已通过';
                      icon = <CheckCircleOutlined />;
                      break;
                    case 2:
                      color = 'red';
                      text = '已拒绝';
                      icon = <CloseCircleOutlined />;
                      break;
                    default:
                      break;
                  }

                  return (
                    <Tag color={color} icon={icon} style={{ marginLeft: 8 }}>
                      {text}
                    </Tag>
                  );
                })()}
              </>
            )}
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
        className="comment-detail-modal"
        centered
        destroyOnClose
        footer={
          currentComment ? [
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              关闭
            </Button>,
            currentComment.status === 0 ? (
              <>
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setViewModalVisible(false);
                    handleReviewComment(currentComment.id, 1);
                  }}
                >
                  通过
                </Button>
                <Button
                  key="reject"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setViewModalVisible(false);
                    handleRejectComment(currentComment.id);
                  }}
                >
                  拒绝
                </Button>
              </>
            ) : null
          ] : null
        }
      >
        {currentComment && (
          <Form layout="vertical" className="comment-detail-form">
            <Form.Item
              label={
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  <CommentOutlined style={{ marginRight: 8 }} />
                  评论内容
                </div>
              }
            >
              <div className="comment-content-container" style={{ border: '1px solid #d9d9d9', borderRadius: '6px', paddingLeft: '8px', paddingRight: '8px', minHeight: '80px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center' }}>
                <CommentContentRenderer content={currentComment.content} />
              </div>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  评论文章
                </span>
              }
            >
              <Input
                value={currentComment.article_title || '-'}
                readOnly
                style={{ color: '#1890ff', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9' }}
                title="点击查看文章"
              />
            </Form.Item>

            {currentComment.parent_id > 0 && (
              <Form.Item
                label={
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    <CommentOutlined style={{ marginRight: 8 }} />
                    父评论内容
                  </div>
                }
              >
                <div className="comment-content-container" style={{ border: '1px solid #d9d9d9', borderRadius: '6px', paddingLeft: '8px', paddingRight: '8px', minHeight: '80px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center' }}>
                  <CommentContentRenderer content={currentComment.parent_content || '无内容'} />
                </div>
              </Form.Item>
            )}

            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '8px' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              评论ID: {currentComment.id} | 文章ID: {currentComment.article_id || '-'} | 评论者ID: {currentComment.author_id || '-'}
            </div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '4px' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              {currentComment.status === 0
                ? '请根据内容决定是否通过审核。通过的评论将在前台展示。'
                : currentComment.status === 1
                  ? '该评论已通过审核，已在前台展示。'
                  : '该评论已被拒绝，不会在前台展示。'}
            </div>

            {currentComment.status === 2 && currentComment.review_remark && (
              <div style={{ marginTop: '8px', backgroundColor: '#fff2f0', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#cf1322' }}>
                  <CloseCircleOutlined style={{ marginRight: '4px' }} />
                  拒绝理由
                </div>
                <div>{currentComment.review_remark}</div>
              </div>
            )}
          </Form>
        )}
      </Modal>

      {/* 拒绝评论模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloseCircleOutlined style={{ marginRight: 8, color: '#fff' }} />
            拒绝评论
          </div>
        }
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        width={600}
        className="comment-detail-modal"
        centered
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setRejectModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            loading={rejectLoading}
            onClick={handleRejectSubmit}
          >
            拒绝
          </Button>
        ]}
      >
        <Form layout="vertical" className="comment-detail-form">

          <Form.Item
            label={
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                <FileTextOutlined style={{ marginRight: 8 }} />
                拒绝理由（评论者可见）
              </div>
            }
          >
            <Input.TextArea
              rows={4}
              placeholder="例如：评论内容不符合社区规范、包含广告信息等"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: '6px' }}
            />
          </Form.Item>

          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '8px' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            请写清晰、专业的拒绝理由，帮助评论者了解为什么其评论被拒绝。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CommentManagement;