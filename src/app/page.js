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
    // Safe to parse JSON
    const result = await res.json();
    console.log(result.data);
    localStorage.setItem('token', result.data);
    router.push('/pages/dashboard');
    // Handle login success (redirect or notify user)
  } else {
    // Possibly parse error message if any, else handle gracefully
    let errorMsg = 'Login failed';
    try {
      const errResp = await res.json();
      errorMsg = errResp.message || errorMsg;
    } catch {
      // JSON parse fail, fallback
    }
    // Show error message in UI
    setError(errorMsg);
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Login</button>
      {error && <div>{error}</div>}
    </form>
  );
}
