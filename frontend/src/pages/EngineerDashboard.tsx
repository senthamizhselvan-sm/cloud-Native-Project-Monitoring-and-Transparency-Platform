import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi, feedbackApi } from '../services/api';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  assigned_engineer: string | null;
  end_date: string | null;
  risk_level?: string;
}

interface Complaint {
  id: string;
  project_id: string;
  status: string;
  description: string;
}

export default function EngineerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Selected project for editing
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [status, setStatus] = useState('');
  const [completion, setCompletion] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Crore`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  const fetchDashboardData = async () => {
    try {
      const [projResp, compResp] = await Promise.all([
        projectApi.get('/projects'),
        feedbackApi.get('/feedback').catch(() => ({ data: [] }))
      ]);
      setProjects(projResp.data);
      setComplaints(compResp.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load engineer dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem('user_email') || '';
    setUserEmail(email);
    fetchDashboardData();
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setStatus(project.status);
    setCompletion(project.completion);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const resp = await projectApi.put(`/projects/${selectedProject.id}`, {
        status,
        completion: Number(completion)
      });
      setUpdateSuccess('Progress updated successfully!');
      setSelectedProject(resp.data);
      fetchDashboardData();
    } catch (err: any) {
      setUpdateError(err?.response?.data?.detail ?? 'Failed to update progress');
    }
  };

  // Filter projects assigned to this engineer
  const assignedProjects = projects.filter(
    (p) => p.assigned_engineer && p.assigned_engineer.toLowerCase() === userEmail.toLowerCase()
  );

  // Pending Tasks count (Active construction projects not yet completed)
  const pendingTasks = assignedProjects.filter(p => p.completion < 100 && p.status !== 'Completed').length;

  // Upcoming Deadlines (Project end_date within 30 days and completion < 90)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const upcomingDeadlines = assignedProjects.filter(p => {
    if (!p.end_date || p.completion >= 90) return false;
    const deadline = new Date(p.end_date);
    return deadline > new Date() && deadline <= thirtyDaysFromNow;
  }).length;

  // Inspection Requests (Active complaints against the engineer's assigned projects)
  const assignedProjectIds = assignedProjects.map(p => p.id);
  const inspectionRequests = complaints.filter(
    c => assignedProjectIds.includes(c.project_id) && c.status === 'OPEN'
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 pb-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Engineer Work-Center</h2>
            <p className="text-sm text-slate-500 mt-1">Supervise assigned project execution plans, report completion progress, and track citizen inspections.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Logged: {userEmail}
          </span>
        </div>

        {/* Engineer Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 border-t-4 border-orange-500 bg-white shadow-sm rounded-2xl flex items-center justify-between transition hover:shadow-md">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Active Tasks</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{pendingTasks} Projects</span>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18a9.005 9.005 0 0 0 8.716-11.253" />
              </svg>
            </div>
          </Card>
          
          <Card className="p-5 border-t-4 border-red-500 bg-white shadow-sm rounded-2xl flex items-center justify-between transition hover:shadow-md">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Deadlines (30 Days)</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{upcomingDeadlines} Alerts</span>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-650">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
          </Card>

          <Card className="p-5 border-t-4 border-yellow-500 bg-white shadow-sm rounded-2xl flex items-center justify-between transition hover:shadow-md">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inspection Grievance Requests</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{inspectionRequests} Unresolved</span>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Assigned Projects List (Redesigned Active Task Cards) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4">My Supervised Civil Works</h3>
              {loading ? (
                <p className="text-sm text-slate-500">Loading works list...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : assignedProjects.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 font-bold">No projects currently assigned to your email.</p>
                  <p className="text-xs text-slate-400 mt-1">Request an Officer to assign you to a project site using email: {userEmail}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedProjects.map((p) => {
                    const projectComplaintsCount = complaints.filter(
                      c => c.project_id === p.id && c.status === 'OPEN'
                    ).length;

                    return (
                      <Card
                        key={p.id}
                        className={`p-5 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                          selectedProject?.id === p.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <Link to={`/projects/${p.id}`} className="font-extrabold text-slate-900 text-sm leading-snug hover:text-blue-600 transition block truncate" title={p.name}>
                                {p.name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                                {p.department} &bull; {p.location}
                              </span>
                            </div>
                            
                            {/* Health Risk Indicator */}
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${
                              p.risk_level === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                              p.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                              'bg-emerald-50 text-emerald-700 border-emerald-250'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                p.risk_level === 'High' ? 'bg-red-500' :
                                p.risk_level === 'Medium' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} /> {p.risk_level || 'Low'}
                            </span>
                          </div>

                          <div className="pt-2">
                            <div className="flex justify-between text-[10px] font-extrabold text-slate-500 mb-1">
                              <span>Work Completion Progress</span>
                              <span>{p.completion}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  p.completion === 100 ? 'bg-emerald-500' : 'bg-blue-650'
                                }`}
                                style={{ width: `${p.completion}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                            <div>
                              Budget: <span className="font-bold text-slate-700">{formatCurrency(p.budget)}</span>
                            </div>
                            {projectComplaintsCount > 0 && (
                              <span className="text-red-650 font-black flex items-center gap-1.5 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                {projectComplaintsCount} Grievances
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                          <Link
                            to={`/projects/${p.id}`}
                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2 rounded-xl text-xs transition"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleSelectProject(p)}
                            className="flex-1 bg-blue-650 hover:bg-blue-700 text-white font-extrabold py-2 rounded-xl text-xs transition shadow-sm animate-fade-in"
                          >
                            Edit Progress
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Update Progress Form */}
          <div className="lg:col-span-4">
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Log Progress Audits</h3>
              {selectedProject ? (
                <form onSubmit={handleUpdateProgress} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-650 border border-slate-100">
                    <div className="font-bold text-slate-800 truncate mb-0.5">{selectedProject.name}</div>
                    <div>{selectedProject.department} &bull; {selectedProject.location}</div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Inspection Scheduled">Inspection Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between">
                      <span>Completion Percentage:</span>
                      <span className="text-blue-700 font-extrabold">{completion}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={completion}
                      onChange={(e) => setCompletion(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-semibold">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-650 hover:bg-blue-700 text-white font-extrabold py-2.5 text-xs transition shadow-sm"
                  >
                    Save Progress Audits
                  </button>
                  {updateError && <p className="text-xs text-red-650 mt-1 font-semibold">{updateError}</p>}
                  {updateSuccess && <p className="text-xs text-green-650 mt-1 font-semibold">{updateSuccess}</p>}
                </form>
              ) : (
                <div className="text-slate-400 text-center py-12 text-xs font-semibold">
                  Select a supervised civil project from the list to record progress audits.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
