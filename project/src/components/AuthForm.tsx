import React, { useState } from 'react';
import { Shield, User, Mail, AlertCircle } from 'lucide-react';
import { isWebAuthnSupported, createCredential, getAssertion, bufferToBase64, base64ToBuffer } from '../utils/webauthn';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  axios.defaults.withCredentials = true; // Include session cookies

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    try {
      const optionsRes = await axios.post('http://localhost:8000/api/auth/passkeys/reg/begin/', { email, name });
      const cred = await createCredential(optionsRes.data);
      const response = await axios.post('http://localhost:8000/api/auth/passkeys/reg/complete/', {
        email,
        credential: cred
      });
      login(response.data.user);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const optionsRes = await axios.post('http://localhost:8000/api/auth/passkeys/auth/begin', { email });
      const assertion = await getAssertion(optionsRes.data);
      const response = await axios.post('http://localhost:8000/api/auth/passkeys/auth/complete', {
        email,
        assertion
      });
      login(response.data.user);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isLogin && !name)) {
      setError('Please fill all fields');
      return;
    }
    return isLogin ? handleLogin() : handleRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {!isLogin && (
            <div>
              <label>Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          )}
          {error && (
            <div className="text-red-600 flex items-center space-x-2">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-blue-500 hover:underline mt-4 block w-full text-center"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
