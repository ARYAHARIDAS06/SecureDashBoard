from django.contrib import admin
from .models import Contact
from call_api.models import CallLog
# Register your models here.
admin.site.register(Contact)
admin.site.register(CallLog)