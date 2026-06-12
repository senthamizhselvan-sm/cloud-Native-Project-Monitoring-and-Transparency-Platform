import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
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
              <svg className="w-3.5 h-3.5 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

      {/* Double Column Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side primary details panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Budget and Timeline Summary Box */}
          <Card className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4">Capitalization & Timelines</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-slate-100 pb-5">
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sanctioned Budget</span>
                <span className="text-xl font-black text-slate-900 block">{formatCurrency(project.budget)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                <span className="text-sm font-bold text-slate-700 block mt-1">{startDateStr}</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Completion</span>
                <span className="text-sm font-bold text-slate-700 block mt-1">{endDateStr}</span>
              </div>
            </div>

            <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Physical Completion</span>
                  <span>{project.completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.completion}%` }}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-end sm:justify-end gap-3 self-center">
                <ProgressCircle value={project.completion} size={60} />
              </div>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-4 text-xs font-extrabold border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'timeline' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Timeline Milestones
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-3 px-4 text-xs font-extrabold border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'gallery' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Photo Evidence ({filteredPhotos.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-4 text-xs font-extrabold border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'documents' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Document Center ({textDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 px-4 text-xs font-extrabold border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === 'feedback' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Grievances ({feedback.length})
            </button>
          </div>

          {/* Tab 1: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {isOfficerOrEngineer && (
                <Card className="p-5 border border-blue-100 bg-blue-50/40 rounded-2xl shadow-sm">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-3">Add Construction Milestone</h4>
                  <form onSubmit={handleAddTimeline} className="space-y-3.5">
                    <div>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Milestone Title (e.g. Sub-grade levelling completed)"
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <textarea
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="Describe milestone progress and quality validations conducted..."
                        rows={2}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Milestone Photo Attachment</label>
                      <input
                        id="timeline-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEventFile(e.target.files ? e.target.files[0] : null)}
                        className="text-xs text-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingEvent}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                    >
                      {addingEvent ? 'Uploading...' : 'Log Milestone Event'}
                    </button>
                  </form>
                </Card>
              )}

              <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-400 pl-2">No milestone timelines recorded.</p>
                ) : (
                  timeline.map((event) => (
                    <div key={event.id} className="relative group">
                      <span className="absolute -left-[32px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white group-hover:scale-110 transition duration-150">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </span>
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition duration-200">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{event.title}</h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{event.description}</p>
                        )}
                        {event.image_url && (
                          <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-100 max-w-md">
                            <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
                            }} />
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 mt-3 font-semibold uppercase tracking-wider font-mono">
                          By: {event.created_by}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex gap-1.5 border-b border-slate-100 pb-3.5 overflow-x-auto">
                {['All', 'Progress Photo', 'Drone Photo', 'Before Construction Photo', 'After Completion Photo', 'Inspection Photo'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryFilter(tab)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition whitespace-nowrap ${
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
                <div className="text-center py-12 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No images uploaded under this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredPhotos.map((img) => (
                    <div key={img.id} className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow hover:border-slate-350 transition duration-200">
                      <div className="relative h-28 overflow-hidden bg-slate-100">
                        <img
                          src={img.file_url}
                          alt={img.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {img.document_type.replace(' Photo', '')}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-extrabold text-[10px] truncate text-slate-800" title={img.filename}>{img.filename}</div>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 mt-1 font-mono">
                          <span>v{img.version}</span>
                          <span>{new Date(img.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {isOfficerOrEngineer && (
                <Card className="p-5 border border-blue-100 bg-blue-50/40 rounded-2xl shadow-sm">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-3">Upload Project Document</h4>
                  <form onSubmit={handleUploadDoc} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Doc Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
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
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Select File</label>
                        <input
                          id="doc-file-input"
                          type="file"
                          required
                          onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                    {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}
                    <button
                      type="submit"
                      disabled={uploadingDoc}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                    >
                      {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </form>
                </Card>
              )}

              <div className="flex justify-between items-center mb-1">
                <h4 className="font-extrabold text-slate-800 text-sm">Official Tenders & Reports</h4>
                <Link to={`/projects/${project.id}/documents`} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.15A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25V12" />
                  </svg>
                  <span>Open Document Center (Version History)</span>
                </Link>
              </div>

              {textDocuments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {textDocuments.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:bg-slate-50/50 transition duration-150">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-6 h-6 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 truncate">{doc.filename}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold font-mono">
                            {doc.document_type} &bull; v{doc.version} &bull; {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex-shrink-0"
                      >
                        Download / Preview
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Complaints */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-slate-800 text-sm">Grievance Activity Trail</h4>
                <Link
                  to={`/feedback/new?projectId=${project.id}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Report new issue
                </Link>
              </div>

              {feedback.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">No public issues reported.</div>
              ) : (
                feedback.map((item) => (
                  <Card key={item.id} className="p-4.5 border border-slate-200 rounded-2xl bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800">{item.citizen_name}</span>
                        <div className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                          {item.issue_type} &bull; {item.location || 'Chennai'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.severity && (
                          <Badge variant={item.severity === 'High' ? 'danger' : item.severity === 'Medium' ? 'warning' : 'success'}>
                            {item.severity} Severity
                          </Badge>
                        )}
                        <Badge variant={item.status === 'RESOLVED' ? 'success' : 'danger'}>{item.status}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                    
                    {item.image_url && (
                      <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-200 max-w-xs bg-slate-50">
                        <img src={item.image_url} alt="complaint proof" className="w-full h-32 object-cover" />
                      </div>
                    )}
                    
                    {item.assigned_inspector && (
                      <div className="text-[10px] text-blue-700 font-bold mt-3.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        <span>Inspector Assigned: {item.assigned_inspector}</span>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side intelligence dashboards */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Intelligence Insight Panel */}
          <Card className="border border-blue-200 bg-blue-50/30 p-5 rounded-2xl shadow-sm">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
              <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 6.75h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V9a2.25 2.25 0 0 1 2.25-2.25Z" />
              </svg>
              Project Intelligence
            </h4>

            {!isLoggedIn ? (
              <div className="text-xs text-blue-700 leading-relaxed text-center py-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <p className="font-bold">Intelligence Feed Locked</p>
                <p className="mt-1 text-slate-500 font-medium">Log in to view dynamic risk indices and ML completion forecasts.</p>
                <Link to="/login" className="mt-3 inline-block bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-blue-700 transition">
                  Login Access
                </Link>
              </div>
            ) : predLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Risk score details */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Risk Index Score</span>
                    <span className="font-mono text-slate-700">{project.risk_score || (delayPred ? delayPred.risk_score : 10)} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div className={`h-2 rounded-full ${
                       (project.risk_score || 10) >= 70 ? 'bg-red-500' :
                       (project.risk_score || 10) >= 35 ? 'bg-amber-500' :
                       'bg-emerald-500'
                    }`} style={{ width: `${project.risk_score || (delayPred ? delayPred.risk_score : 10)}%` }}></div>
                  </div>
                </div>

                {/* Delay prediction */}
                {delayPred && delayPred.expected_delay_days !== undefined && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Projected Delay Duration</span>
                    <span className="text-xl font-black text-blue-600">{delayPred.expected_delay_days} Days</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">{delayPred.description}</p>
                  </div>
                )}

                {/* AI Text summary */}
                {projectSummary && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 leading-relaxed space-y-1">
                    <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-wider">Project Status Summary</span>
                    <p className="font-medium text-slate-600">{projectSummary}</p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Action Recommendations</span>
                  <div className="space-y-2.5">
                    {getAIRecommendations().map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 font-semibold">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
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

          {/* Project Activity Log Feed */}
          <Card className="p-5 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-3">Activities Feed</h4>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No system log updates</p>
            ) : (
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {activities.map((act) => (
                  <div key={act.id} className="text-[11px] leading-relaxed p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div className="text-slate-700 font-medium">{act.message}</div>
                    <div className="text-[8px] text-slate-400 font-mono text-right mt-1.5">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Project Management Metadata */}
          <Card className="p-5 border border-slate-200 rounded-2xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-3">Administration Details</h4>
            <div className="text-xs text-slate-600 space-y-3.5 font-semibold">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Supervising Engineer</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{project.assigned_engineer || 'Unassigned'}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project System ID</span>
                <span className="font-mono text-[9px] block truncate bg-slate-50 p-2.5 rounded-lg mt-1 border border-slate-100 select-all font-normal">
                  {project.id}
                </span>
              </div>
              {project.created_by && (
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created By Officer</span>
                  <span className="font-mono text-[9px] text-slate-500 block truncate mt-1 font-normal">{project.created_by}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Action for Citizens */}
          <Card className="p-5 text-center border border-slate-200 rounded-2xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-1.5">Spotted a Site Defect?</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Help audits by uploading layout drawings, progress photos, or report safety issues directly to local engineers.
            </p>
            <Link
              to={`/feedback/new?projectId=${project.id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0h2.25c.34 0 .68.107.962.308l1.733 1.237c.361.258.852.258 1.213 0l1.733-1.237a1.69 1.69 0 0 1 1.924 0l1.733 1.237c.361.258.852.258 1.213 0l1.733-1.237a1.69 1.69 0 0 1 1.924 0l1.733 1.237c.282.201.623.308.962.308H21v-6.75a.75.75 0 0 0-.75-.75h-2.25a1.69 1.69 0 0 1-1.924 0l-1.733-1.237a1.14 1.14 0 0 0-1.213 0l-1.733 1.237a1.69 1.69 0 0 1-1.924 0l-1.733-1.237a1.14 1.14 0 0 0-1.213 0L7.962 7.058A1.69 1.69 0 0 1 7.001 6.75H3V3.75" />
              </svg>
              Submit Site Grievance
            </Link>
          </Card>
        </div>

      </div>
    </div>
  );
}
