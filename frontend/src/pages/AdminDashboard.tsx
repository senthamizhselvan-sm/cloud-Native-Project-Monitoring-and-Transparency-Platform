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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';

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

  // Admin Metrics
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

  const getLatencyIndicator = (latency: number | null, status: 'checking' | 'online' | 'offline') => {
    if (status === 'offline') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> OFFLINE
        </span>
      );
    }
    
    if (status === 'checking' || latency === null) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" /> PINGING...
        </span>
      );
    }

    if (latency < 100) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {latency}ms (Fast)
        </span>
      );
    } else if (latency <= 300) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {latency}ms (Moderate)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {latency}ms (High Latency)
        </span>
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 pb-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin System Panel</h2>
            <p className="text-slate-500 text-sm">Monitor microservices network health, latency bounds, registered growth, and audit log histories.</p>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 2.714Z" />
            </svg>
            Role: System Administrator
          </span>
        </div>

        {/* Core Admin Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Services Health Widget (Left) */}
          <Card className="lg:col-span-8 space-y-4 border border-slate-200 rounded-2xl shadow-sm bg-white p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Microservices Cluster Status</h3>
              <button
                onClick={checkAllServices}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 transition"
              >
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Ping Health Checks
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {services.map((srv) => (
                <div
                  key={srv.name}
                  className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 shadow-sm transition duration-200 hover:border-slate-200"
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{srv.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Port: {srv.port}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getLatencyIndicator(srv.latency, srv.status)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats Widget (Right) */}
          <Card className="lg:col-span-4 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 rounded-2xl shadow-md min-h-[300px]">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-400">Node Cluster Overview</h3>
              <div className="mt-4 space-y-4 font-semibold text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Microservices Online</span>
                  <span className="font-extrabold text-slate-100">{services.filter(s => s.status === 'online').length} / {services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment</span>
                  <span className="font-extrabold text-indigo-400 uppercase font-mono text-[9px] tracking-wide bg-indigo-500/20 px-1.5 py-0.5 rounded">LOCAL CLOUD</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Hub</span>
                  <span className="font-extrabold text-slate-100">Windows Native MongoDB</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Websockets</span>
                  <span className="font-extrabold text-indigo-400">4 Active Hubs</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400 mt-6">
              <span>Primary Port Gateway:</span>
              <span className="font-mono text-indigo-400 font-bold">5173 (Vite Server)</span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User growth graph */}
          <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Node User Registrations Growth</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Citizens" stroke="#2563EB" strokeWidth={2.5} activeDot={{ r: 6 }} name="Citizens Registered" />
                  <Line type="monotone" dataKey="Officers" stroke="#8B5CF6" strokeWidth={2.5} activeDot={{ r: 6 }} name="Officers Registered" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* API requests bar chart */}
          <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">API Requests Per Service</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiUsageData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="service" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#2563EB" radius={[4, 4, 0, 0]} name="Requests / Min">
                    {apiUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Audit Trail Card */}
        <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 hover:shadow transition">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-900 text-sm">Security Audit Trails</h3>
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
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 2.714Z" />
                    </svg>
                    <div>
                      <span className="font-extrabold text-slate-800">{log.user}</span>{' '}
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
