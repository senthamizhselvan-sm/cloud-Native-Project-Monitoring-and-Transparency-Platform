import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const resp = await api.post('/auth/login', { email, password });
      const token = resp.data.access_token;
      localStorage.setItem('access_token', token);

      // fetch profile to get role
      const profile = await api.get('/auth/profile');
      const role = profile.data.role ?? 'Citizen';
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', profile.data.full_name ?? '');

      if (role === 'Officer') navigate('/dashboard/officer');
      else if (role === 'Engineer') navigate('/dashboard/engineer');
      else navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Auth</p>
      <h2 className="mt-2 text-3xl font-bold">Login</h2>
      <p className="mt-2 text-sm text-slate-600">Sign in to access your dashboard.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" />
        <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">Sign in</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New here? <Link to="/register" className="font-semibold text-blue-700">Create an account</Link>
      </p>
    </div>
  );
}
