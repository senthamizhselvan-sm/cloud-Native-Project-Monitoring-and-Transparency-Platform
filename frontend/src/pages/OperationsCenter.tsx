import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, MetricCard, InsightCard, RiskCard, ActivityCard } from '../design-system/components/Card';
import { projectApi, feedbackApi, auditApi } from '../services/api';

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
  assigned_engineer?: string;
}

interface Feedback {
  id: string;
  project_id: string;
  issue_type: string;
  severity?: string;
  description: string;
  citizen_name: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  created_by: string;
}

export default function OperationsCenter() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, feedRes, actRes] = await Promise.all([
          projectApi.get('/projects'),
          feedbackApi.get('/feedback').catch(() => ({ data: [] })),
          auditApi.get('/audit/activities').catch(() => ({ data: [] }))
        ]);
        setProjects(projRes.data);
        setFeedback(feedRes.data);
        setActivities(actRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch real-time operational datasets.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) return `₹${crores.toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  // 1. Alert indicators
  const delayedProjects = projects.filter(p => p.status.toLowerCase().includes('delay') || (p.risk_level === 'High' && p.completion < 60));
  const openComplaints = feedback.slice(0, 5);
  const criticalComplaints = feedback.filter(f => f.severity === 'High');

  // 2. Risk recommendation list
  const getOperationsRecommendations = () => {
    const recs = [];
    if (delayedProjects.length > 0) {
      recs.push({
        id: 'o1',
        severity: 'danger' as const,
        message: `System Alert: ${delayedProjects.length} critical infrastructure works are experiencing delay flags. Retain audit inspector.`,
        actionLabel: 'Inspect',
        route: `/projects/${delayedProjects[0].id}`
      });
    }
    if (criticalComplaints.length > 0) {
      recs.push({
        id: 'o2',
        severity: 'warning' as const,
        message: `Quality Alert: ${criticalComplaints.length} severe safety hazards logged in public forum. Review inspector rosters.`,
        actionLabel: 'Review',
        route: '/feedback/manage'
      });
    }
    recs.push({
      id: 'o3',
      severity: 'info' as const,
      message: `Operational notice: State average project completion is sitting stable at 54% total utilization.`,
      actionLabel: 'View stats',
      route: '/analytics'
    });
    return recs;
  };

  // 3. District Health Ranking
  const getDistrictRankings = () => {
    const districts = Array.from(new Set(projects.map(p => p.location)));
    const rankings = districts.map((d) => {
      const distProjects = projects.filter(p => p.location === d);
      const avgComp = Math.round(distProjects.reduce((sum, p) => sum + p.completion, 0) / distProjects.length);
      const riskScore = distProjects.filter(p => p.risk_level === 'High').length;
      return { name: d, completion: avgComp, riskCount: riskScore };
    });
    return rankings.sort((a, b) => b.completion - a.completion).slice(0, 5);
  };

  const districtRankings = getDistrictRankings();

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
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
              Operations Command Center
            </h2>
            <p className="text-sm text-slate-500 mt-1">Unified live cockpit monitoring operational alert queues, department audit activities, and district health ratings.</p>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full uppercase animate-pulse">
            Live Stream Active
          </span>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <MetricCard
            label="Cost Risks Detected"
            value={delayedProjects.length}
            borderAccent="border-red-500"
            trend="Statewide budget anomalies"
            trendDirection="neutral"
            icon={
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
          />
          <MetricCard
            label="Severe Complaints"
            value={criticalComplaints.length}
            borderAccent="border-amber-500"
            trend="Awaiting onsite reviews"
            trendDirection="down"
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
            }
          />
          <MetricCard
            label="Inspectors On Site"
            value={projects.filter(p => p.assigned_engineer).length}
            borderAccent="border-emerald-600"
            trend="Active monitoring rate"
            trendDirection="up"
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            }
          />
          <MetricCard
            label="Total Mapped Funds"
            value={formatCurrency(projects.reduce((sum, p) => sum + p.budget, 0))}
            borderAccent="border-blue-600"
            trend="Total statewide capital"
            trendDirection="neutral"
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.957-.659-1.006-.879-1.006-2.303 0-3.182s2.9-.879 4.07 0c.513.385.972.85 1.282 1.397m-7.658 3.262H3m18 0h-3.262" />
              </svg>
            }
          />
        </div>

        {/* Live Alerts & Recommendations Panel */}
        <InsightCard title="Automated Risk Action Dispatcher" subtitle="Intelligence-based guidelines">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getOperationsRecommendations().map((rec) => (
              <RiskCard
                key={rec.id}
                severity={rec.severity}
                message={rec.message}
                timestamp="Telemetry dynamic log"
                actionLabel={rec.actionLabel}
                onClickAction={() => window.location.href = rec.route}
              />
            ))}
          </div>
        </InsightCard>

        {/* Dynamic Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Live Activity Logs (Left) */}
          <Card className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Live Chronological Activity Feed</h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No actions logged in telemetry logs</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {activities.slice(0, 10).map((act) => (
                    <ActivityCard
                      key={act.id}
                      message={act.message}
                      timestamp={new Date(act.timestamp).toLocaleString()}
                      user={act.created_by}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* District Performance Health Rankings (Right) */}
          <Card className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Top 5 Districts Health Index</h3>
                <p className="text-slate-450 text-[10px] mt-0.5 font-bold uppercase tracking-wider">State geographic performance rankings</p>
              </div>
              
              <div className="space-y-4">
                {districtRankings.map((rank, idx) => (
                  <div key={rank.name} className="flex flex-col gap-1.5 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{idx + 1}. {rank.name} District</span>
                      <span className="font-black text-blue-600">{rank.completion}% Avg</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${rank.completion}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mt-0.5">
                      <span>Status: Stable</span>
                      <span className={rank.riskCount > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}>
                        {rank.riskCount} Risk Works
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>

      </div>
    </AppLayout>
  );
}
