# Generated manually for cover_image field change

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0002_change_avatar_to_urlfield'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='cover_image',
            field=models.URLField(blank=True, null=True, verbose_name='封面图片URL'),
        ),
    ]