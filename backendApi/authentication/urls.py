from django.urls import path
from . import views

urlpatterns = [
    # Traditional registration
    path('register/', views.register_user, name='register_user'),
    
    # WebAuthn registration
    path('webauthn/register/begin/', views.webauthn_register_begin, name='webauthn_register_begin'),
    path('webauthn/register/complete/', views.webauthn_register_complete, name='webauthn_register_complete'),
    
    # WebAuthn authentication
    path('webauthn/login/begin/', views.webauthn_login_begin, name='webauthn_login_begin'),
    path('webauthn/login/complete/', views.webauthn_login_complete, name='webauthn_login_complete'),
    
    # Credential management
    path('webauthn/credentials/', views.user_credentials, name='user_credentials'),
    path('webauthn/credentials/<uuid:credential_id>/', views.delete_credential, name='delete_credential'),
]