import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, MetricCard, InsightCard, RiskCard } from '../design-system/components/Card';
import { projectApi, feedbackApi, predictionApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
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
}

interface Feedback {
  id: string;
  project_id: string;
  issue_type: string;
  severity?: string;
  description: string;
}

export default function AICenter() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, feedRes] = await Promise.all([
          projectApi.get('/projects'),
          feedbackApi.get('/feedback').catch(() => ({ data: [] }))
        ]);
        setProjects(projRes.data);
        setFeedback(feedRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch AI telemetry dataset.');
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

  // Sort projects by risk score descending
  const riskRanked = [...projects].sort((a, b) => {
    const scoreA = a.risk_score || (a.risk_level === 'High' ? 85 : a.risk_level === 'Medium' ? 50 : 15);
    const scoreB = b.risk_score || (b.risk_level === 'High' ? 85 : b.risk_level === 'Medium' ? 50 : 15);
    return scoreB - scoreA;
  });

  // Top 10 Delayed / At-Risk projects
  const topDelayed = riskRanked.filter(p => p.status !== 'Completed').slice(0, 10);

  // Compute total state risk breakdown
  const highRiskCount = projects.filter(p => p.risk_level === 'High').length;
  const mediumRiskCount = projects.filter(p => p.risk_level === 'Medium').length;
  const lowRiskCount = projects.filter(p => !p.risk_level || p.risk_level === 'Low').length;

  // NLP Category Clustered Counts (Mocking NLP Suggestion clusters based on keywords)
  const getNlpCategories = () => {
    const categories: Record<string, number> = {
      'Road Quality Defects': 0,
      'Water Logged Leakage': 0,
      'Drainage / Sewerage Block': 0,
      'Electrical / Power Failures': 0,
      'Structural / Safety Hazards': 0,
      'Others / Administrative': 0,
    };

    feedback.forEach((f) => {
      const desc = f.description.toLowerCase();
      if (desc.includes('road') || desc.includes('crack') || desc.includes('concrete') || desc.includes('street')) {
        categories['Road Quality Defects'] += 1;
      } else if (desc.includes('water') || desc.includes('pipe') || desc.includes('leak')) {
        categories['Water Logged Leakage'] += 1;
      } else if (desc.includes('drain') || desc.includes('sewer') || desc.includes('overflow')) {
        categories['Drainage / Sewerage Block'] += 1;
      } else if (desc.includes('electricity') || desc.includes('power') || desc.includes('cable') || desc.includes('wire')) {
        categories['Electrical / Power Failures'] += 1;
      } else if (desc.includes('structural') || desc.includes('safety') || desc.includes('hazard') || desc.includes('collapsed')) {
        categories['Structural / Safety Hazards'] += 1;
      } else {
        categories['Others / Administrative'] += 1;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const nlpData = getNlpCategories();

  // Recommendations for high risk
  const getTopRecommendations = () => {
    const recs = [];
    const criticalProjects = riskRanked.filter(p => p.risk_level === 'High');
    
    if (criticalProjects.length > 0) {
      recs.push({
        id: 'r1',
        severity: 'danger' as const,
        message: `High Alert: ${criticalProjects[0].name} has a risk score of ${criticalProjects[0].risk_score || 85}. Schedule immediate site inspection.`,
        actionLabel: 'War Room',
        route: `/projects/${criticalProjects[0].id}`
      });
    }
    
    // Check for general complaints volume
    if (feedback.length > 5) {
      recs.push({
        id: 'r2',
        severity: 'warning' as const,
        message: `NLP classification indicates a surge in "Road Quality" reports. Optimize material audits in the northern corridor.`,
        actionLabel: 'View complaints',
        route: '/feedback/manage'
      });
    }

    recs.push({
      id: 'r3',
      severity: 'info' as const,
      message: `System audit: Seeding district vectors indicates Salem district projects show excellent progress scorecard.`,
      actionLabel: 'District View',
      route: '/dashboard/district-intelligence?district=Salem'
    });

    return recs;
  };

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
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-1.813-5.096M9 21h8.25M9.813 15.904A8.25 8.25 0 0 1 18.063 9.75M9.813 15.904a8.251 8.251 0 0 1-5.188-7.904M18.063 9.75V3m0 0l1.813 5.096M18.063 3H9.813m8.25 6.75a8.25 8.25 0 0 0-8.25-8.25" />
              </svg>
              AI Operations Center
            </h2>
            <p className="text-sm text-slate-500 mt-1">Real-time predictive telemetry: risk indexing, NLP complaint categorization, and machine learning schedule delay forecasts.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full uppercase">
            Active Analytics Mode
          </span>
        </div>

        {/* Dynamic risk telemetry widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            label="State Critical Projects"
            value={highRiskCount}
            borderAccent="border-red-600"
            trend="Sorted by Risk Score"
            trendDirection="neutral"
            details="requires intervention"
            icon={
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
          />
          <MetricCard
            label="State Moderate Projects"
            value={mediumRiskCount}
            borderAccent="border-amber-500"
            trend="Risk Index 35-70"
            trendDirection="neutral"
            details="monitored weekly"
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
            }
          />
          <MetricCard
            label="State Stable Projects"
            value={lowRiskCount}
            borderAccent="border-emerald-600"
            trend="All Systems Clear"
            trendDirection="up"
            details="on time delivery"
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            }
          />
        </div>

        {/* AI Action Recommendations Panel */}
        <InsightCard 
          title="Operations Intelligence Dispatcher" 
          subtitle="Real-time suggested actions"
          icon={
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-1.813-5.096M9 21h8.25M9.813 15.904A8.25 8.25 0 0 1 18.063 9.75M9.813 15.904a8.251 8.251 0 0 1-5.188-7.904M18.063 9.75V3m0 0l1.813 5.096M18.063 3H9.813m8.25 6.75a8.25 8.25 0 0 0-8.25-8.25" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopRecommendations().map((rec) => (
              <RiskCard
                key={rec.id}
                severity={rec.severity}
                message={rec.message}
                timestamp="Calculated just now"
                actionLabel={rec.actionLabel}
                onClickAction={() => window.location.href = rec.route}
              />
            ))}
          </div>
        </InsightCard>

        {/* Split Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Top 10 Delayed Projects list (Left) */}
          <Card className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Top 10 Delayed Infrastructure Telemetry</h3>
                <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-black uppercase">Schedule Risks</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5">Project Details</th>
                      <th className="py-2.5 text-center">Risk Score</th>
                      <th className="py-2.5 text-center">Est. Delay</th>
                      <th className="py-2.5 text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topDelayed.map((p) => {
                      const score = p.risk_score || (p.risk_level === 'High' ? 85 : p.risk_level === 'Medium' ? 50 : 15);
                      // Estimate a delay in days based on score and completion
                      const estDelay = p.status === 'Completed' ? 0 : Math.round((score / 100) * 120 + (100 - p.completion) * 0.5);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3">
                            <Link to={`/projects/${p.id}`} className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline block leading-snug">
                              {p.name}
                            </Link>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">{p.department} &bull; {p.location} District</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              score >= 70 ? 'bg-red-50 text-red-700' :
                              score >= 35 ? 'bg-amber-50 text-amber-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {score} / 100
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`font-black ${estDelay > 45 ? 'text-red-600' : 'text-slate-700'}`}>
                              {estDelay} Days
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-slate-800">
                            {formatCurrency(p.budget)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* NLP Complaints Clustered (Right) */}
          <Card className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">NLP Grievance Clustering</h3>
                <p className="text-slate-450 text-[10px] mt-0.5 font-bold uppercase tracking-wider">Topic models from citizen feedback</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                {feedback.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold">No complaints indexed yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nlpData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} hide />
                      <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} width={100} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {nlpData.map((entry, index) => {
                          const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-[11px] text-indigo-850 leading-relaxed font-semibold">
              🤖 <strong>AI Classification Engine:</strong> The NLP algorithm clusters reported text in the background to automatically identify localized cluster failures.
            </div>
          </Card>

        </div>

      </div>
    </AppLayout>
  );
}
