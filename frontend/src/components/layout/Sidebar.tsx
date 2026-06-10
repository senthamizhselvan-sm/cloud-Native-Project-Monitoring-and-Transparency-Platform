import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    navigate('/login');
  }

  const getNavItems = () => {
    switch (role) {
      case 'Officer':
        return [
          { to: '/dashboard/officer', label: 'Dashboard' },
          { to: '/projects', label: 'Projects' },
          { to: '/feedback/manage', label: 'Complaints Box' },
          { to: '/analytics', label: 'Analytics' },
        ];
      case 'Engineer':
        return [
          { to: '/dashboard/engineer', label: 'My Dashboard' },
          { to: '/projects', label: 'All Projects' },
        ];
      case 'Admin':
        return [
          { to: '/admin', label: 'Admin Panel' },
          { to: '/admin/audit', label: 'Audit Logs' },
          { to: '/projects', label: 'Projects' },
          { to: '/feedback/manage', label: 'Complaints Box' },
          { to: '/analytics', label: 'Analytics' },
        ];
      default:
        return [
          { to: '/', label: 'Home Portal' },
          { to: '/projects', label: 'Projects' },
        ];
    }
  };

  const items = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 px-4 py-6 fixed inset-y-0 left-0 flex flex-col justify-between">
      <div>
        <div className="mb-6 text-lg font-bold text-blue-800 flex items-center gap-2">
          <span>🏛️</span>
          <span>Gov Monitor</span>
        </div>
        <nav className="space-y-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm font-semibold transition"
        >
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
