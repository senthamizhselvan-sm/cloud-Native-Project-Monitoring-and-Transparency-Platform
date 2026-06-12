import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, MetricCard, InsightCard, RiskCard, ActivityCard } from '../design-system/components/Card';
import ProgressCircle from '../components/ui/ProgressCircle';
import Badge from '../components/ui/Badge';
import { projectApi, documentApi, feedbackApi, predictionApi, auditApi } from '../services/api';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  start_date: string | null;
  end_date: string | null;
  assigned_engineer: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  risk_level?: string;
  risk_score?: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  created_by: string;
  timestamp: string;
  image_url?: string | null;
}

interface DocumentItem {
  id: string;
  filename: string;
  file_url: string;
  document_type: string;
  version: number;
  uploaded_at: string;
}

interface FeedbackItem {
  id: string;
  citizen_name: string;
  issue_type: string;
  description: string;
  status: string;
  location?: string | null;
  severity?: string | null;
  image_url?: string | null;
  assigned_inspector?: string;
}

interface DelayPrediction {
  delay_risk: string;
  risk_score: number;
  description: string;
  expected_delay_days?: number;
}

interface CostPrediction {
  expected_cost_increase_percent: number;
  expected_final_cost: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  // AI Prediction states
  const [delayPred, setDelayPred] = useState<DelayPrediction | null>(null);
  const [costPred, setCostPred] = useState<CostPrediction | null>(null);
  const [projectSummary, setProjectSummary] = useState<string | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Tab & role states
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery' | 'documents' | 'feedback'>('timeline');
  const [galleryFilter, setGalleryFilter] = useState('All');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [addingEvent, setAddingEvent] = useState(false);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Tender Document');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function loadDetails() {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, timeRes, docRes, feedRes, actRes] = await Promise.all([
        projectApi.get(`/projects/${projectId}`),
        projectApi.get(`/projects/${projectId}/timeline`).catch(() => ({ data: [] })),
        documentApi.get(`/documents/project/${projectId}`).catch(() => ({ data: [] })),
        feedbackApi.get(`/feedback/project/${projectId}`).catch(() => ({ data: [] })),
        auditApi.get('/audit/activities', { params: { project_id: projectId } }).catch(() => ({ data: [] }))
      ]);

      setProject(projRes.data);
      setTimeline(timeRes.data);
      setDocuments(docRes.data);
      setFeedback(feedRes.data);
      setActivities(actRes.data);

      // Run ML predictions if logged in
      if (localStorage.getItem('access_token')) {
        try {
          setPredLoading(true);
          const predInput = {
            budget: projRes.data.budget,
            district: projRes.data.location,
            past_progress: projRes.data.completion
          };
          const [delayRes, costRes] = await Promise.all([
            predictionApi.post('/prediction/delay', predInput),
            predictionApi.post('/prediction/cost-overrun', predInput)
          ]);
          setDelayPred(delayRes.data);
          setCostPred(costRes.data);

          // Get AI NL Project Summary
          const sumRes = await predictionApi.post('/prediction/summarize-project', {
            name: projRes.data.name,
            department: projRes.data.department,
            budget: projRes.data.budget,
            completion: projRes.data.completion,
            status: projRes.data.status,
            complaints_count: feedRes.data.length,
            risk_level: projRes.data.risk_level || "Low"
          });
          setProjectSummary(sumRes.data.summary);
        } catch (pErr) {
          console.error('Prediction API failed', pErr);
        } finally {
          setPredLoading(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    loadDetails();
  }, [projectId]);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !eventTitle.trim()) return;
    try {
      setAddingEvent(true);
      
      let uploadedUrl = null;
      // If a milestone photo was attached, upload it first to document-service
      if (eventFile) {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('document_type', 'Progress Photo');
        formData.append('file', eventFile);
        const fileRes = await documentApi.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = fileRes.data.file_url;
      }

      await projectApi.post(`/projects/${projectId}/timeline`, {
        title: eventTitle,
        description: eventDesc,
        image_url: uploadedUrl
      });
      
      setEventTitle('');
      setEventDesc('');
      setEventFile(null);
      const fileInput = document.getElementById('timeline-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Reload timeline and documents
      loadDetails();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Failed to add timeline event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !docFile) return;
    try {
      setUploadingDoc(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('document_type', docType);
      formData.append('file', docFile);

      await documentApi.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDocFile(null);
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      loadDetails();
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail ?? 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl max-w-2xl mx-auto border border-red-200">
        <h3 className="font-semibold text-lg">Error Loading Project</h3>
        <p className="text-sm mt-1">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-sm underline mt-4 block text-blue-700 font-medium">
          &larr; Back to projects list
        </Link>
      </div>
    );
  }

  const startDateStr = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set';
  const endDateStr = project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set';
  
  const getBadgeVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete')) return 'success';
    if (s.includes('progress') || s.includes('ongoing')) return 'info';
    if (s.includes('plan')) return 'warning';
    return 'danger';
  };

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Crore`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  const isOfficerOrEngineer = role === 'Officer' || role === 'Engineer' || role === 'Admin';
  
  // Group photos
  const isPhoto = (dType: string) => {
    const t = dType.toLowerCase();
    return t.includes('photo') || t.includes('image');
  };
  const photoDocuments = documents.filter((d) => isPhoto(d.document_type));
  const textDocuments = documents.filter((d) => !isPhoto(d.document_type));

  const getBannerImage = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('water')) return 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('road') || d.includes('highway')) return 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('health')) return 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('school') || d.includes('education')) return 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('municipal') || d.includes('drainage')) return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('energy') || d.includes('power')) return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200';
    if (d.includes('agri')) return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200';
    return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=1200';
  };

  const getGalleryFallbacks = () => {
    const defaultDate = project.created_at || new Date().toISOString();
    return [
      { id: 'f1', document_type: 'Before Construction Photo', filename: 'Site_Inspection_PreConstruction.jpg', file_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600', version: 1, uploaded_at: defaultDate },
      { id: 'f2', document_type: 'Progress Photo', filename: 'Foundation_Concrete_Pouring.jpg', file_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600', version: 1, uploaded_at: defaultDate },
      { id: 'f3', document_type: 'Inspection Photo', filename: 'Structural_Safety_Audit.jpg', file_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600', version: 1, uploaded_at: defaultDate },
      { id: 'f4', document_type: 'After Completion Photo', filename: 'Finished_Infrastructure_Handover.jpg', file_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600', version: 1, uploaded_at: defaultDate }
    ];
  };

  const finalPhotosList = photoDocuments.length > 0 ? photoDocuments : getGalleryFallbacks();
  const filteredPhotos = finalPhotosList.filter((p) => {
    if (galleryFilter === 'All') return true;
    return p.document_type.toLowerCase().includes(galleryFilter.toLowerCase());
  });

  // Dynamic recommendations based on risk score and status
  const getAIRecommendations = () => {
    const recs: { type: 'danger' | 'warning' | 'success' | 'info'; text: string }[] = [];
    const score = project.risk_score || (delayPred ? delayPred.risk_score : 10);
    
    if (score >= 70) {
      recs.push({ type: 'danger', text: 'Critical delay alert: Assign additional labor forces to site immediately.' });
      recs.push({ type: 'info', text: 'Schedule on-site safety and structural inspection within 24 hours.' });
    } else if (score >= 35) {
      recs.push({ type: 'warning', text: 'Medium alert: Optimize material pipeline supply chains to mitigate delay.' });
      recs.push({ type: 'info', text: 'Schedule monthly validation review with supervising engineer.' });
    } else {
      recs.push({ type: 'success', text: 'All systems clear: Proceed with current schedule checkpoints.' });
    }

    if (feedback.filter(f => f.status === 'OPEN').length > 2) {
      recs.push({ type: 'warning', text: 'Review active citizen grievances regarding environmental/safety hazards.' });
    }

    return recs;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 bg-slate-50 text-slate-900 font-sans">
      
      {/* Back Link */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <Link to="/projects" className="text-xs text-blue-700 hover:underline font-bold flex items-center gap-1">
          <span>&larr;</span> Back to project command catalog
        </Link>
      </div>

      {/* Hero Banner Header */}
      <div className="mx-4 sm:mx-6 lg:mx-8 rounded-2xl overflow-hidden relative shadow-md h-64 md:h-72 border border-slate-200">
        <img 
          src={getBannerImage(project.department)} 
          alt="Project Hero Banner" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent flex flex-col justify-end p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
              project.risk_level === 'High' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
              project.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-200 border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Risk: {project.risk_level || 'Low'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
              project.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
              project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' :
              'bg-amber-500/20 text-amber-200 border-amber-500/30'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.64 8.38m5.95 5.99a5.96 5.96 0 0 1-5.84-7.38m0 0v4.8m0-4.8a14.98 14.98 0 0 1 6.16 12.12" />
              </svg>
              Status: {project.status}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">{project.name}</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 uppercase tracking-wider font-semibold">
            {project.department} &bull; {project.location} District
          </p>
        </div>
      </div>

      {/* High-density Top KPI / Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 px-4 sm:px-6 lg:px-8">
        <MetricCard
          label="Sanctioned Budget"
          value={formatCurrency(project.budget)}
          borderAccent="border-blue-600"
          trend="Capital Outlay Pool"
          trendDirection="neutral"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.957-.659-1.006-.879-1.006-2.303 0-3.182s2.9-.879 4.07 0c.513.385.972.85 1.282 1.397m-7.658 3.262H3m18 0h-3.262" />
            </svg>
          }
        />
        <MetricCard
          label="Physical Progress"
          value={`${project.completion}%`}
          borderAccent="border-emerald-600"
          trend="Worksite Completion Rate"
          trendDirection="up"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
          }
        />
        <MetricCard
          label="Projected Delay"
          value={delayPred && typeof delayPred.expected_delay_days === 'number' ? `${delayPred.expected_delay_days} Days` : "No Delay Risk"}
          borderAccent="border-amber-500"
          trend="ML Predictive Forecast"
          trendDirection={delayPred && typeof delayPred.expected_delay_days === 'number' && delayPred.expected_delay_days > 0 ? "down" : "neutral"}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <MetricCard
          label="Risk Index Score"
          value={`${project.risk_score || (delayPred ? delayPred.risk_score : 10)} / 100`}
          borderAccent={(project.risk_score || 10) >= 70 ? 'border-red-500' : (project.risk_score || 10) >= 35 ? 'border-amber-500' : 'border-emerald-500'}
          trend="Dynamic Risk Matrix"
          trendDirection="neutral"
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
        />
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Mission Control Split Screen */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Progress & Capital Utilization Cockpit */}
          <Card className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4">Capitalization & Timelines Cockpit</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left Sub-Section: Stats */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                    <span className="text-xs font-bold text-slate-700 block">{startDateStr}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Completion</span>
                    <span className="text-xs font-bold text-slate-700 block">{endDateStr}</span>
                  </div>
                </div>
                
                {/* Physical Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Physical Completion</span>
                    <span>{project.completion}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.completion}%` }}></div>
                  </div>
                </div>

                {/* Budget Utilization bar (derived visual helper) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Expended Capital Ratio (Budget Utilization)</span>
                    <span>{project.status === 'Completed' ? 100 : Math.max(10, Math.min(100, Math.round(project.completion * 1.1)))}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-800 h-2 rounded-full" style={{ width: `${project.status === 'Completed' ? 100 : Math.max(10, Math.min(100, Math.round(project.completion * 1.1)))}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Right Sub-Section: Visual Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0">
                <ProgressCircle value={project.completion} size={90} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Completion Gauge</span>
              </div>

            </div>
          </Card>

          {/* Side-by-Side Splits: Milestone Timeline vs Document Registry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column A: Milestone Registry */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Milestone Timeline
                </h4>
              </div>

              {/* Add Milestone Log inside (only visible to Officer/Engineer) */}
              {isOfficerOrEngineer && (
                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-xl space-y-3">
                  <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Log Construction Milestone</span>
                  <form onSubmit={handleAddTimeline} className="space-y-3">
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Milestone Title (e.g. Roof casting completed)"
                      required
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="Brief details of progress..."
                      rows={2}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Upload progress photo (optional)</label>
                      <input
                        id="timeline-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEventFile(e.target.files ? e.target.files[0] : null)}
                        className="text-[9px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingEvent}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      {addingEvent ? 'Submitting...' : 'Log Progress'}
                    </button>
                  </form>
                </div>
              )}

              {/* Milestones feed */}
              <div className="relative border-l border-slate-200 pl-4 space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No milestone updates logged.</p>
                ) : (
                  timeline.map((event) => (
                    <div key={event.id} className="relative group pl-1">
                      <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white">
                        <span className="h-1 w-1 rounded-full bg-white" />
                      </span>
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition duration-150">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-slate-800 text-xs leading-snug">{event.title}</span>
                            <span className="text-[8px] text-slate-400 font-mono flex-shrink-0">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{event.description}</p>
                          )}
                          {event.image_url && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-100 max-w-full">
                              <img src={event.image_url} alt={event.title} className="w-full h-28 object-cover" onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
                              }} />
                            </div>
                          )}
                          <span className="text-[8px] text-slate-400 font-mono mt-1 uppercase tracking-wider block">
                            Logged by: {event.created_by}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column B: Document & Tenders Registry */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Tenders & Reports Registry
                </h4>
              </div>

              {/* Upload Document form inline */}
              {isOfficerOrEngineer && (
                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-xl space-y-3">
                  <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Upload Site Document</span>
                  <form onSubmit={handleUploadDoc} className="space-y-3">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Doc Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="Tender Document">Tender Document</option>
                        <option value="Inspection Report">Inspection Report</option>
                        <option value="Budget Report">Budget Report</option>
                        <option value="Completion Certificate">Completion Certificate</option>
                        <option value="Drone Photo">Drone Photo</option>
                        <option value="Before Construction Photo">Before Construction Photo</option>
                        <option value="After Completion Photo">After Completion Photo</option>
                        <option value="Inspection Photo">Inspection Photo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Select File</label>
                      <input
                        id="doc-file-input"
                        type="file"
                        required
                        onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                        className="text-[9px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {uploadError && <p className="text-[10px] text-red-600 font-semibold">{uploadError}</p>}
                    <button
                      type="submit"
                      disabled={uploadingDoc}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      {uploadingDoc ? 'Uploading...' : 'Upload File'}
                    </button>
                  </form>
                </div>
              )}

              {/* Text documents list */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {textDocuments.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No formal documents registered.</p>
                ) : (
                  textDocuments.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition duration-150">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <svg className="w-5 h-5 text-slate-450 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 truncate">{doc.filename}</div>
                          <div className="text-[8px] text-slate-450 uppercase tracking-wider font-semibold font-mono mt-0.5">
                            {doc.document_type} &bull; v{doc.version}
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-blue-600 hover:underline font-black flex-shrink-0 uppercase tracking-wider pl-2"
                      >
                        Get File
                      </a>
                    </div>
                  ))
                )}
              </div>
              
              <div className="pt-2">
                <Link to={`/projects/${project.id}/documents`} className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                  <span>Open Document Center (Full History) &rarr;</span>
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Intelligence & Visual Evidence Cockpit */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Panel (Integration at the Top Right) */}
          <Card className="border border-blue-200 bg-blue-50/20 p-5 rounded-2xl shadow-sm">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 6.75h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V9a2.25 2.25 0 0 1 2.25-2.25Z" />
              </svg>
              AI Risk Cockpit
            </h4>

            {!isLoggedIn ? (
              <div className="text-xs text-blue-700 leading-relaxed text-center py-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                <p className="font-bold">Intelligence Locked</p>
                <p className="mt-1 text-slate-500 font-medium">Log in to view ML predictive analysis.</p>
                <Link to="/login" className="mt-3 inline-block bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-[10px]">
                  Sign In
                </Link>
              </div>
            ) : predLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Risk score bar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Risk Index</span>
                    <span className="font-mono text-slate-700 font-black">{project.risk_score || (delayPred ? delayPred.risk_score : 10)} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-2 rounded-full ${
                      (project.risk_score || 10) >= 70 ? 'bg-red-500' :
                      (project.risk_score || 10) >= 35 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} style={{ width: `${project.risk_score || (delayPred ? delayPred.risk_score : 10)}%` }}></div>
                  </div>
                </div>

                {/* Delay Prediction */}
                {delayPred && delayPred.expected_delay_days !== undefined && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Projected Delay Duration</span>
                    <span className="text-lg font-black text-blue-600">{delayPred.expected_delay_days} Days</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{delayPred.description}</p>
                  </div>
                )}

                {/* AI Text Summary */}
                {projectSummary && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-[11px] text-slate-600 leading-relaxed">
                    <span className="block text-[8px] font-bold text-blue-600 uppercase tracking-wider mb-1">Project Status Summary</span>
                    <p className="font-medium text-slate-600">{projectSummary}</p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Action Guidelines</span>
                  <div className="space-y-2">
                    {getAIRecommendations().map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-600 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          rec.type === 'danger' ? 'bg-red-500' :
                          rec.type === 'warning' ? 'bg-amber-500' :
                          rec.type === 'success' ? 'bg-emerald-500' :
                          'bg-blue-500'
                        }`} />
                        <span>{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </Card>

          {/* Visual Evidence Gallery directly embedded in the sidebar list */}
          <Card className="p-5 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                Visual Site Evidence
              </h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {finalPhotosList.length} Files
              </span>
            </div>

            {/* Quick mini image gallery row */}
            <div className="grid grid-cols-2 gap-2">
              {finalPhotosList.slice(0, 4).map((photo) => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-150 h-20 bg-slate-50">
                  <img
                    src={photo.file_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=200';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                    <a
                      href={photo.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-white font-bold bg-blue-600 px-2 py-1 rounded-md"
                    >
                      View
                    </a>
                  </div>
                  <div className="absolute bottom-1 left-1 max-w-[90%]">
                    <span className="bg-slate-900/75 text-white text-[6px] font-bold px-1 py-0.2 rounded uppercase block truncate">
                      {photo.document_type.replace(' Photo', '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Show all button triggers the Gallery tab concept */}
            <div className="mt-3 text-center border-t border-slate-100 pt-2.5">
              <button
                onClick={() => {
                  setActiveTab('gallery');
                  const tabEl = document.getElementById('tab-group');
                  if (tabEl) tabEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                Launch Multi-Row Photo Board &rarr;
              </button>
            </div>
          </Card>

          {/* Citizen Grievance Box */}
          <Card className="p-5 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                </svg>
                Site Grievances
              </h4>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                {feedback.length} Open
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {feedback.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No site defects reported.</p>
              ) : (
                feedback.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-bold text-slate-700">{item.citizen_name}</span>
                      <span className={`px-1.5 py-0.2 rounded-md font-bold text-[7px] border uppercase ${
                        item.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        item.severity === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {item.severity || 'Low'} Risk
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{item.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 text-center flex flex-col gap-2">
              <Link
                to={`/feedback/new?projectId=${project.id}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
              >
                Report On-site Issue
              </Link>
            </div>
          </Card>

          {/* Audit Logs Trail & Admin Metadata */}
          <Card className="p-5 border border-slate-200 rounded-2xl shadow-sm bg-white space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2">Audit Activities</h4>
              {activities.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No system audit logged.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activities.slice(0, 4).map((act) => (
                    <div key={act.id} className="text-[10px] p-2 bg-slate-50 border border-slate-150 rounded-lg flex flex-col justify-between">
                      <span className="text-slate-600 font-medium">{act.message}</span>
                      <span className="text-[7px] text-slate-400 font-mono text-right mt-0.5">{new Date(act.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-2.5 font-semibold text-slate-600">
              <div>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Supervising Engineer</span>
                <span className="text-slate-700 block text-xs mt-0.5">{project.assigned_engineer || 'Unassigned Officer'}</span>
              </div>
              <div>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Workspace GUID</span>
                <span className="font-mono text-[9px] bg-slate-50 p-1.5 rounded block truncate select-all font-normal mt-0.5">{project.id}</span>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Embedded Anchor for Page Scrolling on tab change */}
      <div id="tab-group" className="h-0" data-tab-group="" />

      {/* Main Tab Details Area (shown below splits if active tab is not 'timeline') */}
      {activeTab !== 'timeline' && (
        <div className="px-4 sm:px-6 lg:px-8 mt-6">
          <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                {activeTab === 'gallery' ? 'Photo Evidence Gallery' : activeTab === 'documents' ? 'Contractor Documents list' : 'Citizen Grievances Management'}
              </h3>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Back to Split Screen &uarr;
              </button>
            </div>

            {/* Tab 2: Gallery Detail Expanded */}
            {activeTab === 'gallery' && (
              <div className="space-y-5">
                <div className="flex gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
                  {['All', 'Progress Photo', 'Drone Photo', 'Before Construction Photo', 'After Completion Photo', 'Inspection Photo'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setGalleryFilter(tab)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold border transition whitespace-nowrap ${
                        galleryFilter === tab
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab.replace(' Photo', '')}
                    </button>
                  ))}
                </div>

                {filteredPhotos.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 italic">No images in this folder.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredPhotos.map((img) => (
                      <div key={img.id} className="group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition duration-200">
                        <div className="relative h-32 overflow-hidden bg-slate-50">
                          <img
                            src={img.file_url}
                            alt={img.filename}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {img.document_type.replace(' Photo', '')}
                          </span>
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="font-bold text-xs text-slate-800 truncate" title={img.filename}>{img.filename}</div>
                          <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                            <span>Version {img.version}</span>
                            <span>{new Date(img.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Documents Detail Expanded */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {textDocuments.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No document listings found.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {textDocuments.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <svg className="w-5 h-5 text-slate-450 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-slate-800 block truncate">{doc.filename}</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider block">
                              {doc.document_type} &bull; v{doc.version} &bull; {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          Download / View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Complaints Detail Expanded */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                {feedback.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No grievances recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.map((item) => (
                      <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-black text-slate-800 block">{item.citizen_name}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 block">
                                {item.issue_type} &bull; {item.location || 'Chennai'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.severity && (
                                <Badge variant={item.severity === 'High' ? 'danger' : item.severity === 'Medium' ? 'warning' : 'success'}>
                                  {item.severity} Severity
                                </Badge>
                              )}
                              <Badge variant={item.status === 'RESOLVED' ? 'success' : 'danger'}>{item.status}</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{item.description}</p>
                          {item.image_url && (
                            <div className="rounded-lg overflow-hidden border border-slate-200 max-w-xs h-32 bg-slate-100">
                              <img src={item.image_url} alt="complaint evidence" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        {item.assigned_inspector && (
                          <div className="text-[9px] text-blue-700 font-bold flex items-center gap-1 border-t border-slate-100 pt-2.5">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <span>Assigned Inspector: {item.assigned_inspector}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </Card>
        </div>
      )}

    </div>
  );
}
