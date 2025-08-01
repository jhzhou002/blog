# Vue.js 博客系统

一个基于 Vue.js + Node.js + MySQL 的现代化博客系统，类似 WordPress 的功能完整的内容管理系统。

## 🌟 特性

- 📝 **文章管理** - 支持 Markdown 编辑，草稿/发布状态管理
- 🏷️ **分类标签** - 灵活的分类和标签系统
- 💬 **评论系统** - 支持嵌套回复，评论审核
- 👥 **用户系统** - 多角色权限管理（管理员/编辑/用户）
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 🔒 **安全可靠** - JWT 认证，数据验证，XSS 防护
- 📊 **管理后台** - 现代化的管理界面
- 🚀 **性能优化** - 代码分割，图片懒加载，缓存优化

## 🛠️ 技术栈

### 前端
- Vue.js 3 - 渐进式 JavaScript 框架
- Vue Router 4 - 客户端路由
- Pinia - 状态管理
- Element Plus - UI 组件库
- Vite - 构建工具
- Axios - HTTP 客户端

### 后端
- Node.js - JavaScript 运行时
- Express.js - Web 框架
- MySQL - 关系型数据库
- JWT - 身份认证
- Multer - 文件上传
- Bcrypt - 密码加密

### 部署
- 宝塔面板 - 服务器管理
- Nginx - 反向代理
- PM2 - 进程管理

## 📦 项目结构

```
blog/
├── client/                 # 前端 Vue.js 应用
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── views/         # 页面组件
│   │   │   ├── blog/      # 博客前台
│   │   │   ├── admin/     # 管理后台
│   │   │   └── auth/      # 认证页面
│   │   ├── router/        # 路由配置
│   │   ├── store/         # 状态管理
│   │   ├── api/           # API 接口
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── vite.config.js
├── server/                 # 后端 Node.js 应用
│   ├── controllers/        # 控制器
│   ├── models/            # 数据模型
│   ├── routes/            # 路由定义
│   ├── middleware/        # 中间件
│   ├── config/            # 配置文件
│   ├── utils/             # 工具函数
│   ├── uploads/           # 文件上传目录
│   ├── package.json
│   └── app.js
├── database/               # 数据库脚本
│   └── init.sql
├── deploy/                 # 部署相关
│   ├── nginx.conf
│   ├── pm2.config.js
│   └── deploy.sh
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0
- MySQL >= 8.0
- 宝塔面板（推荐）

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd blog
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

3. **数据库配置**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE blog_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据表
mysql -u root -p blog_system < database/init.sql
```

4. **环境配置**
```bash
# 复制环境配置文件
cd server
cp .env.example .env

# 编辑配置文件
vim .env
```

配置示例：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_system

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=development
```

5. **启动开发服务器**
```bash
# 在项目根目录
npm run dev
```

访问地址：
- 博客前台：http://localhost:8080
- 管理后台：http://localhost:8080/admin
- API 服务：http://localhost:3000

## 🔧 宝塔部署

### 1. 服务器环境准备

在宝塔面板中安装：
- Nginx 1.20+
- MySQL 8.0+
- Node.js 16+
- PM2

### 2. 数据库设置

1. 在宝塔面板创建数据库 `blog_system`
2. 创建数据库用户并授权
3. 导入 `database/init.sql` 文件

### 3. 网站配置

1. **创建网站**
   - 在宝塔面板创建网站
   - 域名：your-domain.com
   - 根目录：/www/wwwroot/blog

2. **上传代码**
```bash
# 上传项目文件到服务器
tar -czf blog.tar.gz .
# 通过宝塔面板上传并解压到 /www/wwwroot/blog
```

3. **配置 Nginx**
```bash
# 复制 Nginx 配置
cp deploy/nginx.conf /www/server/panel/vhost/nginx/your-domain.com.conf
# 重启 Nginx
systemctl reload nginx
```

4. **运行部署脚本**
```bash
cd /www/wwwroot/blog
chmod +x deploy/deploy.sh
./deploy/deploy.sh production
```

### 4. SSL 证书配置（可选）

1. 在宝塔面板申请免费 SSL 证书
2. 或上传自有证书
3. 开启强制 HTTPS

### 5. 服务监控

使用 PM2 监控应用状态：
```bash
pm2 status
pm2 logs blog-server
pm2 monit
```

## 📝 使用说明

### 管理员账户

首次部署后，请使用以下账户登录管理后台：
- 用户名：admin
- 邮箱：admin@blog.com
- 密码：请在数据库中查看加密后的密码

### 主要功能

1. **文章管理**
   - 创建、编辑、删除文章
   - 支持 Markdown 格式
   - 草稿和发布状态
   - 特色图片设置

2. **分类标签**
   - 层级分类管理
   - 标签云展示
   - 文章分类筛选

3. **评论系统**
   - 访客评论
   - 嵌套回复
   - 评论审核
   - 垃圾评论过滤

4. **用户管理**
   - 用户注册登录
   - 角色权限控制
   - 个人资料管理

5. **媒体管理**
   - 图片上传
   - 文件管理
   - 批量操作

6. **系统设置**
   - 网站基本信息
   - SEO 设置
   - 评论设置

## 🔒 安全配置

1. **修改默认密码**
   - 立即修改管理员密码
   - 使用强密码策略

2. **JWT 密钥**
   - 生成复杂的 JWT_SECRET
   - 定期更换密钥

3. **数据库安全**
   - 使用独立数据库用户
   - 限制数据库访问权限

4. **服务器安全**
   - 配置防火墙
   - 定期更新系统
   - 监控异常访问

## 🔧 维护操作

### 备份数据

```bash
# 数据库备份
mysqldump -u root -p blog_system > backup_$(date +%Y%m%d).sql

# 文件备份
tar -czf blog_backup_$(date +%Y%m%d).tar.gz /www/wwwroot/blog
```

### 更新部署

```bash
cd /www/wwwroot/blog
git pull origin main
./deploy/deploy.sh production
```

### 日志查看

```bash
# 应用日志
pm2 logs blog-server

# Nginx 日志
tail -f /www/wwwroot/blog/logs/nginx_access.log
tail -f /www/wwwroot/blog/logs/nginx_error.log
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库配置
   - 确认数据库服务状态
   - 验证用户权限

2. **应用启动失败**
   - 查看 PM2 日志
   - 检查端口占用
   - 验证环境变量

3. **静态资源 404**
   - 检查 Nginx 配置
   - 确认构建文件存在
   - 验证文件权限

4. **API 请求失败**
   - 检查代理配置
   - 确认后端服务状态
   - 查看错误日志

### 获取帮助

- 查看项目文档
- 检查系统日志
- 联系技术支持

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

---

© 2024 Vue.js 博客系统. All rights reserved.
