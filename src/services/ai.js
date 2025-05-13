import api from './api';

// AI助手API服务函数

// 使用AI助手为文章生成标签
export const generateTags = (articleContent) => {
  return api.post('/api/ai/tag', { article_content: articleContent });  // 修正：包装成对象
};

// 使用AI助手为文章生成标题
export const generateTitles = (articleContent) => {
  return api.post('/api/ai/title', { article_content: articleContent });  // 修正：包装成对象
};

/**
 * 使用AI助手润色文章（流式响应）
 * @param {string} articleContent - 文章内容
 * @param {AbortSignal} signal - 用于中断请求的信号
 * @param {Function} onData - 处理每个数据块的回调
 * @param {Function} onError - 处理错误的回调
 * @param {Function} onComplete - 请求完成时的回调
 * @returns {Promise<{abort: Function}>} - 返回包含abort方法的对象，用于手动中断请求
 */
export const polishArticle = async (articleContent, { onData, onError, onComplete, signal }) => {
  const url = '/api/ai/polish';
  const token = localStorage.getItem('token');
  
  try {
    // 使用fetch API发送POST请求并处理流式响应
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',  // 明确告诉服务器我们期望接收事件流
        'Connection': 'keep-alive'      // 明确要求保持连接
      },
      body: JSON.stringify({ article_content: articleContent }),
      signal,                           // 添加信号用于控制请求
      keepalive: true                   // 启用keepalive选项
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    // 获取响应的reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 用于存储未完成的SSE消息
    let buffer = '';

    // 处理流式响应
    let done = false;
    // 添加最后活动时间跟踪
    let lastActivityTime = Date.now();
    // 添加心跳检查间隔（30秒）
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      // 如果超过60秒没有活动，认为连接可能已断开
      if (now - lastActivityTime > 60000 && !done) {
        clearInterval(heartbeatInterval);
        // 不立即中断，给予更多时间让连接恢复
      }
    }, 30000);

    try {
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        // 更新最后活动时间
        lastActivityTime = Date.now();

        if (done) {
          // 流结束，处理缓冲区中可能剩余的数据
          if (buffer.trim()) {
            processSSEMessage(buffer);
          }

          onComplete && onComplete();
          break;
        }

        // 解码数据并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 查找完整的SSE消息（以空行分隔）
        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          // 提取一个完整的SSE消息
          const message = buffer.substring(0, boundaryIndex).trim();
          // 更新缓冲区，移除已处理的消息
          buffer = buffer.substring(boundaryIndex + 2);

          if (message) {
            processSSEMessage(message);
          }
        }
      }
    } finally {
      // 清理心跳检查
      clearInterval(heartbeatInterval);
    }

    // 处理单个SSE消息的函数
    function processSSEMessage(sseMessage) {
      // 将消息按行分割，寻找data行
      const lines = sseMessage.split('\n');
      let dataContent = null;

      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataContent = line.substring(5).trim();
          break;
        }
      }

      // 如果没有找到data内容，直接返回
      if (!dataContent) return;

      // 处理流结束信号
      if (dataContent === '[DONE]') {
        onComplete && onComplete();
        done = true;
        return;
      }

      try {
        // 解析JSON数据
        const parsedData = JSON.parse(dataContent);

        // 处理错误消息
        if (parsedData.is_error) {
          onError && onError(parsedData.content);
          done = true;
          return;
        }

        // 处理正常数据
        onData && onData(parsedData.content);
      } catch (error) {
        console.error("Failed to parse data:", error);
      }
    }
  } catch (error) {
    // 只有当不是AbortError时才调用onError回调
    if (error.name !== 'AbortError') {
      onError && onError(error);
      throw error;
    }
  }
};

/**
 * 使用AI助手生成文章摘要（流式响应）
 * @param {string} articleContent - 文章内容
 * @param {AbortSignal} signal - 用于中断请求的信号
 * @param {Function} onData - 处理每个数据块的回调
 * @param {Function} onError - 处理错误的回调
 * @param {Function} onComplete - 请求完成时的回调
 * @returns {Promise<{abort: Function}>} - 返回包含abort方法的对象，用于手动中断请求
 */
export const generateSummary = async (articleContent, { onData, onError, onComplete, signal }) => {
  const url = '/api/ai/summary';
  const token = localStorage.getItem('token');
  
  try {
    // 使用fetch API发送POST请求并处理流式响应
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',  // 明确告诉服务器我们期望接收事件流
        'Connection': 'keep-alive'      // 明确要求保持连接
      },
      body: JSON.stringify({ article_content: articleContent }),
      signal,                           // 添加信号用于控制请求
      keepalive: true                   // 启用keepalive选项
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    // 获取响应的reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 用于存储未完成的SSE消息
    let buffer = '';

    // 处理流式响应
    let done = false;
    // 添加最后活动时间跟踪
    let lastActivityTime = Date.now();
    // 添加心跳检查间隔（30秒）
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      // 如果超过60秒没有活动，认为连接可能已断开
      if (now - lastActivityTime > 60000 && !done) {
        clearInterval(heartbeatInterval);
        // 不立即中断，给予更多时间让连接恢复
      }
    }, 30000);

    try {
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        // 更新最后活动时间
        lastActivityTime = Date.now();

        if (done) {
          // 流结束，处理缓冲区中可能剩余的数据
          if (buffer.trim()) {
            processSSEMessage(buffer);
          }

          onComplete && onComplete();
          break;
        }

        // 解码数据并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 查找完整的SSE消息（以空行分隔）
        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          // 提取一个完整的SSE消息
          const message = buffer.substring(0, boundaryIndex).trim();
          // 更新缓冲区，移除已处理的消息
          buffer = buffer.substring(boundaryIndex + 2);

          if (message) {
            processSSEMessage(message);
          }
        }
      }
    } finally {
      // 清理心跳检查
      clearInterval(heartbeatInterval);
    }

    // 处理单个SSE消息的函数
    function processSSEMessage(sseMessage) {
      // 从消息中分离出 data 数据
      let dataContent = null;

      if (sseMessage.startsWith('data:')) {
        dataContent = sseMessage.substring(5).trim();
      }

      // 如果没有找到data内容，直接返回
      if (!dataContent) return;

      // 处理流结束信号
      if (dataContent === '[DONE]') {
        onComplete && onComplete();
        done = true;
        return;
      }

      try {
        // 解析JSON数据
        const parsedData = JSON.parse(dataContent);

        // 处理错误消息
        if (parsedData.is_error) {
          onError && onError(parsedData.content);
          done = true;
          return;
        }

        // 处理正常数据
        onData && onData(parsedData.content);
      } catch (error) {
        console.error("Failed to parse data:", error);
      }
    }
  } catch (error) {
    // 只有当不是AbortError时才调用onError回调
    if (error.name !== 'AbortError') {
      onError && onError(error);
      throw error;
    }
  }
};

// 管理AI模型配置的API（如需使用）

// 获取AI模型配置列表（分页）
export const getModels = (params = {}) => {
  return api.get('/api/ai/models', { params });
};

// 获取指定ID的模型配置
export const getModelById = (id) => {
  return api.get(`/api/ai/models/${id}`);
};

// 创建新的模型配置
export const createModel = (data) => {
  return api.post('/api/ai/models', data);
};

// 更新模型配置
export const updateModel = (id, data) => {
  return api.put(`/api/ai/models/${id}`, data);
};

// 删除模型配置
export const deleteModel = (id) => {
  return api.delete(`/api/ai/models/${id}`);
};

// 重置特定模型的使用统计信息
export const resetModelStats = (id) => {
  return api.post(`/api/ai/models/${id}/reset`);
};

// 重置所有模型的使用统计信息
export const resetAllModelStats = () => {
  return api.post('/api/ai/models/reset');
};

// 获取所有AI模型的总体统计信息
export const getModelsOverview = () => {
  return api.get('/api/ai/models/overview');
};
