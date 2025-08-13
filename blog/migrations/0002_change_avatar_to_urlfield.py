# Generated manually for avatar field change

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.URLField(blank=True, null=True, verbose_name='头像URL'),
        ),
    ]