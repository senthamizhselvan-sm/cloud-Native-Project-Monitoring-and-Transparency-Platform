import React from 'react';
import { shadows } from '../tokens/shadows';

// Generic layout card
export function Card({ 
  children, 
  className = '', 
  variant = 'soft' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'soft' | 'medium' | 'premium' 
}) {
  const shadowClass = shadows[variant] || shadows.soft;
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 ${shadowClass} ${className}`}>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  details,
  icon,
  borderAccent = 'border-blue-600',
  className = '',
  children
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  details?: string;
  icon?: React.ReactNode;
  borderAccent?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card variant="soft" className={`border-t-4 ${borderAccent} flex flex-col justify-between h-32 hover:translate-y-[-2px] transition duration-350 ${className}`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2 flex flex-col">
        <span className="text-2xl font-black text-slate-900 leading-none">{value}</span>
        {children ? children : (
          trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`text-[10px] font-bold ${
                trendDirection === 'up' ? 'text-emerald-600' :
                trendDirection === 'down' ? 'text-rose-600' :
                'text-slate-500'
              }`}>
                {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '•'} {trend}
              </span>
              {details && <span className="text-[9px] text-slate-400 font-medium">{details}</span>}
            </div>
          )
        )}
      </div>
    </Card>
  );
}

// AI recommendations or telemetry card with soft colors
export function InsightCard({
  title,
  subtitle,
  children,
  icon,
  className = ''
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="premium" className={`bg-blue-50/20 border-blue-100 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">{title}</h3>
        </div>
        {subtitle && <span className="text-[10px] text-slate-400 font-bold">{subtitle}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

// Project summaries list cards
export function ProjectCard({
  name,
  location,
  department,
  budget,
  completion,
  riskLevel = 'Low',
  complaintsCount = 0,
  imageUrl,
  onClickView,
  className = ''
}: {
  name: string;
  location: string;
  department: string;
  budget: string;
  completion: number;
  riskLevel?: string;
  complaintsCount?: number;
  imageUrl?: string;
  onClickView?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-300 flex flex-col justify-between overflow-hidden ${className}`}>
      {imageUrl && (
        <div className="h-32 w-full overflow-hidden bg-slate-100 border-b border-slate-200/50">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-3">
            <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">{name}</h4>
            <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border shrink-0 ${
              riskLevel === 'High' ? 'bg-red-500/10 text-red-700 border-red-200' :
              riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
              'bg-emerald-500/10 text-emerald-700 border-emerald-200'
            }`}>
              Risk: {riskLevel}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {department} • {location}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-bold">Physical Progress</span>
            <span className="font-black text-slate-700">{completion}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${completion}%` }} />
          </div>

          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-50">
            <div className="space-y-0.5">
              <span className="block text-[8px] font-semibold text-slate-400 uppercase">Budget Allocation</span>
              <span className="font-extrabold text-slate-700">{budget}</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="block text-[8px] font-semibold text-slate-400 uppercase">Complaints</span>
              <span className={`font-extrabold ${complaintsCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{complaintsCount} open</span>
            </div>
          </div>

          {onClickView && (
            <button
              onClick={onClickView}
              className="w-full text-center rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 py-2 text-xs font-bold transition border border-slate-100 cursor-pointer"
            >
              Review War Room &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Urgent warnings
export function RiskCard({
  message,
  timestamp,
  severity = 'warning',
  actionLabel,
  onClickAction,
  className = ''
}: {
  message: string;
  timestamp: string;
  severity?: 'warning' | 'danger' | 'info';
  actionLabel?: string;
  onClickAction?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${
      severity === 'danger' ? 'bg-red-50/40 border-red-100 text-red-800' :
      severity === 'warning' ? 'bg-amber-50/40 border-amber-100 text-amber-800' :
      'bg-blue-50/40 border-blue-100 text-blue-800'
    } ${className}`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold leading-relaxed">{message}</p>
        <span className="text-[9px] text-slate-400 font-mono block">{timestamp}</span>
      </div>
      {actionLabel && onClickAction && (
        <button 
          onClick={onClickAction}
          className="text-[10px] font-black underline uppercase tracking-wider shrink-0 hover:text-slate-900 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Notification bell logs
export function NotificationCard({
  message,
  timestamp,
  read = false,
  onMarkRead,
  className = ''
}: {
  message: string;
  timestamp: string;
  read?: boolean;
  onMarkRead?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-3.5 rounded-xl border flex flex-col gap-2 transition ${
      !read ? 'bg-blue-50/30 border-blue-100/50' : 'bg-white border-slate-150'
    } ${className}`}>
      <div className="text-xs text-slate-800 leading-snug">{message}</div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">{timestamp}</span>
        {!read && onMarkRead && (
          <button
            onClick={onMarkRead}
            className="text-[9px] font-black text-blue-600 hover:text-blue-800 transition"
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}

// Activity feed logs
export function ActivityCard({
  message,
  timestamp,
  user,
  action,
  className = ''
}: {
  message: string;
  timestamp: string;
  user?: string;
  action?: string;
  className?: string;
}) {
  return (
    <div className={`p-3.5 bg-slate-50/50 hover:bg-slate-50 transition border border-slate-200/50 rounded-xl flex flex-col justify-between gap-1.5 ${className}`}>
      <div className="text-xs text-slate-700 leading-relaxed font-medium">{message}</div>
      <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono font-bold">
        {user && <span className="uppercase">By: {user}</span>}
        <span>{timestamp}</span>
      </div>
    </div>
  );
}
