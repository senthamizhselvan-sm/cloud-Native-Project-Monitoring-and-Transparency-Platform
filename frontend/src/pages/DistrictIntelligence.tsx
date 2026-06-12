import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { Card, MetricCard, InsightCard } from '../design-system/components/Card';
import { projectApi, feedbackApi } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  risk_level?: string;
  risk_score?: number;
}

interface Feedback {
  id: string;
  project_id: string;
  issue_type: string;
  severity?: string;
  location?: string | null;
  status: string;
}

const DISTRICT_OPTIONS = [
  'Salem', 'Chennai', 'Trichy', 'Madurai', 'Coimbatore', 
  'Dharmapuri', 'Erode', 'Kanchipuram', 'Cuddalore', 'Vellore',
  'Thanjavur', 'Tirunelveli', 'Thoothukudi', 'Kanyakumari'
];

export default function DistrictIntelligence() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'Salem');
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, feedRes] = await Promise.all([
          projectApi.get('/projects'),
          feedbackApi.get('/feedback').catch(() => ({ data: [] }))
        ]);
        setProjects(projRes.data);
        setFeedback(feedRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch district telemetry data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update URL search parameter when selected district changes
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    setSearchParams({ district: dist });
  };

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) return `₹${crores.toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  // Filter projects/complaints by location
  const districtProjects = projects.filter(
    p => p.location.toLowerCase() === selectedDistrict.toLowerCase()
  );
  
  // Filter complaints by matching project locations
  const districtProjectIds = new Set(districtProjects.map(p => p.id));
  const districtFeedback = feedback.filter(
    f => f.location?.toLowerCase() === selectedDistrict.toLowerCase() || (f.project_id && districtProjectIds.has(f.project_id))
  );

  // Computations
  const totalBudget = districtProjects.reduce((sum, p) => sum + p.budget, 0);
  const completedCount = districtProjects.filter(p => p.status === 'Completed').length;
  const riskCount = districtProjects.filter(p => p.risk_level === 'High').length;
  const avgCompletion = districtProjects.length > 0
    ? Math.round(districtProjects.reduce((sum, p) => sum + p.completion, 0) / districtProjects.length)
    : 0;

  // Chart data 1: Projects by Department Focus
  const getDeptFocusData = () => {
    const counts: Record<string, number> = {};
    districtProjects.forEach((p) => {
      counts[p.department] = (counts[p.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Chart data 2: Budget Utilized by Department focus
  const getDeptBudgetData = () => {
    const totals: Record<string, number> = {};
    districtProjects.forEach((p) => {
      totals[p.department] = (totals[p.department] || 0) + p.budget;
    });
    return Object.entries(totals).map(([name, value]) => ({ 
      name, 
      value: Number((value / 10000000).toFixed(2)) // in Crores
    }));
  };

  const deptFocusData = getDeptFocusData();
  const deptBudgetData = getDeptBudgetData();

  // Scorecard table: Department effectiveness
  const getDepartmentStats = () => {
    const depts = Array.from(new Set(districtProjects.map(p => p.department)));
    return depts.map((d) => {
      const deptProjects = districtProjects.filter(p => p.department === d);
      const avgComp = Math.round(deptProjects.reduce((sum, p) => sum + p.completion, 0) / deptProjects.length);
      const highRisk = deptProjects.filter(p => p.risk_level === 'High').length;
      const totalCost = deptProjects.reduce((sum, p) => sum + p.budget, 0);
      return {
        name: d,
        count: deptProjects.length,
        avgCompletion: avgComp,
        highRisk,
        totalBudget: totalCost
      };
    });
  };

  const deptStats = getDepartmentStats();

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">District Intelligence</h2>
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="text-sm border border-slate-200 bg-white rounded-xl px-3 py-1.5 font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  {DISTRICT_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                Tamil Nadu Localized Infrastructure Performance Registry
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full select-none">
            Geo Telemetry active
          </span>
        </div>

        {/* Datadog KPI gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Total Projects"
            value={districtProjects.length}
            trend="Active in district"
            trendDirection="neutral"
            borderAccent="border-blue-600"
          />
          <MetricCard
            label="Sanctioned Capital"
            value={formatCurrency(totalBudget)}
            trend="Total allocated"
            trendDirection="neutral"
            borderAccent="border-indigo-600"
          />
          <MetricCard
            label="Completed Projects"
            value={completedCount}
            trend={`${districtProjects.length - completedCount} In Progress`}
            trendDirection="up"
            borderAccent="border-emerald-600"
          />
          <MetricCard
            label="Complaints Count"
            value={districtFeedback.length}
            trend={`${districtFeedback.filter(f => f.status === 'OPEN').length} Unresolved`}
            trendDirection="down"
            borderAccent="border-amber-500"
          />
          <MetricCard
            label="High Risk Projects"
            value={riskCount}
            trend="Risk score >= 70"
            trendDirection="neutral"
            borderAccent="border-red-500"
          />
        </div>

        {/* Dynamic Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Project count focus */}
          <Card className="flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Sector Project Density</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Quantity of infrastructure projects mapped by department.</p>
            </div>
            <div className="h-64 flex items-center justify-center">
              {deptFocusData.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No sector statistics available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptFocusData}
                      cx="50%"
                      cy="48%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deptFocusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Chart 2: Sector Budget utilization */}
          <Card className="flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Capital Utilized by Sector</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Budget allocations (expressed in Crores) across sectors.</p>
            </div>
            <div className="h-64 flex items-center justify-center">
              {deptBudgetData.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No cost allocations to chart</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptBudgetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(value) => `₹${value} Crore`} />
                    <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]}>
                      {deptBudgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

        </div>

        {/* Department Performance Scorecard Table */}
        <Card className="p-6">
          <div className="border-b border-slate-100 pb-3.5 mb-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Sector Success Scorecard</h3>
            <p className="text-slate-450 text-[10px] mt-0.5 font-bold uppercase tracking-wider">Localized performance metrics grouped by executing agency</p>
          </div>
          
          {deptStats.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-semibold">No performance parameters registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-650">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Executing Agency</th>
                    <th className="py-2.5 text-center">Active Projects</th>
                    <th className="py-2.5 text-center">Avg Progress</th>
                    <th className="py-2.5 text-center">High Risk Alerts</th>
                    <th className="py-2.5 text-right">Cumulative Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deptStats.map((stat) => (
                    <tr key={stat.name} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-bold text-slate-900">{stat.name}</td>
                      <td className="py-3 text-center font-mono">{stat.count} Works</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono">{stat.avgCompletion}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden hidden md:block">
                            <div className="bg-blue-600 h-1" style={{ width: `${stat.avgCompletion}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          stat.highRisk > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {stat.highRisk} Alert{stat.highRisk !== 1 && 's'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-800">{formatCurrency(stat.totalBudget)}</td>
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
