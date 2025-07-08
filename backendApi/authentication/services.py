import base64
from datetime import timedelta
from django.conf import settings
import json  
from django.utils import timezone
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
)
from .models import WebAuthnCredential, WebAuthnChallenge

class WebAuthnService:
    def __init__(self):
        self.rp_id = settings.WEBAUTHN_RP_ID
        self.rp_name = settings.WEBAUTHN_RP_NAME
        self.origin = settings.WEBAUTHN_ORIGIN

    def _store_challenge(self, user, challenge: bytes, challenge_type: str):
        return WebAuthnChallenge.objects.create(
            user=user,
            challenge=base64.urlsafe_b64encode(challenge).decode('ascii').rstrip('='),
            challenge_type=challenge_type,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

    def _get_current_challenge(self, user, challenge_type: str):
        challenge_obj = WebAuthnChallenge.objects.filter(
            user=user,
            challenge_type=challenge_type,
            expires_at__gt=timezone.now()
        ).first()
        
        if not challenge_obj:
            return None
            
        # Padding fix for base64 decoding
        padding = '=' * (-len(challenge_obj.challenge) % 4)
        return base64.urlsafe_b64decode(challenge_obj.challenge + padding)

    def generate_registration_options(self, user):
        user_id_bytes = str(user.id).encode("utf-8")

        options = generate_registration_options(
            rp_id=self.rp_id,
            rp_name=self.rp_name,
            user_id=user_id_bytes,
            user_name=user.email,
            user_display_name=user.get_full_name() or user.email,
            authenticator_selection=AuthenticatorSelectionCriteria(
                authenticator_attachment="platform",
                user_verification=UserVerificationRequirement.REQUIRED
            )
        )

        self._store_challenge(user, options.challenge, "registration")
        
        return {
            "rp": {"id": self.rp_id, "name": self.rp_name},
            "user": {
                "id": base64.urlsafe_b64encode(user_id_bytes).decode("utf-8").rstrip("="),
                "name": user.email,
                "displayName": user.get_full_name() or user.email
            },
            "challenge": base64.urlsafe_b64encode(options.challenge).decode('ascii').rstrip('='),
            "pubKeyCredParams": [
                {"type": "public-key", "alg": -7},
                {"type": "public-key", "alg": -257}
            ],
            "authenticatorSelection": {
                "authenticatorAttachment": "platform",
                "userVerification": "required"
            },
            "timeout": 60000,
            "attestation": "none"
        }

    def verify_registration_response(self, request, user, credential: dict):
        try:
            challenge = self._get_current_challenge(user, "registration")
            if not challenge:
                print("No valid registration challenge found")
                return False

            verification = verify_registration_response(
                credential=RegistrationCredential.parse_raw(json.dumps({
                    'id': credential['id'],
                    'rawId': credential['rawId'],
                    'response': {
                        'attestationObject': credential['response']['attestationObject'],
                        'clientDataJSON': credential['response']['clientDataJSON']
                    },
                    'type': credential['type']
                })),
                expected_challenge=challenge,
                expected_origin=self.origin,
                expected_rp_id=self.rp_id,
                require_user_verification=True
            )

            if verification.verified:
                WebAuthnCredential.objects.create(
                    user=user,
                    credential_id=credential['id'],
                    public_key=base64.urlsafe_b64encode(verification.credential_public_key).decode('ascii').rstrip('='),
                    sign_count=verification.sign_count,
                    device_name="Primary Device"
                )
                WebAuthnChallenge.objects.filter(
                    user=user,
                    challenge_type="registration"
                ).delete()
                return True

            return False
        except Exception as e:
            print(f"Registration verification failed: {str(e)}")
            return False

    def generate_authentication_options(self, user):
        credentials = [
            {"id": cred.credential_id, "type": "public-key"}
            for cred in user.webauthn_credentials.all()
        ]

        options = generate_authentication_options(
            rp_id=self.rp_id,
            allow_credentials=credentials,
            user_verification=UserVerificationRequirement.REQUIRED
        )

        self._store_challenge(user, options.challenge, "authentication")
        
        return {
            "challenge": base64.urlsafe_b64encode(options.challenge).decode('ascii').rstrip('='),
            "rpId": self.rp_id,
            "allowCredentials": credentials,
            "userVerification": "required",
            "timeout": 60000
        }

    def verify_authentication_response(self, request, credential: dict):
        try:
            stored_cred = WebAuthnCredential.objects.filter(
                credential_id=credential['id']
            ).select_related('user').first()
            
            if not stored_cred:
                print(f"Credential not found: {credential['id']}")
                return None

            challenge = self._get_current_challenge(stored_cred.user, "authentication")
            if not challenge:
                print("No valid authentication challenge found")
                return None

            verification = verify_authentication_response(
                credential=AuthenticationCredential.parse_raw(json.dumps({
                    'id': credential['id'],
                    'rawId': credential['rawId'],
                    'response': {
                        'authenticatorData': credential['response']['authenticatorData'],
                        'clientDataJSON': credential['response']['clientDataJSON'],
                        'signature': credential['response']['signature'],
                        'userHandle': credential['response'].get('userHandle')
                    },
                    'type': credential['type']
                })),
                expected_challenge=challenge,
                expected_origin=self.origin,
                expected_rp_id=self.rp_id,
                credential_public_key=base64.urlsafe_b64decode(stored_cred.public_key + '==='),
                credential_current_sign_count=stored_cred.sign_count,
                require_user_verification=True
            )

            if verification.verified:
                stored_cred.sign_count = verification.new_sign_count
                stored_cred.last_used = timezone.now()
                stored_cred.save()

                WebAuthnChallenge.objects.filter(
                    user=stored_cred.user,
                    challenge_type="authentication"
                ).delete()

                return stored_cred.user

            return None
        except Exception as e:
            print(f"Authentication verification failed: {str(e)}")
            return None