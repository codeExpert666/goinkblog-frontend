import React, { useState, useEffect, useCallback, useContext, useTransition } from 'react';
import { Row, Col, Divider, Typography, Button, message, Spin, Tooltip } from 'antd';
import { FireOutlined, HistoryOutlined, RightOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../store/authContext';
import { getHotArticles, getLatestArticles, toggleLikeArticle, toggleFavoriteArticle, getArticles } from '../../services/article';
import { getCategoryDistribution } from '../../services/stat';
import { getHotTags } from '../../services/tag';
import HorizontalArticleList from '../../components/article/HorizontalArticleList';

import '../../styles/article/articleCard.css';
import '../../styles/user/userProfile.css';
import '../../styles/article/categoryDistribution.css';
import '../../styles/article/horizontalArticleList.css';

const ArticlesPage = () => {
  const [hotArticles, setHotArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [categoriesArticlesMap, setCategoriesArticlesMap] = useState({});
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [hotTags, setHotTags] = useState([]);
  const [hotLoading, setHotLoading] = useState(true);
  const [latestLoading, setLatestLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [hotTagsLoading, setHotTagsLoading] = useState(true);
  const [categoriesArticlesLoading, setCategoriesArticlesLoading] = useState({});
  // 使用 useTransition 来处理分类切换，避免页面闪烁
  const [, startTransition] = useTransition();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { Text } = Typography;

  // 获取热门文章
  const fetchHotArticles = useCallback(async () => {
    setHotLoading(true);
    try {
      const response = await getHotArticles(10);
      if (response.data) {
        setHotArticles(response.data);
      }
    } catch (error) {
      console.error('Failed to get hot articles:', error);
    } finally {
      setHotLoading(false);
    }
  }, []);

  // 获取最新文章
  const fetchLatestArticles = useCallback(async () => {
    setLatestLoading(true);
    try {
      const response = await getLatestArticles(10);
      if (response.data) {
        setLatestArticles(response.data);
      }
    } catch (error) {
      console.error('Failed to get latest articles:', error);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  // 获取分类分布数据
  const fetchCategoryDistribution = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const response = await getCategoryDistribution();
      if (response.code === 200 && response.data) {
        setCategoryDistribution(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch category distribution data:', error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // 获取热门标签
  const fetchHotTags = useCallback(async () => {
    setHotTagsLoading(true);
    try {
      const response = await getHotTags(15); // 获取15个热门标签
      if (response.data) {
        setHotTags(response.data);
      }
    } catch (error) {
      console.error('Failed to get hot tags:', error);
    } finally {
      setHotTagsLoading(false);
    }
  }, []);

  // 获取指定分类的文章（带缓存检查）
  const fetchCategoryArticles = useCallback(async (categoryId) => {
    // 设置加载状态
    setCategoriesArticlesLoading(prev => ({ ...prev, [categoryId]: true }));

    // 检查是否已有缓存数据
    if (categoriesArticlesMap[categoryId]) {
      // 如果已经有缓存数据，直接设置当前分类ID，不再发送请求
      startTransition(() => {
        setCurrentCategoryId(categoryId);
        // 即使使用缓存数据，也需要将加载状态设置为false
        setCategoriesArticlesLoading(prev => ({ ...prev, [categoryId]: false }));
      });
      return;
    }

    try {
      const response = await getArticles({
        page: 1,
        page_size: 10,
        status: 'published',
        category_ids: [categoryId],
        sort_by: 'views'
      });

      if (response.data && response.data.items) {
        // 使用 startTransition 包装状态更新，避免页面闪烁
        startTransition(() => {
          setCategoriesArticlesMap(prev => ({
            ...prev,
            [categoryId]: response.data.items
          }));
          // 在这里更新当前分类ID
          setCurrentCategoryId(categoryId);
          // 设置加载状态为false
          setCategoriesArticlesLoading(prev => ({ ...prev, [categoryId]: false }));
        });
      }
    } catch (error) {
      console.error(`Failed to fetch articles for category ${categoryId}:`, error);
      // 错误时也需要设置加载状态为false
      startTransition(() => {
        setCategoriesArticlesLoading(prev => ({ ...prev, [categoryId]: false }));
      });
    }
  }, [startTransition, categoriesArticlesMap]);

  // 点击分类标签切换显示的文章
  const handleCategoryClick = useCallback((categoryId) => {
    // 如果已经在当前分类，则不操作
    if (categoryId === currentCategoryId) return;
    fetchCategoryArticles(categoryId);
  }, [currentCategoryId, fetchCategoryArticles]);

  // 获取热门分类的所有文章
  const fetchTopCategoriesArticles = useCallback(async () => {
    // 确保分类数据已加载
    if (categoryDistribution.length === 0) return;

    try {
      // 获取前五个热门分类（按文章数量排序）
      const topCategories = [...categoryDistribution]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (topCategories.length === 0) return;

      // 设置默认选中的分类ID
      if (currentCategoryId === null && topCategories.length > 0) {
        // 使用 startTransition 包装状态更新，避免页面闪烁
        startTransition(() => {
          setCurrentCategoryId(topCategories[0].id);
        });
      }

      // 初始化所有分类的加载状态
      const loadingState = {};
      topCategories.forEach(cat => {
        // 默认所有分类都设置false，除非是默认选中的分类且没有缓存
        if (cat.id === topCategories[0].id && !categoriesArticlesMap[cat.id]) {
          loadingState[cat.id] = true;
        } else {
          loadingState[cat.id] = false;
        }
      });
      setCategoriesArticlesLoading(loadingState);

      // 只为第一次默认选中的分类获取文章，其他分类在用户点击时才获取
      if (topCategories.length > 0) {
        const defaultCategoryId = topCategories[0].id;
        // 只有在没有缓存的情况下才获取
        if (!categoriesArticlesMap[defaultCategoryId]) {
          await fetchCategoryArticles(defaultCategoryId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch popular category articles:', error);
    }
  }, [categoryDistribution, fetchCategoryArticles, currentCategoryId, startTransition, categoriesArticlesMap]);

  useEffect(() => {
    fetchHotArticles();
    fetchLatestArticles();
    fetchCategoryDistribution();
    fetchHotTags();
  }, [fetchHotArticles, fetchLatestArticles, fetchCategoryDistribution, fetchHotTags]);

  // 当分类数据加载完成后，获取热门分类的文章
  useEffect(() => {
    if (categoryDistribution.length > 0 && !categoryLoading) {
      fetchTopCategoriesArticles();
    }
  }, [categoryDistribution, categoryLoading, fetchTopCategoriesArticles]);

  // 创建热门标签的CSS样式文件
  const createHotTagsStyleSheet = () => {
    // 检查样式是否已存在
    if (!document.getElementById('hot-tags-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'hot-tags-styles';
      styleSheet.innerHTML = `
        @keyframes float-0 {
          0% { transform: translateY(0px) rotate(var(--rotate-angle)); }
          100% { transform: translateY(-10px) rotate(var(--rotate-angle)); }
        }

        @keyframes float-1 {
          0% { transform: translateY(0px) rotate(var(--rotate-angle)); }
          100% { transform: translateY(-6px) rotate(var(--rotate-angle)); }
        }

        @keyframes float-2 {
          0% { transform: translateY(0px) rotate(var(--rotate-angle)); }
          100% { transform: translateY(-13px) rotate(var(--rotate-angle)); }
        }

        @keyframes float-3 {
          0% { transform: translateY(0px) rotate(var(--rotate-angle)); }
          100% { transform: translateY(-8px) rotate(var(--rotate-angle)); }
        }

        .hot-tag-item {
          display: inline-block;
          transition: all 0.3s ease;
        }

        .hot-tag-item:hover {
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
          z-index: 10 !important;
          filter: brightness(1.4) !important;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  };

  // 组件挂载时创建样式
  useEffect(() => {
    createHotTagsStyleSheet();
    return () => {
      // 组件卸载时清理样式
      const styleElement = document.getElementById('hot-tags-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // 点赞文章
  const handleLikeArticle = async (articleId, source = 'hot') => {
    // 检查用户是否登录
    if (!user) {
      message.info('请先登录后再进行操作');
      navigate('/login');
      return;
    }

    try {
      const response = await toggleLikeArticle(articleId);

      if (response.data !== undefined) {
        // 更新文章列表中的点赞状态
        const updateArticles = (prevArticles) =>
          prevArticles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  like_count: response.data.interacted
                    ? article.like_count + 1
                    : article.like_count - 1,
                  interactions: {
                    ...article.interactions,
                    liked: response.data.interacted
                  }
                }
              : article
          );

        // 根据来源更新不同的文章列表
        if (source === 'hot') {
          setHotArticles(updateArticles);
        } else if (source === 'latest') {
          setLatestArticles(updateArticles);
        } else if (source === 'topCategories') {
          setCategoriesArticlesMap(prev => ({...prev,[currentCategoryId]: updateArticles(prev[currentCategoryId] || [])}));
        }

        message.success(response.data.interacted ? '点赞成功' : '已取消点赞');
      }
    } catch (error) {
      console.error('Failed to like the article:', error);
      message.error('点赞操作失败');
    }
  };

  // 收藏文章
  const handleFavoriteArticle = async (articleId, source = 'hot') => {
    // 检查用户是否登录
    if (!user) {
      message.info('请先登录后再进行操作');
      navigate('/login');
      return;
    }

    try {
      const response = await toggleFavoriteArticle(articleId);

      if (response.data !== undefined) {
        // 更新文章列表中的收藏状态
        const updateArticles = (prevArticles) =>
          prevArticles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  favorite_count: response.data.interacted
                    ? article.favorite_count + 1
                    : article.favorite_count - 1,
                  interactions: {
                    ...article.interactions,
                    favorited: response.data.interacted
                  }
                }
              : article
          );

        // 根据来源更新不同的文章列表
        if (source === 'hot') {
          setHotArticles(updateArticles);
        } else if (source === 'latest') {
          setLatestArticles(updateArticles);
        } else if (source === 'topCategories') {
          setCategoriesArticlesMap(prev => ({...prev,[currentCategoryId]: updateArticles(prev[currentCategoryId] || [])}));
        }

        message.success(response.data.interacted ? '收藏成功' : '已取消收藏');
      }
    } catch (error) {
      console.error('Failed to favorite the article:', error);
      message.error('收藏操作失败');
    }
  };

  // 评论文章
  const handleCommentArticle = (articleId) => {
    // 检查用户是否登录
    if (!user) {
      message.info('请先登录后再进行操作');
      navigate('/login');
      return;
    }

    // 跳转到文章详情页
    navigate(`/articles/${articleId}`);
  };

  // 根据文章数量和索引获取标签样式
  const getTagStyle = (count, index) => {
    // 计算旋转角度
    const rotateAngle = Math.sin(index * 0.5) * 5;

    // 基本样式
    const baseStyle = {
      margin: '0 8px 12px 0',
      fontSize: `${Math.min(16 + count/10, 22)}px`,
      padding: '8px 15px',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'inline-block',
      position: 'relative',
      boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)',
      fontWeight: count > 15 ? 'bold' : 'normal',
      color: '#fff',
      // 设置自定义属性存储旋转角度
      '--rotate-angle': `${rotateAngle}deg`,
    };

    // 根据文章数量和索引位置选择不同的样式变化
    if (count >= 30) {
      // 重要标签角度更大
      const biggerRotateAngle = Math.sin(index * 0.3) * 8;
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #ff4d4f, #ff7a45)',
        boxShadow: '0 4px 12px rgba(255, 77, 79, 0.4)',
        borderRadius: '16px 4px 16px 4px',
        zIndex: 5,
        transform: 'scale(1.1)',
        '--rotate-angle': `${biggerRotateAngle}deg`,
      };
    } else if (count >= 20) {
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #ff7a45, #fa8c16)',
        borderRadius: '4px 16px 4px 16px',
        boxShadow: '0 3px 10px rgba(250, 140, 22, 0.3)',
        zIndex: 4,
      };
    } else if (count >= 10) {
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #fa8c16, #ffc53d)',
        borderRadius: index % 2 === 0 ? '18px 6px 18px 6px' : '6px 18px 6px 18px',
        zIndex: 3,
      };
    } else if (count >= 5) {
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #ffc53d, #ffec3d)',
        color: '#873800',
        borderRadius: index % 3 === 0 ? '20px 8px' : index % 3 === 1 ? '8px 20px' : '14px',
        zIndex: 2,
      };
    } else {
      return {
        ...baseStyle,
        background: 'linear-gradient(45deg, #ffec3d, #bae637)',
        color: '#614700',
        zIndex: 1,
      };
    }
  };

  // 根据索引获取标签位置样式
  const getTagPositionStyle = (index, total) => {
    // 创建交错的标签布局
    // Math.floor(index / 5); // 大致分行 - 注释掉未使用的变量
    const offsetX = Math.sin(index * 0.8) * 20; // 水平偏移
    const offsetY = Math.cos(index * 0.5) * 10; // 垂直偏移

    return {
      transform: `translateX(${offsetX}px) translateY(${offsetY}px)`,
      marginLeft: (index % 2 === 0) ? '5px' : '15px',
      marginRight: (index % 3 === 0) ? '20px' : '10px',
      marginTop: (index % 4 === 0) ? '5px' : (index % 4 === 1) ? '15px' : '10px',
      marginBottom: (index % 3 === 0) ? '20px' : '15px',
      zIndex: total - index, // 使较少数量的标签在前面
    };
  };

  // 移除未使用的网格配置

  return (
    <div className="article-list-page">
      {/* 热门文章区域 */}
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Typography.Title level={4} style={{
              margin: 0,
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #ff4d4f 0%, #ff7a45 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              padding: '0 2px'
            }}>
              <FireOutlined style={{
                color: '#ff4d4f',
                marginRight: 10,
                fontSize: '22px',
                filter: 'drop-shadow(0 2px 3px rgba(255, 77, 79, 0.2))'
              }} />
              热门文章推荐
              <div style={{
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '40%',
                height: 3,
                background: 'linear-gradient(90deg, #ff4d4f 0%, transparent 100%)',
                borderRadius: 2
              }}></div>
            </Typography.Title>
            <Link to="/search?sort_by=views&expanded=true&auto_search=true">
              <Button type="link" size="small" style={{ fontWeight: 500 }}>
                查看更多 <RightOutlined />
              </Button>
            </Link>
          </div>
          <HorizontalArticleList
            articles={hotArticles}
            loading={hotLoading}
            pagination={false}
            onLike={(id) => handleLikeArticle(id, 'hot')}
            onFavorite={(id) => handleFavoriteArticle(id, 'hot')}
            onComment={handleCommentArticle}
            emptyText="暂无热门文章"
            maxVisibleTags={3}
          />
        </Col>
      </Row>

      {/* 最新文章区域 */}
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Typography.Title level={4} style={{
              margin: 0,
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #1890ff 0%, #36cfc9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              padding: '0 2px'
            }}>
              <HistoryOutlined style={{
                color: '#1890ff',
                marginRight: 10,
                fontSize: '22px',
                filter: 'drop-shadow(0 2px 3px rgba(24, 144, 255, 0.2))'
              }} />
              最新文章发布
              <div style={{
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '40%',
                height: 3,
                background: 'linear-gradient(90deg, #1890ff 0%, transparent 100%)',
                borderRadius: 2
              }}></div>
            </Typography.Title>
            <Link to="/search?sort_by=newest&expanded=true&auto_search=true">
              <Button type="link" size="small" style={{ fontWeight: 500 }}>
                查看更多 <RightOutlined />
              </Button>
            </Link>
          </div>
          <HorizontalArticleList
            articles={latestArticles}
            loading={latestLoading}
            pagination={false}
            onLike={(id) => handleLikeArticle(id, 'latest')}
            onFavorite={(id) => handleFavoriteArticle(id, 'latest')}
            onComment={handleCommentArticle}
            emptyText="暂无最新文章"
            maxVisibleTags={3}
          />
        </Col>
      </Row>

      {/* 热门标签区域 */}
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Typography.Title level={4} style={{
              margin: 0,
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #ff4d4f 0%, #ff7a45 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              padding: '0 2px'
            }}>
              <TagOutlined style={{
                color: '#ff4d4f',
                marginRight: 10,
                fontSize: '24px',
                filter: 'drop-shadow(0 3px 5px rgba(255, 77, 79, 0.4))'
              }} />
              火热标签
              <div style={{
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '40%',
                height: 3,
                background: 'linear-gradient(90deg, #ff4d4f 0%, transparent 100%)',
                borderRadius: 2
              }}></div>
            </Typography.Title>
          </div>

          {hotTagsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : hotTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无热门标签
            </div>
          ) : (
            <div className="hot-tags-container" style={{
              padding: '10px 0',
              position: 'relative',
              // minHeight: '180px',
              perspective: '1000px',
              overflow: 'hidden'
            }}>
              {hotTags.map((tag, index) => (
                <Link to={`/search?expanded=true&tag_ids=${tag.id}&auto_search=true`} key={tag.id}>
                  <div
                    className="hot-tag-item"
                    style={{
                      ...getTagStyle(tag.article_count, index),
                      ...getTagPositionStyle(index, hotTags.length),
                      animation: `float-${index % 4} ${3 + index % 3}s infinite alternate`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    {tag.name}
                    <span style={{
                      fontWeight: 'bold',
                      marginLeft: 5,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      padding: '0px 6px',
                      fontSize: '0.9em',
                      display: 'inline-block'
                    }}>
                      {tag.article_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Col>
      </Row>

      {/* 分类分布区域 */}
      {categoryDistribution.length > 0 && (
        <Row gutter={[0, 24]}>
          <Col span={24}>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Typography.Title level={4} style={{
                margin: 0,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #722ed1 0%, #1890ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                padding: '0 2px'
              }}>
                <AppstoreOutlined style={{
                  color: '#722ed1',
                  marginRight: 10,
                  fontSize: '22px',
                  filter: 'drop-shadow(0 2px 3px rgba(114, 46, 209, 0.2))'
                }} />
                文章分类分布
                <div style={{
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  width: '40%',
                  height: 3,
                  background: 'linear-gradient(90deg, #722ed1 0%, transparent 100%)',
                  borderRadius: 2
                }}></div>
              </Typography.Title>

            </div>

            <div className="category-distribution-section fade-in">
              <Spin spinning={categoryLoading}>
                {/* 计算总数 */}
                {(() => {
                  const total = categoryDistribution.reduce((sum, cat) => sum + cat.count, 0);

                  // 颜色数组
                  const colors = ['#1890ff', '#52c41a', '#eb2f96', '#faad14', '#722ed1', '#13c2c2', '#fa541c', '#f759ab', '#7cb305', '#08979c', '#096dd9', '#d46b08', '#389e0d', '#cf1322'];

                  // 排序分类，使大的分类在前面
                  const sortedCategories = [...categoryDistribution].sort((a, b) => b.count - a.count);

                  return (
                    <>
                      {/* GitHub风格进度条 */}
                      <div className="github-style-bar">
                        {sortedCategories.map((category, index) => {
                          const percent = total > 0 ? (category.count / total) * 100 : 0;
                          const color = colors[index % colors.length];

                          return (
                            <Tooltip
                              key={category.name}
                              title={`${category.name}: ${category.count} 篇 (${Math.round(percent)}%)`}
                              color={color}
                            >
                              <div
                                className="category-segment"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: color,
                                  cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/search?expanded=true&category_name=${encodeURIComponent(category.name)}&auto_search=true`)}
                              />
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* 分类图例 */}
                      <div className="category-legend" style={{ marginTop: 16 }}>
                        {sortedCategories.map((category, index) => {
                          const color = colors[index % colors.length];
                          const percent = total > 0 ? (category.count / total) * 100 : 0;
                          // 计算动画延迟类名
                          const delayClass = `category-item-delay-${Math.min(index + 1, 10)}`;

                          return (
                            <Link
                              key={category.name}
                              to={`/search?expanded=true&category_name=${encodeURIComponent(category.name)}&auto_search=true`}
                            >
                              <div className={`legend-item category-item-enter ${delayClass}`}>
                                <span className="color-dot" style={{ backgroundColor: color }}></span>
                                <span className="category-name">{category.name}</span>
                                <span className="category-percent">{Math.round(percent)}%</span>
                                <span className="category-count">({category.count})</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {categoryDistribution.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Text type="secondary">暂无分类数据</Text>
                  </div>
                )}
              </Spin>
            </div>

            {/* 分类标签栏 */}
            {categoryDistribution.length > 0 && (
              <div className="category-tabs" style={{ marginTop: 24, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Row gutter={[12, 16]}>
                      {/* 利用分类分布中的相同颜色数组 */}
                      {(() => {
                        // 复用分类分布组件中的相同颜色数组
                        const colors = ['#1890ff', '#52c41a', '#eb2f96', '#faad14', '#722ed1', '#13c2c2', '#fa541c', '#f759ab', '#7cb305', '#08979c', '#096dd9', '#d46b08', '#389e0d', '#cf1322'];

                        // 排序分类，与分类分布保持一致
                        const sortedCategories = [...categoryDistribution]
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5);

                        return sortedCategories.map((category, index) => {
                          const color = colors[index % colors.length];
                          // 创建从单色到透明的渐变
                          const gradient = `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
                          const isActive = currentCategoryId === category.id;

                          return (
                            <Col key={category.id}>
                              <Button
                                type={isActive ? 'primary' : 'default'}
                                onClick={() => handleCategoryClick(category.id)}
                                className="category-tab-button"
                                style={{
                                  borderRadius: '18px',
                                  padding: '4px 16px',
                                  height: 'auto',
                                  border: isActive ? 'none' : '1px solid #f0f0f0',
                                  background: isActive ? gradient : 'white',
                                  boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                                  fontWeight: isActive ? 'bold' : 'normal',
                                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                  transform: isActive ? 'translateY(-2px)' : 'none',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  // 添加悬停效果
                                  ':hover': {
                                    borderColor: 'transparent',
                                    boxShadow: isActive ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    transform: isActive ? 'translateY(-4px)' : 'translateY(-2px)',
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: isActive ? 'white' : gradient,
                                    marginRight: '8px',
                                    boxShadow: isActive ? '0 0 4px rgba(255, 255, 255, 0.8)' : 'none',
                                    transition: 'all 0.3s'
                                  }}></span>
                                  <span style={{
                                    color: isActive ? 'white' : 'rgba(0, 0, 0, 0.65)',
                                    transition: 'color 0.3s'
                                  }}>
                                    {category.name}
                                  </span>
                                  <span style={{
                                    marginLeft: '6px',
                                    fontSize: '12px',
                                    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                                    color: isActive ? 'white' : 'rgba(0, 0, 0, 0.45)',
                                    borderRadius: '10px',
                                    padding: '1px 8px',
                                    transition: 'all 0.3s'
                                  }}>
                                    {category.count}
                                  </span>
                                </div>
                              </Button>
                            </Col>
                          );
                        });
                      })()}
                    </Row>
                  </div>
                  {/* 查看更多按钮 */}
                  {currentCategoryId && (
                    <Link to={`/search?expanded=true&category_ids=${currentCategoryId}&auto_search=true`}>
                      <Button type="link" size="small" style={{ fontWeight: 500, marginLeft: 8 }}>
                        查看更多 <RightOutlined />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* 添加CSS样式以支持悬停效果 */}
            <style jsx>{`
              .category-tab-button:hover {
                border-color: transparent !important;
                box-shadow: ${currentCategoryId ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'} !important;
                transform: ${currentCategoryId ? 'translateY(-4px)' : 'translateY(-2px)'} !important;
              }

              /* 添加悬停时的微光效果 */
              .category-tab-button:hover::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 50%;
                height: 100%;
                background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
                transform: skewX(-25deg);
                animation: shine 0.75s;
              }

              @keyframes shine {
                100% {
                  left: 150%;
                }
              }
            `}</style>

            {/* 当前分类文章列表 */}
            {currentCategoryId && (
              <div className="top-categories-articles" style={{ marginTop: 10 }}>
                <HorizontalArticleList
                  articles={categoriesArticlesMap[currentCategoryId] || []}
                  loading={categoriesArticlesLoading[currentCategoryId]}
                  pagination={false}
                  onLike={(id) => handleLikeArticle(id, 'topCategories')}
                  onFavorite={(id) => handleFavoriteArticle(id, 'topCategories')}
                  onComment={handleCommentArticle}
                  emptyText="暂无该分类文章"
                  maxVisibleTags={3}
                />
              </div>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ArticlesPage;
