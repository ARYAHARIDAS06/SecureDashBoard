from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
AUTH_USER_MODEL = 'authentication.User'
SECRET_KEY = 'django-insecure-zg29+ulxyvzrb1feax$xvv9g6pb#n^39f8l*x@-egj*sf55(o4'
DEBUG = True

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    'a26395bc65e8.ngrok-free.app',  # Removed extra space
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'call_api',
    'contacts',
    'rest_framework',
    'corsheaders',
    'authentication',
    'passkeys',
    'rest_framework_simplejwt',  # Added for JWT
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

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY':'hfds#$S@345^fhdshhg&*^$#^e7df',
    'AUTH_HEADER_TYPES': ('Bearer',),
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

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

WEBAUTHN_RP_ID = "localhost"
WEBAUTHN_RP_NAME = "Secure DashBoard"
WEBAUTHN_ORIGIN = "http://localhost:5173"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    "https://a26395bc65e8.ngrok-free.app",
]
CORS_ALLOW_CREDENTIALS = True