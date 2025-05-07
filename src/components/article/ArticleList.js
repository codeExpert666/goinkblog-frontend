import React from 'react';
import { List, Empty, Spin } from 'antd';
import ArticleItem from './ArticleItem';
import CustomPagination from '../common/CustomPagination';
import '../../styles/article/articleCard.css';
import '../../styles/common/pagination.css';

const ArticleList = ({
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
  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <List
        grid={grid}
        dataSource={articles}
        pagination={false}
        locale={{ emptyText: <Empty description={emptyText} /> }}
        renderItem={(article) => (
          <List.Item>
            <ArticleItem
              article={article}
              onLike={onLike}
              onFavorite={onFavorite}
              onComment={onComment}
              maxVisibleTags={maxVisibleTags}
            />
          </List.Item>
        )}
      />

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

export default ArticleList;
