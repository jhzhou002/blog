from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.urls import reverse


class User(AbstractUser):
    """Extended User model"""
    is_admin = models.BooleanField(default=False, verbose_name='是否管理员')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='头像')
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'


class Category(models.Model):
    """文章分类"""
    name = models.CharField(max_length=100, unique=True, verbose_name='分类名称')
    description = models.TextField(blank=True, verbose_name='分类描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '分类'
        verbose_name_plural = '分类'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Tag(models.Model):
    """文章标签"""
    name = models.CharField(max_length=50, unique=True, verbose_name='标签名称')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '标签'
        verbose_name_plural = '标签'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Post(models.Model):
    """文章模型"""
    title = models.CharField(max_length=200, verbose_name='标题')
    summary = models.TextField(max_length=500, verbose_name='摘要')
    content = models.TextField(verbose_name='内容')
    cover_image = models.ImageField(upload_to='posts/', blank=True, null=True, verbose_name='封面图片')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='分类')
    tags = models.ManyToManyField(Tag, blank=True, verbose_name='标签')
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='作者')
    
    # 统计字段
    views = models.PositiveIntegerField(default=0, verbose_name='浏览数')
    likes = models.PositiveIntegerField(default=0, verbose_name='点赞数')
    favorites = models.PositiveIntegerField(default=0, verbose_name='收藏数')
    
    # 状态字段
    is_published = models.BooleanField(default=True, verbose_name='是否发布')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '文章'
        verbose_name_plural = '文章'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('blog:post_detail', kwargs={'pk': self.pk})
    
    def increment_views(self):
        """增加浏览数"""
        self.views += 1
        self.save(update_fields=['views'])


class Comment(models.Model):
    """评论模型"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', verbose_name='文章')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    content = models.TextField(verbose_name='评论内容')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                              related_name='replies', verbose_name='父评论')
    
    is_approved = models.BooleanField(default=True, verbose_name='是否审核通过')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '评论'
        verbose_name_plural = '评论'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.username} - {self.post.title}'


class UserAction(models.Model):
    """用户行为记录（点赞、收藏等）"""
    ACTION_CHOICES = [
        ('like', '点赞'),
        ('favorite', '收藏'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, verbose_name='文章')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='行为类型')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '用户行为'
        verbose_name_plural = '用户行为'
        unique_together = ['user', 'post', 'action']
    
    def __str__(self):
        return f'{self.user.username} {self.get_action_display()} {self.post.title}'