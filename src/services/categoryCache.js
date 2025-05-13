// 分类数据缓存服务
// 用于缓存分类数据，避免重复请求相同的分类数据

import { getCategoryById } from './category';

// 分类数据缓存
const categoryCache = {
  // 存储分类数据的对象，格式为 { categoryId: categoryData }
  data: {},
  
  // 获取分类数据，如果缓存中没有则请求并缓存
  async getCategory(categoryId) {
    // 如果缓存中已有该分类数据，则直接返回
    if (this.data[categoryId]) {
      return this.data[categoryId];
    }
    
    try {
      // 请求分类数据
      const response = await getCategoryById(categoryId);
      if (response.data) {
        // 缓存分类数据
        this.data[categoryId] = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch category (ID:${categoryId}) data:`, error);
      return null;
    }
  },
  
  // 添加分类数据到缓存
  addCategory(categoryData) {
    if (categoryData && categoryData.id) {
      this.data[categoryData.id] = categoryData;
    }
  },
  
  // 批量添加分类数据到缓存
  addCategories(categoriesData) {
    if (Array.isArray(categoriesData)) {
      categoriesData.forEach(category => {
        if (category && category.id) {
          this.data[category.id] = category;
        }
      });
    }
  },
  
  // 清除缓存
  clear() {
    this.data = {};
  }
};

export default categoryCache;
