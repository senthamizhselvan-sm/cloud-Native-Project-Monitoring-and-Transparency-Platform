import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { projectApi, feedbackApi, analyticsApi } from '../services/api';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState(false);

  const [stats, setStats] = useState({
    activeProjects: '128',
    delayedProjects: '14',
    budgetUtilization: '68%',
    feedbackOpen: '42 open'
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    const userName = localStorage.getItem('user_name') || 'User';
    setLoggedIn(!!token);
    setRole(userRole);
    setName(userName);

    if (token) {
      async function loadRealStats() {
        try {
          const [projRes, feedRes, budgetRes] = await Promise.all([
            projectApi.get('/projects'),
            feedbackApi.get('/feedback').catch(() => ({ data: [] })),
            analyticsApi.get('/analytics/budget').catch(() => ({ data: null }))
          ]);

          const total = projRes.data.length;
          const openFeedbacks = feedRes.data.filter((f: any) => f.status === 'OPEN').length;
          
          // Count delayed: completion < 100 and end_date is past current date
          const now = new Date();
          const delayed = projRes.data.filter((p: any) => {
            if (p.completion >= 100 || !p.end_date) return false;
            return new Date(p.end_date) < now;
          }).length;

          const utRate = budgetRes?.data?.utilization_rate ?? 68;

          setStats({
            activeProjects: String(total),
            delayedProjects: String(delayed),
            budgetUtilization: `${utRate}%`,
            feedbackOpen: `${openFeedbacks} open`
          });
        } catch (err) {
          console.warn('Could not fetch real-time stats, using default values', err);
        }
      }
      loadRealStats();
    }
  }, []);

  const formatRoleTitle = (r: string | null) => {
    if (!r) return 'Public Guest';
    if (r === 'Officer') return 'Executive Officer';
    if (r === 'Engineer') return 'Supervising Engineer';
    if (r === 'Citizen') return 'Verified Citizen';
    if (r === 'Admin') return 'System Administrator';
    return r;
  };

  // Render role-specific navigation tiles
  const renderActionTiles = () => {
    switch (role) {
      case 'Officer':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <Link to="/dashboard/officer" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Project Command Center</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Statewide projects catalog, allocate budgets, and assign supervising engineers.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Manage catalog &rarr;</span>
              </Card>
            </Link>

            <Link to="/feedback/manage" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-white transition duration-200 text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Grievance Management</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Moderate public site feedback, review safety alerts, and schedule structural audits.</p>
                </div>
                <span className="text-orange-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Review grievances &rarr;</span>
              </Card>
            </Link>

            <Link to="/analytics" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Analytical Dashboards</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Evaluate monthly spending indices, cumulative burn rates, and department standings.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Explore analytics &rarr;</span>
              </Card>
            </Link>

            <Link to="/map" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition duration-200 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8m.75-12h-7.5A2.25 2.25 0 0 0 6 9v7.5A2.25 2.25 0 0 0 8.25 18.75h7.5A2.25 2.25 0 0 0 18 16.5V9a2.25 2.25 0 0 0-2.25-2.25Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Statewide GIS map</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Inspect geological locations and regional layout scopes of all active civil works.</p>
                </div>
                <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Inspect map &rarr;</span>
              </Card>
            </Link>
          </div>
        );
      case 'Engineer':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            <Link to="/dashboard/engineer" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.03V3m0 3a9 9 0 0 1 9 9m-9-9a9 9 0 0 0-9 9" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Engineer Work-Center</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Manage your assigned projects checklist, log progress percentage changes, and track deadlines.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Open dashboard &rarr;</span>
              </Card>
            </Link>

            <Link to="/projects" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">State Projects Registry</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Browse statewide civil projects directory, inspect detailed templates, timelines, and budgets.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">View projects &rarr;</span>
              </Card>
            </Link>

            <Link to="/map" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition duration-200 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585c-.083-.177-.127-.565V9.75c0-.621-.504-1.125-1.125-1.125h-1.125a1.125 1.125 0 0 1-1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H9.75a9 9 0 0 0-9 9c0 1.114.2 2.18.567 3.167" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">GIS Project Locations</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Inspect geological locations and regional layout coordinates of all active civil works.</p>
                </div>
                <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Inspect map &rarr;</span>
              </Card>
            </Link>
          </div>
        );
      case 'Citizen':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            <Link to="/dashboard/citizen" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">My Grievances Portal</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Monitor progress tracking on reported site safety concerns or resource delays.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Track complaints &rarr;</span>
              </Card>
            </Link>

            <Link to="/feedback/new" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-white transition duration-200 text-orange-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Report Site Defect</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Submit a new site safety concern or resource delay report, attach progress photos.</p>
                </div>
                <span className="text-orange-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">File report &rarr;</span>
              </Card>
            </Link>

            <Link to="/public" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Transparency Portal</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Inspect newly completed works, read spotlight reviews, and look up district statistics.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Browse portal &rarr;</span>
              </Card>
            </Link>
          </div>
        );
      case 'Contractor':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            <Link to="/dashboard/contractor" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Contractor Work-Center</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Supervise won project sites, record milestone completions, and upload tender document certs.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Open dashboard &rarr;</span>
              </Card>
            </Link>

            <Link to="/projects" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">State Projects Registry</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Browse statewide civil projects directory, inspect detailed templates, timelines, and budgets.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">View projects &rarr;</span>
              </Card>
            </Link>

            <Link to="/map" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition duration-200 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585c-.083-.177-.565V9.75c0-.621-.504-1.125-1.125-1.125h-1.125a1.125 1.125 0 0 1-1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H9.75a9 9 0 0 0-9 9c0 1.114.2 2.18.567 3.167" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">GIS Project Locations</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Inspect geological locations and regional layout coordinates of all active civil works.</p>
                </div>
                <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Inspect map &rarr;</span>
              </Card>
            </Link>
          </div>
        );
      case 'Admin':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <Link to="/admin" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827a1.125 1.125 0 0 1 .26 1.43l-1.297 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Control Panel</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Monitor microservices cluster status, response times, and system performance.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Inspect cluster &rarr;</span>
              </Card>
            </Link>

            <Link to="/admin/audit" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-white transition duration-200 text-orange-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 2.714Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Audit Trails</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Verify logins, trace administrative updates, and check global audit timeline trails.</p>
                </div>
                <span className="text-orange-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">View security logs &rarr;</span>
              </Card>
            </Link>

            <Link to="/analytics" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Global Analytics</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Review spend summaries, burn-rates, and department ratings.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Explore analytics &rarr;</span>
              </Card>
            </Link>

            <Link to="/projects" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition duration-200 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">State Projects Registry</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Supervise full project records directory statewide.</p>
                </div>
                <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Browse projects &rarr;</span>
              </Card>
            </Link>
          </div>
        );
      default:
        // Guest layout / shortcuts
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <Link to="/public" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition duration-200 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Public Transparency Portal</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Inspect spotlight civil projects, read completed success stories, and view metrics.</p>
                </div>
                <span className="text-blue-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Browse Portal &rarr;</span>
              </Card>
            </Link>

            <Link to="/map" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition duration-200 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585c-.083-.177-.127-.565V9.75c0-.621-.504-1.125-1.125-1.125h-1.125a1.125 1.125 0 0 1-1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H9.75a9 9 0 0 0-9 9c0 1.114.2 2.18.567 3.167" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">GIS Project Location Map</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Geolocate construction zones, search projects near you, and read site summaries.</p>
                </div>
                <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Inspect map &rarr;</span>
              </Card>
            </Link>

            <Link to="/register" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-white transition duration-200 text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Register Citizen Profile</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Create an account to submit safety complaints, trace inspector assignments, and get alerts.</p>
                </div>
                <span className="text-orange-600 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Sign Up &rarr;</span>
              </Card>
            </Link>

            <Link to="/login" className="group">
              <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-500 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition duration-200 text-emerald-650">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Console Portal Access</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">Sign in to your dashboard to manage, analyze, or report project status changes.</p>
                </div>
                <span className="text-emerald-655 font-extrabold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition duration-150 inline-block mt-4">Login to account &rarr;</span>
              </Card>
            </Link>
          </div>
        );
    }
  };

  return (
    <section className="space-y-8 font-sans pb-12">
      {/* Hero Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
            {formatRoleTitle(role)} Console
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-none">
            {loggedIn ? `Welcome Back, ${name}.` : 'Monitor public projects with total transparency.'}
          </h2>
          <p className="mt-4 max-w-2xl text-xs md:text-sm text-slate-350 leading-relaxed font-semibold">
            {loggedIn 
              ? 'Your personalized workspace is ready. Access role-specific analytics, logs, timelines, and geographical monitoring nodes.'
              : 'A unified cloud portal for citizens, officers, engineers, and contractors to track progress, costs, documents, and grievances.'}
          </p>
        </div>
      </div>

      {/* Statewide Core KPI Widgets */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Statewide Monitoring Metrics</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Projects</span>
              <svg className="w-5 h-5 text-blue-600 transition duration-200 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21V3m0 18a9.005 9.005 0 0 0 8.716-11.253" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.activeProjects}</p>
            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Under statewide construction</span>
          </Card>

          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Delayed Projects</span>
              <svg className="w-5 h-5 text-red-500 transition duration-200 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-black text-red-655">{stats.delayedProjects}</p>
            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Exceeded scheduled bounds</span>
          </Card>

          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Budget Spent Rate</span>
              <svg className="w-5 h-5 text-emerald-500 transition duration-200 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.budgetUtilization}</p>
            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Sanctioned funds utilized</span>
          </Card>

          <Card className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm transition hover:shadow-md">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Citizen Feedback</span>
              <svg className="w-5 h-5 text-indigo-500 transition duration-200 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.12 2.76 2.68 2.76h12.14c1.56 0 2.68-1.16 2.68-2.76V6.75c0-1.6-1.12-2.76-2.68-2.76H5.06c-1.56 0-2.68 1.16-2.68 2.76v7.51Z" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 capitalize">{stats.feedbackOpen}</p>
            <span className="text-[9px] text-slate-400 block mt-1 font-semibold">Grievances open in queues</span>
          </Card>
        </div>
      </div>

      {/* Interactive Command Shortcuts */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-baseline">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Quick Navigation Shortcuts</h3>
          {loggedIn && (
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Adapting to role: {role}
            </span>
          )}
        </div>
        
        {renderActionTiles()}
      </div>

      {/* Participatory Monitoring Section */}
      {!loggedIn && (
        <Card className="p-8 border border-slate-250 bg-white rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 text-lg">Are you a registered Civil Engineer or Regional Officer?</h4>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-semibold">
              Log in with your executive email credentials to access internal scheduling panels, progress validation logs, AI predictions, and document control vaults.
            </p>
          </div>
          <Link
            to="/login"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition shadow-sm self-stretch md:self-auto text-center"
          >
            Access Dashboard Panel
          </Link>
        </Card>
      )}
    </section>
  );
}
