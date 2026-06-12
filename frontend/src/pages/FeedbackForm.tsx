import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi, feedbackApi, documentApi, predictionApi } from '../services/api';

interface Project {
  id: string;
  name: string;
  department: string;
}

interface AICategorization {
  category: string;
  confidence: number;
  urgency_level: string;
}

export default function FeedbackForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId') || searchParams.get('project_id');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [issueType, setIssueType] = useState('Poor Quality');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Chennai');
  const [severity, setSeverity] = useState('Low');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  
  // AI assist state
  const [aiCat, setAiCat] = useState<AICategorization | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCitizenName(localStorage.getItem('user_name') || '');

    async function fetchProjects() {
      try {
        const resp = await projectApi.get('/projects');
        setProjects(resp.data);
        if (queryProjectId) {
          setProjectId(queryProjectId);
        } else if (resp.data.length > 0) {
          setProjectId(resp.data[0].id);
        }
      } catch (err: any) {
        setError('Failed to fetch projects list');
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, [queryProjectId]);

  // Trigger AI categorization when description changes
  const handleAICategorize = async () => {
    if (description.length < 10) return;
    try {
      setAiLoading(true);
      const res = await predictionApi.post('/prediction/categorize-complaint', {
        complaint_text: description
      });
      setAiCat(res.data);
      // Auto-update severity based on AI recommendation if user wants
      if (res.data.urgency_level) {
        setSeverity(res.data.urgency_level);
      }
    } catch (err) {
      console.warn('AI categorization failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !citizenName || !description) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // Handle file upload if a citizen uploaded a photo
      if (selectedFile) {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('document_type', 'Inspection Photo');
        formData.append('file', selectedFile);
        
        try {
          const uploadRes = await documentApi.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalImageUrl = uploadRes.data.file_url;
        } catch (uploadErr) {
          console.error('File upload failed, falling back to empty image url', uploadErr);
        }
      }

      await feedbackApi.post('/feedback', {
        project_id: projectId,
        citizen_name: citizenName,
        issue_type: aiCat?.category || issueType,
        description: description,
        image_url: finalImageUrl || null,
        location: location,
        severity: severity
      });
      
      setFormSuccess('Feedback submitted successfully!');
      setTimeout(() => {
        const role = localStorage.getItem('user_role');
        if (role === 'Citizen') {
          navigate('/dashboard/citizen');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Report Public Construction Grievance</h2>
        <Link to="/dashboard/citizen" className="text-sm text-blue-700 hover:underline font-semibold">
          &larr; Back to Dashboard
        </Link>
      </div>

      <Card className="p-6 border border-slate-200 shadow-sm rounded-xl bg-white">
        {loadingProjects ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Targeted Project *</label>
              {projects.length === 0 ? (
                <div className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  No public works projects are currently available for feedback.
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Citizen Name *</label>
                <input
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Issue Classification *</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Poor Quality">Poor Quality</option>
                  <option value="Delay">Delay</option>
                  <option value="Overpricing">Overpricing</option>
                  <option value="Safety Hazard">Safety Hazard</option>
                  <option value="Water Leakage">Water & Sanitation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">District / Location *</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
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
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Severity *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Low">Low Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="High">High Severity</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleAICategorize}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Describe the issue in detail (e.g. cracked road concrete, water logged leakage). AI will automatically parse the issue type."
                required
              />
              {aiLoading && <p className="text-[10px] text-slate-400 mt-1">AI analyzing issue details...</p>}
              {aiCat && (
                <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-[11px] text-indigo-700 flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 6.75h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V9a2.25 2.25 0 0 1 2.25-2.25Z" />
                    </svg>
                    <span><strong>AI Classification Suggestion:</strong> {aiCat.category} ({aiCat.confidence}% confidence)</span>
                  </span>
                  <Badge variant={aiCat.urgency_level === 'High' ? 'danger' : aiCat.urgency_level === 'Medium' ? 'warning' : 'success'}>
                    {aiCat.urgency_level} Urgency
                  </Badge>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachment Options</span>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Upload Photo Evidence</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Or Provide Image URL</label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
                  placeholder="e.g. http://imgur.com/photo.jpg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || projects.length === 0}
              className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-extrabold py-2.5 text-sm transition shadow-sm"
            >
              {submitting ? 'Submitting Report...' : 'Submit Transparent Grievance Report'}
            </button>

            {error && <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>}
            {formSuccess && <p className="text-sm text-green-600 mt-2 font-medium">{formSuccess}</p>}
          </form>
        )}
      </Card>
    </div>
  );
}
