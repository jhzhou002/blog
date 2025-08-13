from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Tag, Post, Comment, UserAction


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'is_admin', 'date_joined')
    list_filter = ('is_admin', 'is_staff', 'is_superuser', 'date_joined')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('额外信息', {'fields': ('is_admin', 'avatar')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'is_published', 'is_featured', 'views', 'likes', 'created_at')
    list_filter = ('category', 'tags', 'is_published', 'is_featured', 'created_at')
    search_fields = ('title', 'content')
    filter_horizontal = ('tags',)
    readonly_fields = ('views', 'likes', 'favorites', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'summary', 'content', 'cover_image', 'category', 'tags', 'author')
        }),
        ('状态', {
            'fields': ('is_published', 'is_featured')
        }),
        ('统计信息', {
            'fields': ('views', 'likes', 'favorites', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # 新增时设置作者
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'content_preview', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('content', 'user__username', 'post__title')
    readonly_fields = ('created_at',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = '评论预览'


@admin.register(UserAction)
class UserActionAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'action', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__username', 'post__title')
    readonly_fields = ('created_at',)