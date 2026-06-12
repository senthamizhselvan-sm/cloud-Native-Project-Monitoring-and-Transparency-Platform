import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { analyticsApi } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

const DEPARTMENTS = [
  'Water Resources',
  'Highways & Roads',
  'Public Health',
  'School Education',
  'Municipal Administration',
  'Energy & Power',
  'Agriculture',
  'Social Welfare'
];

const DEPT_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#34D399', '#8B5CF6', '#A78BFA', '#F59E0B'];

export default function AnalyticsPage() {
  const [budgetData, setBudgetData] = useState<any>(null);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [burnRateData, setBurnRateData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);
  const [rankingsData, setRankingsData] = useState<any[]>([]);

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLoc, setSelectedLoc] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const params: any = {};
        if (selectedDept) params.department = selectedDept;
        if (selectedLoc) params.location = selectedLoc;

        const [bRes, dRes, distRes, trendsRes, burnRes, forecastRes, compRes, rankRes] = await Promise.all([
          analyticsApi.get('/analytics/budget', { params }),
          analyticsApi.get('/analytics/departments', { params }),
          analyticsApi.get('/analytics/districts', { params }),
          analyticsApi.get('/analytics/trends', { params }).catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/burn-rate', { params }).catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/forecast', { params }).catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/complaints', { params }).catch(() => ({ data: [] })),
          analyticsApi.get('/analytics/rankings', { params }).catch(() => ({ data: [] }))
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
  }, [selectedDept, selectedLoc]);

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
        <div className="space-y-6 max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h2>
          <Card className="border-red-200 bg-red-50 text-red-700 p-6 text-center rounded-xl">
            <p className="font-semibold">{error}</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 pb-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial & Project Analytics</h2>
            <p className="text-slate-500 text-sm mt-1">Aggregated command analytics showing spending bounds, burn rates, and completion forecasts.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 text-blue-605">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interactive Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-grow">
            <div className="flex-1 sm:max-w-xs">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 sm:max-w-xs">
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
              >
                <option value="">All Districts</option>
                {TAMIL_NADU_DISTRICTS.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {(selectedDept || selectedLoc) && (
              <button
                onClick={() => {
                  setSelectedDept('');
                  setSelectedLoc('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 self-stretch justify-center"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Overview Stats (Premium Metric Widgets) */}
        {budgetData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Allocated Budget</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-900 block tracking-tight">{formatCurrency(budgetData.total_budget)}</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1.5 block">Sanctioned for filtered projects</span>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Utilized Budget Spent</span>
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-emerald-600 block tracking-tight">{formatCurrency(budgetData.used_budget)}</span>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${budgetData.utilization_rate}%` }}></div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.957-.659-1.006-.879-1.006-2.303 0-3.182s2.9-.879 4.07 0c.513.385.972.85 1.282 1.397m-7.658 3.262H3m18 0h-3.262" />
                </svg>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-900 block tracking-tight">{formatCurrency(budgetData.remaining_budget)}</span>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${100 - budgetData.utilization_rate}%` }}></div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Utilization Rate</span>
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-blue-600 block tracking-tight">{budgetData.utilization_rate}%</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1.5 block">Of cumulative allocation spent</span>
              </div>
            </Card>
          </div>
        )}

        {/* First Charts Row: Spending Trends & Budget Burn Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spending Trend */}
          <Card className="flex flex-col p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Monthly Spending Trend</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="spending" stroke="#2563EB" fill="url(#colorSpending)" strokeWidth={2.5} name="Monthly spent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Budget Burn Rate */}
          <Card className="flex flex-col p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Budget Cumulative Burn Rate</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burnRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/10000000).toFixed(1)}Cr`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" stroke="#0F172A" strokeWidth={2.5} name="Allocated Budget" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="spent" stroke="#2563EB" strokeWidth={2.5} name="Actual spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Second Row: Budget Allocations & Completion Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Department Budget Allocations */}
          <Card className="lg:col-span-8 flex flex-col p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Budget Allocations by Department</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
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
          <Card className="lg:col-span-4 flex flex-col p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Completion Forecast (ML Projected)</h3>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="completion" stroke="#8B5CF6" strokeWidth={3} name="Avg Progress" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Third Row: District Project Counts & Complaint Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by District */}
          <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Projects by District</h3>
            <div className="h-64">
              {districtData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-semibold">No active projects found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="location" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="project_count" name="Number of Projects" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Complaint Heatmap */}
          <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
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
                    <Bar dataKey="complaints_count" name="Citizen Complaints" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Department Rankings Table */}
        <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
          <h3 className="font-extrabold text-sm text-slate-800 mb-4">Department Performance Ranking</h3>
          {rankingsData.length === 0 ? (
            <p className="text-xs text-slate-400">No data to display department rankings.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="min-w-full divide-y divide-slate-250 text-left text-xs bg-white">
                <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
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
                    <tr key={rank.department} className="hover:bg-slate-55/30 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">#{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 capitalize">{rank.department}</td>
                      <td className="px-4 py-3 font-black text-blue-600">{rank.avg_completion}%</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(rank.total_budget)}</td>
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
