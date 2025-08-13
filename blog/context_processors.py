from django.db.models import Count, Q
from .models import Category


def site_categories(request):
    """为所有模板提供网站分类数据"""
    categories = Category.objects.annotate(
        post_count=Count('post', filter=Q(post__is_published=True))
    ).filter(post_count__gt=0).order_by('name')[:8]  # 最多显示8个分类
    
    return {
        'site_categories': categories,
    }