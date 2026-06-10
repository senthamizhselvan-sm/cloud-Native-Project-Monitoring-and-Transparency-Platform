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

  const filteredPhotos = photoDocuments.filter((p) => {
    if (galleryFilter === 'All') return true;
    return p.document_type.toLowerCase().includes(galleryFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex items-center justify-between">
        <Link to="/projects" className="text-sm text-blue-700 hover:underline font-semibold flex items-center gap-1">
          <span>&larr;</span> Back to all projects
        </Link>
        <div className="flex items-center gap-2">
          {project.risk_level && (
            <Badge variant={project.risk_level === 'High' ? 'danger' : project.risk_level === 'Medium' ? 'warning' : 'success'}>
              {project.risk_level} Risk Level
            </Badge>
          )}
          <Badge variant={getBadgeVariant(project.status)}>{project.status}</Badge>
        </div>
      </div>

      {/* Title & Core Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 flex flex-col justify-between p-6 border border-slate-200 rounded-xl shadow-sm bg-white">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{project.name}</h1>
            <p className="text-sm text-slate-400 mt-1 capitalize font-semibold">{project.department} Department &bull; {project.location}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Budget</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">{formatCurrency(project.budget)}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
              <span className="text-sm font-bold text-slate-700 mt-1.5 block">{startDateStr}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Finish</span>
              <span className="text-sm font-bold text-slate-700 mt-1.5 block">{endDateStr}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4 flex flex-col items-center justify-center p-6 text-center border border-slate-200 rounded-xl shadow-sm bg-white">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Project Progress</h4>
          <ProgressCircle value={project.completion} size={120} />
        </Card>
      </div>

      {/* Main Grid: Left Tabs, Right Metadata + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tabs Navigation & Tab Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'timeline' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Milestone Timeline
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'gallery' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Photo Gallery ({photoDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'documents' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Document Center ({textDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'feedback' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Public Complaints ({feedback.length})
            </button>
          </div>

          {/* Tab Content: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {isOfficerOrEngineer && (
                <Card className="p-5 border border-blue-100 bg-blue-50/50 rounded-xl shadow-sm">
                  <h4 className="font-extrabold text-sm text-slate-800 mb-3">Add Construction Milestone</h4>
                  <form onSubmit={handleAddTimeline} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Milestone Title (e.g. Foundation Completed)"
                        required
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <textarea
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="Describe the milestone and quality audits completed..."
                        rows={2}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attach Milestone Photo (Optional)</label>
                      <input
                        id="timeline-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEventFile(e.target.files ? e.target.files[0] : null)}
                        className="text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingEvent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      {addingEvent ? 'Submitting...' : 'Log Milestone'}
                    </button>
                  </form>
                </Card>
              )}

              <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-500 pl-2">No timeline milestones have been logged yet.</p>
                ) : (
                  timeline.map((event) => (
                    <div key={event.id} className="relative group">
                      <span className="absolute -left-[32px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white group-hover:scale-110 transition duration-150">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </span>
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition duration-200">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-slate-800 text-sm">{event.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{event.description}</p>
                        )}
                        {event.image_url && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 max-w-md">
                            <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
                            }} />
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 mt-3 font-semibold uppercase tracking-wider font-mono">
                          Recorded by: {event.created_by}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Photo Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
                {['All', 'Progress Photo', 'Drone Photo', 'Before Construction Photo', 'After Completion Photo', 'Inspection Photo'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
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
                <div className="text-center py-12 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No images uploaded under this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {filteredPhotos.map((img) => (
                    <div key={img.id} className="group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                      <div className="relative h-36 overflow-hidden bg-slate-100">
                        <img
                          src={img.file_url}
                          alt={img.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {img.document_type.replace(' Photo', '')}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-[11px] truncate text-slate-800" title={img.filename}>{img.filename}</div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-mono">
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

          {/* Tab Content: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {isOfficerOrEngineer && (
                <Card className="p-5 border border-blue-100 bg-blue-50/50 rounded-xl shadow-sm">
                  <h4 className="font-extrabold text-sm text-slate-800 mb-3">Upload Project Document</h4>
                  <form onSubmit={handleUploadDoc} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doc Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select File</label>
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      {uploadingDoc ? 'Uploading...' : 'Upload File'}
                    </button>
                  </form>
                </Card>
              )}

              <div className="flex justify-between items-center mb-2">
                <h4 className="font-extrabold text-slate-800 text-sm">Official Tenders & Reports</h4>
                <Link to={`/projects/${project.id}/documents`} className="text-xs font-bold text-blue-600 hover:underline">
                  📁 Open Document Center (Version History)
                </Link>
              </div>

              {textDocuments.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">No project documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {textDocuments.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50/50 transition duration-150">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-2xl">📄</span>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-slate-800 truncate">{doc.filename}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold font-mono">
                            {doc.document_type} &bull; v{doc.version} &bull; Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex-shrink-0"
                      >
                        Download / Preview
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Public Feedback */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800 text-sm">Grievance Activity Trail</h4>
                <Link
                  to={`/feedback/new?projectId=${project.id}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Report new issue
                </Link>
              </div>

              {feedback.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">No public issues reported on this project.</div>
              ) : (
                feedback.map((item) => (
                  <Card key={item.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800">{item.citizen_name}</span>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
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
                    
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {item.description}
                    </p>
                    
                    {item.image_url && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 max-w-xs bg-slate-50">
                        <img src={item.image_url} alt="complaint proof" className="w-full h-32 object-cover" />
                      </div>
                    )}
                    
                    {item.assigned_inspector && (
                      <div className="text-[10px] text-blue-700 font-bold mt-3 flex items-center gap-1.5">
                        <span>🕵️</span>
                        <span>Assigned Inspector: {item.assigned_inspector}</span>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: Metadata, Actions, and AI Predictions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Predictive insights */}
          <Card className="border border-indigo-200 bg-indigo-50/40 p-5 rounded-xl shadow-sm">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 mb-3">
              <span>🧠</span>
              <span>Predictive ML Analytics</span>
            </h4>
            
            {!isLoggedIn ? (
              <div className="text-xs text-indigo-700 leading-relaxed text-center py-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="font-semibold">Predictive Models Locked</p>
                <p className="mt-1 text-slate-500 font-medium">Log in to compute machine learning cost overruns and construction delay risk estimates.</p>
                <Link to="/login" className="mt-3 inline-block bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                  Login to Access
                </Link>
              </div>
            ) : predLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {projectSummary && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-[11px] text-slate-600 leading-relaxed">
                    <span className="block text-[8px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Generated Overview</span>
                    {projectSummary}
                  </div>
                )}
                
                {delayPred && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Delay Risk Forecast</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={delayPred.delay_risk === 'High' ? 'danger' : delayPred.delay_risk === 'Medium' ? 'warning' : 'success'}>
                        {delayPred.delay_risk} Risk
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">Score: {delayPred.risk_score}%</span>
                    </div>
                    {delayPred.expected_delay_days !== undefined && (
                      <div className="text-xs font-bold text-slate-700 mt-2">
                        Expected Delay Time: <span className="text-indigo-600">{delayPred.expected_delay_days} Days</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{delayPred.description}</p>
                  </div>
                )}

                {costPred && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Cost Overrun Prediction</span>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      +{costPred.expected_cost_increase_percent}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Expected Final Cost: <strong className="text-slate-800">{formatCurrency(costPred.expected_final_cost)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Project Activity Log Feed */}
          <Card className="p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-sm mb-3">Live Activity Event Trail</h4>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No project updates recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {activities.map((act) => (
                  <div key={act.id} className="text-[11px] leading-relaxed p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-700">{act.message}</div>
                    <div className="text-[8px] text-slate-400 font-mono text-right mt-1">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Project Metadata Details */}
          <Card className="p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-sm mb-3">Project Management</h4>
            <div className="text-xs text-slate-600 space-y-3 font-semibold">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Engineer</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{project.assigned_engineer || 'Unassigned'}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project Unique ID</span>
                <span className="font-mono text-[9px] block truncate bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100 select-all font-normal">
                  {project.id}
                </span>
              </div>
              {project.created_by && (
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created By (Officer ID)</span>
                  <span className="font-mono text-[9px] text-slate-500 block truncate mt-1 font-normal">{project.created_by}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Action Button for Citizens */}
          <Card className="p-5 text-center border border-slate-200 rounded-xl shadow-sm bg-white">
            <h4 className="font-extrabold text-slate-800 text-sm mb-1">Spotted an Issue?</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Help government audits by submitting progress photos or flagging construction defects on this site.
            </p>
            <Link
              to={`/feedback/new?projectId=${project.id}`}
              className="block w-full text-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold transition shadow-sm"
            >
              Report Grievance / Feedback
            </Link>
          </Card>
        </div>

      </div>
    </div>
  );
}
