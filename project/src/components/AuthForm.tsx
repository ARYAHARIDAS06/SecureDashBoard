// 

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { createCredential, getAssertion } from '../utils/webauthn';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const [error, setError] = useState('');

  axios.defaults.withCredentials = true;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res1 = await axios.post('http://localhost:8000/api/auth/passkeys/auth/begin/', { email });
        const assertion = await getAssertion(res1.data);
        const res2 = await axios.post('http://localhost:8000/api/auth/passkeys/auth/complete/', { email, assertion });
        login(res2.data.user);
      } else {
        const res1 = await axios.post('http://localhost:8000/api/auth/passkeys/reg/begin/', { email, name });
        const cred = await createCredential(res1.data);
        const res2 = await axios.post('http://localhost:8000/api/auth/passkeys/reg/complete/', { email, credential: cred });
        login(res2.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Auth failed');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h2 className="text-xl font-bold">{isLogin ? 'Login' : 'Register'} with Passkey</h2>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full border px-3 py-2 rounded" />
        {!isLogin && (
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className="w-full border px-3 py-2 rounded" />
        )}
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white py-2 w-full rounded">{isLogin ? 'Login' : 'Register'}</button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-500 w-full text-center">
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
