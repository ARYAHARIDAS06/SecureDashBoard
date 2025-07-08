from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from contacts.views import ContactViewSet
from call_api.views import make_call, call_logs, end_call, call_status, incoming_call, get_twilio_token, outbound_call_twiml

router = DefaultRouter()
router.register(r'contacts', ContactViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/passkeys/', include('authentication.urls')),
    path('api/call/', make_call),
    path('api/calls/', call_logs),
    path('api/end_call/', end_call),
    path('api/call/status/', call_status),
    path('api/incoming/', incoming_call),
    path('api/ge/', get_twilio_token),
    path('api/voice/', outbound_call_twiml),
]