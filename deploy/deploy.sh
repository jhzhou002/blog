#!/bin/bash

# 博客系统部署脚本
# 使用方法: ./deploy.sh [production|development]

set -e

# 获取环境参数，默认为production
ENV=${1:-production}
echo "部署环境: $ENV"

# 项目路径
PROJECT_PATH="/www/wwwroot/blog"
BACKUP_PATH="/www/backup/blog"
DATE=$(date +%Y%m%d_%H%M%S)

echo "开始部署博客系统..."

# 1. 创建备份
if [ -d "$PROJECT_PATH" ]; then
    echo "创建备份..."
    mkdir -p "$BACKUP_PATH"
    tar -czf "$BACKUP_PATH/blog_backup_$DATE.tar.gz" -C "$PROJECT_PATH" .
    echo "备份完成: $BACKUP_PATH/blog_backup_$DATE.tar.gz"
fi

# 2. 创建必要的目录
mkdir -p "$PROJECT_PATH"
mkdir -p "$PROJECT_PATH/logs"
mkdir -p "$PROJECT_PATH/server/uploads"

# 3. 进入项目目录
cd "$PROJECT_PATH"

# 4. 更新代码（如果是Git仓库）
if [ -d ".git" ]; then
    echo "更新代码..."
    git pull origin main
else
    echo "警告: 不是Git仓库，请手动上传代码"
fi

# 5. 安装后端依赖
echo "安装后端依赖..."
cd server
npm install --production

# 6. 安装前端依赖
echo "安装前端依赖..."
cd ../client
npm install

# 7. 构建前端
echo "构建前端应用..."
npm run build

# 8. 创建环境配置文件
echo "创建环境配置文件..."
cd ../server
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "请修改 .env 文件中的配置"
fi

# 9. 数据库初始化
echo "初始化数据库..."
mysql -u root -p blog_system < ../database/init.sql

# 10. 设置文件权限
echo "设置文件权限..."
cd "$PROJECT_PATH"
chown -R www:www .
chmod -R 755 .
chmod -R 777 logs
chmod -R 777 server/uploads

# 11. 启动/重启应用
echo "启动应用..."
cd server

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
fi

# 停止现有进程
pm2 stop blog-server 2>/dev/null || true
pm2 delete blog-server 2>/dev/null || true

# 启动应用
pm2 start ../deploy/pm2.config.js --env $ENV
pm2 save
pm2 startup

echo "部署完成！"
echo "应用状态："
pm2 status

echo ""
echo "请确保以下配置正确："
echo "1. Nginx配置文件已复制到正确位置"
echo "2. 数据库连接信息正确"
echo "3. 域名已正确解析"
echo "4. SSL证书已配置（如果使用HTTPS）"
echo ""
echo "访问应用: http://your-domain.com"
echo "管理后台: http://your-domain.com/admin"