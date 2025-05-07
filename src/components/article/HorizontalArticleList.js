import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Empty, Spin, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ArticleItem from './ArticleItem';
import CustomPagination from '../common/CustomPagination';
import '../../styles/article/articleCard.css';
import '../../styles/article/horizontalArticleList.css';
import '../../styles/common/pagination.css';

/**
 * 水平滚动的文章列表组件
 * 基于ArticleList组件，但使用水平滚动布局
 *
 * 支持响应式布局，通过grid属性配置不同断点的列数：
 * - xs: 超小屏幕 (<576px)
 * - sm: 小屏幕 (≥576px)
 * - md: 中等屏幕 (≥768px)
 * - lg: 大屏幕 (≥992px)
 * - xl: 超大屏幕 (≥1200px)
 * - xxl: 超超大屏幕 (≥1600px)
 */
const HorizontalArticleList = ({
  articles,
  loading,
  pagination,
  onChange,
  onLike,
  onFavorite,
  onComment,
  emptyText = "暂无文章",
  maxVisibleTags = 3,
  grid = {
    gutter: 16,
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3,
    xxl: 4
  },
}) => {
  const scrollContainerRef = useRef(null);

  // 响应式布局状态 - 只需要列数
  const [columnsCount, setColumnsCount] = useState(grid.xxl);
  
  // 添加状态用于判断是否需要显示滚动按钮
  const [canScroll, setCanScroll] = useState(false);

  // 监听窗口大小变化，更新响应式布局
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let columns = grid.xxl;

      if (width < 576) {
        columns = grid.xs;
      } else if (width < 768) {
        columns = grid.sm;
      } else if (width < 992) {
        columns = grid.md;
      } else if (width < 1200) {
        columns = grid.lg;
      } else if (width < 1600) {
        columns = grid.xl;
      }

      setColumnsCount(columns);
    };

    // 初始调用一次
    handleResize();

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);

    // 组件卸载时移除监听
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [grid]);

  // 处理左右滚动
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // 每次滚动的像素数
      const currentScroll = scrollContainerRef.current.scrollLeft;

      if (direction === 'left') {
        scrollContainerRef.current.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: 'smooth'
        });
      } else {
        scrollContainerRef.current.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  // 检查内容是否可以滚动的函数
  const checkScrollable = useCallback(() => {
    if (scrollContainerRef.current) {
      // 如果内容宽度大于容器宽度，则可以滚动
      const isScrollable = scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth;
      setCanScroll(isScrollable);
    }
  }, []);

  // 在内容变化或窗口大小改变时检查是否可滚动
  useEffect(() => {
    checkScrollable();
    // 添加 resize 事件监听，窗口大小改变时重新检查
    window.addEventListener('resize', checkScrollable);
    
    // 组件卸载时移除监听
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [articles, columnsCount, checkScrollable]);

  // 修改加载状态的处理方式，不再直接返回加载组件
  // 而是在文章列表上方显示加载指示器，保持原有内容
  const showLoadingIndicator = loading;

  return (
    <div className="horizontal-article-list-container">
      {/* 加载指示器 - 当加载时显示在顶部，不影响内容布局 */}
      {showLoadingIndicator && (
        <div className="article-list-loading-indicator">
          <Spin size="small" />
        </div>
      )}

      {/* 左右滚动按钮 - 仅在文章列表可滚动时显示 */}
      {articles.length > 0 && canScroll && (
        <>
          <Button
            className="scroll-button scroll-left"
            icon={<LeftOutlined />}
            onClick={() => handleScroll('left')}
            shape="circle"
          />
          <Button
            className="scroll-button scroll-right"
            icon={<RightOutlined />}
            onClick={() => handleScroll('right')}
            shape="circle"
          />
        </>
      )}

      {/* 水平滚动容器 - 添加过渡效果 */}
      <div
        className={`horizontal-scroll-container ${showLoadingIndicator ? 'loading' : ''}`}
        ref={scrollContainerRef}
        style={{
          opacity: showLoadingIndicator ? 0.7 : 1,
          transition: 'opacity 0.3s ease',
          minHeight: '200px', // 确保容器有最小高度，避免内容切换时的跳动
          margin: `0 -${grid.gutter / 2}px` // 根据grid.gutter动态设置外边距
        }}
      >
        {articles.length === 0 ? (
          <Empty description={emptyText} />
        ) : (
          articles.map((article) => (
            <div
              className="horizontal-article-item"
              key={article.id}
              style={{
                margin: `0 ${grid.gutter / 2}px`, // 根据grid.gutter动态设置内边距
                width: `calc(${100 / columnsCount}% - ${grid.gutter}px)`, // 使用当前响应式列数
              }}
            >
              <ArticleItem
                article={article}
                onLike={onLike}
                onFavorite={onFavorite}
                onComment={onComment}
                maxVisibleTags={maxVisibleTags}
              />
            </div>
          ))
        )}
      </div>

      {/* 只有当pagination不为false且文章列表不为空时才显示分页组件 */}
      {pagination !== false && articles.length > 0 && (
        <CustomPagination
          current={pagination.current}
          pageSize={pagination.pageSize || 6}
          total={pagination.total}
          onChange={(page) => onChange(page, pagination.pageSize || 6)}
          showQuickJumper
          showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 篇`}
          showLessItems
          responsive
        />
      )}
    </div>
  );
};

export default HorizontalArticleList;
