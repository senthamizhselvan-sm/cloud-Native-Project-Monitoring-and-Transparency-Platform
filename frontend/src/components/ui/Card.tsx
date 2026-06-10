import React from 'react';

export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 ${className}`}>
      {children}
    </div>
  );
}
