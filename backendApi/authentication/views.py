from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.contrib.auth.models import AnonymousUser

from .models import User
from .services import WebAuthnService

webauthn_service = WebAuthnService()

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user (traditional registration)"""
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not email or not username:
        return Response(
            {'error': 'Email and username are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'User with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    
    # Generate token
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'user_id': str(user.id),
        'email': user.email,
        'token': token.key,
        'message': 'User registered successfully'
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webauthn_register_begin(request):
    """Begin WebAuthn registration process"""
    try:
        options = webauthn_service.generate_registration_options(request.user)
        return Response(options, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to generate registration options: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webauthn_register_complete(request):
    """Complete WebAuthn registration process"""
    credential_json = request.data.get('credential')
    
    if not credential_json:
        return Response(
            {'error': 'Credential data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = webauthn_service.verify_registration_response(
            request.user, 
            credential_json
        )
        
        if success:
            return Response(
                {'message': 'WebAuthn credential registered successfully'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Failed to verify credential'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_begin(request):
    """Begin WebAuthn authentication process"""
    email = request.data.get('email')
    user = None
    
    if email:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    try:
        options = webauthn_service.generate_authentication_options(user)
        return Response(options, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to generate authentication options: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def webauthn_login_complete(request):
    """Complete WebAuthn authentication process"""
    credential_json = request.data.get('credential')
    
    if not credential_json:
        return Response(
            {'error': 'Credential data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = webauthn_service.verify_authentication_response(credential_json)
        
        if user:
            # Generate or get token
            token, created = Token.objects.get_or_create(user=user)
            
            # Login user
            login(request, user)
            
            return Response({
                'user_id': str(user.id),
                'email': user.email,
                'token': token.key,
                'message': 'Authentication successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_credentials(request):
    """Get user's WebAuthn credentials"""
    credentials = request.user.webauthn_credentials.all()
    
    credential_data = []
    for cred in credentials:
        credential_data.append({
            'id': str(cred.id),
            'device_name': cred.device_name,
            'created_at': cred.created_at,
            'last_used': cred.last_used,
            'sign_count': cred.sign_count
        })
    
    return Response({
        'credentials': credential_data
    }, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_credential(request, credential_id):
    """Delete a WebAuthn credential"""
    try:
        credential = request.user.webauthn_credentials.get(id=credential_id)
        credential.delete()
        return Response(
            {'message': 'Credential deleted successfully'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Credential not found'},
            status=status.HTTP_404_NOT_FOUND
        )
