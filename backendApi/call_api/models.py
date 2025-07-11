from django.db import models
from django.conf import settings

class CallLog(models.Model):
    sid = models.CharField(max_length=34, unique=True, null=True, blank=True)  # Twilio call SID
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    from_number = models.CharField(max_length=15, null=True)
    to_number = models.CharField(max_length=15, null=True)
    status = models.CharField(max_length=20, null=True)
    start_time = models.DateTimeField(null=True)
    duration = models.IntegerField(null=True)
    direction = models.CharField(max_length=20, choices=[('incoming', 'Incoming'), ('outgoing', 'Outgoing')], null=True)

    def __str__(self):
        return f"{self.direction} call from {self.from_number} to {self.to_number}"