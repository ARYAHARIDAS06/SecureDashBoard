import base64
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from webauthn import generate_registration_options, verify_registration_response
from webauthn import generate_authentication_options, verify_authentication_response
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from django.conf import settings
from django.utils import timezone

from .models import User, WebAuthnCredential, WebAuthnChallenge

class WebAuthnService:
    """Service class for WebAuthn operations"""
    
    def __init__(self):
        self.rp_id = settings.WEBAUTHN_RP_ID
        self.rp_name = settings.WEBAUTHN_RP_NAME
        self.origin = settings.WEBAUTHN_ORIGIN
    
    def generate_registration_options(self, user: User) -> Dict[str, Any]:
        """Generate options for WebAuthn registration"""
        
        # Get existing credentials to exclude them
        existing_credentials = [
            {"id": cred.credential_id, "type": "public-key"}
            for cred in user.webauthn_credentials.all()
        ]
        
        options = generate_registration_options(
            rp_id=self.rp_id,
            rp_name=self.rp_name,
            user_id=str(user.id).encode(),
            user_name=user.email,
            user_display_name=user.get_full_name() or user.email,
            exclude_credentials=existing_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
        )
        
        # Store challenge
        challenge = WebAuthnChallenge.objects.create(
            user=user,
            challenge=base64.urlsafe_b64encode(options.challenge).decode(),
            expires_at=timezone.now() + timedelta(minutes=5),
            challenge_type='registration'
        )
        
        return {
            "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
            "rp": {"id": options.rp.id, "name": options.rp.name},
            "user": {
                "id": base64.urlsafe_b64encode(options.user.id).decode(),
                "name": options.user.name,
                "displayName": options.user.display_name,
            },
            "pubKeyCredParams": [
                {"alg": param.alg, "type": param.type} for param in options.pub_key_cred_params
            ],
            "authenticatorSelection": {
                "userVerification": options.authenticator_selection.user_verification,
            },
            "timeout": options.timeout,
            "excludeCredentials": [
                {
                    "id": base64.urlsafe_b64encode(cred.id).decode(),
                    "type": cred.type,
                }
                for cred in options.exclude_credentials
            ],
        }
    
    def verify_registration_response(self, user: User, credential_json: str) -> bool:
        """Verify WebAuthn registration response"""
        
        try:
            credential_data = json.loads(credential_json)
            
            # Get the challenge
            challenge_record = WebAuthnChallenge.objects.filter(
                user=user,
                challenge_type='registration',
                expires_at__gt=timezone.now()
            ).first()
            
            if not challenge_record:
                return False
            
            challenge = base64.urlsafe_b64decode(challenge_record.challenge)
            
            # Create RegistrationCredential object
            credential = RegistrationCredential.parse_raw(credential_json)
            
            # Verify the registration
            verification = verify_registration_response(
                credential=credential,
                expected_challenge=challenge,
                expected_origin=self.origin,
                expected_rp_id=self.rp_id,
            )
            
            if verification.verified:
                # Save the credential
                WebAuthnCredential.objects.create(
                    user=user,
                    credential_id=base64.urlsafe_b64encode(verification.credential_id).decode(),
                    public_key=base64.urlsafe_b64encode(verification.credential_public_key).decode(),
                    sign_count=verification.sign_count,
                    device_name=credential_data.get('deviceName', 'Unknown Device')
                )
                
                # Clean up the challenge
                challenge_record.delete()
                
                return True
            
            return False
            
        except Exception as e:
            print(f"Registration verification error: {e}")
            return False
    
    def generate_authentication_options(self, user: Optional[User] = None) -> Dict[str, Any]:
        """Generate options for WebAuthn authentication"""
        
        # Get allowed credentials
        allowed_credentials = []
        if user:
            allowed_credentials = [
                {"id": cred.credential_id, "type": "public-key"}
                for cred in user.webauthn_credentials.all()
            ]
        
        options = generate_authentication_options(
            rp_id=self.rp_id,
            allow_credentials=allowed_credentials,
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        
        # Store challenge
        challenge = WebAuthnChallenge.objects.create(
            user=user,
            challenge=base64.urlsafe_b64encode(options.challenge).decode(),
            expires_at=timezone.now() + timedelta(minutes=5),
            challenge_type='authentication'
        )
        
        return {
            "challenge": base64.urlsafe_b64encode(options.challenge).decode(),
            "timeout": options.timeout,
            "rpId": options.rp_id,
            "allowCredentials": [
                {
                    "id": base64.urlsafe_b64encode(cred.id).decode(),
                    "type": cred.type,
                }
                for cred in options.allow_credentials
            ],
            "userVerification": options.user_verification,
        }
    
    def verify_authentication_response(self, credential_json: str) -> Optional[User]:
        """Verify WebAuthn authentication response"""
        
        try:
            credential_data = json.loads(credential_json)
            
            # Create AuthenticationCredential object
            credential = AuthenticationCredential.parse_raw(credential_json)
            
            # Find the credential in database
            credential_id = base64.urlsafe_b64encode(credential.raw_id).decode()
            webauthn_credential = WebAuthnCredential.objects.filter(
                credential_id=credential_id
            ).first()
            
            if not webauthn_credential:
                return None
            
            # Get the challenge
            challenge_record = WebAuthnChallenge.objects.filter(
                user=webauthn_credential.user,
                challenge_type='authentication',
                expires_at__gt=timezone.now()
            ).first()
            
            if not challenge_record:
                return None
            
            challenge = base64.urlsafe_b64decode(challenge_record.challenge)
            
            # Verify the authentication
            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=challenge,
                expected_origin=self.origin,
                expected_rp_id=self.rp_id,
                credential_public_key=base64.urlsafe_b64decode(webauthn_credential.public_key),
                credential_current_sign_count=webauthn_credential.sign_count,
            )
            
            if verification.verified:
                # Update credential sign count and last used
                webauthn_credential.sign_count = verification.new_sign_count
                webauthn_credential.last_used = timezone.now()
                webauthn_credential.save()
                
                # Clean up the challenge
                challenge_record.delete()
                
                return webauthn_credential.user
            
            return None
            
        except Exception as e:
            print(f"Authentication verification error: {e}")
            return None
