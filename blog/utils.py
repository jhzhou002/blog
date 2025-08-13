"""
Utility functions for blog app
"""
import os
import uuid
from django.conf import settings
from qiniu import Auth, put_file, etag
import qiniu.config


def upload_to_qiniu(file_path, file_name=None):
    """
    上传文件到七牛云
    """
    if not file_name:
        file_name = str(uuid.uuid4()) + os.path.splitext(file_path)[1]
    
    # 构造上传凭证
    q = Auth(settings.QINIU_ACCESS_KEY, settings.QINIU_SECRET_KEY)
    
    # 上传到七牛后的文件名
    key = f'blog-yk/images/{file_name}'
    
    # 生成上传Token
    token = q.upload_token(settings.QINIU_BUCKET_NAME, key)
    
    # 要上传文件的本地路径
    ret, info = put_file(token, key, file_path)
    
    if info.status_code == 200:
        # 返回文件的访问URL
        return f"http://{settings.QINIU_BUCKET_DOMAIN}/{key}"
    else:
        return None


def upload_avatar_to_qiniu(file_path, user_id):
    """
    上传头像到七牛云
    """
    file_name = f"user_{user_id}_{uuid.uuid4().hex[:8]}.jpg"
    
    # 构造上传凭证
    q = Auth(settings.QINIU_ACCESS_KEY, settings.QINIU_SECRET_KEY)
    
    # 上传到七牛后的文件名
    key = f'blog-yk/avatar/{file_name}'
    
    # 生成上传Token
    token = q.upload_token(settings.QINIU_BUCKET_NAME, key)
    
    # 要上传文件的本地路径
    ret, info = put_file(token, key, file_path)
    
    if info.status_code == 200:
        # 返回文件的访问URL
        return f"http://{settings.QINIU_BUCKET_DOMAIN}/{key}"
    else:
        return None


def generate_filename(instance, filename):
    """
    生成唯一的文件名
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return filename


def post_image_path(instance, filename):
    """
    文章图片上传路径
    """
    filename = generate_filename(instance, filename)
    return f"posts/{filename}"


def avatar_image_path(instance, filename):
    """
    头像上传路径
    """
    filename = generate_filename(instance, filename)
    return f"avatars/{filename}"


def truncate_string(string, length=100):
    """
    截取字符串
    """
    if len(string) <= length:
        return string
    return string[:length] + "..."


def get_client_ip(request):
    """
    获取客户端IP地址
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip