import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, MetricCard, ProjectCard } from '../design-system/components/Card';
import Badge from '../components/ui/Badge';
import { feedbackApi, projectApi } from '../services/api';

interface Feedback {
  id: string;
  project_id: string;
  citizen_name: string;
  issue_type: string;
  description: string;
  status: string;
  assigned_inspector: string | null;
  created_at: string;
}

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

export default function CitizenDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [districtProjects, setDistrictProjects] = useState<Project[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const getCitizenDistrict = (email: string) => {
    if (!email) return 'Chennai';
    if (email.includes('.')) {
      const parts = email.split('@')[0].split('.');
      if (parts.length > 1) {
        const d = parts[1];
        return d.charAt(0).toUpperCase() + d.slice(1);
      }
    }
    return 'Chennai';
  };

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  const getBannerImage = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('water')) return 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400';
    if (d.includes('road') || d.includes('highway')) return 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=400';
    if (d.includes('health')) return 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=400';
    if (d.includes('school') || d.includes('education')) return 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400';
    if (d.includes('municipal') || d.includes('drainage')) return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
    if (d.includes('energy') || d.includes('power')) return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400';
    if (d.includes('agri')) return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400';
    return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
  };

  useEffect(() => {
    const email = localStorage.getItem('user_email') || '';
    setUserEmail(email);

    async function fetchData() {
      try {
        const district = getCitizenDistrict(email);
        const [feedbackResp, projectResp] = await Promise.all([
          feedbackApi.get('/feedback'),
          projectApi.get('/projects')
        ]);
        setFeedbacks(feedbackResp.data);

        const projectMap: Record<string, string> = {};
        projectResp.data.forEach((p: Project) => {
          projectMap[p.id] = p.name;
        });
        setProjectsMap(projectMap);

        // Filter projects located in the citizen's district
        const localWorks = projectResp.data.filter(
          (p: Project) => p.location.toLowerCase() === district.toLowerCase()
        );
        setDistrictProjects(localWorks);
      } catch (err: any) {
        setError(err?.response?.data?.detail ?? 'Failed to load citizen data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getBadgeVariant = (status: string) => {
    return status === 'RESOLVED' ? 'success' : 'danger';
  };

  const citizenDistrict = getCitizenDistrict(userEmail);
  const totalIssues = feedbacks.length;
  const resolvedIssues = feedbacks.filter(f => f.status === 'RESOLVED').length;
  const pendingIssues = totalIssues - resolvedIssues;

  return (
    <section className="space-y-6 font-sans bg-slate-50 min-h-screen text-slate-900 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Citizen Console</p>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-slate-900">My Dashboard</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Track your reported issues, inspect public works, and monitor feedback statuses.</p>
        </div>
        <Link
          to="/feedback/new"
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm self-stretch sm:self-auto text-center flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          Report Construction Issue
        </Link>
      </div>

      {/* KPI Stats widgets using MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Total Filed Issues"
          value={totalIssues}
          borderAccent="border-blue-600"
          trend="Grievances registered in district"
          trendDirection="neutral"
          icon={
            <svg className="w-5 h-5 text-blue-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        />
        <MetricCard
          label="Resolved Issues"
          value={resolvedIssues}
          borderAccent="border-emerald-600"
          trend="Inspected and verified as resolved"
          trendDirection="up"
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <MetricCard
          label="Pending Audit Issues"
          value={pendingIssues}
          borderAccent="border-amber-500"
          trend="Under review by local engineers"
          trendDirection="neutral"
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Double Column Grid Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: My Filed Grievance Logs (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">My Filed Grievance Logs</h3>
            {loading ? (
              <p className="text-xs text-slate-500">Loading your issues...</p>
            ) : error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold">You haven't reported any public works issues yet.</p>
                <Link to="/feedback/new" className="text-xs text-blue-600 hover:underline font-extrabold mt-2 block">
                  Click here to report your first issue
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                  <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Issue Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Inspector</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600 font-semibold">
                    {feedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-bold text-slate-800 max-w-[150px] truncate">
                          <Link to={`/projects/${fb.project_id}`} className="text-blue-600 hover:underline">
                            {projectsMap[fb.project_id] || `ID: ${fb.project_id.slice(0, 8)}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-500 uppercase text-[10px]">{fb.issue_type}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getBadgeVariant(fb.status)}>{fb.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {fb.assigned_inspector ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                              {fb.assigned_inspector}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-450">{new Date(fb.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Local District Transparency Hub (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-sm text-slate-800">Works in {citizenDistrict} District</h3>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                {districtProjects.length} Active
              </span>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal mb-4 font-medium">
              Verified public works within your district. Review details to inspect contractor timelines, budgets, and submit site audits.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-400 text-center py-6">Loading district works...</p>
              ) : districtProjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No public works logged in your district.</p>
              ) : (
                districtProjects.slice(0, 3).map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    name={proj.name}
                    location={proj.location}
                    department={proj.department}
                    budget={formatCurrency(proj.budget)}
                    completion={proj.completion}
                    riskLevel={proj.risk_level || 'Low'}
                    onClickView={() => window.location.href = `/projects/${proj.id}`}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

      </div>

    </section>
  );
}
