import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { analyticsApi } from '../services/api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [budgetData, setBudgetData] = useState<any>(null);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  
  // New Analytics metrics
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [burnRateData, setBurnRateData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);
  const [rankingsData, setRankingsData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bRes, dRes, distRes, trendsRes, burnRes, forecastRes, compRes, rankRes] = await Promise.all([
          analyticsApi.get('/analytics/budget'),
          analyticsApi.get('/analytics/departments'),
          analyticsApi.get('/analytics/districts'),
          analyticsApi.get('/analytics/trends').catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/burn-rate').catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/forecast').catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/complaints').catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/rankings').catch(() => ({ data: [] }))
        ]);
        
        setBudgetData(bRes.data);
        setDeptData(dRes.data);
        setDistrictData(distRes.data);
        setTrendsData(trendsRes.data);
        setBurnRateData(burnRes.data);
        setForecastData(forecastRes.data);
        setComplaintsData(compRes.data);
        setRankingsData(rankRes.data);
        
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch analytics data. Ensure the analytics-service is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Crore`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto pt-4">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Analytics</h2>
          <Card className="border-red-250 bg-red-50 text-red-700 p-6 text-center rounded-xl">
            <p className="font-semibold">{error}</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const pieData = budgetData ? [
    { name: 'Used Budget', value: budgetData.used_budget },
    { name: 'Remaining Budget', value: budgetData.remaining_budget }
  ] : [];

  const PIE_COLORS = ['#3b82f6', '#10b981'];
  const DEPT_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b'];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Financial & Project Analytics</h2>
            <p className="text-slate-500 text-sm mt-1">Aggregated command analytics showing spending bounds, burn rates, and completion forecasts.</p>
          </div>
        </div>

        {/* Overview Stats */}
        {budgetData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="flex flex-col justify-between border-l-4 border-blue-600 p-5 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Allocated Budget</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{formatCurrency(budgetData.total_budget)}</span>
            </Card>
            <Card className="flex flex-col justify-between border-l-4 border-emerald-600 p-5 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilized Budget spent</span>
              <span className="text-2xl font-black text-emerald-600 mt-2 block">{formatCurrency(budgetData.used_budget)}</span>
            </Card>
            <Card className="flex flex-col justify-between border-l-4 border-yellow-500 p-5 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{formatCurrency(budgetData.remaining_budget)}</span>
            </Card>
            <Card className="flex flex-col justify-between border-l-4 border-purple-600 p-5 rounded-xl bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilization Rate</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-purple-700">{budgetData.utilization_rate}%</span>
                <span className="text-slate-400 text-xs font-normal">of budget spent</span>
              </div>
            </Card>
          </div>
        )}

        {/* First Charts Row: Spending Trends & Budget Burn Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spending Trend */}
          <Card className="flex flex-col p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Monthly Spending Trend</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="spending" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2.5} name="Monthly spent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Budget Burn Rate */}
          <Card className="flex flex-col p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Budget Cumulative Burn Rate</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burnRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/10000000}Cr`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" stroke="#3b82f6" strokeWidth={2.5} name="Allocated Budget" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2.5} name="Actual spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Second Row: Budget Allocations & Completion Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Department Budget Allocations */}
          <Card className="lg:col-span-8 flex flex-col p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Budget Allocations by Department</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]}>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Completion Forecast */}
          <Card className="lg:col-span-4 flex flex-col p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Completion Forecast (ML Projected)</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={3} name="Avg Progress" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Third Row: District Project Counts & Complaint Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by District */}
          <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Projects by District</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="location" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="project_count" name="Number of Projects" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Complaint Heatmap */}
          <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Complaint Distribution by District</h3>
            <div className="h-64">
              {complaintsData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-semibold">No complaints logged to count.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintsData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="location" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="complaints_count" name="Citizen Complaints" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Department Rankings Table */}
        <Card className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 mb-4">Department Performance Ranking</h3>
          {rankingsData.length === 0 ? (
            <p className="text-xs text-slate-400">No data to display department rankings.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Avg Progress</th>
                    <th className="px-4 py-3">Total Allocated</th>
                    <th className="px-4 py-3">Budget Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {rankingsData.map((rank, idx) => (
                    <tr key={rank.department} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">#{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 capitalize">{rank.department}</td>
                      <td className="px-4 py-3 font-extrabold text-blue-600">{rank.avg_completion}%</td>
                      <td className="px-4 py-3">{formatCurrency(rank.total_budget)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(rank.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
