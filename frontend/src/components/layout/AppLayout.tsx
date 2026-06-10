import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <TopNav />
        <main className="pt-20 px-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
