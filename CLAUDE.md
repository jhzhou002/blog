# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fully implemented personal blog system built with **Django 4.x + Bootstrap 5 + MySQL** architecture. The project features a responsive design with mobile-first approach, including both public blog frontend and comprehensive admin dashboard.

## Architecture

- **Frontend**: Bootstrap 5 with responsive design and mobile bottom navigation
- **Backend**: Django 4.x with custom User model and comprehensive views
- **Database**: MySQL 8.x with PyMySQL connector
- **File Storage**: Qiniu Cloud (七牛云) for avatar uploads
- **Authentication**: Extended Django User model with admin/superuser roles

## Development Commands

### Database Operations
```bash
# Initial setup (handles migration issues)
python setup_database.py

# Standard Django migrations
python manage.py makemigrations blog
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Development Server
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python manage.py runserver

# Access points:
# - Frontend: http://127.0.0.1:8000
# - Admin: http://127.0.0.1:8000/admin/dashboard/
```

### Static Files
```bash
# Collect static files for production
python manage.py collectstatic
```

## Code Architecture

### Django App Structure
- **blog/models.py**: Core data models (User, Post, Category, Tag, Comment, UserAction, Banner)
- **blog/views.py**: View logic for both frontend and admin areas
- **blog/urls.py**: URL routing with clear separation between frontend and admin paths
- **blog/utils.py**: Utility functions including Qiniu Cloud upload handlers
- **blog/context_processors.py**: Global template context (site categories for navigation)

### Key Models
- **User**: Extended AbstractUser with `avatar` (URLField for Qiniu URLs) and `is_admin` flag
- **Post**: Articles with category/tags, statistics (views, likes, favorites), and publishing status
- **Comment**: Hierarchical comments with parent/child relationships for replies
- **UserAction**: Tracks user likes/favorites with unique constraints
- **Banner**: Carousel banners for homepage

### Template Architecture
- **templates/base.html**: Master template with responsive navbar and mobile bottom navigation
- **templates/blog/**: Frontend templates (index, post_detail, profile, etc.)
- **templates/blog/admin/**: Admin dashboard templates with unified styling

### Frontend Features
- **Responsive Design**: Bootstrap 5 with mobile-first approach
- **Mobile Navigation**: Bottom navigation bar (APP-style) for mobile devices
- **Dynamic Navigation**: Category-based navigation menu generated from database
- **Comment System**: Collapsible replies with chat-style bubbles
- **Avatar System**: Click-to-upload with Qiniu Cloud integration
- **AJAX Interactions**: Like/favorite functionality with real-time updates

### File Storage Integration
- **Avatar uploads**: Processed locally (resize to 200x200) then uploaded to Qiniu
- **Storage paths**: `blog-yk/avatar/` for user avatars, `blog-yk/images/` for posts
- **URL storage**: Avatar URLs stored directly in User.avatar field (not file paths)

### Admin Dashboard
- **Comprehensive admin interface**: Custom admin templates with statistics dashboard
- **User management**: Admin panel for managing users, posts, categories, tags, comments
- **Real-time statistics**: Dashboard with actual data counts and charts
- **Unified styling**: Custom admin.css for consistent UI across admin pages

### Authentication & Permissions
- **Extended User model**: Custom user with avatar and admin role support
- **Role-based access**: Separate admin views with proper permission checks
- **Password management**: Modal-based password change functionality
- **Profile management**: Interactive avatar upload and profile editing

## Configuration

### Environment Variables (.env)
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=blog
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306
QINIU_ACCESS_KEY=your-qiniu-access-key
QINIU_SECRET_KEY=your-qiniu-secret-key
QINIU_BUCKET_NAME=your-bucket-name
QINIU_BUCKET_DOMAIN=your-domain
```

### Database Schema
- MySQL database with UTF-8 encoding
- Custom migrations handle User model properly
- Foreign key relationships between Post/Category/Tag/Comment
- UserAction table with unique constraints for like/favorite tracking

## URL Structure

### Frontend URLs
- `/` - Homepage with banner carousel and post cards
- `/post/<id>/` - Article detail with comments
- `/category/<id>/` - Category-filtered posts
- `/tag/<id>/` - Tag-filtered posts
- `/search/` - Search functionality
- `/login/`, `/register/`, `/logout/` - User authentication
- `/profile/` - User profile with avatar upload and settings

### Admin URLs
- `/admin/dashboard/` - Admin dashboard with statistics
- `/admin/posts/`, `/admin/post/add/` - Post management
- `/admin/categories/`, `/admin/tags/` - Content organization
- `/admin/users/`, `/admin/comments/` - User and content moderation
- `/admin/banners/` - Homepage banner management

### AJAX Endpoints
- `/post/<id>/like/` - Toggle post like
- `/post/<id>/favorite/` - Toggle post favorite  
- `/post/<id>/comment/` - Add comment/reply
- `/change-password/` - Update user password
- `/upload-avatar/` - Upload user avatar

## Important Implementation Notes

### Mobile-First Design
- Mobile devices show bottom navigation bar (hidden on desktop)
- Desktop shows traditional top navigation (hidden on mobile)  
- Responsive breakpoint at 767.98px for mobile/desktop differences

### Comment System Architecture
- Hierarchical comments using self-referencing parent field
- Chat-style reply bubbles with left/right positioning
- Collapsible replies (hidden by default, expandable via JavaScript)
- Avatar display for all commenters

### File Upload Strategy
- Avatars: Local processing (PIL resize) → Qiniu upload → URL storage in database
- No local file storage for production assets
- Temporary files cleaned up after Qiniu upload

### Code Quality Practices
- Chinese comments throughout codebase
- Consistent naming conventions
- Proper Django ORM usage with select_related/prefetch_related
- CSRF protection on all forms
- Responsive CSS with mobile-first approach
- 你是一位专业的博客研发经理，你的任务是基于我提出的需求、调试问题，围绕工程项目进行代码开发和材料编写
注意：
-但凡对于前端页面的修改要考虑兼容移动端场景，要有响应式设计
-节约上下文窗口，500行以下代码提供完整代码文件；超过500行提供完整函数代码
-一个对话中不要提供迭代式代码，不利于代码合入。一次性提供修改的代码再做解释
-简化代码，仅修复关键问题
-使用现有代码结构，避免引入新概念或者新函数
-代码注释全部使用中文
-当你不确定或者不了解实时信息时，使用互联网搜索功能
-前端页面样式都集中于style.css
-每次修改完代码，必须列出修改的代码文件列表（标注：已有/新增），对应代码函数（标注：已有/新增）
-禁止提示语、日志打印、注释使用iOS的表情文字