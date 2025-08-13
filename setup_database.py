#!/usr/bin/env python
"""
数据库初始化脚本
运行此脚本来创建数据库和表
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

# 设置Django设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myblog.settings')

# 初始化Django
django.setup()

def setup_database():
    """初始化数据库"""
    print("=== Django 博客数据库初始化 ===")
    
    try:
        print("1. 创建迁移文件...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        
        print("2. 执行数据库迁移...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        print("3. 创建超级用户...")
        print("请按提示输入管理员用户信息：")
        execute_from_command_line(['manage.py', 'createsuperuser'])
        
        print("\n=== 数据库初始化完成 ===")
        print("现在您可以运行以下命令启动开发服务器：")
        print("python manage.py runserver")
        
    except Exception as e:
        print(f"初始化过程中出现错误: {e}")
        print("请检查数据库连接配置是否正确")

if __name__ == '__main__':
    setup_database()