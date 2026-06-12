import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { auditApi } from '../services/api';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await auditApi.get('/audit/logs');
        setLogs(res.data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch audit logs. Verify that the audit-service is running and you are logged in as an Admin.');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('upload')) {
      return 'bg-green-500 text-white';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('assign') || act.includes('resolve')) {
      return 'bg-blue-500 text-white';
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('reject')) {
      return 'bg-red-500 text-white';
    }
    return 'bg-yellow-500 text-white';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) {
      return (
        <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      );
    }
    if (act.includes('upload') || act.includes('document')) {
      return (
        <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    }
    if (act.includes('assign')) {
      return (
        <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      );
    }
    if (act.includes('resolve')) {
      return (
        <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      );
    }
    if (act.includes('delete')) {
      return (
        <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    );
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Time difference helper (humanized timestamps)
  const getRelativeTime = (timestamp: string) => {
    const logDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return logDate.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto pt-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Audit Logs</h2>
            <p className="text-slate-500 text-sm mt-1">Review tamper-proof chronological logs of all administrative and construction events.</p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full uppercase">
            Admin Audits Mode
          </span>
        </div>

        {/* Filter Card */}
        <Card className="flex flex-col gap-4 border border-slate-200 shadow-sm rounded-xl p-5 bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by user, action, or resource..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50/50"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              Showing {filteredLogs.length} of {logs.length} logged actions
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-5 rounded-lg text-xs border border-red-200 font-semibold">
              {error}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No audit logs found matching criteria.
            </div>
          ) : (
            /* Vertical Chronological Timeline View */
            <div className="relative border-l-2 border-slate-200 pl-8 ml-6 space-y-6 pt-2 pb-6">
              {filteredLogs.map((log) => {
                const initial = log.user ? log.user.charAt(0).toUpperCase() : 'U';
                return (
                  <div key={log.id} className="relative group">
                    {/* User Avatar node */}
                    <div className="absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border-2 border-white text-blue-700 font-bold text-xs shadow-sm group-hover:scale-110 transition duration-150">
                      {initial}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-250 p-4 shadow-sm hover:shadow transition duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-slate-500 inline-block align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            {log.user}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                            <span>{getActionIcon(log.action)}</span>
                            {log.action}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Target Resource: <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px] select-all">{log.resource}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600 block">
                          {getRelativeTime(log.timestamp)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-semibold block mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
