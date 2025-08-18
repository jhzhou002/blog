from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import json
import os
import tempfile
from PIL import Image

from .models import Post, Category, Tag, Comment, User, UserAction, Banner
from .utils import upload_avatar_to_qiniu, upload_post_image_to_qiniu


def index(request):
    """首页视图"""
    # 轮播图横幅
    banners = Banner.objects.filter(is_active=True)[:5]
    
    # 获取筛选参数
    category_id = request.GET.get('category')
    
    # 获取已发布的文章，支持分类筛选
    posts = Post.objects.filter(is_published=True).select_related('category', 'author').prefetch_related('tags')
    
    # 注意：所有用户都可以看到VIP文章列表，只是访问时会有限制
    
    # 当前选中的分类
    current_category = None
    if category_id:
        try:
            current_category = Category.objects.get(id=category_id)
            posts = posts.filter(category=current_category)
        except Category.DoesNotExist:
            pass
    
    # 分页
    paginator = Paginator(posts, 5)  # 每页5篇文章
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    # 最近文章（包含VIP文章，用于显示标识）
    recent_posts = Post.objects.filter(is_published=True).order_by('-created_at')[:5]
    
    # 推荐阅读（按浏览量排序，包含VIP文章）
    recommended_posts = Post.objects.filter(is_published=True).order_by('-views', '-likes')[:5]
    
    # 分类统计
    categories = Category.objects.annotate(post_count=Count('post')).filter(post_count__gt=0)[:10]
    
    # 热门标签
    tags = Tag.objects.annotate(post_count=Count('post')).filter(post_count__gt=0).order_by('-post_count')[:20]
    
    context = {
        'banners': banners,
        'posts': posts,
        'recent_posts': recent_posts,
        'recommended_posts': recommended_posts,
        'categories': categories,
        'tags': tags,
        'current_category': current_category,
        'site_name': settings.SITE_NAME,
        'site_description': settings.SITE_DESCRIPTION,
    }
    
    return render(request, 'blog/index.html', context)


def post_detail(request, pk):
    """文章详情页"""
    post = get_object_or_404(Post, pk=pk, is_published=True)
    
    # VIP文章访问控制
    if post.is_vip_only:
        if not request.user.is_authenticated:
            # 未登录用户直接跳转到VIP升级页面
            return render(request, 'blog/vip_upgrade.html', {'post': post})
        elif not request.user.is_vip_active():
            # 非VIP用户或VIP已过期
            return render(request, 'blog/vip_upgrade.html', {
                'post': post, 
                'user_logged_in': True
            })
    
    # 增加浏览量
    post.increment_views()
    
    # 获取评论
    comments = Comment.objects.filter(post=post, is_approved=True, parent=None).order_by('-created_at')
    
    # 相关文章（包含VIP文章，用于显示标识）
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
    
    # 侧边栏数据
    recent_posts = Post.objects.filter(is_published=True).order_by('-created_at')[:5]
    categories = Category.objects.annotate(post_count=Count('post')).filter(post_count__gt=0)[:10]
    tags = Tag.objects.annotate(post_count=Count('post')).filter(post_count__gt=0).order_by('-post_count')[:20]
    
    context = {
        'post': post,
        'comments': comments,
        'related_posts': related_posts,
        'recent_posts': recent_posts,
        'categories': categories,
        'tags': tags,
        'user_liked': user_liked,
        'user_favorited': user_favorited,
    }
    
    return render(request, 'blog/post_detail.html', context)


def category_posts(request, pk):
    """分类文章列表"""
    category = get_object_or_404(Category, pk=pk)
    posts = Post.objects.filter(category=category, is_published=True)  # 包含VIP文章
    
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
    posts = Post.objects.filter(tags=tag, is_published=True)  # 包含VIP文章
    
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
        ).distinct()  # 包含VIP文章，显示时会有标识
        
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
        'liked_posts': liked_posts,
        'favorited_posts': favorited_posts,
    }
    
    return render(request, 'blog/profile.html', context)


@login_required
def change_password(request):
    """修改密码"""
    if request.method == 'POST':
        old_password = request.POST.get('old_password')
        new_password1 = request.POST.get('new_password1')
        new_password2 = request.POST.get('new_password2')
        
        # 验证当前密码
        if not request.user.check_password(old_password):
            messages.error(request, '当前密码错误')
        elif new_password1 != new_password2:
            messages.error(request, '两次新密码输入不一致')
        elif len(new_password1) < 6:
            messages.error(request, '密码长度不能少于6位')
        else:
            # 修改密码
            request.user.set_password(new_password1)
            request.user.save()
            # 更新session，避免用户被登出
            update_session_auth_hash(request, request.user)
            messages.success(request, '密码修改成功')
    
    return redirect('blog:profile')


@login_required
def upload_avatar(request):
    """上传头像"""
    if request.method == 'POST' and request.FILES.get('avatar'):
        avatar_file = request.FILES['avatar']
        
        # 验证文件类型
        if not avatar_file.content_type.startswith('image/'):
            messages.error(request, '请上传图片文件')
            return redirect('blog:profile')
        
        # 验证文件大小（2MB）
        if avatar_file.size > 2 * 1024 * 1024:
            messages.error(request, '文件大小不能超过2MB')
            return redirect('blog:profile')
        
        try:
            # 创建临时文件处理图片
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                # 处理图片
                with Image.open(avatar_file) as img:
                    # 转换为RGB模式（如果是RGBA）
                    if img.mode in ('RGBA', 'LA', 'P'):
                        img = img.convert('RGB')
                    
                    # 缩放到200x200
                    img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                    img.save(temp_file.name, 'JPEG', quality=85)
                
                # 上传到七牛云
                qiniu_url = upload_avatar_to_qiniu(temp_file.name, request.user.id)
                
                if qiniu_url:
                    # 更新用户头像URL
                    request.user.avatar = qiniu_url
                    request.user.save()
                    messages.success(request, '头像上传成功')
                else:
                    messages.error(request, '头像上传到云存储失败')
                
                # 删除临时文件
                os.unlink(temp_file.name)
                
        except Exception as e:
            messages.error(request, f'头像上传失败：{str(e)}')
    else:
        messages.error(request, '请选择要上传的头像文件')
    
    return redirect('blog:profile')


# AJAX 视图
@require_POST
def like_post(request, pk):
    """点赞文章"""
    # 添加调试日志
    print(f"点赞请求 - 用户: {request.user}, 是否认证: {request.user.is_authenticated}")
    print(f"请求头: {request.headers}")
    print(f"会话: {request.session.session_key}")
    
    if not request.user.is_authenticated:
        print("用户未认证，返回错误响应")
        return JsonResponse({
            'success': False,
            'message': '请先登录'
        })
    
    post = get_object_or_404(Post, pk=pk)
    print(f"处理文章: {post.title}")
    
    action, created = UserAction.objects.get_or_create(
        user=request.user,
        post=post,
        action='like'
    )
    
    if not created:
        action.delete()
        post.likes -= 1
        liked = False
        print(f"取消点赞，当前点赞数: {post.likes}")
    else:
        post.likes += 1
        liked = True
        print(f"添加点赞，当前点赞数: {post.likes}")
    
    post.save()
    
    response_data = {
        'success': True,
        'liked': liked,
        'count': post.likes
    }
    print(f"返回响应: {response_data}")
    
    return JsonResponse(response_data)


@require_POST
def favorite_post(request, pk):
    """收藏文章"""
    # 添加调试日志
    print(f"收藏请求 - 用户: {request.user}, 是否认证: {request.user.is_authenticated}")
    print(f"请求头: {request.headers}")
    print(f"会话: {request.session.session_key}")
    
    if not request.user.is_authenticated:
        print("用户未认证，返回错误响应")
        return JsonResponse({
            'success': False,
            'message': '请先登录'
        })
    
    post = get_object_or_404(Post, pk=pk)
    print(f"处理文章: {post.title}")
    
    action, created = UserAction.objects.get_or_create(
        user=request.user,
        post=post,
        action='favorite'
    )
    
    if not created:
        action.delete()
        post.favorites -= 1
        favorited = False
        print(f"取消收藏，当前收藏数: {post.favorites}")
    else:
        post.favorites += 1
        favorited = True
        print(f"添加收藏，当前收藏数: {post.favorites}")
    
    post.save()
    
    response_data = {
        'success': True,
        'favorited': favorited,
        'count': post.favorites
    }
    print(f"返回响应: {response_data}")
    
    return JsonResponse(response_data)


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
        is_vip_only = request.POST.get('is_vip_only') == 'on'
        cover_image = request.FILES.get('cover_image')
        
        if title and content:
            # 先创建文章对象（不包含封面）
            post = Post.objects.create(
                title=title,
                summary=summary,
                content=content,
                category_id=category_id if category_id else None,
                author=request.user,
                is_published=is_published,
                is_featured=is_featured,
                is_vip_only=is_vip_only
            )
            
            # 处理封面图片上传到七牛云
            if cover_image:
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                        with Image.open(cover_image) as img:
                            if img.mode in ('RGBA', 'LA', 'P'):
                                img = img.convert('RGB')
                            # 缩放封面图片到合适尺寸
                            img.thumbnail((800, 600), Image.Resampling.LANCZOS)
                            img.save(temp_file.name, 'JPEG', quality=85)
                        
                        # 上传到七牛云
                        qiniu_url = upload_post_image_to_qiniu(temp_file.name, post.id)
                        if qiniu_url:
                            post.cover_image = qiniu_url
                            post.save()
                        
                        # 删除临时文件
                        os.unlink(temp_file.name)
                except Exception as e:
                    messages.warning(request, f'封面图片上传失败：{str(e)}')
            
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
        post.is_vip_only = request.POST.get('is_vip_only') == 'on'
        
        # 处理封面图片上传到七牛云
        cover_image = request.FILES.get('cover_image')
        if cover_image:
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                    with Image.open(cover_image) as img:
                        if img.mode in ('RGBA', 'LA', 'P'):
                            img = img.convert('RGB')
                        # 缩放封面图片到合适尺寸
                        img.thumbnail((800, 600), Image.Resampling.LANCZOS)
                        img.save(temp_file.name, 'JPEG', quality=85)
                    
                    # 上传到七牛云
                    qiniu_url = upload_post_image_to_qiniu(temp_file.name, post.id)
                    if qiniu_url:
                        post.cover_image = qiniu_url
                    
                    # 删除临时文件
                    os.unlink(temp_file.name)
            except Exception as e:
                messages.warning(request, f'封面图片上传失败：{str(e)}')
        
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
def admin_user_vip_toggle(request, user_id):
    """切换用户VIP状态"""
    if not request.user.is_admin and not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': '权限不足'})
    
    if request.method == 'POST':
        try:
            user = get_object_or_404(User, id=user_id)
            action = request.POST.get('action')
            
            if action == 'grant_vip':
                user.is_vip = True
                # 设置VIP过期时间（可选）
                expire_date = request.POST.get('expire_date')
                if expire_date:
                    from datetime import datetime
                    user.vip_expire_date = datetime.strptime(expire_date, '%Y-%m-%d')
                else:
                    user.vip_expire_date = None  # 永久VIP
                user.save()
                return JsonResponse({
                    'success': True, 
                    'message': f'已设置 {user.username} 为VIP用户',
                    'is_vip': True
                })
            
            elif action == 'revoke_vip':
                user.is_vip = False
                user.vip_expire_date = None
                user.save()
                return JsonResponse({
                    'success': True, 
                    'message': f'已取消 {user.username} 的VIP状态',
                    'is_vip': False
                })
                
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': '无效请求'})


@login_required
def admin_banners(request):
    """横幅管理"""
    if not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问此页面')
        return redirect('blog:index')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'add':
            title = request.POST.get('title')
            subtitle = request.POST.get('subtitle', '')
            image = request.FILES.get('image')
            post_id = request.POST.get('post')
            external_url = request.POST.get('external_url', '')
            is_active = request.POST.get('is_active') == 'on'
            order = request.POST.get('order', 0)
            
            if title and image:
                banner = Banner.objects.create(
                    title=title,
                    subtitle=subtitle,
                    image=image,
                    post_id=post_id if post_id else None,
                    external_url=external_url,
                    is_active=is_active,
                    order=order
                )
                messages.success(request, '横幅创建成功')
            else:
                messages.error(request, '标题和图片不能为空')
        
        elif action == 'edit':
            banner_id = request.POST.get('banner_id')
            banner = get_object_or_404(Banner, id=banner_id)
            
            banner.title = request.POST.get('title')
            banner.subtitle = request.POST.get('subtitle', '')
            banner.post_id = request.POST.get('post') if request.POST.get('post') else None
            banner.external_url = request.POST.get('external_url', '')
            banner.is_active = request.POST.get('is_active') == 'on'
            banner.order = request.POST.get('order', 0)
            
            new_image = request.FILES.get('image')
            if new_image:
                banner.image = new_image
            
            banner.save()
            messages.success(request, '横幅更新成功')
        
        elif action == 'delete':
            banner_id = request.POST.get('banner_id')
            banner = get_object_or_404(Banner, id=banner_id)
            banner.delete()
            messages.success(request, '横幅删除成功')
    
    banners = Banner.objects.all().order_by('order', '-created_at')
    posts = Post.objects.filter(is_published=True).order_by('-created_at')
    
    context = {
        'title': '横幅管理',
        'banners': banners,
        'posts': posts,
    }
    
    return render(request, 'blog/admin/banners.html', context)


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