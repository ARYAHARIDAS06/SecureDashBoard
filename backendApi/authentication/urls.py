from django.urls import path
from .views import (
    webauthn_register_begin,
    webauthn_register_complete,
    webauthn_login_begin,
    webauthn_login_complete
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/begin/', webauthn_register_begin, name='webauthn-register-begin'),
    path('register/complete/', webauthn_register_complete, name='webauthn-register-complete'),
    path('login/begin/', webauthn_login_begin, name='webauthn-login-begin'),
    path('login/complete/', webauthn_login_complete, name='webauthn-login-complete'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Add this line
]