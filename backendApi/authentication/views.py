import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .services import WebAuthnService

User = get_user_model()
webauthn_service = WebAuthnService()

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_register_begin(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email.split('@')[0]}
        )
        
        options = webauthn_service.generate_registration_options(user)
        return Response(options)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_register_complete(request):
    try:
        email = request.data.get('email')
        credential = request.data.get('credential')
        
        if not email or not credential:
            return Response({'error': 'Email and credential required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(email=email)
        success = webauthn_service.verify_registration_response(request._request, user, credential)
        
        if success:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_201_CREATED)
        return Response({'error': 'Registration verification failed'}, 
                       status=status.HTTP_400_BAD_REQUEST)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_begin(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(email=email)
        options = webauthn_service.generate_authentication_options(user)
        return Response(options)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_complete(request):
    try:
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'Credential required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = webauthn_service.verify_authentication_response(request._request, credential)
        if user:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            })
        return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)