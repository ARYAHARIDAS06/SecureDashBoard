# """
# URL configuration for backendApi project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/4.2/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from contacts.views import ContactViewSet
from call_api.views import make_call
from call_api.views import call_logs
from call_api.views import end_call,call_status
from call_api.views import incoming_call,get_twilio_token,outbound_call_twiml
from rest_framework.authtoken.views import obtain_auth_token
#from authentication.views import RegisterView, LoginView, UserView
router = DefaultRouter()
router.register(r'contacts', ContactViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('authentication.urls')),

#path('api/auth/passkeys/', include(('passkeys.urls','passkeys'), namespace='passkeys')),
     path('api/call/', make_call),
    path('api/calls/', call_logs),
    path('api/end_call/', end_call),
    path('api/call/status/', call_status),
    path('api/incoming/', incoming_call),
    path('api/ge/', get_twilio_token),
    path('api/voice/', outbound_call_twiml),
     path('api/auth/passkeys/', include(('passkeys.urls', 'passkeys'), namespace='passkeys')),


]

