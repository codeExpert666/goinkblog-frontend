import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Tooltip, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { TagOutlined } from '@ant-design/icons';
import tagCache from '../../services/tagCache';

// 预设的标签颜色数组（排除蓝色系列，以便与分类区分）
const TAG_COLORS = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'purple', 'pink'
];

// 根据标签ID生成一个稳定的颜色
const getColorByTagId = (id) => {
  if (!id) return 'default';
  // 将ID转换为数字（如果不是数字）
  const numId = typeof id === 'number' ? id : parseInt(id.toString().replace(/[^0-9]/g, ''), 10) || 0;
  // 使用ID对颜色数组长度取模，确保每个ID总是对应同一个颜色
  return TAG_COLORS[numId % TAG_COLORS.length];
};

const TagDisplay = ({
  id,        // 标签ID
  color,     // 自定义颜色，如果提供则使用，否则根据ID生成
  clickable = true,
  showTooltip = false,
  style = {}
}) => {
  // 使用状态管理标签数据和加载状态
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 通过ID获取标签信息
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // 使用缓存服务获取标签数据
    const fetchTag = async () => {
      try {
        setLoading(true);
        // 使用缓存服务获取标签数据
        const tagData = await tagCache.getTag(id);
        if (tagData) {
          setTag(tagData);
          setError(null);
        } else {
          setError(new Error(`未找到ID为${id}的标签`));
        }
      } catch (err) {
        console.error('获取标签信息失败:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTag();
  }, [id]);

  // 使用useMemo缓存标签内容，避免不必要的重新渲染
  const tagContent = useMemo(() => {
    if (loading) return <Spin size="small" />;

    if (!tag || error) return null;

    // 提取标签信息
    const tagName = tag.name;
    const tagId = tag.id;
    const articleCount = tag.article_count;

    // 确定标签颜色：优先使用传入的颜色，否则根据ID生成颜色
    const tagColor = color || getColorByTagId(tagId);

    // 自定义标签样式，使其与分类标签区分
    const customStyle = {
      cursor: clickable ? 'pointer' : 'default',
      borderRadius: '16px',  // 更圆润的边角
      padding: '0 10px',     // 左右内边距增加
      fontSize: '12px',      // 字体稍小
      fontWeight: 'normal',  // 普通字重
      marginRight: '0',      // 移除右边距，由父容器的gap控制
      ...style
    };

    // 创建标签内容
    return {
      element: (
        <Tag
          color={tagColor}
          style={customStyle}
          icon={<TagOutlined />}
        >
          {tagName} {articleCount > 0 && showTooltip && `(${articleCount})`}
        </Tag>
      ),
      tagId,
      articleCount
    };
  }, [tag, loading, error, color, clickable, style, showTooltip]);

  // 如果正在加载或没有数据，返回加载状态或null
  if (loading || !tag || error) return tagContent?.element || null;

  // 解构标签内容
  const { element, tagId, articleCount } = tagContent;

  // 不可点击的情况下直接返回标签
  if (!clickable) {
    return element;
  }

  // 可点击的情况
  if (clickable && tagId) {
    const tooltipContent = articleCount > 0 ? `包含 ${articleCount} 篇文章` : '暂无文章';

    return showTooltip ? (
      <Tooltip title={tooltipContent}>
        <Link
          to={`/search?expanded=true&tag_ids=${tagId}&auto_search=true`}
          onClick={(e) => e.stopPropagation()}
        >
          {element}
        </Link>
      </Tooltip>
    ) : (
      <Link
        to={`/search?expanded=true&tag_ids=${tagId}&auto_search=true`}
        onClick={(e) => e.stopPropagation()}
      >
        {element}
      </Link>
    );
  }

  // 默认情况
  return element;
};

export default TagDisplay;
