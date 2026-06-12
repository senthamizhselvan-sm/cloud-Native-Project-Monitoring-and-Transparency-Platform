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
        <div className="mb-6 px-3 flex items-center gap-2 text-blue-600">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18a9.005 9.005 0 0 0 8.716-11.253M12 3a9.005 9.005 0 0 1 8.716 11.253M12 3a9.005 9.005 0 0 0-8.716 11.253M12 3v18M3.284 14.747a9.005 9.005 0 0 0 8.716 11.253" />
          </svg>
          <span className="text-lg font-black text-slate-800 tracking-tight">Gov Monitor</span>
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
