import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [district, setDistrict] = useState('Chennai');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // basic client-side validation to avoid 422
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await api.post('/auth/register', { full_name: fullName, email, password, role, district });
      navigate('/register/success');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg ?? JSON.stringify(d)).join('; '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Registration failed');
      }
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Auth</p>
      <h2 className="mt-2 text-3xl font-bold">Register</h2>
      <p className="mt-2 text-sm text-slate-600">Create citizen, engineer, contractor, officer, or admin accounts.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name *</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Full name" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email *</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password *</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Role *</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
            <option>Citizen</option>
            <option>Engineer</option>
            <option>Contractor</option>
            <option>Officer</option>
            <option>Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">District *</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
            {TAMIL_NADU_DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">Create account</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-semibold text-blue-700">Go back to login</Link>
      </p>
    </div>
  );
}
