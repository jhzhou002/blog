# MyBlog - Django 个人博客系统

基于 Django + Bootstrap + MySQL 的响应式个人博客系统，支持文章管理、评论互动、用户认证等功能。

## 🚀 快速开始

### 环境要求

- Python 3.8+
- MySQL 8.0+
- pip

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/jhzhou002/blog.git
cd blog
```

2. **创建虚拟环境**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

5. **初始化数据库**

**重要：解决迁移问题**

如果遇到迁移错误 `(1824, "Failed to open the referenced table 'blog_user'")`，请按以下步骤操作：

**方法一：使用初始化脚本**
```bash
python setup_database.py
```

**方法二：手动执行**
```bash
# 1. 确保blog app被正确识别
python manage.py makemigrations blog

# 2. 按正确顺序执行迁移
python manage.py migrate

# 3. 创建超级用户
python manage.py createsuperuser
```

**方法三：如果仍有问题，重置数据库**
```bash
# 删除所有迁移文件（保留__init__.py）
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# 重新创建迁移
python manage.py makemigrations
python manage.py migrate
```

6. **启动开发服务器**
```bash
python manage.py runserver
```

访问 http://127.0.0.1:8000 查看博客首页
访问 http://127.0.0.1:8000/admin 进入管理后台

## 📁 项目结构

```
blog/
├── myblog/                 # Django项目配置
│   ├── settings.py        # 项目设置
│   ├── urls.py           # 主URL配置
│   └── ...
├── blog/                  # 博客应用
│   ├── models.py         # 数据模型
│   ├── views.py          # 视图逻辑
│   ├── urls.py           # URL路由
│   ├── admin.py          # 管理后台
│   ├── utils.py          # 工具函数
│   └── migrations/       # 数据库迁移文件
├── templates/            # HTML模板
│   ├── base.html         # 基础模板
│   └── blog/            # 博客页面模板
├── static/              # 静态文件
│   ├── css/            # CSS样式
│   ├── js/             # JavaScript脚本
│   └── images/         # 图片资源
├── requirements.txt     # Python依赖
├── .env.example        # 环境变量示例
└── README.md          # 项目说明
```

## 🔧 功能特性

### 前台功能
- ✅ 响应式首页设计
- ✅ 文章列表展示
- ✅ 文章详情页面
- ✅ 分类和标签筛选
- ✅ 全文搜索功能
- ✅ 用户注册登录
- ✅ 文章点赞收藏
- ✅ 评论系统

### 后台功能
- ✅ 文章管理（增删改查）
- ✅ 分类标签管理
- ✅ 评论管理
- ✅ 用户管理
- ✅ 数据统计

### 技术特性
- ✅ Bootstrap 5 响应式设计
- ✅ AJAX 交互体验
- ✅ 七牛云图片存储
- ✅ 安全的用户认证
- ✅ SEO 友好的URL

## 🗄️ 数据库设计

- **User**: 扩展的用户模型
- **Category**: 文章分类
- **Tag**: 文章标签
- **Post**: 博客文章
- **Comment**: 文章评论
- **UserAction**: 用户行为记录

## 🔐 环境配置

在 `.env` 文件中配置以下参数：

```env
# Django配置
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 数据库配置
DB_NAME=blog
DB_USER=your-username
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# 七牛云配置
QINIU_ACCESS_KEY=your-access-key
QINIU_SECRET_KEY=your-secret-key
QINIU_BUCKET_NAME=your-bucket
QINIU_BUCKET_DOMAIN=your-domain
```

## 🚨 常见问题

### 迁移错误
如果遇到 `Failed to open the referenced table 'blog_user'` 错误：
1. 确保已安装 `mysqlclient` 或 `PyMySQL`
2. 检查数据库连接配置
3. 使用上述初始化步骤重新创建迁移

### 静态文件问题
开发环境下Django会自动处理静态文件，生产环境需要：
```bash
python manage.py collectstatic
```

### 权限问题
确保数据库用户有足够权限创建表和索引。

## 📝 开发说明

- 遵循Django最佳实践
- 使用Bootstrap 5进行响应式设计
- 支持中英文国际化
- 代码注释完善

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

MIT License