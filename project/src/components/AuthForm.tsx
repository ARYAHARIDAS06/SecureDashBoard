import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/axios'; // Update the path if necessary
import { useNavigate, useLocation } from 'react-router-dom';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkWebAuthnSupport = () => {
      const isSupported = 
        window.PublicKeyCredential && 
        typeof window.PublicKeyCredential === 'function' &&
        navigator.credentials && 
        navigator.credentials.create;
      setIsWebAuthnAvailable(!!isSupported);
    };
    checkWebAuthnSupport();
  }, []);

  const bufferToBase64URL = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const base64URLToBuffer = (base64URL: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64URL.length % 4)) % 4);
    const base64 = (base64URL + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleWebAuthnRegistration = async () => {
    try {
      setIsLoading(true);
      setError('');

      // 1. Get registration options from server
      const optionsResponse = await axios.post(
        'http://localhost:8000/api/auth/passkeys/register/begin/', 
        { email }
      );
      console.log('Registration options from server:', optionsResponse.data);

      // 2. Prepare public key options for browser
      const publicKey = {
        ...optionsResponse.data,
        challenge: base64URLToBuffer(optionsResponse.data.challenge),
        user: {
          ...optionsResponse.data.user,
          id: base64URLToBuffer(optionsResponse.data.user.id),
        },
        excludeCredentials: []
      };
      console.log('Public key options for navigator.credentials.create:', publicKey);

      // 3. Create credential using browser WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("No credential received from authenticator");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // 4. Prepare registration data for server verification
      const registrationData = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: bufferToBase64URL(response.attestationObject),
          clientDataJSON: bufferToBase64URL(response.clientDataJSON)
        }
      };
      console.log('Registration data sent to server:', registrationData);

      // 5. Send to server for verification
      const completeResponse = await axios.post(
        'http://localhost:8000/api/auth/passkeys/register/complete/',
        { 
          email,
          credential: registrationData 
        }
      );
      console.log('Server response for registration complete:', completeResponse.data);

      if (completeResponse.data?.token) {
        login({ ...completeResponse.data.user, token: completeResponse.data.token }); // Pass user and token
        navigate('/login'); // Redirect to login after successful registration
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      console.log('Error details:', {
        message: err.message,
        name: err.name,
        code: err.code,
        response: err.response?.data,
        request: err.request
      });
      let errorMessage = "Registration failed";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Registration cancelled by user";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebAuthnLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const optionsResponse = await axios.post(
        'http://localhost:8000/api/auth/passkeys/login/begin/',
        { email }
      );
      console.log('Authentication options from server:', optionsResponse.data);
      
      const options = optionsResponse.data;

      const publicKey = {
        challenge: base64URLToBuffer(options.challenge),
        rpId: options.rpId,
        allowCredentials: options.allowCredentials.map((cred: any) => ({
          id: base64URLToBuffer(cred.id),
          type: 'public-key'
        })),
        userVerification: 'required'
      };
      console.log('Public key options for navigator.credentials.get:', publicKey);

      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) {
        throw new Error("No credential received from authenticator");
      }

      const assertion = credential as PublicKeyCredential;
      const response = assertion.response as AuthenticatorAssertionResponse;
      
      const assertionData = {
        id: assertion.id,
        rawId: bufferToBase64URL(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferToBase64URL(response.authenticatorData),
          clientDataJSON: bufferToBase64URL(response.clientDataJSON),
          signature: bufferToBase64URL(response.signature),
          userHandle: response.userHandle 
            ? bufferToBase64URL(response.userHandle)
            : undefined
        }
      };
      console.log('Authentication data sent to server:', assertionData);

      const verifyResponse = await axios.post(
        'http://localhost:8000/api/auth/passkeys/login/complete/',
        { credential: assertionData }
      );
      console.log('Server response for authentication complete:', verifyResponse.data);

      if (verifyResponse.data?.token) {
        login({ ...verifyResponse.data.user, token: verifyResponse.data.token }); // Pass user and token
        navigate('/'); // Redirect to dashboard after successful login
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      console.log('Error details:', {
        message: err.message,
        name: err.name,
        code: err.code,
        response: err.response?.data,
        request: err.request
      });
      let errorMessage = "Authentication failed";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Authentication cancelled by user";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!isLogin && !name) {
      setError("Name is required");
      return;
    }

    try {
      if (isLogin) {
        await handleWebAuthnLogin();
      } else {
        await handleWebAuthnRegistration();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h2 className="text-xl font-bold">
          {isLogin ? 'Login' : 'Register'} with {isWebAuthnAvailable ? 'Passkey' : 'Password'}
        </h2>

        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border px-3 py-2 rounded"
            disabled={isLoading}
          />

          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full border px-3 py-2 rounded"
              disabled={isLoading}
            />
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 w-full rounded hover:bg-blue-700 transition flex items-center justify-center"
            disabled={isLoading || !isWebAuthnAvailable}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Signing in...' : 'Registering...'}
              </>
            ) : (
              isLogin ? 'Sign in' : 'Register'
            )}
          </button>

          {!isWebAuthnAvailable && (
            <div className="text-sm text-yellow-600">
              <p>For passkey support, use Chrome, Edge or Safari on a supported device</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              navigate(isLogin ? '/register' : '/login');
            }}
            className="text-blue-500 w-full text-center text-sm hover:underline"
            disabled={isLoading}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;