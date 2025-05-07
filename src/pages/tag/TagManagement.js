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
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { getTagsPaginated, createTag, updateTag, deleteTag } from '../../services/tag';
import { AuthContext } from '../../store/authContext';
import '../../styles/tag/tagManagement.css';

const { Title, Text } = Typography;

const TagManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增标签');
  const [currentTag, setCurrentTag] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter'],
  });
  const [sortState, setSortState] = useState({
    sort_by_id: undefined,
    sort_by_article_count: undefined,
    sort_by_create: undefined,
    sort_by_update: undefined,
  });
  // 存储后端返回的统计数据
  const [statsData, setStatsData] = useState({
    totalTags: 0,
    tagsWithArticles: 0,
    totalArticles: 0,
    maxArticlesTagName: '',
    maxArticlesCount: 0
  });

  // 检查是否有管理员权限
  const isAdmin = user && user.role === 'admin';

  // 获取标签列表
  const fetchTags = async (page = 1, pageSize = 10, sorters = []) => {
    setLoading(true);
    try {
      // 准备排序参数
      const params = {
        page,
        page_size: pageSize,
      };

      // 处理多列排序，按照优先级顺序处理
      // 优先级从高到低：sort_by_id、sort_by_article_count、sort_by_create、sort_by_update

      // 首先检查是否有ID排序
      const idSorter = sorters.find(s => s.field === 'id' && s.order);
      if (idSorter) {
        params.sort_by_id = idSorter.order === 'ascend' ? 'asc' : 'desc';
      }

      // 然后检查是否有文章数量排序
      const articleCountSorter = sorters.find(s => s.field === 'article_count' && s.order);
      if (articleCountSorter) {
        params.sort_by_article_count = articleCountSorter.order === 'ascend' ? 'asc' : 'desc';
      }

      // 然后检查是否有创建时间排序
      const createTimeSorter = sorters.find(s => s.field === 'created_at' && s.order);
      if (createTimeSorter) {
        params.sort_by_create = createTimeSorter.order === 'ascend' ? 'asc' : 'desc';
      }

      // 最后检查是否有更新时间排序
      const updateTimeSorter = sorters.find(s => s.field === 'updated_at' && s.order);
      if (updateTimeSorter) {
        params.sort_by_update = updateTimeSorter.order === 'ascend' ? 'asc' : 'desc';
      }

      const response = await getTagsPaginated(params);

      if (response.data) {
        setTags(response.data.items);
        setPagination({
          current: response.data.page,
          pageSize: response.data.page_size,
          total: response.data.total_tags,
          position: ['bottomCenter'],
        });

        // 更新统计数据，使用后端返回的数据
        setStatsData({
          totalTags: response.data.total_tags || 0,
          tagsWithArticles: response.data.tags_with_article || 0,
          totalArticles: response.data.total_articles || 0,
          maxArticlesTagName: response.data.tag_name_with_most_article || '-',
          maxArticlesCount: response.data.most_article_counts || 0
        });
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 自定义列排序处理
  const handleColumnSort = (field) => {
    // 创建新的排序状态
    const newSortState = { ...sortState };

    // 根据列字段确定要更新的排序状态属性
    let sortKey;
    if (field === 'id') {
      sortKey = 'sort_by_id';
    } else if (field === 'article_count') {
      sortKey = 'sort_by_article_count';
    } else if (field === 'created_at') {
      sortKey = 'sort_by_create';
    } else if (field === 'updated_at') {
      sortKey = 'sort_by_update';
    } else {
      return; // 如果不是可排序列，直接返回
    }

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

    // 将排序状态转换为排序器数组
    const sorters = [];

    // 按照优先级顺序添加排序器
    if (newSortState.sort_by_id) {
      sorters.push({
        field: 'id',
        order: newSortState.sort_by_id === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (newSortState.sort_by_article_count) {
      sorters.push({
        field: 'article_count',
        order: newSortState.sort_by_article_count === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (newSortState.sort_by_create) {
      sorters.push({
        field: 'created_at',
        order: newSortState.sort_by_create === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (newSortState.sort_by_update) {
      sorters.push({
        field: 'updated_at',
        order: newSortState.sort_by_update === 'asc' ? 'ascend' : 'descend'
      });
    }

    fetchTags(pagination.current, pagination.pageSize, sorters);
  };

  // 表格分页和排序变化处理
  const handleTableChange = (pagination) => {
    // 只处理分页变化，排序由自定义处理函数处理
    const sorters = [];

    // 按照优先级顺序添加排序器
    if (sortState.sort_by_id) {
      sorters.push({
        field: 'id',
        order: sortState.sort_by_id === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (sortState.sort_by_article_count) {
      sorters.push({
        field: 'article_count',
        order: sortState.sort_by_article_count === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (sortState.sort_by_create) {
      sorters.push({
        field: 'created_at',
        order: sortState.sort_by_create === 'asc' ? 'ascend' : 'descend'
      });
    }

    if (sortState.sort_by_update) {
      sorters.push({
        field: 'updated_at',
        order: sortState.sort_by_update === 'asc' ? 'ascend' : 'descend'
      });
    }

    fetchTags(pagination.current, pagination.pageSize, sorters);
  };

  // 打开新增标签模态框
  const handleAddTag = () => {
    form.resetFields();
    setCurrentTag(null);
    setModalTitle('新增标签');
    setModalVisible(true);
  };

  // 打开编辑标签模态框
  const handleEditTag = (record) => {
    form.setFieldsValue({
      name: record.name,
    });
    setCurrentTag(record);
    setModalTitle('编辑标签');
    setModalVisible(true);
  };

  // 保存标签
  const handleSaveTag = async () => {
    try {
      const values = await form.validateFields();

      if (currentTag) {
        // 更新标签
        await updateTag(currentTag.id, values);
        message.success('标签更新成功');
      } else {
        // 新增标签
        await createTag(values);
        message.success('标签创建成功');
      }

      setModalVisible(false);
      // 保留当前的排序状态
      // 将排序状态转换为排序器数组
      const sorters = [];

      // 按照优先级顺序添加排序器
      if (sortState.sort_by_id) {
        sorters.push({
          field: 'id',
          order: sortState.sort_by_id === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_article_count) {
        sorters.push({
          field: 'article_count',
          order: sortState.sort_by_article_count === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_create) {
        sorters.push({
          field: 'created_at',
          order: sortState.sort_by_create === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_update) {
        sorters.push({
          field: 'updated_at',
          order: sortState.sort_by_update === 'asc' ? 'ascend' : 'descend'
        });
      }

      fetchTags(pagination.current, pagination.pageSize, sorters);
    } catch (error) {
      console.error('保存标签失败:', error);
      message.error('保存标签失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (id) => {
    try {
      await deleteTag(id);
      message.success('标签删除成功');
      // 保留当前的排序状态
      // 将排序状态转换为排序器数组
      const sorters = [];

      // 按照优先级顺序添加排序器
      if (sortState.sort_by_id) {
        sorters.push({
          field: 'id',
          order: sortState.sort_by_id === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_article_count) {
        sorters.push({
          field: 'article_count',
          order: sortState.sort_by_article_count === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_create) {
        sorters.push({
          field: 'created_at',
          order: sortState.sort_by_create === 'asc' ? 'ascend' : 'descend'
        });
      }

      if (sortState.sort_by_update) {
        sorters.push({
          field: 'updated_at',
          order: sortState.sort_by_update === 'asc' ? 'ascend' : 'descend'
        });
      }

      fetchTags(pagination.current, pagination.pageSize, sorters);
    } catch (error) {
      console.error('删除标签失败:', error);

      // 如果是冲突错误（标签下有文章）
      if (error.code === 409 || (error.response && error.response.status === 409)) {
        Modal.confirm({
          title: '无法删除标签',
          icon: <ExclamationCircleOutlined />,
          content: '该标签下存在文章，无法删除。请先移除或重新标记这些文章后再试。',
          okText: '我知道了',
          cancelText: null,
          okButtonProps: { type: 'primary' },
        });
      } else {
        message.error('删除标签失败');
      }
    }
  };

  // 表格列配置
  const columns = [
    {
      title: (
        <div
          onClick={() => handleColumnSort('id')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          ID
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_id ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_id ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_id === 'asc' ? '↑' : (sortState.sort_by_id === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => (
        <Tag color="blue" style={{ fontSize: '14px', padding: '2px 8px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('article_count')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          文章数
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_article_count ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_article_count ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_article_count === 'asc' ? '↑' : (sortState.sort_by_article_count === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'article_count',
      key: 'article_count',
      width: 120,
      render: (text) => <Tag color={text > 0 ? 'green' : 'default'} style={{ borderRadius: '12px', padding: '0 8px' }}>{text}</Tag>,
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('created_at')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          创建时间
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_create ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_create ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_create === 'asc' ? '↑' : (sortState.sort_by_create === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: (
        <div
          onClick={() => handleColumnSort('updated_at')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          更新时间
          <span style={{
            marginLeft: '4px',
            color: sortState.sort_by_update ? '#1890ff' : '#bfbfbf',
            fontWeight: sortState.sort_by_update ? 'bold' : 'normal'
          }}>
            {sortState.sort_by_update === 'asc' ? '↑' : (sortState.sort_by_update === 'desc' ? '↓' : '↕')}
          </span>
        </div>
      ),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTag(record)}
            disabled={!isAdmin}
            className="tag-action-button"
            title="编辑标签"
          />
          <Popconfirm
            title="确定要删除这个标签吗?"
            onConfirm={() => handleDeleteTag(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!isAdmin || record.article_count > 0}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!isAdmin || record.article_count > 0}
              className="tag-action-button"
              title={record.article_count > 0 ? "该标签下有文章，无法删除" : "删除标签"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="tag-management">
      {/* 欢迎横幅 */}
      <div className="tag-welcome-banner">
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
                <TagsOutlined style={{ marginRight: 12 }} />
                标签管理
              </Title>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
              在这里管理您的博客文章标签，组织内容关键词，提升文章检索体验。
            </Text>
          </div>
          <Avatar
            size={64}
            icon={<TagsOutlined />}
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
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="标签总数"
              value={statsData.totalTags}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="有文章的标签"
              value={statsData.tagsWithArticles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="文章总数"
              value={statsData.totalArticles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="最多文章的标签"
              value={statsData.maxArticlesTagName}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#eb2f96', fontSize: '16px' }}
            />
            {statsData.maxArticlesCount > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                共 {statsData.maxArticlesCount} 篇文章
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 标签表格卡片 */}
      <Card
        className="tag-table-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>标签列表</Title>
            {!isAdmin && (
              <Tooltip title="只有管理员可以创建、编辑和删除标签">
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            )}
            <Tooltip title="点击列标题可以进行排序，支持多列同时排序">
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#722ed1' }} />
            </Tooltip>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTag}
            disabled={!isAdmin}
            className="add-tag-button"
          >
            新增标签
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tags}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          className="tag-table"
          bordered={false}
        />
      </Card>

      {/* 标签操作模态框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveTag}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        className="tag-modal"
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" maxLength={50} />
          </Form.Item>
          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '8px' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            标签名称将用于文章标签展示，请确保名称简洁明了。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TagManagement;