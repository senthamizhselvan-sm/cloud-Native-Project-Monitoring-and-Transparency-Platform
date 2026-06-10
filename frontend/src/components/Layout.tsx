import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [role, setRole] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setLoggedIn(!!token);
    setRole(localStorage.getItem('user_role'));
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setLoggedIn(false);
    setRole(null);
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
              Public Project Transparency
            </p>
            <h1 className="text-xl font-bold">Government Monitoring Platform</h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <Link to="/" className="transition hover:text-slate-900">Dashboard</Link>
            <Link to="/projects" className="transition hover:text-slate-900">Projects</Link>
            <Link to="/public" className="transition hover:text-slate-900">Transparency Portal</Link>
            <Link to="/map" className="transition hover:text-slate-900">GIS Map</Link>
            {loggedIn ? (
              <>
                {role === 'Officer' && <Link to="/dashboard/officer" className="transition hover:text-slate-900">Officer Panel</Link>}
                {role === 'Engineer' && <Link to="/dashboard/engineer" className="transition hover:text-slate-900">Engineer Panel</Link>}
                {role === 'Citizen' && <Link to="/dashboard/citizen" className="transition hover:text-slate-900">Citizen Dashboard</Link>}
                <button onClick={handleLogout} className="ml-2 text-sm text-red-600">Logout</button>
              </>
            ) : (
              <Link to="/login" className="transition hover:text-slate-900">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
