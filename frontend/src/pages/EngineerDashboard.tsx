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
  const assignedProjectIds = assignedProjects.map(p => p.id);

  // 1. Pending Tasks count (Active construction projects not yet completed)
  const pendingTasks = assignedProjects.filter(p => p.completion < 100 && p.status !== 'Completed').length;

  // 2. Upcoming Deadlines (Project end_date within 30 days and completion < 90)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const upcomingDeadlines = assignedProjects.filter(p => {
    if (!p.end_date || p.completion >= 90) return false;
    const deadline = new Date(p.end_date);
    return deadline > new Date() && deadline <= thirtyDaysFromNow;
  }).length;

  // 3. Inspection Requests (Active complaints against the engineer's assigned projects)
  const inspectionRequests = complaints.filter(
    c => assignedProjectIds.includes(c.project_id) && c.status === 'OPEN'
  ).length;

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete')) return 'success';
    if (s.includes('progress') || s.includes('ongoing')) return 'info';
    if (s.includes('plan')) return 'warning';
    return 'danger';
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Engineer Work-Center</h2>
            <p className="text-sm text-slate-500 mt-1">Supervise assigned project execution plans, report completion progress, and track citizen inspections.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full">
            Logged: {userEmail}
          </span>
        </div>

        {/* Engineer Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 border-t-4 border-orange-500 bg-white shadow-sm rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Active Tasks</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{pendingTasks} Projects</span>
            </div>
            <span className="text-3xl">🏗️</span>
          </Card>
          
          <Card className="p-5 border-t-4 border-red-500 bg-white shadow-sm rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Deadlines (30 Days)</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{upcomingDeadlines} Alerts</span>
            </div>
            <span className="text-3xl">⚠️</span>
          </Card>

          <Card className="p-5 border-t-4 border-yellow-500 bg-white shadow-sm rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inspection Grievance Requests</span>
              <span className="text-3xl font-black text-slate-800 mt-1.5 block">{inspectionRequests} Unresolved</span>
            </div>
            <span className="text-3xl">🕵️</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Assigned Projects List */}
          <div className="lg:col-span-8">
            <Card className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">My Supervised Civil Works</h3>
              {loading ? (
                <p className="text-sm text-slate-500">Loading works list...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : assignedProjects.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 font-bold">No projects currently assigned to your email.</p>
                  <p className="text-xs text-slate-400 mt-1">Request an Officer to assign you to a project site using email: {userEmail}</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Project Title</th>
                        <th className="px-4 py-3">District</th>
                        <th className="px-4 py-3">Risk Assessment</th>
                        <th className="px-4 py-3">Completion</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-600">
                      {assignedProjects.map((p) => (
                        <tr key={p.id} className={`hover:bg-slate-50/50 transition ${selectedProject?.id === p.id ? 'bg-blue-50/20' : ''}`}>
                          <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">
                            <Link to={`/projects/${p.id}`} className="text-blue-700 hover:underline">{p.name}</Link>
                          </td>
                          <td className="px-4 py-3 capitalize">{p.location}</td>
                          <td className="px-4 py-3">
                            {p.risk_level && (
                              <Badge variant={p.risk_level === 'High' ? 'danger' : p.risk_level === 'Medium' ? 'warning' : 'success'}>
                                {p.risk_level}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold">{p.completion}%</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleSelectProject(p)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                            >
                              Edit Progress
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Update Progress Form */}
          <div className="lg:col-span-4">
            <Card className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Log Progress Audits</h3>
              {selectedProject ? (
                <form onSubmit={handleUpdateProgress} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <div className="font-bold text-slate-800 truncate mb-0.5">{selectedProject.name}</div>
                    <div>{selectedProject.department} &bull; {selectedProject.location}</div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Inspection Scheduled">Inspection Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Completion Percentage: <span className="text-blue-700 font-extrabold">{completion}%</span>
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

                  <button type="submit" className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 text-xs transition shadow-sm">
                    Save Progress Audits
                  </button>
                  {updateError && <p className="text-xs text-red-600 mt-1 font-semibold">{updateError}</p>}
                  {updateSuccess && <p className="text-xs text-green-600 mt-1 font-semibold">{updateSuccess}</p>}
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
