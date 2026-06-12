import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
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
}

export default function CitizenDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [feedbackResp, projectResp] = await Promise.all([
          feedbackApi.get('/feedback'),
          projectApi.get('/projects')
        ]);
        setFeedbacks(feedbackResp.data);

        const projectMap: Record<string, string> = {};
        projectResp.data.forEach((p: Project) => {
          projectMap[p.id] = p.name;
        });
        setProjects(projectMap);
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

  const totalIssues = feedbacks.length;
  const resolvedIssues = feedbacks.filter(f => f.status === 'RESOLVED').length;
  const pendingIssues = totalIssues - resolvedIssues;

  return (
    <section className="space-y-6 font-sans bg-slate-50 min-h-screen text-slate-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Citizen Console</p>
          <h2 className="text-3xl font-black tracking-tight mt-1 text-slate-900">My Dashboard</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Track your reported issues, inspect public works, and monitor feedback statuses.</p>
        </div>
        <Link
          to="/feedback/new"
          className="rounded-xl bg-blue-650 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 text-xs transition shadow-sm self-stretch sm:self-auto text-center flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          Report Construction Issue
        </Link>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Filed Issues</span>
            <svg className="w-5 h-5 text-blue-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{totalIssues}</p>
          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Grievances registered in database</span>
        </Card>

        <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Resolved Issues</span>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{resolvedIssues}</p>
          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Inspected and verified as resolved</span>
        </Card>

        <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Audit Issues</span>
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{pendingIssues}</p>
          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Currently under review by local engineers</span>
        </Card>
      </div>

      {/* Reports Table card */}
      <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow transition">
        <h3 className="font-extrabold text-sm text-slate-800 mb-4">My Filed Grievance Logs</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading your issues...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-bold">You haven't reported any public works issues yet.</p>
            <Link to="/feedback/new" className="text-xs text-blue-700 hover:underline font-extrabold mt-2 block">
              Click here to report your first issue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
              <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Issue Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Inspector Assigned</th>
                  <th className="px-4 py-3">Date Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-650">
                {feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">
                      <Link to={`/projects/${fb.project_id}`} className="text-blue-600 hover:underline">
                        {projects[fb.project_id] || `Project ID: ${fb.project_id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-xs text-slate-500 uppercase">{fb.issue_type}</td>
                    <td className="px-4 py-3 truncate max-w-xs" title={fb.description}>{fb.description}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant(fb.status)}>{fb.status}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-755">
                      {fb.assigned_inspector ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          {fb.assigned_inspector}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-550 font-mono">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
