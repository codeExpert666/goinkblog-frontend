import { createContext } from 'react';

export const ArticleContext = createContext({
  articles: [],
  hotArticles: [],
  latestArticles: [],
  currentArticle: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  filterParams: {},
  setFilterParams: () => {},
  fetchArticles: () => {},
  fetchArticleById: () => {},
  createArticle: () => {},
  updateArticle: () => {},
  deleteArticle: () => {},
  toggleLikeArticle: () => {},
  toggleFavoriteArticle: () => {},
  resetArticleState: () => {},
});
