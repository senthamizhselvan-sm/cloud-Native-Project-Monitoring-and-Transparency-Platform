import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/register', { full_name: fullName, email, password, role });
      navigate('/login');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Auth</p>
      <h2 className="mt-2 text-3xl font-bold">Register</h2>
      <p className="mt-2 text-sm text-slate-600">Create citizen, engineer, contractor, officer, or admin accounts.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Full name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
          <option>Citizen</option>
          <option>Engineer</option>
          <option>Contractor</option>
          <option>Officer</option>
          <option>Admin</option>
        </select>
        <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">Create account</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-semibold text-blue-700">Go back to login</Link>
      </p>
    </div>
  );
}
