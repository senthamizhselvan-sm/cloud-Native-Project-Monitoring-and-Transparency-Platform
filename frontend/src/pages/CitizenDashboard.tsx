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
    return status === 'RESOLVED' ? 'success' : 'warning';
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Citizen Portal</p>
          <h2 className="text-3xl font-bold">My Dashboard</h2>
          <p className="mt-1 text-slate-600">Track your reported issues and monitor public works.</p>
        </div>
        <Link
          to="/feedback/new"
          className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 text-sm transition shadow-sm"
        >
          📢 Report Work Issue
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">My Reported Issues</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading your issues...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">You haven't reported any public works issues yet.</p>
                <Link to="/feedback/new" className="text-sm text-blue-700 hover:underline font-semibold mt-2 block">
                  Click here to report your first issue
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Project Name</th>
                      <th className="px-4 py-3 font-medium">Issue Type</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Inspector Assigned</th>
                      <th className="px-4 py-3 font-medium">Date Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {feedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {projects[fb.project_id] || `Project ID: ${fb.project_id}`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase">{fb.issue_type}</td>
                        <td className="px-4 py-3 truncate max-w-xs">{fb.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getBadgeVariant(fb.status)}>{fb.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {fb.assigned_inspector || <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
