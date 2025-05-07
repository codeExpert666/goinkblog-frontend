import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../store/authContext';
import { Row, Col, message } from 'antd';
import {
  getArticles,
  toggleLikeArticle,
  toggleFavoriteArticle
} from '../../services/article';
import { getAllCategories } from '../../services/category';
import ArticleList from '../../components/article/ArticleList';
import ArticleFilter from '../../components/article/ArticleFilter';
import '../../styles/article/articleCard.css';

const SearchPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filterParams, setFilterParams] = useState({
    sort_by: query.get('sort_by') || '',
    category_ids: query.get('category_ids') ? [query.get('category_ids')] : [],
    tag_ids: query.get('tag_ids') ? [query.get('tag_ids')] : []
  });

  // 获取文章列表
  const fetchArticles = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { page = 1, ...restParams } = params;

      const response = await getArticles({
        page,
        page_size: 12,
        status: 'published', // 默认只显示已发布的文章
        ...restParams,
      });

      if (response.data) {
        setArticles(response.data.items || []);
        setPagination({
          current: response.data.page || 1,
          pageSize: 12,
          total: response.data.total || 0,
        });
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      message.error('获取文章列表失败');
    } finally {
      setLoading(false);
    }
  }, []);  // 这里不需要添加依赖项，因为这个函数只依赖于组件内的状态更新函数

  // 使用 useRef 来跟踪是否是首次渲染
  const isInitialRender = useRef(true);
  const prevSearch = useRef(location.search);

  // 初始化时获取数据
  useEffect(() => {
    // 如果是首次渲染或者 URL 参数发生了变化，才执行请求
    if (isInitialRender.current || prevSearch.current !== location.search) {
      isInitialRender.current = false;
      prevSearch.current = location.search;

      const newParams = {
        page: 1,
        status: 'published',
        sort_by: query.get('sort_by') || ''
      };

      // 如果 URL 中有 category_ids 参数，则添加到请求参数中
      const categoryId = query.get('category_ids');
      if (categoryId) {
        newParams.category_ids = [categoryId];
      }

      // 如果 URL 中有 tag_ids 参数，则添加到请求参数中
      const tagId = query.get('tag_ids');
      if (tagId) {
        newParams.tag_ids = [tagId];
      }

      // 如果 URL 中有 category_name 参数，则需要先获取对应的分类ID
      const categoryName = query.get('category_name');
      if (categoryName && !categoryId) {
        // 先设置筛选参数，但不包含category_ids
        setFilterParams(prev => ({
          ...prev,
          sort_by: newParams.sort_by,
          tag_ids: newParams.tag_ids || []
        }));

        // 异步获取分类ID并执行搜索
        const fetchCategoryIdByName = async () => {
          try {
            const response = await getAllCategories();
            if (response.data && response.data.items) {
              // 查找匹配的分类
              const matchedCategory = response.data.items.find(
                category => category.name === categoryName
              );

              if (matchedCategory) {
                // 找到匹配的分类，更新参数并执行搜索
                newParams.category_ids = [matchedCategory.id];

                // 更新筛选参数状态
                setFilterParams(prev => ({
                  ...prev,
                  category_ids: [matchedCategory.id]
                }));

                // 执行搜索
                fetchArticles(newParams);
              } else {
                // 未找到匹配的分类，仍然执行搜索但不带分类ID
                console.warn(`未找到名为 "${categoryName}" 的分类`);
                fetchArticles(newParams);
              }
            } else {
              // 获取分类列表失败，仍然执行搜索但不带分类ID
              fetchArticles(newParams);
            }
          } catch (error) {
            console.error('获取分类列表失败:', error);
            // 出错时仍然执行搜索但不带分类ID
            fetchArticles(newParams);
          }
        };

        fetchCategoryIdByName();
      } else {
        // 没有category_name参数或已有category_ids参数，直接设置筛选参数并执行搜索
        setFilterParams(prev => ({
          ...prev,
          sort_by: newParams.sort_by,
          category_ids: newParams.category_ids || [],
          tag_ids: newParams.tag_ids || []
        }));

        fetchArticles(newParams);
      }
    }
  }, [location.search, query, fetchArticles]);

  // 筛选条件变化时重新获取数据
  const handleFilterChange = (values) => {
    const params = {
      ...values,
      page: 1
    };
    setFilterParams(values);
    fetchArticles(params);
  };

  // 分页变化时重新获取数据
  const handlePageChange = (page) => {
    const params = {
      ...filterParams,
      page
    };
    fetchArticles(params);
  };

  // 点赞文章
  const handleLikeArticle = async (articleId) => {
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
        setArticles(prevArticles =>
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
          )
        );

        message.success(response.data.interacted ? '点赞成功' : '已取消点赞');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error('点赞操作失败');
    }
  };

  // 收藏文章
  const handleFavoriteArticle = async (articleId) => {
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
        setArticles(prevArticles =>
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
          )
        );

        message.success(response.data.interacted ? '收藏成功' : '已取消收藏');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
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

  return (
    <div className="search-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {/* 文章筛选器 */}
          <ArticleFilter
            initialValues={filterParams}
            onSearch={handleFilterChange}
            loading={loading}
          />

          {/* 文章列表 */}
          <ArticleList
            articles={articles}
            loading={loading}
            pagination={pagination}
            onChange={handlePageChange}
            onLike={handleLikeArticle}
            onFavorite={handleFavoriteArticle}
            onComment={handleCommentArticle}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SearchPage;
