// 标签数据缓存服务
// 用于缓存标签数据，避免重复请求相同的标签数据

import { getTagById } from './tag';

// 标签数据缓存
const tagCache = {
  // 存储标签数据的对象，格式为 { tagId: tagData }
  data: {},
  
  // 获取标签数据，如果缓存中没有则请求并缓存
  async getTag(tagId) {
    // 如果缓存中已有该标签数据，则直接返回
    if (this.data[tagId]) {
      return this.data[tagId];
    }
    
    try {
      // 请求标签数据
      const response = await getTagById(tagId);
      if (response.data) {
        // 缓存标签数据
        this.data[tagId] = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch tag (ID:${tagId}) data:`, error);
      return null;
    }
  },
  
  // 添加标签数据到缓存
  addTag(tagData) {
    if (tagData && tagData.id) {
      this.data[tagData.id] = tagData;
    }
  },
  
  // 批量添加标签数据到缓存
  addTags(tagsData) {
    if (Array.isArray(tagsData)) {
      tagsData.forEach(tag => {
        if (tag && tag.id) {
          this.data[tag.id] = tag;
        }
      });
    }
  },
  
  // 清除缓存
  clear() {
    this.data = {};
  },
  
  // 从缓存中移除指定标签
  removeTag(tagId) {
    if (this.data[tagId]) {
      delete this.data[tagId];
    }
  }
};

export default tagCache;
