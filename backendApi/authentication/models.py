from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    """Extended User model for WebAuthn"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class WebAuthnCredential(models.Model):
    """Model to store WebAuthn credentials"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='webauthn_credentials')
    credential_id = models.TextField(unique=True)  # Base64 encoded credential ID
    public_key = models.TextField()  # Base64 encoded public key
    sign_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    device_name = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'webauthn_credentials'
        verbose_name = 'WebAuthn Credential'
        verbose_name_plural = 'WebAuthn Credentials'
    
    def __str__(self):
        return f"{self.user.email} - {self.device_name or 'Unknown Device'}"

class WebAuthnChallenge(models.Model):
    """Model to store temporary challenges for WebAuthn"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    challenge = models.TextField()  # Base64 encoded challenge
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    challenge_type = models.CharField(max_length=20, choices=[
        ('registration', 'Registration'),
        ('authentication', 'Authentication'),
    ])
    
    class Meta:
        db_table = 'webauthn_challenges'
        verbose_name = 'WebAuthn Challenge'
        verbose_name_plural = 'WebAuthn Challenges'