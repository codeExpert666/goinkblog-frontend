import React, { useState, useEffect } from 'react';
import { Select, Spin, message } from 'antd';
import { getAllCategories, getCategoryById } from '../../services/category';

const { Option } = Select;

// 自定义分类选择组件
// 使用 labelInValue 模式来确保显示分类名称而不是 ID
const CategorySelect = ({
  value,
  onChange,
  mode = 'single', // 'single' 或 'multiple'
  placeholder = '请选择分类',
  allowClear = true,
  style = {},
  disabled = false,
}) => {
  // 状态
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [internalValue, setInternalValue] = useState(undefined);

  // 获取所有分类
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await getAllCategories();
        if (response.data && response.data.items) {
          setCategories(response.data.items);
        }
      } catch (error) {
        console.error('获取分类列表失败:', error);
        message.error('获取分类列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 当外部值变化时，转换为内部值格式
  useEffect(() => {
    const convertValueToInternal = async () => {
      // 如果没有值，则设置为 undefined
      if (!value) {
        setInternalValue(undefined);
        return;
      }

      // 如果分类列表为空，则需要获取分类信息
      if (categories.length === 0) {
        // 处理多选模式
        if (mode === 'multiple' && Array.isArray(value)) {
          try {
            const promises = value.map(id => getCategoryById(id));
            const responses = await Promise.all(promises);
            const validResponses = responses.filter(response => response.data);

            if (validResponses.length > 0) {
              const labeledValues = validResponses.map(response => ({
                key: response.data.id,
                value: response.data.id,
                label: response.data.name + (response.data.article_count > 0 ? ` (${response.data.article_count})` : '')
              }));
              setInternalValue(labeledValues);
            } else {
              setInternalValue(value.map(id => ({ key: id, value: id, label: `分类 ${id}` })));
            }
          } catch (error) {
            console.error('获取分类信息失败:', error);
            setInternalValue(value.map(id => ({ key: id, value: id, label: `分类 ${id}` })));
          }
        }
        // 处理单选模式
        else if (value) {
          try {
            const response = await getCategoryById(value);
            if (response.data) {
              setInternalValue({
                key: response.data.id,
                value: response.data.id,
                label: response.data.name + (response.data.article_count > 0 ? ` (${response.data.article_count})` : '')
              });
            } else {
              setInternalValue({ key: value, value, label: `分类 ${value}` });
            }
          } catch (error) {
            console.error(`获取分类 ID ${value} 信息失败:`, error);
            setInternalValue({ key: value, value, label: `分类 ${value}` });
          }
        }
      } else {
        // 如果分类列表不为空，则使用列表中的分类信息
        // 处理多选模式
        if (mode === 'multiple' && Array.isArray(value)) {
          const labeledValues = value.map(id => {
            const category = categories.find(c => String(c.id) === String(id));
            return {
              key: id,
              value: id,
              label: category ? category.name + (category.article_count > 0 ? ` (${category.article_count})` : '') : `分类 ${id}`
            };
          });
          setInternalValue(labeledValues);
        }
        // 处理单选模式
        else if (value) {
          const category = categories.find(c => String(c.id) === String(value));
          setInternalValue({
            key: value,
            value,
            label: category ? category.name + (category.article_count > 0 ? ` (${category.article_count})` : '') : `分类 ${value}`
          });
        }
      }
    };

    convertValueToInternal();
  }, [value, categories, mode]);

  // 处理值变化
  const handleChange = (newValue) => {
    console.log('CategorySelect handleChange:', newValue);

    // 如果是多选模式，则转换为 ID 数组
    if (mode === 'multiple') {
      const ids = newValue.map(item => item.value);
      onChange(ids);
    }
    // 如果是单选模式，则转换为 ID
    else {
      onChange(newValue ? newValue.value : undefined);
    }
  };

  // 添加调试日志
  console.log('CategorySelect value:', value);
  console.log('CategorySelect internalValue:', internalValue);
  console.log('CategorySelect categories:', categories);

  return (
    <Select
      labelInValue
      value={internalValue}
      onChange={handleChange}
      mode={mode}
      placeholder={placeholder}
      allowClear={allowClear}
      style={{ width: '100%', ...style }}
      loading={loading}
      disabled={disabled}
      notFoundContent={loading ? <Spin size="small" /> : null}
      optionFilterProp="children"
    >
      {categories.map(category => (
        <Option key={category.id} value={category.id} title={category.name}>
          {category.name} {category.article_count > 0 && `(${category.article_count})`}
        </Option>
      ))}
    </Select>
  );
};

export default CategorySelect;
