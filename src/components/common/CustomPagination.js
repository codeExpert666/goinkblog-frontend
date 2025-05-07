import React from 'react';
import { Pagination } from 'antd';
import '../../styles/common/pagination.css';

/**
 * 自定义分页组件，基于 Ant Design 的分页组件
 */
const CustomPagination = ({ 
  current, 
  pageSize, 
  total, 
  onChange,
  ...restProps 
}) => {
  return (
    <div className="centered-pagination">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Pagination
          current={current}
          pageSize={pageSize}
          total={total}
          onChange={onChange}
          {...restProps}
        />
      </div>
    </div>
  );
};

export default CustomPagination;
