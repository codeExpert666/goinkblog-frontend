import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Select, Row, Col, Button, Card, Space } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import CategorySelect from '../category/CategorySelect';
import TagSelect from '../tag/TagSelect';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllCategories } from '../../services/category';

const { Option } = Select;

const ArticleFilter = ({
  initialValues = {},
  onSearch,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const shouldExpand = query.get('expanded') === 'true';
  const categoryIds = query.get('category_ids');
  const categoryName = query.get('category_name');
  const tagIds = query.get('tag_ids');
  const sortBy = query.get('sort_by');
  const autoSearch = query.get('auto_search') === 'true';

  const [expanded, setExpanded] = useState(shouldExpand);

  const handleSearch = useCallback((values) => {
    // 移除空值
    const filters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // 确保数组类型的参数不会被过滤掉空数组
        if (Array.isArray(value) && value.length === 0) {
          return acc;
        }
        acc[key] = value;
      }
      return acc;
    }, {});

    // 调试日志
    console.log('筛选条件:', filters);

    onSearch(filters);
  }, [onSearch]);

  // 使用 useRef 来跟踪是否已经执行过自动搜索
  const hasAutoSearched = useRef(false);

  useEffect(() => {
    // 合并初始值和URL参数
    const values = { ...initialValues };

    // 如果URL中有分类ID，则设置到表单中
    if (categoryIds) {
      // 将分类ID字符串分割为数组
      const idArray = categoryIds.split(',').map(id => id.trim());
      values.category_ids = idArray;
    }

    // 如果URL中有标签ID，则设置到表单中
    if (tagIds) {
      // 将标签ID字符串分割为数组
      const idArray = tagIds.split(',').map(id => id.trim());
      values.tag_ids = idArray;
    }

    // 如果URL中有分类名称但没有分类ID，则需要先获取对应的分类ID
    if (categoryName && !categoryIds) {
      // 设置展开状态，以便显示分类选择器
      setExpanded(true);

      // 异步获取分类ID
      const fetchCategoryIdByName = async () => {
        try {
          const response = await getAllCategories();
          if (response.data && response.data.items) {
            // 查找匹配的分类
            const matchedCategory = response.data.items.find(
              category => category.name === categoryName
            );

            if (matchedCategory) {
              // 找到匹配的分类，更新表单值
              values.category_ids = [matchedCategory.id];
              form.setFieldsValue(values);

              // 如果需要自动搜索，则触发搜索
              if (autoSearch && !hasAutoSearched.current) {
                hasAutoSearched.current = true;
                handleSearch(values);
              }
            } else {
              console.warn(`未找到名为 "${categoryName}" 的分类`);
              form.setFieldsValue(values);
            }
          } else {
            form.setFieldsValue(values);
          }
        } catch (error) {
          console.error('获取分类列表失败:', error);
          form.setFieldsValue(values);
        }
      };

      fetchCategoryIdByName();
    } else {
      // 没有分类名称或已有分类ID，直接设置表单值
      form.setFieldsValue(values);

      // 如果需要自动搜索，且还没有执行过自动搜索，则触发搜索
      if (autoSearch && !hasAutoSearched.current && (categoryIds || tagIds || sortBy)) {
        hasAutoSearched.current = true;
        handleSearch(values);
      }
    }
  }, [form, initialValues, categoryIds, categoryName, tagIds, sortBy, autoSearch, handleSearch]);



  const handleReset = () => {
    form.resetFields();
    // Ensure the form is visually reset by setting all fields to undefined
    const emptyValues = Object.keys(form.getFieldsValue()).reduce((acc, key) => {
      acc[key] = undefined;
      return acc;
    }, {});

    // 特别处理category_ids和tag_ids字段，确保即使在收起状态下也能被重置
    emptyValues.category_ids = undefined;
    emptyValues.tag_ids = undefined;

    form.setFieldsValue(emptyValues);

    // 清除URL参数，保留当前路径
    navigate('/search', { replace: true });

    // 如果筛选框是展开状态，保持展开
    if (expanded) {
      setTimeout(() => {
        navigate('/search?expanded=true', { replace: true });
      }, 0);
    }

    // 执行搜索，传递空对象表示无筛选条件
    onSearch({});

    // 重置hasAutoSearched，以便下次可以正常触发自动搜索
    hasAutoSearched.current = false;
  };

  return (
    <Card
      className="article-filter-card"
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FilterOutlined />
          <span style={{ marginLeft: 8 }}>文章筛选</span>
        </div>
      }
      style={{ marginBottom: 16 }}
      extra={
        <Button
          type="text"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : '展开'}
        </Button>
      }
    >
      <Form
        form={form}
        layout="horizontal"
        onFinish={handleSearch}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Form.Item name="keyword">
              <Input
                placeholder="搜索文章标题或内容"
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Form.Item name="author">
              <Input
                placeholder="作者名称"
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Form.Item name="sort_by">
              <Select placeholder="排序方式" allowClear>
                <Option value="newest">最新发布</Option>
                <Option value="views">热门文章</Option>
                <Option value="likes">点赞最多</Option>
                <Option value="favorites">收藏最多</Option>
                <Option value="comments">评论最多</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Form.Item name="time_range">
              <Select placeholder="时间范围" allowClear>
                <Option value="today">今天</Option>
                <Option value="week">本周</Option>
                <Option value="month">本月</Option>
                <Option value="year">今年</Option>
                <Option value="all">全部时间</Option>
              </Select>
            </Form.Item>
          </Col>

          {expanded && (
            <>
              <Col xs={24} sm={12} md={8} lg={8} xl={6}>
                <Form.Item name="category_ids">
                  <CategorySelect
                    mode="multiple"
                    placeholder="选择分类"
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8} lg={8} xl={6}>
                <Form.Item name="tag_ids">
                  <TagSelect
                    placeholder="选择标签"
                    allowClear
                    allowCreate={false}
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default ArticleFilter;
