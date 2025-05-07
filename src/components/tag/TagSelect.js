import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Select, Tag, Tooltip, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getAllTags, createTag, getTagById } from '../../services/tag';
import tagCache from '../../services/tagCache';

/**
 * 标签选择组件
 * @param {Object} props 组件属性
 * @param {string} props.value 当前选中的标签ID数组（受控组件时使用）
 * @param {Function} props.onChange 标签选择变更时的回调函数
 * @param {string} props.placeholder 占位文本
 * @param {number} props.maxTagCount 最大标签数量，默认为6
 * @param {boolean} props.allowClear 是否允许清空选择
 * @param {boolean} props.allowCreate 是否允许创建新标签，默认为true
 * @param {string} props.mode 模式，支持 'multiple'（多选）和 'tags'（可创建标签）
 */
const TagSelect = ({
  value,
  onChange,
  placeholder = '请选择或输入标签',
  maxTagCount = 6,
  allowClear = true,
  allowCreate = true,
  mode = 'multiple',
  ...restProps
}) => {
  // 所有标签列表
  const [tags, setTags] = useState([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 搜索文本
  const [searchText, setSearchText] = useState('');
  // 选中的标签ID列表
  const [selectedTags, setSelectedTags] = useState([]);
  // 内部值格式，用于labelInValue模式
  const [internalValue, setInternalValue] = useState([]);
  // 标签是否达到上限
  const [isMaxed, setIsMaxed] = useState(false);
  // 下拉框是否打开
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // 警告消息计时器引用
  const warningTimerRef = useRef(null);
  // 选择器组件引用
  const selectRef = useRef(null);

  // 添加自定义样式，在标签达到上限时隐藏输入框
  useEffect(() => {
    // 添加自定义样式到head
    if (!document.getElementById('tag-select-styles')) {
      const style = document.createElement('style');
      style.id = 'tag-select-styles';
      style.innerHTML = `
        .tags-maxed .ant-select-selection-search {
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // 组件卸载时清理样式
      const styleEl = document.getElementById('tag-select-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // 获取警告消息文本
  const getWarningMessage = () => {
    return allowCreate
      ? '文章关联标签已达最大数量'
      : '标签选择已达最大数量';
  };

  // 显示警告消息，使用统一的函数和防抖
  const showWarning = () => {
    // 如果已有计时器，则不再显示
    if (warningTimerRef.current) return;

    // 显示警告
    message.warning(getWarningMessage());

    // 设置计时器，2秒内不再显示
    warningTimerRef.current = setTimeout(() => {
      warningTimerRef.current = null;
    }, 2000);
  };

  // 清理计时器
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  // 初始化和处理外部传入的value变化
  useEffect(() => {
    if (value) {
      const tagIds = Array.isArray(value) ? value : [value];
      setSelectedTags(tagIds);
      setIsMaxed(tagIds.length >= maxTagCount);
    } else {
      setSelectedTags([]);
      setIsMaxed(false);
    }
  }, [value, maxTagCount]);

  // 当外部值变化时，转换为内部值格式
  useEffect(() => {
    const convertValueToInternal = async () => {
      // 如果没有值，则设置为空数组
      if (!selectedTags || selectedTags.length === 0) {
        setInternalValue([]);
        return;
      }

      // 如果标签列表为空，则需要获取标签信息
      if (tags.length === 0) {
        try {
          const promises = selectedTags.map(id => {
            // 先从缓存中查找
            const cachedTag = tagCache.data[id];
            if (cachedTag) {
              return Promise.resolve({ data: cachedTag });
            }
            // 缓存中没有则请求API
            return getTagById(id);
          });

          const responses = await Promise.all(promises);
          const validResponses = responses.filter(response => response.data);

          if (validResponses.length > 0) {
            const labeledValues = validResponses.map(response => ({
              key: response.data.id,
              value: response.data.id,
              label: response.data.name
            }));
            setInternalValue(labeledValues);
          } else {
            setInternalValue(selectedTags.map(id => ({ key: id, value: id, label: `${id}` })));
            // setInternalValue(selectedTags.map(id => ({ key: id, value: id, label: `标签 ${id}` })));
          }
        } catch (error) {
          console.error('获取标签信息失败:', error);
          setInternalValue(selectedTags.map(id => ({ key: id, value: id, label: `${id}` })));
          // setInternalValue(selectedTags.map(id => ({ key: id, value: id, label: `标签 ${id}` })));
        }
      } else {
        // 如果标签列表不为空，则使用列表中的标签信息
        const labeledValues = selectedTags.map(id => {
          const tag = tags.find(t => String(t.id) === String(id));
          return {
            key: id,
            value: id,
            label: tag ? tag.name : `${id}`
            // label: tag ? tag.name : `标签 ${id}`
          };
        });
        setInternalValue(labeledValues);
      }
    };

    convertValueToInternal();
  }, [selectedTags, tags]);

  // 获取所有标签
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await getAllTags();
        if (response.data) {
          setTags(response.data);
          // 缓存标签数据
          tagCache.addTags(response.data);
        }
      } catch (error) {
        console.error('获取标签失败:', error);
        message.error('获取标签列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // 当标签数量变化时更新CSS类
  useEffect(() => {
    if (!selectRef.current) return;

    if (isMaxed) {
      selectRef.current.classList.add('tags-maxed');
    } else {
      selectRef.current.classList.remove('tags-maxed');
    }
  }, [isMaxed]);

  // 根据搜索文本过滤标签选项
  const filteredOptions = useMemo(() => {
    if (!searchText) return tags;

    return tags.filter(tag =>
      tag.name.toLowerCase().startsWith(searchText.toLowerCase())
    );
  }, [tags, searchText]);

  // 标签选项列表，用于 Select 组件
  const options = useMemo(() => {
    const opts = filteredOptions.map(tag => ({
      value: tag.id,
      label: tag.name,
      data: tag,
    }));

    // 如果有搜索文本，且没有匹配的标签，根据allowCreate属性决定是否显示创建选项
    if (searchText && filteredOptions.length === 0 && !isMaxed) {
      if (allowCreate) {
        opts.push({
          value: 'create-tag',
          label: (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PlusOutlined style={{ marginRight: '8px' }} /> 创建标签 "{searchText}"
            </div>
          ),
          data: { name: searchText, isNew: true },
        });
      }
    }

    return opts;
  }, [filteredOptions, searchText, isMaxed, allowCreate]);

  // 处理标签选择变更
  const handleChange = async (newValue) => {
    console.log('TagSelect handleChange:', newValue);

    // 提取ID值
    let selectedValues = [];

    // 处理labelInValue模式下的值
    if (Array.isArray(newValue)) {
      selectedValues = newValue.map(item => {
        // 如果是创建标签选项
        if (item.value === 'create-tag') {
          return 'create-tag';
        }
        return item.value;
      });
    }
    // 如果选择的是"创建标签"选项
    if (selectedValues.includes('create-tag')) {
      const newTagIndex = selectedValues.indexOf('create-tag');
      selectedValues.splice(newTagIndex, 1);

      try {
        // 创建新标签
        const response = await createTag({ name: searchText });
        if (response.data && response.data.id) {
          // 将新标签添加到标签列表
          const newTag = response.data;
          setTags(prevTags => [...prevTags, newTag]);
          // 将新标签添加到缓存
          tagCache.addTag(newTag);
          // 将新标签ID添加到选中列表
          selectedValues.push(newTag.id);

          message.success(`标签"${newTag.name}"创建成功`);
        }
      } catch (error) {
        console.error('创建标签失败:', error);
        message.error('创建标签失败');
      }
    }

    // 更新选中状态
    setSelectedTags(selectedValues);
    const newIsMaxed = selectedValues.length >= maxTagCount;
    setIsMaxed(newIsMaxed);

    // 如果状态从未达到最大数量变为达到最大数量，显示一次警告
    if (!isMaxed && newIsMaxed) {
      showWarning();
    }

    // 调用外部onChange回调
    if (onChange) {
      onChange(selectedValues);
    }

    // 清空搜索文本
    setSearchText('');
  };

  // 处理搜索文本变更
  const handleSearch = (text) => {
    // 如果标签已满，则不更新搜索文本并显示警告
    if (isMaxed) {
      // 显示警告
      showWarning();
      return;
    }

    // 否则更新搜索文本
    setSearchText(text);
  };

  // 处理失去焦点事件，重置搜索文本
  const handleBlur = () => {
    setSearchText('');
  };

  // 处理下拉框显示状态变化
  const handleDropdownVisibleChange = (open) => {
    // 如果标签已满，则阻止下拉框打开并显示警告
    if (isMaxed && open) {
      showWarning();
      return;
    }

    setDropdownOpen(open);
  };

  // 标签下拉框最大数量达到时的提示内容
  const maxTagPlaceholder = (omittedValues) => {
    return (
      <Tooltip title="文章关联标签已达最大数量">
        <Tag color="error">+{omittedValues.length}...</Tag>
      </Tooltip>
    );
  };

  // 自定义下拉框内容
  const dropdownRender = (menu) => {
    if (tags.length === 0 && !searchText && !loading) {
      return (
        <div style={{ padding: '8px 12px' }}>
          {allowCreate ? '暂无标签，请输入创建' : '暂无标签'}
        </div>
      );
    }

    if (isMaxed) {
      return (
        <div style={{ padding: '8px 12px', color: '#ff4d4f' }}>
          {allowCreate ? '文章最多关联6个标签，已达最大数量' : '标签选择已达最大数量'}
        </div>
      );
    }

    return menu;
  };

  // 当选中标签达到上限时，禁用输入功能
  const handleKeyDown = (e) => {
    // 如果标签已满且不是退格键，则阻止输入并显示警告
    if (isMaxed && e.keyCode !== 8) { // 8是Backspace键的keyCode
      e.preventDefault();
      showWarning();
    }
  };

  return (
    <div ref={selectRef} className={isMaxed ? 'tags-maxed' : ''}>
      <Select
        labelInValue
        mode={mode}
        value={internalValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onBlur={handleBlur}
        loading={loading}
        placeholder={placeholder}
        allowClear={allowClear}
        showSearch
        filterOption={false}
        options={options}
        maxTagCount={maxTagCount}
        maxTagPlaceholder={maxTagPlaceholder}
        dropdownRender={dropdownRender}
        notFoundContent={
          loading ? '加载中...' : (
            searchText ?
              isMaxed ?
              '标签已达上限' :
              (allowCreate ?
                `未找到"${searchText}"，按回车创建` :
                '暂无匹配标签')
            : '暂无标签'
          )
        }
        onInputKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        open={isMaxed ? false : dropdownOpen}
        onDropdownVisibleChange={handleDropdownVisibleChange}
        tokenSeparators={[',']} // 添加逗号作为分隔符
        popupClassName={isMaxed ? 'hidden-dropdown' : ''}
        {...restProps}
      />
    </div>
  );
};

export default TagSelect;
