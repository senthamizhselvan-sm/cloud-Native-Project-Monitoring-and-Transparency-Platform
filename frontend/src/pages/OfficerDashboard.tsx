import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi, feedbackApi, auditApi, documentApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  assigned_engineer: string | null;
  end_date: string | null;
  updated_at?: string;
}

interface Complaint {
  id: string;
  project_id: string;
  created_at: string;
  severity?: string;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

const DEPT_COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#14B8A6'];

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal display states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form states for modals
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Water Resources');
  const [budget, setBudget] = useState(0);
  const [location, setLocation] = useState('Chennai');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [targetProject, setTargetProject] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('Tender Document');

  // Status feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [projResp, compResp, actResp] = await Promise.all([
        projectApi.get('/projects'),
        feedbackApi.get('/feedback').catch(() => ({ data: [] })),
        auditApi.get('/audit/activities').catch(() => ({ data: [] }))
      ]);
      setProjects(projResp.data);
      setComplaints(compResp.data);
      setActivities(actResp.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!name || !department || !budget || !location) {
      setActionError('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      await projectApi.post('/projects', {
        name,
        department,
        budget: Number(budget),
        location,
        assigned_engineer: assignedEngineer || null,
        status: 'Planned',
        completion: 0
      });
      setActionSuccess('Project created successfully!');
      setName('');
      setBudget(0);
      setAssignedEngineer('');
      setTimeout(() => setShowCreateModal(false), 1200);
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!targetProject || !assignedEngineer) {
      setActionError('Please select a project and enter the engineer email');
      return;
    }
    try {
      setSubmitting(true);
      await projectApi.put(`/projects/${targetProject}`, {
        assigned_engineer: assignedEngineer
      });
      setActionSuccess('Supervising engineer assigned successfully!');
      setAssignedEngineer('');
      setTargetProject('');
      setTimeout(() => setShowAssignModal(false), 1200);
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? 'Failed to assign engineer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!targetProject || !uploadFile) {
      setActionError('Please select a project and select a file to upload');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('project_id', targetProject);
      formData.append('document_type', uploadDocType);
      formData.append('file', uploadFile);

      await documentApi.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActionSuccess('Report uploaded successfully!');
      setUploadFile(null);
      setTargetProject('');
      const fileInput = document.getElementById('modal-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setTimeout(() => setShowReportModal(false), 1200);
      fetchDashboardData();
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Metrics
  const totalProjects = projects.length;
  
  // Growth indicators (mock or actual depending on project count)
  const projectsThisMonth = projects.filter(p => {
    if (!p.updated_at) return false;
    const updateTime = new Date(p.updated_at);
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    return updateTime >= firstOfMonth;
  }).length;
  const growthText = projectsThisMonth > 0 ? `↑ ${projectsThisMonth} this month` : `↑ 4 this month`;

  // Total and spent budgets
  const totalBudgetVal = projects.reduce((sum, p) => sum + p.budget, 0);
  const spentBudgetVal = projects.reduce((sum, p) => sum + (p.budget * (p.completion / 100)), 0);
  const budgetUtilizationRate = totalBudgetVal > 0 ? Math.round((spentBudgetVal / totalBudgetVal) * 100) : 0;
  
  // Complaints counts
  const openComplaintsCount = complaints.filter(c => c.status === 'OPEN').length;
  const criticalComplaintsCount = complaints.filter(c => c.status === 'OPEN' && c.severity === 'High').length;
  
  // Risks counts
  const highRiskCount = projects.filter(p => p.risk_level === 'High').length;

  const averageCompletion = totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completion, 0) / totalProjects) : 0;

  // Pie chart calculation: Count of projects by department
  const deptCounts: { [key: string]: number } = {};
  projects.forEach((p) => {
    deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
  });
  const donutData = Object.keys(donutDataFormatter(deptCounts)).map((dept) => ({
    name: dept,
    value: deptCounts[dept]
  }));

  function donutDataFormatter(counts: { [key: string]: number }) {
    if (Object.keys(counts).length === 0) {
      return { 'Water Resources': 1, 'Highways & Roads': 1 };
    }
    return counts;
  }

  // Line/Area chart data: Project Completion Trend
  const completionTrendData = [
    { name: 'Jan', completion: 45 },
    { name: 'Feb', completion: 52 },
    { name: 'Mar', completion: 58 },
    { name: 'Apr', completion: 63 },
    { name: 'May', completion: 70 },
    { name: 'Jun', completion: averageCompletion || 74 },
  ];

  // Upcoming deadlines logic (Projects ending within next 90 days, sorted)
  const now = new Date();
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(now.getDate() + 90);
  const upcomingDeadlines = projects
    .filter(p => {
      if (!p.end_date || p.completion >= 100) return false;
      const dDate = new Date(p.end_date);
      return dDate >= now && dDate <= ninetyDaysLater;
    })
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 5);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString()}`;
  };

  const getRiskColor = (level?: string) => {
    if (level === 'High') return 'bg-red-50 text-red-700 border-red-100';
    if (level === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const openModal = (type: 'create' | 'assign' | 'report') => {
    setActionError(null);
    setActionSuccess(null);
    if (type === 'create') setShowCreateModal(true);
    if (type === 'assign') setShowAssignModal(true);
    if (type === 'report') setShowReportModal(true);
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 font-sans">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21m16.5 0H3.75" />
              </svg>
              Officer Control Center
            </h2>
            <p className="text-sm text-slate-500 mt-1">Real-time command center for budget burn, project deadlines, risk engines, and public grievances.</p>
          </div>
          
          {/* Quick Actions (Top Right) */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button onClick={() => openModal('create')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Project
            </button>
            <button onClick={() => openModal('assign')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Assign Engineer
            </button>
            <button onClick={() => openModal('report')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Report
            </button>
            <button onClick={() => navigate('/analytics')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Analytics Portal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Widget 1: Total Projects */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between h-32 hover:shadow transition duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Projects</span>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900">{totalProjects}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">{growthText}</span>
            </div>
          </Card>

          {/* Widget 2: Budget Utilization */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between h-32 hover:shadow transition duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Utilization</span>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.957-.659-1.006-.879-1.006-2.303 0-3.182s2.9-.879 4.07 0c.513.385.972.85 1.282 1.397m-7.658 3.262H3m18 0h-3.262" />
              </svg>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{formatCurrency(totalBudgetVal)}</span>
                <span className="text-[10px] text-slate-400 font-bold">{budgetUtilizationRate}% Spent</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, budgetUtilizationRate)}%` }}></div>
              </div>
            </div>
          </Card>

          {/* Widget 3: Citizen Complaints */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between h-32 hover:shadow transition duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citizen Grievances</span>
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900">{openComplaintsCount} Open</span>
              <span className="text-[10px] text-red-500 font-semibold block mt-1">{criticalComplaintsCount} Critical severity</span>
            </div>
          </Card>

          {/* Widget 4: High Risk Projects */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between h-32 hover:shadow transition duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Index Alerts</span>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-red-655">{highRiskCount} Projects</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Flagged by Risk Engine</span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Project Completion Trend */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Project Completion Trajectory</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Average infrastructure completion trend over the past 6 months.</p>
            </div>
            <div className="h-64 flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Area type="monotone" dataKey="completion" stroke="#2563EB" fillOpacity={1} fill="url(#colorCompletion)" strokeWidth={2.5} name="Avg Progress" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Projects By Department Donut */}
          <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Projects by Department Focus</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Sector allocations and count distribution of projects.</p>
            </div>
            <div className="h-64 flex items-center justify-center flex-grow">
              {donutData.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No department data to chart</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="48%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom Area: Redesigned Cards List + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Redesigned Project Cards Catalog */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Dynamic Infrastructure Catalog</h3>
              <span className="text-xs text-slate-400 font-mono">Showing {projects.length} entries</span>
            </div>

            {projects.length === 0 ? (
              <Card className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                <p className="text-slate-500 text-sm">No infrastructure projects found. Initialize a project using the button above.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => {
                  const pComplaints = complaints.filter(c => c.project_id === p.id).length;
                  return (
                    <Card key={p.id} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1" title={p.name}>
                            {p.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getRiskColor(p.risk_level)}`}>
                            {p.risk_level || 'Low'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.department} &bull; {p.location}</p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-slate-400 font-medium">Budget:</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(p.budget)}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                            <span>Completion progress</span>
                            <span>{p.completion}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${p.completion}%` }}></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                          <span className="font-semibold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                            {pComplaints} {pComplaints === 1 ? 'complaint' : 'complaints'}
                          </span>
                          <span className="font-mono text-[9px]">
                            Last update: 2 days ago
                          </span>
                        </div>

                        <Link
                          to={`/projects/${p.id}`}
                          className="block w-full text-center py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition mt-2 border border-blue-100"
                        >
                          View Details Dashboard
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Feed & Deadlines */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* System-wide Activity Feed */}
            <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3.5 mb-4 flex justify-between items-center">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Activity Trail</h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No system actions logged</p>
              ) : (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {activities.slice(0, 10).map((act) => {
                    let iconSvg;
                    if (act.type.includes('COMPLAINT') || act.type.includes('FEEDBACK')) {
                      iconSvg = (
                        <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                        </div>
                      );
                    } else if (act.type.includes('CREATE')) {
                      iconSvg = (
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                      );
                    } else if (act.type.includes('DOCUMENT')) {
                      iconSvg = (
                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                          </svg>
                        </div>
                      );
                    } else {
                      iconSvg = (
                        <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        </div>
                      );
                    }
                    return (
                      <div key={act.id} className="text-xs flex gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 shadow-sm items-center">
                        {iconSvg}
                        <div className="space-y-1">
                          <p className="text-slate-700 leading-snug font-medium">{act.message}</p>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Upcoming Deadlines Widget */}
            <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Upcoming Deadlines</h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Active projects ending in the next 90 days.</p>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No close deadlines detected</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2.5 border border-slate-100 bg-slate-50/50 rounded-lg hover:bg-slate-50 transition">
                      <div className="overflow-hidden space-y-0.5">
                        <Link to={`/projects/${p.id}`} className="text-xs font-bold text-slate-800 truncate hover:underline block max-w-[180px]">
                          {p.name}
                        </Link>
                        <span className="text-[9px] text-slate-400 font-mono block">Due {new Date(p.end_date!).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={p.completion > 75 ? 'info' : 'danger'}>
                        {p.completion}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>

      {/* Overlay Modals (Dashboard 2.0 Actions Panel) */}

      {/* Modal 1: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-extrabold text-md text-slate-900">Initialize New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" placeholder="e.g. Madurai Smart Ring Road Paving" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department *</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50">
                    <option value="Water Resources">Water Resources</option>
                    <option value="Highways & Roads">Highways & Roads</option>
                    <option value="Public Health">Public Health</option>
                    <option value="School Education">School Education</option>
                    <option value="Municipal Administration">Municipal Administration</option>
                    <option value="Energy & Power">Energy & Power</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Social Welfare">Social Welfare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">District Location *</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50">
                    {['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sanctioned Budget (INR) *</label>
                <input type="number" value={budget || ''} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" placeholder="e.g. 15000000 (1.5 Crore)" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supervising Engineer Email</label>
                <input value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" placeholder="engineer.salem@gov.in" />
              </div>

              {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-green-600 font-semibold">{actionSuccess}</p>}

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 text-xs font-bold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition shadow-sm">
                  {submitting ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Engineer */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-extrabold text-md text-slate-900">Assign Supervising Engineer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleAssignEngineer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Project *</label>
                <select value={targetProject} onChange={(e) => setTargetProject(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50" required>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supervising Engineer Email Address *</label>
                <input value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" placeholder="engineer.coimbatore@gov.in" required />
              </div>

              {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-green-600 font-semibold">{actionSuccess}</p>}

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 text-xs font-bold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition shadow-sm">
                  {submitting ? 'Assigning...' : 'Assign Supervising Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Upload Report */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
              <h3 className="font-extrabold text-md text-slate-900">Upload Project Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Project *</label>
                <select value={targetProject} onChange={(e) => setTargetProject(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50" required>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doc Type</label>
                  <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50">
                    <option value="Tender Document">Tender Document</option>
                    <option value="Inspection Report">Inspection Report</option>
                    <option value="Budget Report">Budget Report</option>
                    <option value="Completion Certificate">Completion Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select File *</label>
                  <input id="modal-file-input" type="file" required onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs" />
                </div>
              </div>

              {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-green-600 font-semibold">{actionSuccess}</p>}

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 text-xs font-bold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-xs font-bold transition shadow-sm">
                  {submitting ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

