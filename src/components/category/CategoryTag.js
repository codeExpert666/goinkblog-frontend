import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Tooltip, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { AppstoreOutlined } from '@ant-design/icons';
import categoryCache from '../../services/categoryCache';

const CategoryTag = ({
  id,        // 分类ID
  color = 'blue',
  clickable = true,
  showTooltip = true,
  style = {}
}) => {
  // 使用状态管理分类数据和加载状态
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 通过ID获取分类信息
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // 使用缓存服务获取分类数据
    const fetchCategory = async () => {
      try {
        setLoading(true);
        // 使用缓存服务获取分类数据
        const categoryData = await categoryCache.getCategory(id);
        if (categoryData) {
          setCategory(categoryData);
          setError(null);
        } else {
          setError(new Error(`未找到ID为${id}的分类`));
        }
      } catch (err) {
        console.error('Failed to get category information:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  // 使用useMemo缓存标签内容，避免不必要的重新渲染
  const tagContent = useMemo(() => {
    if (loading) return <Spin size="small" />;

    if (!category || error) return null;

    // 提取分类信息
    const categoryName = category.name;
    const categoryId = category.id;
    const description = category.description;

    // 创建标签内容
    return {
      element: (
        <Tag
          color={color}
          style={{
            cursor: clickable ? 'pointer' : 'default',
            borderRadius: '4px',
            padding: '0 8px',
            fontSize: '13px',
            fontWeight: '500',
            marginRight: '0',
            ...style
          }}
          icon={<AppstoreOutlined />}
        >
          {categoryName}
        </Tag>
      ),
      categoryId,
      description
    };
  }, [category, loading, error, color, clickable, style]);

  // 如果正在加载或没有数据，返回加载状态或null
  if (loading || !category || error) return tagContent?.element || null;

  // 解构标签内容
  const { element, categoryId, description } = tagContent;

  // 不可点击且没有描述的情况下直接返回标签
  if (!clickable && !description) {
    return element;
  }

  // 可点击但没有描述的情况
  if (clickable && !description && categoryId) {
    return (
      <Link
        to={`/search?expanded=true&category_ids=${categoryId}&auto_search=true`}
        onClick={(e) => e.stopPropagation()}
      >
        {element}
      </Link>
    );
  }

  // 有描述需要显示提示的情况
  if (description && showTooltip) {
    return (
      <Tooltip title={description}>
        {clickable && categoryId ? (
          <Link
            to={`/search?expanded=true&category_ids=${categoryId}&auto_search=true`}
            onClick={(e) => e.stopPropagation()}
          >
            {element}
          </Link>
        ) : (
          element
        )}
      </Tooltip>
    );
  }

  // 可点击但不需要提示的情况
  if (clickable && categoryId) {
    return (
      <Link
        to={`/search?expanded=true&category_ids=${categoryId}&auto_search=true`}
        onClick={(e) => e.stopPropagation()}
      >
        {element}
      </Link>
    );
  }

  // 默认情况
  return element;
};

export default CategoryTag;
