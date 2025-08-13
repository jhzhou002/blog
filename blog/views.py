from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import json

from .models import Post, Category, Tag, Comment, User, UserAction


def index(request):
    """首页视图"""
    # 获取已发布的文章
    posts = Post.objects.filter(is_published=True).select_related('category', 'author').prefetch_related('tags')
    
    # 分页
    paginator = Paginator(posts, 5)  # 每页5篇文章
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    # 推荐文章（轮播图）
    featured_posts = Post.objects.filter(is_published=True, is_featured=True)[:3]
    
    # 最近文章
    recent_posts = Post.objects.filter(is_published=True).order_by('-created_at')[:5]
    
    # 推荐阅读（按浏览量排序）
    recommended_posts = Post.objects.filter(is_published=True).order_by('-views', '-likes')[:5]
    
    # 分类统计
    categories = Category.objects.annotate(post_count=Count('post')).filter(post_count__gt=0)[:10]
    
    # 热门标签
    tags = Tag.objects.annotate(post_count=Count('post')).filter(post_count__gt=0).order_by('-post_count')[:20]
    
    context = {
        'posts': posts,
        'featured_posts': featured_posts,
        'recent_posts': recent_posts,
        'recommended_posts': recommended_posts,
        'categories': categories,
        'tags': tags,
        'site_name': settings.SITE_NAME,
        'site_description': settings.SITE_DESCRIPTION,
    }
    
    return render(request, 'blog/index.html', context)


def post_detail(request, pk):
    """文章详情页"""
    post = get_object_or_404(Post, pk=pk, is_published=True)
    
    # 增加浏览量
    post.increment_views()
    
    # 获取评论
    comments = Comment.objects.filter(post=post, is_approved=True, parent=None).order_by('-created_at')
    
    # 相关文章
    related_posts = Post.objects.filter(
        category=post.category, 
        is_published=True
    ).exclude(pk=post.pk)[:4]
    
    # 检查用户是否已点赞/收藏
    user_liked = False
    user_favorited = False
    if request.user.is_authenticated:
        user_liked = UserAction.objects.filter(
            user=request.user, post=post, action='like'
        ).exists()
        user_favorited = UserAction.objects.filter(
            user=request.user, post=post, action='favorite'
        ).exists()
    
    context = {
        'post': post,
        'comments': comments,
        'related_posts': related_posts,
        'user_liked': user_liked,
        'user_favorited': user_favorited,
    }
    
    return render(request, 'blog/post_detail.html', context)


def category_posts(request, pk):
    """分类文章列表"""
    category = get_object_or_404(Category, pk=pk)
    posts = Post.objects.filter(category=category, is_published=True)
    
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    context = {
        'posts': posts,
        'category': category,
        'title': f'{category.name} - 分类文章',
    }
    
    return render(request, 'blog/category_posts.html', context)


def tag_posts(request, pk):
    """标签文章列表"""
    tag = get_object_or_404(Tag, pk=pk)
    posts = Post.objects.filter(tags=tag, is_published=True)
    
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    context = {
        'posts': posts,
        'tag': tag,
        'title': f'{tag.name} - 标签文章',
    }
    
    return render(request, 'blog/tag_posts.html', context)


def categories(request):
    """分类列表页"""
    categories = Category.objects.annotate(post_count=Count('post')).filter(post_count__gt=0)
    
    context = {
        'categories': categories,
        'title': '文章分类',
    }
    
    return render(request, 'blog/categories.html', context)


def tags(request):
    """标签列表页"""
    tags = Tag.objects.annotate(post_count=Count('post')).filter(post_count__gt=0).order_by('-post_count')
    
    context = {
        'tags': tags,
        'title': '文章标签',
    }
    
    return render(request, 'blog/tags.html', context)


def search(request):
    """搜索功能"""
    query = request.GET.get('q', '').strip()
    posts = []
    
    if query:
        posts = Post.objects.filter(
            Q(title__icontains=query) | 
            Q(summary__icontains=query) | 
            Q(content__icontains=query),
            is_published=True
        ).distinct()
        
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page')
        posts = paginator.get_page(page_number)
    
    context = {
        'posts': posts,
        'query': query,
        'title': f'搜索结果 - {query}' if query else '搜索',
    }
    
    return render(request, 'blog/search.html', context)


def about(request):
    """关于页面"""
    return render(request, 'blog/about.html', {'title': '关于我们'})


# 用户认证相关视图
def login_view(request):
    """登录视图"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, '登录成功！')
            # 管理员登录后直接跳转到后台管理
            if user.is_admin or user.is_superuser:
                return redirect('blog:admin_dashboard')
            return redirect(request.GET.get('next', 'blog:index'))
        else:
            messages.error(request, '用户名或密码错误')
    
    return render(request, 'blog/login.html', {'title': '用户登录'})


def register(request):
    """注册视图"""
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        
        # 基本验证
        if password != password2:
            messages.error(request, '两次密码输入不一致')
        elif User.objects.filter(username=username).exists():
            messages.error(request, '用户名已存在')
        elif User.objects.filter(email=email).exists():
            messages.error(request, '邮箱已被注册')
        else:
            # 创建用户
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            messages.success(request, '注册成功，请登录')
            return redirect('blog:login')
    
    return render(request, 'blog/register.html', {'title': '用户注册'})


def logout_view(request):
    """注销视图"""
    logout(request)
    messages.success(request, '已成功退出登录')
    return redirect('blog:index')


@login_required
def profile(request):
    """个人中心"""
    # 用户的评论
    user_comments = Comment.objects.filter(user=request.user).order_by('-created_at')[:10]
    
    # 用户的点赞文章
    liked_posts = Post.objects.filter(
        useraction__user=request.user,
        useraction__action='like',
        is_published=True
    )[:10]
    
    # 用户的收藏文章
    favorited_posts = Post.objects.filter(
        useraction__user=request.user,
        useraction__action='favorite',
        is_published=True
    )[:10]
    
    context = {
        'title': '个人中心',
        'user_comments': user_comments,
        'liked_posts': liked_posts,
        'favorited_posts': favorited_posts,
    }
    
    return render(request, 'blog/profile.html', context)


# AJAX 视图
@require_POST
@login_required
def like_post(request, pk):
    """点赞文章"""
    post = get_object_or_404(Post, pk=pk)
    
    action, created = UserAction.objects.get_or_create(
        user=request.user,
        post=post,
        action='like'
    )
    
    if not created:
        action.delete()
        post.likes -= 1
        liked = False
    else:
        post.likes += 1
        liked = True
    
    post.save()
    
    return JsonResponse({
        'success': True,
        'liked': liked,
        'count': post.likes
    })


@require_POST
@login_required
def favorite_post(request, pk):
    """收藏文章"""
    post = get_object_or_404(Post, pk=pk)
    
    action, created = UserAction.objects.get_or_create(
        user=request.user,
        post=post,
        action='favorite'
    )
    
    if not created:
        action.delete()
        post.favorites -= 1
        favorited = False
    else:
        post.favorites += 1
        favorited = True
    
    post.save()
    
    return JsonResponse({
        'success': True,
        'favorited': favorited,
        'count': post.favorites
    })


@login_required
def add_comment(request, pk):
    """添加评论"""
    post = get_object_or_404(Post, pk=pk)
    
    if request.method == 'POST':
        content = request.POST.get('content')
        parent_id = request.POST.get('parent_id')
        
        if content:
            comment = Comment.objects.create(
                post=post,
                user=request.user,
                content=content,
                parent_id=parent_id if parent_id else None
            )
            messages.success(request, '评论添加成功')
        else:
            messages.error(request, '评论内容不能为空')
    
    return redirect('blog:post_detail', pk=pk)


# 管理员相关视图
@login_required
def admin_dashboard(request):
    """管理员控制台"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    # 统计数据
    total_posts = Post.objects.count()
    published_posts = Post.objects.filter(is_published=True).count()
    total_comments = Comment.objects.count()
    total_users = User.objects.count()
    
    # 最新评论
    recent_comments = Comment.objects.select_related('user', 'post').order_by('-created_at')[:10]
    
    # 有文章的分类统计
    categories_with_posts = Category.objects.annotate(
        post_count=Count('post', filter=Q(post__is_published=True))
    ).filter(post_count__gt=0)[:6]  # 最多显示6个分类
    
    # 月度文章统计 (简化版本，实际项目中可能需要更复杂的查询)
    from datetime import datetime
    current_year = datetime.now().year
    monthly_posts = []
    
    for month in range(1, 13):
        count = Post.objects.filter(
            created_at__year=current_year,
            created_at__month=month,
            is_published=True
        ).count()
        monthly_posts.append(count)
    
    context = {
        'title': '管理控制台',
        'total_posts': total_posts,
        'published_posts': published_posts,
        'total_comments': total_comments,
        'total_users': total_users,
        'recent_comments': recent_comments,
        'categories_with_posts': categories_with_posts,
        'monthly_posts': monthly_posts,
    }
    
    return render(request, 'blog/admin/dashboard.html', context)


@login_required
def admin_posts(request):
    """文章管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    posts = Post.objects.all().select_related('category', 'author').order_by('-created_at')
    
    paginator = Paginator(posts, 20)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    context = {
        'title': '文章管理',
        'posts': posts,
    }
    
    return render(request, 'blog/admin/posts.html', context)


@login_required
def admin_post_add(request):
    """添加文章"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    if request.method == 'POST':
        title = request.POST.get('title')
        summary = request.POST.get('summary')
        content = request.POST.get('content')
        category_id = request.POST.get('category')
        tag_ids = request.POST.getlist('tags')
        is_published = request.POST.get('is_published') == 'on'
        is_featured = request.POST.get('is_featured') == 'on'
        cover_image = request.FILES.get('cover_image')
        
        if title and content:
            post = Post.objects.create(
                title=title,
                summary=summary,
                content=content,
                category_id=category_id if category_id else None,
                author=request.user,
                is_published=is_published,
                is_featured=is_featured,
                cover_image=cover_image
            )
            
            if tag_ids:
                post.tags.set(tag_ids)
            
            messages.success(request, '文章创建成功')
            return redirect('blog:admin_posts')
        else:
            messages.error(request, '标题和内容不能为空')
    
    categories = Category.objects.all()
    tags = Tag.objects.all()
    
    context = {
        'title': '添加文章',
        'categories': categories,
        'tags': tags,
    }
    
    return render(request, 'blog/admin/post_form.html', context)


@login_required
def admin_post_edit(request, pk):
    """编辑文章"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    post = get_object_or_404(Post, pk=pk)
    
    if request.method == 'POST':
        post.title = request.POST.get('title')
        post.summary = request.POST.get('summary')
        post.content = request.POST.get('content')
        
        category_id = request.POST.get('category')
        post.category_id = category_id if category_id else None
        
        tag_ids = request.POST.getlist('tags')
        post.tags.set(tag_ids)
        
        post.is_published = request.POST.get('is_published') == 'on'
        post.is_featured = request.POST.get('is_featured') == 'on'
        
        cover_image = request.FILES.get('cover_image')
        if cover_image:
            post.cover_image = cover_image
        
        post.save()
        messages.success(request, '文章更新成功')
        return redirect('blog:admin_posts')
    
    categories = Category.objects.all()
    tags = Tag.objects.all()
    
    context = {
        'title': '编辑文章',
        'post': post,
        'categories': categories,
        'tags': tags,
    }
    
    return render(request, 'blog/admin/post_form.html', context)


@login_required
def admin_post_delete(request, pk):
    """删除文章"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    post = get_object_or_404(Post, pk=pk)
    
    if request.method == 'POST':
        post.delete()
        messages.success(request, '文章删除成功')
        return redirect('blog:admin_posts')
    
    context = {
        'title': '删除文章',
        'post': post,
    }
    
    return render(request, 'blog/admin/post_delete.html', context)


@login_required
def admin_categories(request):
    """分类管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        
        if name:
            Category.objects.create(name=name, description=description)
            messages.success(request, '分类创建成功')
        else:
            messages.error(request, '分类名称不能为空')
    
    categories = Category.objects.annotate(post_count=Count('post')).order_by('-created_at')
    
    context = {
        'title': '分类管理',
        'categories': categories,
    }
    
    return render(request, 'blog/admin/categories.html', context)


@login_required
def admin_tags(request):
    """标签管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    if request.method == 'POST':
        name = request.POST.get('name')
        
        if name:
            Tag.objects.create(name=name)
            messages.success(request, '标签创建成功')
        else:
            messages.error(request, '标签名称不能为空')
    
    tags = Tag.objects.annotate(post_count=Count('post')).order_by('-created_at')
    
    context = {
        'title': '标签管理',
        'tags': tags,
    }
    
    return render(request, 'blog/admin/tags.html', context)


@login_required
def admin_comments(request):
    """评论管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    comments = Comment.objects.all().select_related('user', 'post').order_by('-created_at')
    
    paginator = Paginator(comments, 20)
    page_number = request.GET.get('page')
    comments = paginator.get_page(page_number)
    
    context = {
        'title': '评论管理',
        'comments': comments,
    }
    
    return render(request, 'blog/admin/comments.html', context)


@login_required
def admin_users(request):
    """用户管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    users = User.objects.all().order_by('-date_joined')
    
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    users = paginator.get_page(page_number)
    
    context = {
        'title': '用户管理',
        'users': users,
    }
    
    return render(request, 'blog/admin/users.html', context)


@login_required
def admin_settings(request):
    """系统设置"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    if request.method == 'POST':
        # 这里可以处理系统设置的保存
        messages.success(request, '设置保存成功')
    
    context = {
        'title': '系统设置',
    }
    
    return render(request, 'blog/admin/settings.html', context)