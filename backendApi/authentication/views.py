import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .services import WebAuthnService

User = get_user_model()
webauthn_service = WebAuthnService()

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_register_begin(request):
    try:
        email = request.data.get('email')
        print(f"Register begin - Received email: {email}")
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email.split('@')[0]}
        )
        print(f"User {'created' if created else 'retrieved'}: {user.email}")
        
        options = webauthn_service.generate_registration_options(user)
        print(f"Registration options generated: {json.dumps(options, indent=2)}")
        return Response(options)
    except Exception as e:
        print(f"Register begin error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_register_complete(request):
    try:
        email = request.data.get('email')
        credential = request.data.get('credential')
        print(f"Register complete - Received email: {email}")
        print(f"Register complete - Received credential: {json.dumps(credential, indent=2)}")
    
        if not email or not credential:
            return Response({'error': 'Email and credential required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(email=email)
        print(f"User retrieved: {user.email}")
        success = webauthn_service.verify_registration_response(request._request, user, credential)
        
        if success:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            print(f"Registration successful for user: {user.email}, refresh token: {str(refresh)}")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username
                }
            }, status=status.HTTP_201_CREATED)
        print("Registration verification failed")
        return Response({'error': 'Registration verification failed'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        print(f"User not found: {email}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Register complete error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_begin(request):
    try:
        email = request.data.get('email')
        print(f"Login begin - Received email: {email}")
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(email=email)
        print(f"User retrieved: {user.email}")
        options = webauthn_service.generate_authentication_options(user)
        print(f"Authentication options generated: {json.dumps(options, indent=2)}")
        return Response(options)
    except User.DoesNotExist:
        print(f"User not found: {email}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Login begin error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_complete(request):
    try:
        credential = request.data.get('credential')
        print(f"Login complete - Received credential: {json.dumps(credential, indent=2)}")
        if not credential:
            return Response({'error': 'Credential required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = webauthn_service.verify_authentication_response(request._request, credential)
        if user:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            print(f"Authentication successful for user: {user.email}, refresh token: {str(refresh)}")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username
                }
            })
        print("Authentication verification failed")
        return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(f"Login complete error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)