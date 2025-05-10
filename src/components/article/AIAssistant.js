import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Tabs,
  Spin,
  Tag,
  message,
  Alert
} from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  TagsOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  CloseOutlined,
  BulbOutlined,
  VerticalAlignBottomOutlined,
  StopOutlined
} from '@ant-design/icons';
import { polishArticle, generateSummary, generateTags, generateTitles } from '../../services/ai';
import '../../styles/article/aiAssistant.css';

const { TabPane } = Tabs;

// AI助手组件 - 悬浮窗版本
const AIAssistant = ({
  articleContent,
  onPolish,
  onSummaryGenerated,
  onTitleSelected,
  form,  // 表单引用参数
  onTagsGenerated = null  // 保留标签回调参数，设置默认值为null
}) => {
  // 悬浮窗状态
  const [visible, setVisible] = useState(false);
  // 状态管理
  const [activeTab, setActiveTab] = useState('polish');
  const [polishLoading, setPolishLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [titlesLoading, setTitlesLoading] = useState(false);

  const [polishedContent, setPolishedContent] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState([]);
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);

  // 应用状态跟踪
  const [polishApplied, setPolishApplied] = useState(false);  // 是否已应用润色内容
  const [summaryApplied, setSummaryApplied] = useState(false);  // 是否已应用摘要

  // 标签相关状态
  const [appliedTags, setAppliedTags] = useState([]);  // 已应用的标签
  const [allTagsApplied, setAllTagsApplied] = useState(false);  // 是否应用了所有标签

  // 提示气泡状态
  const [showTooltip, setShowTooltip] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);

  // 创建文本框的引用
  const polishContentRef = useRef(null);
  const summaryContentRef = useRef(null);

  // 控制自动滚动功能
  const [autoScrollPolish, setAutoScrollPolish] = useState(true);
  const [autoScrollSummary, setAutoScrollSummary] = useState(true);

  // 请求控制器
  const [polishController, setPolishController] = useState(null);
  const [summaryController, setSummaryController] = useState(null);

  // 使用useRef创建手动停止标志，这样不会受到状态更新异步的影响
  const manualStopRef = useRef({
    polish: false,
    summary: false
  });

  // 监听表单中标签值的变化
  useEffect(() => {
    if (!form || tags.length === 0) return;

    // 初始同步一次
    const syncAppliedTags = () => {
      // 获取当前表单中的标签值
      const currentTags = form.getFieldValue('tag_ids') || [];

      // 更新已应用标签状态
      const newAppliedTags = tags.filter(tag => currentTags.includes(tag));
      setAppliedTags(newAppliedTags);
      setAllTagsApplied(
        newAppliedTags.length === tags.length &&
        tags.length > 0
      );
    };

    // 立即同步一次
    syncAppliedTags();

    // 设置一个定时器，定期检查表单中的标签值
    const intervalId = setInterval(syncAppliedTags, 500);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(intervalId);
    };
  }, [form, tags]);

  // 我们不再需要事件源引用，因为我们使用fetch API处理流式响应

  // 检测内容为空
  const isContentEmpty = !articleContent || articleContent.trim() === '';

  // 首次加载时检查是否显示提示气泡
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('aiAssistantTooltipSeen');
    if (!hasSeenTooltip) {
      // 设置一个短暂的延迟，让用户先看到页面再显示提示
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(true);
        setFirstVisit(true);
      }, 1500);

      return () => clearTimeout(tooltipTimer);
    }
  }, []);

  // 仅在内容变化且开启了自动滚动时执行滚动
  useEffect(() => {
    if (polishContentRef.current && polishedContent && autoScrollPolish) {
      const scrollElement = polishContentRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [polishedContent, autoScrollPolish]);

  // 仅在内容变化且开启了自动滚动时执行滚动
  useEffect(() => {
    if (summaryContentRef.current && summary && autoScrollSummary) {
      const scrollElement = summaryContentRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [summary, autoScrollSummary]);

  // 当悬浮窗关闭或状态变化时清理资源，打开时同步标签状态
  useEffect(() => {
    if (!visible) {
      closeEventSources();

      // 中断正在进行的请求
      if (polishController) {
        // 设置手动停止标志，避免显示错误消息
        manualStopRef.current.polish = true;
        polishController.abort();
        setPolishController(null);
        setPolishLoading(false);
      }

      if (summaryController) {
        // 设置手动停止标志，避免显示错误消息
        manualStopRef.current.summary = true;
        summaryController.abort();
        setSummaryController(null);
        setSummaryLoading(false);
      }
    } else if (form && tags.length > 0) {
      // 当面板打开时，同步一次标签状态
      const currentTags = form.getFieldValue('tag_ids') || [];
      const newAppliedTags = tags.filter(tag => currentTags.includes(tag));
      setAppliedTags(newAppliedTags);
      setAllTagsApplied(
        newAppliedTags.length === tags.length &&
        tags.length > 0
      );
    }
  }, [visible, form, tags, polishController, summaryController]);

  // 关闭提示气泡
  const closeTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('aiAssistantTooltipSeen', 'true');
  };

  // 处理立即查看按钮点击
  const handleTooltipView = () => {
    setVisible(true);
    closeTooltip();
  };

  // 控制悬浮窗显示/隐藏
  const toggleVisible = () => {
    setVisible(!visible);
  };

  // 清理函数 - 由于我们不再使用EventSource，这个函数现在是一个空操作
  // 但我们保留它以防将来需要清理资源
  const closeEventSources = () => {
    // 不再需要关闭EventSource，因为我们现在使用fetch API
    // 保留此函数以保持代码结构一致性
  };

  // 处理文章润色
  const handlePolishArticle = async () => {
    if (isContentEmpty) {
      message.warning('请先输入文章内容');
      return;
    }

    // 如果之前的请求还在进行中，先中断它
    if (polishController) {
      polishController.abort();
    }

    // 重置手动停止标志
    manualStopRef.current.polish = false;

    setPolishLoading(true);
    setPolishedContent('');
    setPolishApplied(false); // 重置润色内容应用状态
    setAutoScrollPolish(true); // 重置为自动滚动

    // 关闭可能存在的事件源
    closeEventSources();

    try {
      // 创建AbortController用于控制请求超时和手动取消
      const controller = new AbortController();
      const { signal } = controller;

      // 保存controller引用以便后续手动中断
      setPolishController(controller);

      // 设置较长的超时时间（5分钟）
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5 * 60 * 1000);
      
      // 调用服务层的polishArticle方法
      await polishArticle(articleContent, {
        signal,
        onData: (content) => {
          // 处理正常数据 - 仅更新内容，滚动由useEffect处理
          setPolishedContent(prevContent => {
            return prevContent + content;
          });
        },
        onError: (errorContent) => {
          setPolishLoading(false);
          message.error(`润色文章失败: ${errorContent}`);
        },
        onComplete: () => {
          setPolishLoading(false);
          message.success('文章润色完成');
        }
      });

      // 清除超时计时器
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('润色文章时发生错误:', error);

      // 只有在不是手动停止的情况下才显示错误消息
      if (!manualStopRef.current.polish) {
        if (error.name === 'AbortError') {
          message.error('润色文章请求超时，请尝试减少文章长度或稍后重试');
        } else {
          message.error('润色文章失败，请稍后重试');
        }

        // 只有非手动停止才重置加载状态
        setPolishLoading(false);
      }
    } finally {
      // 非手动停止的情况下清理controller引用
      if (!manualStopRef.current.polish) {
        setPolishController(null);
      }
    }
  };

  // 手动停止文章润色
  const stopPolishArticle = useCallback(() => {
    if (polishController) {
      // 设置手动停止标志
      manualStopRef.current.polish = true;

      // 显示停止消息
      message.info('已停止文章润色');

      // 中断请求并清理控制器
      polishController.abort();
      setPolishController(null);
      setPolishLoading(false);
    }
  }, [polishController]);

  // 应用润色内容
  const applyPolishedContent = () => {
    if (polishedContent && onPolish) {
      // 如果已经应用过了，就不再重复应用
      if (!polishApplied) {
        onPolish(polishedContent);
        setPolishApplied(true); // 设置已应用状态
        message.success('已应用润色后的内容');
      }
    }
  };

  // 处理生成摘要
  const handleGenerateSummary = async () => {
    if (isContentEmpty) {
      message.warning('请先输入文章内容');
      return;
    }

    // 如果之前的请求还在进行中，先中断它
    if (summaryController) {
      summaryController.abort();
    }

    // 重置手动停止标志
    manualStopRef.current.summary = false;

    setSummaryLoading(true);
    setSummary('');
    setSummaryApplied(false); // 重置摘要应用状态
    setAutoScrollSummary(true); // 重置为自动滚动

    // 关闭可能存在的事件源
    closeEventSources();

    try {
      // 创建AbortController用于控制请求超时和手动取消
      const controller = new AbortController();
      const { signal } = controller;

      // 保存controller引用以便后续手动中断
      setSummaryController(controller);

      // 设置较长的超时时间（5分钟）
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5 * 60 * 1000);
      
      // 调用服务层的generateSummary方法
      await generateSummary(articleContent, {
        signal,
        onData: (content) => {
          // 处理正常数据 - 仅更新内容，滚动由useEffect处理
          setSummary(prevSummary => {
            return prevSummary + content;
          });
        },
        onError: (errorContent) => {
          setSummaryLoading(false);
          message.error(`生成摘要失败: ${errorContent}`);
        },
        onComplete: () => {
          setSummaryLoading(false);
          message.success('摘要生成完成');
        }
      });

      // 清除超时计时器
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('生成摘要时发生错误:', error);

      // 只有在不是手动停止的情况下才显示错误消息
      if (!manualStopRef.current.summary) {
        if (error.name === 'AbortError') {
          message.error('生成摘要请求超时，请尝试减少文章长度或稍后重试');
        } else {
          message.error('生成摘要失败，请稍后重试');
        }

        // 只有非手动停止才重置加载状态
        setSummaryLoading(false);
      }
    } finally {
      // 非手动停止的情况下清理controller引用
      if (!manualStopRef.current.summary) {
        setSummaryController(null);
      }
    }
  };

  // 手动停止摘要生成
  const stopGenerateSummary = useCallback(() => {
    if (summaryController) {
      // 设置手动停止标志
      manualStopRef.current.summary = true;

      // 显示停止消息
      message.info('已停止摘要生成');

      // 中断请求并清理控制器
      summaryController.abort();
      setSummaryController(null);
      setSummaryLoading(false);
    }
  }, [summaryController]);

  // 应用生成的摘要
  const applySummary = () => {
    if (summary && onSummaryGenerated) {
      onSummaryGenerated(summary);
      setSummaryApplied(true); // 设置摘要已应用状态
      message.success('已应用生成的摘要');
    }
  };

  // 处理生成标签
  const handleGenerateTags = async () => {
    if (isContentEmpty) {
      message.warning('请先输入文章内容');
      return;
    }

    setTagsLoading(true);
    setTags([]);
    setAppliedTags([]); // 重置已应用标签
    setAllTagsApplied(false); // 重置全部应用状态

    try {
      const response = await generateTags(articleContent);
      if (response && response.data && response.data.contents) {
        const generatedTags = response.data.contents;
        setTags(generatedTags);

        // 检查已生成的标签哪些已经在表单中
        const currentTags = form.getFieldValue('tag_ids') || [];
        const alreadyApplied = generatedTags.filter(tag =>
          currentTags.includes(tag)
        );

        // 更新已应用状态
        setAppliedTags(alreadyApplied);
        setAllTagsApplied(
          alreadyApplied.length === generatedTags.length &&
          generatedTags.length > 0
        );
      } else {
        message.error('生成标签失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('生成标签时出错:', error);
      message.error('生成标签失败，请稍后重试');
    } finally {
      setTagsLoading(false);
    }
  };

  // 应用标签（单个或全部）
  const applyTag = (tag) => {
    // 我们直接使用表单引用，不再需要通过回调函数
    if (!form) return;

    // 获取当前表单的标签数量
    const currentTags = form.getFieldValue('tag_ids') || [];

    // 检查标签是否已应用
    if (appliedTags.includes(tag)) {
      // 如果已应用，则取消应用
      const newAppliedTags = appliedTags.filter(t => t !== tag);
      setAppliedTags(newAppliedTags);

      // 从表单中移除该标签
      const updatedTags = currentTags.filter(t => t !== tag);
      form.setFieldsValue({ tag_ids: updatedTags });

      // 更新allTagsApplied状态
      setAllTagsApplied(newAppliedTags.length === tags.length && tags.length > 0);

      message.success(`已移除标签: ${tag}`);
    } else {
      // 如果未应用，检查标签数量限制
      if (currentTags.length >= 6) {
        message.error('标签数量已达上限(6个)，无法添加更多标签');
        return;
      }

      // 应用标签
      const newAppliedTags = [...appliedTags, tag];
      setAppliedTags(newAppliedTags);

      // 添加到表单
      form.setFieldsValue({ tag_ids: [...currentTags, tag] });

      // 更新allTagsApplied状态
      setAllTagsApplied(newAppliedTags.length === tags.length && tags.length > 0);

      message.success(`已添加标签: ${tag}`);
    }
  };

  const toggleAllTags = () => {
    if (!form || tags.length === 0) return;

    // 获取当前表单的标签数量
    const currentTags = form.getFieldValue('tag_ids') || [];

    if (allTagsApplied) {
      // 如果所有标签都已应用，则取消应用所有
      const updatedTags = currentTags.filter(tag => !tags.includes(tag));
      form.setFieldsValue({ tag_ids: updatedTags });

      setAppliedTags([]);
      setAllTagsApplied(false);

      message.success('已移除所有生成的标签');
    } else {
      // 如果未全部应用，检查标签数量限制
      const tagsToAdd = tags.filter(tag => !currentTags.includes(tag));

      if (currentTags.length + tagsToAdd.length > 6) {
        const left = 6 - currentTags.length;
        if (left > 0) {
          message.error(`标签数量上限为6个，最多还能再添加${left}个标签`);
        } else {
          message.error('标签数量已达上限(6个)，无法添加更多标签');
        }
        return;
      }

      // 应用所有标签
      const uniqueTags = [...new Set([...currentTags, ...tags])];
      form.setFieldsValue({ tag_ids: uniqueTags });

      setAppliedTags(tags);
      setAllTagsApplied(true);

      message.success('已应用所有生成的标签');
    }
  };

  // 处理生成标题
  const handleGenerateTitles = async () => {
    if (isContentEmpty) {
      message.warning('请先输入文章内容');
      return;
    }

    setTitlesLoading(true);
    setTitles([]);
    setSelectedTitle(null);

    try {
      const response = await generateTitles(articleContent);
      if (response && response.data && response.data.contents) {
        setTitles(response.data.contents);
      } else {
        message.error('生成标题失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('生成标题时出错:', error);
      message.error('生成标题失败，请稍后重试');
    } finally {
      setTitlesLoading(false);
    }
  };

  // 选择标题
  const handleSelectTitle = (title, index) => {
    setSelectedTitle(index);
    if (onTitleSelected) {
      // 去除标题中的引号后再传递给回调函数
      const cleanTitle = title.replace(/^["']|["']$/g, '');
      onTitleSelected(cleanTitle);
      message.success('已应用选择的标题');
    }
  };

  // 渲染润色文章面板
  const renderPolishPanel = () => (
    <div className="ai-assistant-section">
      <div className="ai-assistant-section-title">
        <EditOutlined /> 文章润色
      </div>

      {isContentEmpty ? (
        <Alert
          message="请先输入文章内容"
          description="请在编辑器中输入文章内容后再使用AI润色功能"
          type="warning"
          showIcon
          className="ai-assistant-warning-alert"
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
            <Button
              type="primary"
              onClick={handlePolishArticle}
              loading={polishLoading}
              disabled={isContentEmpty}
            >
              {polishLoading ? '润色中...' : '开始润色'}
            </Button>

            {polishLoading && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopPolishArticle}
              >
                停止
              </Button>
            )}
          </div>

          {polishLoading && (
            <div className="ai-assistant-loading">
              <Spin indicator={<SyncOutlined spin />} />
              <p>AI正在润色您的文章，请稍候...</p>
            </div>
          )}

          {polishedContent && (
            <>
              <div className="ai-assistant-content-container">
                <div
                  className="ai-assistant-streaming-content"
                  ref={polishContentRef}
                  onScroll={() => {
                    // 如果用户手动滚动，检查是否到底部
                    if (!polishContentRef.current) return;

                    const { scrollTop, scrollHeight, clientHeight } = polishContentRef.current;
                    // 如果不在底部且自动滚动开启，关闭自动滚动
                    if (Math.abs(scrollHeight - scrollTop - clientHeight) > 10 && autoScrollPolish) {
                      setAutoScrollPolish(false);
                    }
                  }}
                >
                  {polishedContent}
                </div>
                <div
                  className={`ai-assistant-autoscroll-toggle ${autoScrollPolish ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 切换自动滚动状态
                    const newState = !autoScrollPolish;
                    setAutoScrollPolish(newState);

                    // 如果开启自动滚动，立即滚动到底部
                    if (newState && polishContentRef.current) {
                      polishContentRef.current.scrollTop = polishContentRef.current.scrollHeight;
                    }
                  }}
                >
                  <VerticalAlignBottomOutlined />
                  {autoScrollPolish ? '自动滚动' : '手动滚动'}
                </div>
              </div>

              <Button
                type={polishApplied ? "default" : "primary"}
                icon={polishApplied ? <EditOutlined /> : <CheckCircleOutlined />}
                onClick={applyPolishedContent}
                style={{ marginTop: 16 }}
              >
                {polishApplied ? '已应用润色内容' : '应用润色内容'}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );

  // 渲染生成摘要面板
  const renderSummaryPanel = () => (
    <div className="ai-assistant-section">
      <div className="ai-assistant-section-title">
        <FileTextOutlined /> 生成摘要
      </div>

      {isContentEmpty ? (
        <Alert
          message="请先输入文章内容"
          description="请在编辑器中输入文章内容后再使用AI摘要生成功能"
          type="warning"
          showIcon
          className="ai-assistant-warning-alert"
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
            <Button
              type="primary"
              onClick={handleGenerateSummary}
              loading={summaryLoading}
              disabled={isContentEmpty}
            >
              {summaryLoading ? '生成中...' : '生成摘要'}
            </Button>

            {summaryLoading && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopGenerateSummary}
              >
                停止
              </Button>
            )}
          </div>

          {summaryLoading && (
            <div className="ai-assistant-loading">
              <Spin indicator={<SyncOutlined spin />} />
              <p>AI正在生成文章摘要，请稍候...</p>
            </div>
          )}

          {summary && (
            <>
              <div className="ai-assistant-content-container">
                <div
                  className="ai-assistant-streaming-content"
                  ref={summaryContentRef}
                  onScroll={() => {
                    // 如果用户手动滚动，检查是否到底部
                    if (!summaryContentRef.current) return;

                    const { scrollTop, scrollHeight, clientHeight } = summaryContentRef.current;
                    // 如果不在底部且自动滚动开启，关闭自动滚动
                    if (Math.abs(scrollHeight - scrollTop - clientHeight) > 10 && autoScrollSummary) {
                      setAutoScrollSummary(false);
                    }
                  }}
                >
                  {summary}
                </div>
                <div
                  className={`ai-assistant-autoscroll-toggle ${autoScrollSummary ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 切换自动滚动状态
                    const newState = !autoScrollSummary;
                    setAutoScrollSummary(newState);

                    // 如果开启自动滚动，立即滚动到底部
                    if (newState && summaryContentRef.current) {
                      summaryContentRef.current.scrollTop = summaryContentRef.current.scrollHeight;
                    }
                  }}
                >
                  <VerticalAlignBottomOutlined />
                  {autoScrollSummary ? '自动滚动' : '手动滚动'}
                </div>
              </div>

              <Button
                type={summaryApplied ? "default" : "primary"}
                icon={summaryApplied ? <FileTextOutlined /> : <CheckCircleOutlined />}
                onClick={applySummary}
                style={{ marginTop: 16 }}
              >
                {summaryApplied ? '已应用摘要' : '应用生成的摘要'}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );

  // 渲染生成标签面板
  const renderTagsPanel = () => (
    <div className="ai-assistant-section">
      <div className="ai-assistant-section-title">
        <TagsOutlined /> 生成标签
      </div>

      {isContentEmpty ? (
        <Alert
          message="请先输入文章内容"
          description="请在编辑器中输入文章内容后再使用AI标签生成功能"
          type="warning"
          showIcon
          className="ai-assistant-warning-alert"
        />
      ) : (
        <>
          <Button
            type="primary"
            onClick={handleGenerateTags}
            loading={tagsLoading}
            disabled={isContentEmpty}
            style={{ marginBottom: 16 }}
          >
            {tagsLoading ? '生成中...' : '生成标签'}
          </Button>

          {tagsLoading && (
            <div className="ai-assistant-loading">
              <Spin indicator={<SyncOutlined spin />} />
              <p>AI正在生成标签，请稍候...</p>
            </div>
          )}

          {tags.length > 0 && (
            <>
              <div className="ai-assistant-tags">
                {tags.map((tag, index) => {
                  const isApplied = appliedTags.includes(tag);
                  return (
                    <Tag
                      key={index}
                      className="ai-assistant-tag"
                      color={isApplied ? "green" : "blue"}
                      onClick={() => applyTag(tag)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '14px',
                        margin: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {tag} {isApplied ? <CheckCircleOutlined /> : <PlusOutlined />}
                    </Tag>
                  );
                })}
              </div>

              <Button
                type={allTagsApplied ? "default" : "primary"}
                icon={allTagsApplied ? <TagsOutlined /> : <CheckCircleOutlined />}
                onClick={toggleAllTags}
                style={{ marginTop: 16 }}
              >
                {allTagsApplied ? '解除所有应用' : '应用所有标签'}
              </Button>

              {/* 标签数量提示 */}
              <div style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                提示：最多可添加6个标签
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // 渲染生成标题面板
  const renderTitlesPanel = () => (
    <div className="ai-assistant-section">
      <div className="ai-assistant-section-title">
        <FileTextOutlined /> 生成标题
      </div>

      {isContentEmpty ? (
        <Alert
          message="请先输入文章内容"
          description="请在编辑器中输入文章内容后再使用AI标题生成功能"
          type="warning"
          showIcon
          className="ai-assistant-warning-alert"
        />
      ) : (
        <>
          <Button
            type="primary"
            onClick={handleGenerateTitles}
            loading={titlesLoading}
            disabled={isContentEmpty}
            style={{ marginBottom: 16 }}
          >
            {titlesLoading ? '生成中...' : '生成标题推荐'}
          </Button>

          {titlesLoading && (
            <div className="ai-assistant-loading">
              <Spin indicator={<SyncOutlined spin />} />
              <p>AI正在生成标题推荐，请稍候...</p>
            </div>
          )}

          {titles.length > 0 && (
            <ul className="ai-assistant-title-list">
              {titles.map((title, index) => (
                <li
                  key={index}
                  className={`ai-assistant-title-item ${selectedTitle === index ? 'selected' : ''}`}
                  onClick={() => handleSelectTitle(title, index)}
                >
                  {title}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* 悬浮按钮 */}
      <div
        className={`ai-assistant-float-button ${firstVisit ? 'first-visit' : ''}`}
        onClick={toggleVisible}
        title="AI写作助手"
      >
        <RobotOutlined />
      </div>

      {/* 提示气泡 */}
      {showTooltip && (
        <div className="ai-assistant-tooltip">
          <div className="ai-assistant-tooltip-close" onClick={closeTooltip}>
            <CloseOutlined />
          </div>
          <div className="ai-assistant-tooltip-title">
            <BulbOutlined /> 发现AI助手
          </div>
          <div className="ai-assistant-tooltip-content">
            点击右下角的机器人图标，使用AI助手来润色文章、生成摘要、推荐标签和标题，让您的写作更加高效！
          </div>
          <button className="ai-assistant-tooltip-button" onClick={handleTooltipView}>
            立即查看
          </button>
        </div>
      )}

      {/* 悬浮面板 */}
      {visible && (
        <div className="ai-assistant-float-panel">
          {/* 面板头部 */}
          <div className="ai-assistant-panel-header">
            <div className="ai-assistant-panel-header-left">
              <RobotOutlined />
              <h3>AI写作助手</h3>
            </div>
            <div className="ai-assistant-panel-header-right">
              <button onClick={toggleVisible} title="关闭">
                <CloseOutlined />
              </button>
            </div>
          </div>

          {/* 面板内容区 */}
          <div className="ai-assistant-panel-content">
            <Alert
              message="AI助手使用说明"
              description="AI助手可以帮助您润色文章、生成摘要、推荐标签和标题。请先在编辑器中输入文章内容，然后使用相应功能。"
              type="info"
              showIcon
              className="ai-assistant-info-alert"
              style={{ marginBottom: 20 }}
            />

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="small"
            >
              <TabPane tab="润色" key="polish">
                {renderPolishPanel()}
              </TabPane>

              <TabPane tab="摘要" key="summary">
                {renderSummaryPanel()}
              </TabPane>

              <TabPane tab="标签" key="tags">
                {renderTagsPanel()}
              </TabPane>

              <TabPane tab="标题" key="titles">
                {renderTitlesPanel()}
              </TabPane>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
