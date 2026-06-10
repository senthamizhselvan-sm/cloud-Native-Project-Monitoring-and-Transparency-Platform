import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { feedbackApi, projectApi } from '../services/api';

interface Feedback {
  id: string;
  project_id: string;
  citizen_name: string;
  citizen_id: string;
  issue_type: string;
  description: string;
  image_url: string | null;
  status: string;
  location?: string | null;
  severity?: string | null;
  assigned_inspector: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  department: string;
}

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector assignment state per feedback
  const [inspectorInputs, setInspectorInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [feedbackResp, projectResp] = await Promise.all([
        feedbackApi.get('/feedback'),
        projectApi.get('/projects')
      ]);

      setFeedbacks(feedbackResp.data);

      const projectMap: Record<string, Project> = {};
      projectResp.data.forEach((p: Project) => {
        projectMap[p.id] = p;
      });
      setProjects(projectMap);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load complaints data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (feedbackId: string) => {
    setActionLoading(feedbackId);
    try {
      await feedbackApi.put(`/feedback/${feedbackId}`, {
        status: 'RESOLVED'
      });
      fetchData();
    } catch (err: any) {
      alert('Failed to resolve complaint: ' + (err?.response?.data?.detail ?? 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignInspector = async (feedbackId: string) => {
    const inspectorName = inspectorInputs[feedbackId];
    if (!inspectorName || inspectorName.trim() === '') {
      alert('Please enter an inspector name');
      return;
    }
    setActionLoading(feedbackId);
    try {
      await feedbackApi.put(`/feedback/${feedbackId}`, {
        assigned_inspector: inspectorName
      });
      setInspectorInputs(prev => ({ ...prev, [feedbackId]: '' }));
      fetchData();
    } catch (err: any) {
      alert('Failed to assign inspector: ' + (err?.response?.data?.detail ?? 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const getBadgeVariant = (status: string) => {
    return status === 'RESOLVED' ? 'success' : 'warning';
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Public Complaints & Grievances</h2>
            <p className="text-sm text-slate-500 mt-1">Review feedback, assign inspectors, and resolve citizen reports.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">{error}</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
            <span className="text-3xl">🎉</span>
            <p className="text-slate-600 mt-2 font-bold text-sm">No complaints or feedback submitted yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {feedbacks.map((fb) => {
              const project = projects[fb.project_id];
              const dateStr = new Date(fb.created_at).toLocaleString();
              return (
                <Card key={fb.id} className="p-6 border border-slate-200 rounded-xl shadow-sm bg-white">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="space-y-3 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getBadgeVariant(fb.status)}>{fb.status}</Badge>
                        {fb.severity && (
                          <Badge variant={fb.severity === 'High' ? 'danger' : fb.severity === 'Medium' ? 'warning' : 'success'}>
                            {fb.severity} Severity
                          </Badge>
                        )}
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Type: {fb.issue_type}
                        </span>
                        <span className="text-xs text-slate-400">&bull; {dateStr}</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-800 leading-snug">
                          {project ? project.name : `Project ID: ${fb.project_id}`}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
                          Department: {project ? project.department : 'Unknown'} &bull; District: {fb.location || 'Chennai'}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                        {fb.description}
                      </p>

                      {fb.image_url && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 max-w-sm">
                          <img
                            src={fb.image_url}
                            alt="Citizen attachment proof"
                            className="w-full h-44 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-3 text-xs text-slate-400 border-t border-slate-100/80 font-medium">
                        <div>
                          <strong>Reported By:</strong> {fb.citizen_name}
                        </div>
                        <div>
                          <strong>Inspector:</strong>{' '}
                          <span className={fb.assigned_inspector ? 'text-slate-700 font-bold' : 'text-slate-400 italic'}>
                            {fb.assigned_inspector || 'Not Assigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    {fb.status === 'OPEN' && (
                      <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 flex-shrink-0">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Assign Inspector
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={inspectorInputs[fb.id] || ''}
                              onChange={(e) =>
                                setInspectorInputs(prev => ({ ...prev, [fb.id]: e.target.value }))
                              }
                              placeholder="Inspector Name"
                              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                            />
                            <button
                              disabled={actionLoading === fb.id}
                              onClick={() => handleAssignInspector(fb.id)}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Assign
                            </button>
                          </div>
                        </div>

                        <button
                          disabled={actionLoading === fb.id}
                          onClick={() => handleResolve(fb.id)}
                          className="w-full text-center bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-xs font-bold py-2 rounded-lg transition"
                        >
                          {actionLoading === fb.id ? 'Processing...' : 'Mark Resolved'}
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
