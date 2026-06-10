import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  authApi,
  projectApi,
  feedbackApi,
  documentApi,
  analyticsApi,
  notificationApi,
  auditApi,
  predictionApi
} from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface ServiceStatus {
  name: string;
  port: number;
  url: string;
  status: 'checking' | 'online' | 'offline';
  latency: number | null;
  instance: any;
}

interface QuickAudit {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Auth Service', port: 8001, url: 'http://localhost:8001/health', status: 'checking', latency: null, instance: authApi },
    { name: 'Project Service', port: 8002, url: 'http://localhost:8002/health', status: 'checking', latency: null, instance: projectApi },
    { name: 'Feedback Service', port: 8003, url: 'http://localhost:8003/health', status: 'checking', latency: null, instance: feedbackApi },
    { name: 'Document Service', port: 8004, url: 'http://localhost:8004/health', status: 'checking', latency: null, instance: documentApi },
    { name: 'Analytics Service', port: 8005, url: 'http://localhost:8005/health', status: 'checking', latency: null, instance: analyticsApi },
    { name: 'Notification Service', port: 8006, url: 'http://localhost:8006/health', status: 'checking', latency: null, instance: notificationApi },
    { name: 'Audit Service', port: 8007, url: 'http://localhost:8007/health', status: 'checking', latency: null, instance: auditApi },
    { name: 'AI Prediction Service', port: 8008, url: 'http://localhost:8008/health', status: 'checking', latency: null, instance: predictionApi },
  ]);

  const [recentLogs, setRecentLogs] = useState<QuickAudit[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Mock Admin Metrics
  const userGrowthData = [
    { name: 'Jan', Citizens: 80, Officers: 5 },
    { name: 'Feb', Citizens: 120, Officers: 8 },
    { name: 'Mar', Citizens: 190, Officers: 12 },
    { name: 'Apr', Citizens: 310, Officers: 18 },
    { name: 'May', Citizens: 450, Officers: 25 },
    { name: 'Jun', Citizens: 620, Officers: 30 },
  ];

  const apiUsageData = [
    { service: 'Auth', requests: 4800 },
    { service: 'Project', requests: 12500 },
    { service: 'Feedback', requests: 3200 },
    { service: 'Document', requests: 9400 },
    { service: 'Analytics', requests: 2100 },
    { service: 'Notif', requests: 14500 },
    { service: 'Audit', requests: 6300 },
    { service: 'Predict', requests: 1800 },
  ];

  const checkAllServices = async () => {
    const updatedServices = [...services];
    await Promise.all(
      updatedServices.map(async (srv, index) => {
        const startTime = performance.now();
        try {
          await srv.instance.get(srv.url);
          const endTime = performance.now();
          updatedServices[index].status = 'online';
          updatedServices[index].latency = Math.round(endTime - startTime);
        } catch (err) {
          updatedServices[index].status = 'offline';
          updatedServices[index].latency = null;
        }
      })
    );
    setServices([...updatedServices]);
  };

  async function fetchRecentLogs() {
    try {
      setLogsLoading(true);
      const res = await auditApi.get('/audit/logs');
      setRecentLogs(res.data.slice(0, 5));
    } catch (err) {
      console.warn('Failed to load recent audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    checkAllServices();
    fetchRecentLogs();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin System Panel</h2>
            <p className="text-slate-500 text-sm">Monitor microservices network health, latency bounds, registered growth, and audit log histories.</p>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full">
            Role: System Administrator
          </span>
        </div>

        {/* Core Admin Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Services Health Widget (Left) */}
          <Card className="lg:col-span-7 space-y-4 border border-slate-200 rounded-xl shadow-sm bg-white">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm">Microservices Cluster Status</h3>
              <button
                onClick={checkAllServices}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5"
              >
                <span>🔄</span> Ping Health Checks
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {services.map((srv) => (
                <div
                  key={srv.name}
                  className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 shadow-sm"
                >
                  <div>
                    <div className="text-xs font-black text-slate-800">{srv.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Port: {srv.port}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {srv.status === 'checking' && (
                      <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    )}
                    {srv.status === 'online' && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> ONLINE
                        </span>
                        {srv.latency !== null && (
                          <span className="block text-[8px] text-slate-400 font-bold font-mono mt-0.5">{srv.latency}ms ping</span>
                        )}
                      </div>
                    )}
                    {srv.status === 'offline' && (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> OFFLINE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats Widget (Right) */}
          <Card className="lg:col-span-5 flex flex-col justify-between p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 rounded-xl shadow-md">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-400">Node Cluster Overview</h3>
              <div className="mt-4 space-y-3 font-semibold text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Microservices Scraped</span>
                  <span className="font-extrabold text-slate-100">{services.filter(s=>s.status==='online').length} / {services.length} Online</span>
                </div>
                <div className="flex justify-between">
                  <span>System Environment</span>
                  <span className="font-extrabold text-indigo-400 uppercase font-mono text-[9px] tracking-wide">Production Cloud Local</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary DB Cluster</span>
                  <span className="font-extrabold text-slate-100">MongoDB Replica Set</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Allocation Limit</span>
                  <span className="font-extrabold text-slate-100">12 Cores (Shared)</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Websockets</span>
                  <span className="font-extrabold text-indigo-400">4 Active Hubs</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
              <span>Primary Port Gateway:</span>
              <span className="font-mono text-indigo-400 font-bold">5173 (React Vite)</span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User growth graph */}
          <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Node User Registrations Growth</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Citizens" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2.5} name="Citizens" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* API requests bar chart */}
          <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">API Requests Per Service</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiUsageData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="service" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#2563eb" radius={[4, 4, 0, 0]} name="Requests / Min">
                    {apiUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Audit Trail Card */}
        <Card className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-800 text-sm">Security Audit Trails</h3>
            <Link
              to="/admin/audit"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              View Full Audit Board &rarr;
            </Link>
          </div>

          {logsLoading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading activities...</div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No recent security events logged</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">🛡️</span>
                    <div>
                      <span className="font-bold text-slate-800">{log.user}</span>{' '}
                      <span className="text-slate-500 font-semibold">{log.action}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
