import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi, feedbackApi, auditApi } from '../services/api';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  risk_level?: string;
}

interface Complaint {
  id: string;
  created_at: string;
  severity?: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function OfficerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [budget, setBudget] = useState(0);
  const [location, setLocation] = useState('Chennai');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
    setFormError(null);
    setFormSuccess(null);

    if (!name || !department || !budget || !location) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await projectApi.post('/projects', {
        name,
        department,
        budget: Number(budget),
        location,
        assigned_engineer: assignedEngineer || null,
        status: 'Planned',
        completion: 0
      });
      setFormSuccess('Project created successfully!');
      setName('');
      setDepartment('');
      setBudget(0);
      setLocation('Chennai');
      setAssignedEngineer('');
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail ?? 'Failed to create project');
    }
  };

  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  
  // Widgets upgrades
  const projectsDelayed = projects.filter(p => p.status === 'Delayed').length;
  const projectsAtRisk = projects.filter(p => p.risk_level === 'High').length;
  
  // Complaints in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const complaintsThisWeek = complaints.filter(c => new Date(c.created_at) >= sevenDaysAgo).length;

  // Budget alert: projects with budget > 1 Crore and completion < 50%
  const budgetAlerts = projects.filter(p => p.budget > 10000000 && p.completion < 50).length;

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  const stats = [
    { label: 'Total Projects', value: totalProjects, color: 'border-blue-600' },
    { label: 'Projects Delayed', value: projectsDelayed, color: 'border-red-500' },
    { label: 'Projects at Risk', value: projectsAtRisk, color: 'border-orange-500' },
    { label: 'Complaints (7D)', value: complaintsThisWeek, color: 'border-yellow-500' },
    { label: 'Budget Alerts', value: budgetAlerts, color: 'border-purple-600' },
    { label: 'Total Budget', value: `₹${(totalBudget / 10000000).toFixed(2)} Cr`, color: 'border-emerald-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Officer Command Dashboard</h2>
            <p className="text-sm text-slate-500 mt-1">Direct oversight on infrastructure lifecycle, budget burn metrics, and public transparency feeds.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full">
            Authorized Role: Officer
          </span>
        </div>

        {/* Dynamic Widgets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className={`p-4 border-t-4 ${s.color} bg-white shadow-sm rounded-xl flex flex-col justify-between`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              <span className="text-xl font-black text-slate-800 mt-2 block">{s.value}</span>
            </Card>
          ))}
        </div>

        {/* Dashboard Actions and Trails */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Project Form Column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-3">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Madurai Ring Road Construction" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department *</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Highways Department" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Budget (INR) *</label>
                  <input type="number" value={budget || ''} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 15000000 (1.5 Crore)" required />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">District *</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                      required
                    >
                      <option value="Chennai">Chennai</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Salem">Salem</option>
                      <option value="Trichy">Trichy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supervising Engineer ID</label>
                    <input value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="engineer@example.com" />
                  </div>
                </div>

                <button type="submit" className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 text-xs transition shadow-sm">
                  Initialize Project
                </button>
                {formError && <p className="text-xs text-red-600 mt-1 font-semibold">{formError}</p>}
                {formSuccess && <p className="text-xs text-green-600 mt-1 font-semibold">{formSuccess}</p>}
              </form>
            </Card>

            {/* Live Activity Feed Widget */}
            <Card className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-3">System-wide Activity Trail</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent actions logged</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {activities.slice(0, 10).map((act) => (
                    <div key={act.id} className="text-[11px] leading-relaxed p-2 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
                      <span className="text-slate-700 font-medium">{act.message}</span>
                      <span className="text-[8px] text-slate-400 font-mono text-right mt-1">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Managed Projects List Column */}
          <div className="lg:col-span-8">
            <Card className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Command Catalog Projects</h3>
              {loading ? (
                <p className="text-sm text-slate-500">Loading catalog...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-slate-500">No projects to manage. Use the form to create one.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Project Title</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Budget</th>
                        <th className="px-4 py-3">Risk Level</th>
                        <th className="px-4 py-3">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-600 bg-white">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-bold text-slate-900 truncate max-w-[200px]">
                            <Link to={`/projects/${p.id}`} className="text-blue-700 hover:underline">{p.name}</Link>
                          </td>
                          <td className="px-4 py-3">{p.department} &bull; {p.location}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {p.budget >= 10000000 ? `₹${(p.budget/10000000).toFixed(2)} Cr` : `₹${(p.budget/100000).toFixed(1)} L`}
                          </td>
                          <td className="px-4 py-3">
                            {p.risk_level && (
                              <span className={`font-bold ${
                                p.risk_level === 'High' ? 'text-red-600' :
                                p.risk_level === 'Medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {p.risk_level === 'High' ? '🔴 High' : p.risk_level === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold">{p.completion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
