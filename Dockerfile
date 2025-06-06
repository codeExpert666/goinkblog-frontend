# 构建阶段
FROM node:23-alpine AS build

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建结果到nginx目录
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]