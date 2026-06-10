import React from 'react';

type Variant = 'success' | 'info' | 'warning' | 'danger';

const classes: Record<Variant, string> = {
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

export default function Badge({ variant = 'info', children }: { variant?: Variant; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes[variant]}`}>{children}</span>;
}
