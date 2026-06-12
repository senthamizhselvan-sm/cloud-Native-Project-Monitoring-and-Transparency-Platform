import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, MetricCard, ProjectCard } from '../design-system/components/Card';
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

        {/* Engineer Widgets Grid using MetricCard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            label="Pending Active Tasks"
            value={`${pendingTasks} Projects`}
            borderAccent="border-orange-500"
            trend="Active civil supervision load"
            trendDirection="neutral"
            icon={
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18a9.005 9.005 0 0 0 8.716-11.253" />
              </svg>
            }
          />
          <MetricCard
            label="Upcoming Deadlines (30 Days)"
            value={`${upcomingDeadlines} Alerts`}
            borderAccent="border-red-500"
            trend="Critical schedule alarms"
            trendDirection={upcomingDeadlines > 0 ? "down" : "neutral"}
            icon={
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
          />
          <MetricCard
            label="Inspection Grievance Requests"
            value={`${inspectionRequests} Unresolved`}
            borderAccent="border-yellow-500"
            trend="Open citizen alerts"
            trendDirection={inspectionRequests > 0 ? "down" : "neutral"}
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
          />
        </div>

        {/* Double Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Assigned Projects List (Redesigned Active Task Cards) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4">My Supervised Civil Works</h3>
              {loading ? (
                <p className="text-xs text-slate-500">Loading works list...</p>
              ) : error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : assignedProjects.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-bold">No projects currently assigned to your email.</p>
                  <p className="text-xs text-slate-400 mt-1">Request an Officer to assign you to a project site using email: {userEmail}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedProjects.map((p) => {
                    const projectComplaintsCount = complaints.filter(
                      c => c.project_id === p.id && c.status === 'OPEN'
                    ).length;

                    return (
                      <ProjectCard
                        key={p.id}
                        name={p.name}
                        location={p.location}
                        department={p.department}
                        budget={formatCurrency(p.budget)}
                        completion={p.completion}
                        riskLevel={p.risk_level || 'Low'}
                        complaintsCount={projectComplaintsCount}
                        imageUrl={getBannerImage(p.department)}
                        onClickView={() => handleSelectProject(p)}
                      />
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
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-650 border border-slate-100 font-semibold">
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
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 text-xs transition shadow-sm cursor-pointer"
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
