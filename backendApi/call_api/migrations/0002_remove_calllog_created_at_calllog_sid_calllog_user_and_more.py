# Generated by Django 5.2.4 on 2025-07-10 18:54

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('call_api', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='calllog',
            name='created_at',
        ),
        migrations.AddField(
            model_name='calllog',
            name='sid',
            field=models.CharField(blank=True, max_length=34, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='calllog',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='direction',
            field=models.CharField(choices=[('incoming', 'Incoming'), ('outgoing', 'Outgoing')], max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='duration',
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='from_number',
            field=models.CharField(max_length=15, null=True),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='start_time',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='status',
            field=models.CharField(max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='calllog',
            name='to_number',
            field=models.CharField(max_length=15, null=True),
        ),
    ]
