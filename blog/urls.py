from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # 首页
    path('', views.index, name='index'),
    
    # 文章相关
    path('post/<int:pk>/', views.post_detail, name='post_detail'),
    path('category/<int:pk>/', views.category_posts, name='category_posts'),
    path('tag/<int:pk>/', views.tag_posts, name='tag_posts'),
    
    # 分类和标签页面
    path('categories/', views.categories, name='categories'),
    path('tags/', views.tags, name='tags'),
    
    # 搜索和关于页面
    path('search/', views.search, name='search'),
    path('about/', views.about, name='about'),
    
    # 用户认证
    path('login/', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    
    # AJAX 接口
    path('post/<int:pk>/like/', views.like_post, name='like_post'),
    path('post/<int:pk>/favorite/', views.favorite_post, name='favorite_post'),
    path('post/<int:pk>/comment/', views.add_comment, name='add_comment'),
    
    # 管理员后台
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/posts/', views.admin_posts, name='admin_posts'),
    path('admin/post/add/', views.admin_post_add, name='admin_post_add'),
    path('admin/post/edit/<int:pk>/', views.admin_post_edit, name='admin_post_edit'),
    path('admin/post/delete/<int:pk>/', views.admin_post_delete, name='admin_post_delete'),
    path('admin/categories/', views.admin_categories, name='admin_categories'),
    path('admin/tags/', views.admin_tags, name='admin_tags'),
    path('admin/comments/', views.admin_comments, name='admin_comments'),
    path('admin/users/', views.admin_users, name='admin_users'),
    path('admin/banners/', views.admin_banners, name='admin_banners'),
    path('admin/settings/', views.admin_settings, name='admin_settings'),
]