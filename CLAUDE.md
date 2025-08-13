# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog system built with **Bootstrap + Django + MySQL** architecture. The project is currently in the planning/documentation phase, with detailed specifications available in the Chinese documentation file `个人博客网站开发文档.md`.

## Architecture

- **Frontend**: Bootstrap 5 (responsive design)
- **Backend**: Django 4.x (MVC framework)
- **Database**: MySQL 8.x
- **File Storage**: Qiniu Cloud (七牛云) for images and assets
- **Deployment**: Nginx + Gunicorn/Uwsgi + Docker (optional)

## Key Components

### Frontend Features
- Responsive blog homepage with carousel and article cards
- Article detail pages with comments system
- Category and tag filtering
- Search functionality
- User registration/login system
- Admin dashboard for content management

### Backend Structure
- Django models: User, Category, Tag, Post, PostTag, Comment
- Two main areas: public blog frontend and admin backend
- Authentication system with single admin (author) and regular users
- File upload support with Pillow integration

## Database Configuration

The project uses MySQL with the following structure:
- **Host**: 101.35.218.174
- **Username**: tongyong
- **Database**: blog
- Core tables: User (extended Django User), Category, Tag, Post, PostTag, Comment

## File Storage

Qiniu Cloud configuration for asset storage:
- **Space**: youxuan-images  
- **Region**: 华东-浙江
- **Structure**: 
  - Article images: `blog-yk/images/`
  - Avatars: `blog-yk/avatar/`
- Images should be renamed using appropriate naming conventions before storage

## Development Notes

This appears to be a project in the planning phase with comprehensive documentation but no actual code implementation yet. When developing:

1. Follow Django best practices for MVC structure
2. Implement responsive Bootstrap 5 components
3. Use Django ORM for database operations
4. Integrate Qiniu Cloud SDK for file uploads
5. Implement proper user authentication and admin permissions
6. Ensure mobile-responsive design throughout

## URL Structure

The project plans these main URL patterns:
- Frontend: `/`, `/post/<id>/`, `/category/<id>/`, `/tag/<id>/`, `/search/`
- User auth: `/login/`, `/register/`, `/logout/`
- Admin: `/admin/dashboard/`, `/admin/post/add/`, `/admin/post/edit/<id>/`