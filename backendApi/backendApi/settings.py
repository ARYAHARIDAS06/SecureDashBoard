


from pathlib import Path
from fido2.webauthn import UserVerificationRequirement


BASE_DIR = Path(__file__).resolve().parent.parent
AUTH_USER_MODEL = 'authentication.User'
SECRET_KEY = 'django-insecure-zg29+ulxyvzrb1feax$xvv9g6pb#n^39f8l*x@-egj*sf55(o4'
DEBUG = True

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '54ea-103-154-37-6.ngrok-free.app',  # optional ngrok URL
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Your apps
    'call_api',
    'contacts',

    # Third-party apps
    'rest_framework',
    'corsheaders',
   'authentication','passkeys',
   'rest_framework.authtoken'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backendApi.urls'
# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backendApi.wsgi.application'


WEBAUTHN_RP_ID = "localhost"
WEBAUTHN_RP_NAME = "Secure DashBoard"
WEBAUTHN_ORIGIN = "http://localhost:5173"  # Change to your origin in production
# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'SecureDashBoard',
        'USER': 'postgres',
        'PASSWORD': '1234',
        'HOST': 'localhost',
         'PORT': '5434'
    }
}

# # Password validation
# AUTH_PASSWORD_VALIDATORS = [
#     {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
# ]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'authentication.User'
# CORS settings for React frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174", 
     "http://localhost:5173",  # React dev server
    "https://54ea-103-154-37-6.ngrok-free.app",  # Optional ngrok
]
CORS_ALLOW_CREDENTIALS = True




# Security settings for production
# SECURE_SSL_REDIRECT = False  # Set to True in production with HTTPS
# SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
# CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS


# # WebAuthn (passkey) config
# AUTHENTICATION_BACKENDS = [
#     'passkeys.backend.PasskeyModelBackend',
# ]

# FIDO_SERVER_ID = "localhost"  # or your custom domain
# FIDO_SERVER_NAME = "SecureDashBoard"

# Optional WebAuthn key attachment (platform = fingerprint/FaceID, cross-platform = USB key)
#KEY_ATTACHMENT = passkeys.Attachment.PLATFORM
