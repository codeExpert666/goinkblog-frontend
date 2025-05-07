import React from 'react';
import { List, Empty, Spin, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import DraftArticleItem from './DraftArticleItem';
import CustomPagination from '../common/CustomPagination';
import '../../styles/common/pagination.css';

const { confirm } = Modal;

const DraftArticleList = ({
  articles,
  loading,
  pagination,
  onChange,
  onPublish,
  onDelete,
  emptyText = "暂无草稿",
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
  // 确认发布对话框
  const showPublishConfirm = (id, title) => {
    confirm({
      title: '确定要发布这篇文章吗？',
      icon: <ExclamationCircleOutlined />,
      content: `一旦发布，文章《${title || '无标题'}》将对所有人可见`,
      okText: '发布',
      cancelText: '取消',
      onOk() {
        if (onPublish) onPublish(id);
      },
    });
  };

  // 确认删除对话框
  const showDeleteConfirm = (id, title) => {
    confirm({
      title: '确定要删除这篇草稿吗？',
      icon: <ExclamationCircleOutlined />,
      content: `删除后将无法恢复《${title || '无标题'}》`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        if (onDelete) onDelete(id);
      },
    });
  };

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
            <DraftArticleItem
              article={article}
              onPublish={() => showPublishConfirm(article.id, article.title)}
              onDelete={() => showDeleteConfirm(article.id, article.title)}
              maxVisibleTags={maxVisibleTags}
            />
          </List.Item>
        )}
      />

      {articles.length > 0 && (
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

export default DraftArticleList;
