'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const result = await res.json();
      localStorage.setItem('token', result.data);
      router.push('/pages/dashboard');
    } else {
      let errorMsg = 'Login failed';
      try {
        const errResp = await res.json();
        errorMsg = errResp.message || errorMsg;
      } catch {}
      setError(errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Sign in to your account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
            <input 
              value={username}
              onChange={e => setUsername(e.target.value)}
              type="text"
              placeholder="Enter your username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <input 
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
          {error && (
            <div className="mt-2 text-red-600 text-sm text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
