# Generated manually for VIP features

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_change_cover_image_to_urlfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_vip',
            field=models.BooleanField(default=False, verbose_name='是否VIP用户'),
        ),
        migrations.AddField(
            model_name='user',
            name='vip_expire_date',
            field=models.DateTimeField(blank=True, null=True, verbose_name='VIP过期时间'),
        ),
        migrations.AddField(
            model_name='post',
            name='is_vip_only',
            field=models.BooleanField(default=False, verbose_name='是否VIP文章'),
        ),
    ]