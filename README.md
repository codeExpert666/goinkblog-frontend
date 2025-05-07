# GoInk Blog 前端项目

GoInk Blog 是一个轻量级但功能完备的智能博客系统，基于 React 和 Ant Design 构建，提供现代化的用户界面和丰富的博客功能。

## 项目概述

GoInk Blog 前端是一个基于 React 的单页应用，使用 Ant Design 组件库构建用户界面，支持文章的创建、编辑、发布、搜索等功能，并集成了 AI 辅助功能，如文章润色、摘要生成等。

### 主要功能

- 用户认证：注册、登录、个人资料管理
- 文章管理：创建、编辑、发布、删除文章
- 文章交互：点赞、收藏、评论、浏览
- 文章搜索：多条件筛选、排序
- 用户中心：个人文章管理、互动记录
- 管理后台：仪表盘、系统状态、审核管理
- AI 辅助：文章润色、摘要生成、标签推荐、标题生成

## 技术栈

- **React 18**：用于构建用户界面的 JavaScript 库
- **React Router 6**：用于前端路由管理
- **Ant Design 5**：企业级 UI 设计语言和 React 组件库
- **Axios**：基于 Promise 的 HTTP 客户端
- **Marked & DOMPurify**：Markdown 渲染和 XSS 防护
- **React Quill**：富文本编辑器
- **Highlight.js**：代码语法高亮
- **Recharts**：基于 React 的图表库

## 项目结构

```
goinkblog-frontend/
├── public/                   # 静态资源
│   ├── index.html            # HTML 模板
│   ├── favicon.ico           # 网站图标
│   ├── manifest.json         # PWA 配置
│   └── img/                  # 图片资源目录
├── src/                      # 源代码
│   ├── assets/               # 静态资源文件
│   ├── components/           # 可复用组件
│   │   ├── article/          # 文章相关组件
│   │   ├── category/         # 分类相关组件
│   │   ├── comment/          # 评论相关组件
│   │   ├── common/           # 通用组件
│   │   ├── logger/           # 日志管理相关组件
│   │   ├── tag/              # 标签相关组件
│   │   └── Layout.js         # 全局布局组件
│   ├── hooks/                # 自定义React Hooks
│   ├── pages/                # 页面组件
│   │   ├── admin/            # 管理员页面
│   │   ├── ai/               # AI配置页面
│   │   ├── article/          # 文章相关页面
│   │   ├── category/         # 分类管理页面
│   │   ├── comment/          # 评论管理页面
│   │   ├── logger/           # 日志管理页面
│   │   ├── rbac/             # 权限管理页面
│   │   ├── tag/              # 标签管理页面
│   │   ├── user/             # 用户相关页面
│   │   ├── Login.js          # 登录页面
│   │   ├── Register.js       # 注册页面
│   │   ├── Profile.js        # 用户个人资料页面
│   │   └── NotFound.js       # 404页面
│   ├── services/             # API 服务
│   │   ├── ai.js             # AI相关API服务
│   │   ├── api.js            # API基础配置
│   │   ├── article.js        # 文章相关API服务
│   │   ├── auth.js           # 认证相关API服务
│   │   ├── category.js       # 分类相关API服务
│   │   ├── categoryCache.js  # 分类缓存服务
│   │   ├── comment.js        # 评论相关API服务
│   │   ├── logger.js         # 日志相关API服务
│   │   ├── rbac.js           # 权限相关API服务
│   │   ├── stat.js           # 统计相关API服务
│   │   ├── tag.js            # 标签相关API服务
│   │   └── tagCache.js       # 标签缓存服务
│   ├── store/                # 状态管理
│   │   ├── articleContext.js # 文章相关状态
│   │   └── authContext.js    # 认证相关状态
│   ├── styles/               # 样式文件
│   │   ├── admin/            # 管理员页面样式
│   │   ├── ai/               # AI功能相关样式
│   │   ├── article/          # 文章相关样式
│   │   ├── category/         # 分类相关样式
│   │   ├── comment/          # 评论相关样式
│   │   ├── common/           # 通用样式
│   │   ├── logger/           # 日志相关样式
│   │   ├── rbac/             # 权限管理相关样式
│   │   ├── tag/              # 标签相关样式
│   │   └── user/             # 用户相关样式
│   ├── utils/                # 工具函数
│   ├── App.js                # 应用入口组件
│   ├── index.js              # 应用入口文件
│   └── index.css             # 全局基础样式
├── package.json              # 项目依赖配置
├── package-lock.json         # 依赖版本锁定文件
└── README.md                 # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

应用将在开发模式下运行，访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
```

构建后的文件将生成在 `build` 目录中，可以部署到任何静态文件服务器。

## 主要功能模块

### 用户认证

- 用户注册：支持用户名、邮箱和密码注册
- 用户登录：支持用户名/密码登录，包含验证码验证
- 个人资料：支持头像上传、个人信息编辑

### 文章管理

- 文章列表：支持分页、排序和筛选
- 文章详情：支持 Markdown 渲染、代码高亮
- 文章编辑：支持富文本编辑、Markdown 预览
- 草稿管理：支持保存草稿、发布草稿

### 文章交互

- 点赞：支持文章点赞/取消点赞
- 收藏：支持文章收藏/取消收藏
- 评论：支持文章评论、回复评论
- 浏览：支持文章浏览记录

### 搜索功能

- 关键词搜索：支持标题、内容搜索
- 分类筛选：支持按分类筛选文章
- 标签筛选：支持按标签筛选文章
- 排序选项：支持按热度、时间等排序

### AI 辅助功能

- 文章润色：AI 辅助优化文章表达
- 摘要生成：自动生成文章摘要
- 标签推荐：基于内容推荐相关标签
- 标题生成：根据内容生成推荐标题

### 用户中心

- 文章管理：查看、编辑、删除个人文章
- 互动记录：查看点赞、收藏、评论、浏览记录
- 数据统计：文章阅读量、互动数据统计、个人文章分类分布

### 管理后台

- 仪表盘：文章数据统计、访问趋势统计、用户活跃度统计
- 系统状态：监控系统资源使用，包括主机信息、CPU使用率、内存使用情况、磁盘IO、数据库性能和缓存状态等
- 审核管理：权限管理、分类管理、标签管理、评论管理、日志管理、AI 配置管理等

## API 接口

项目通过 Axios 与后端 API 进行通信，主要接口包括：

- 认证接口：`/api/auth/*`
- 文章接口：`/api/blog/articles/*`
- 分类接口：`/api/blog/categories/*`
- 标签接口：`/api/blog/tags/*`
- 评论接口：`/api/comment/*`
- 统计接口：`/api/stat/*`
- AI 接口：`/api/ai/*`

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT
