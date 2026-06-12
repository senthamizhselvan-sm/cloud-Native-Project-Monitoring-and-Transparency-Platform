import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, MetricCard, ProjectCard, RiskCard, ActivityCard } from '../design-system/components/Card';
import Badge from '../components/ui/Badge';
import { projectApi, feedbackApi, documentApi } from '../services/api';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  assigned_engineer: string | null;
  end_date: string | null;
  risk_level?: string;
  risk_score?: number;
}

interface Complaint {
  id: string;
  project_id: string;
  citizen_name: string;
  issue_type: string;
  description: string;
  status: string;
  severity?: string;
  created_at: string;
}

export default function ContractorDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Selected project states for updates and uploads
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [completion, setCompletion] = useState(0);
  const [status, setStatus] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Document upload states
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Tender Document');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const getContractorDistrict = (email: string) => {
    if (!email) return 'Chennai';
    if (email.includes('.')) {
      const parts = email.split('@')[0].split('.');
      if (parts.length > 1) {
        const d = parts[1];
        return d.charAt(0).toUpperCase() + d.slice(1);
      }
    }
    return 'Chennai';
  };

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  const getBannerImage = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('water')) return 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400';
    if (d.includes('road') || d.includes('highway')) return 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=400';
    if (d.includes('health')) return 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=400';
    if (d.includes('school') || d.includes('education')) return 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400';
    if (d.includes('municipal') || d.includes('drainage')) return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
    if (d.includes('energy') || d.includes('power')) return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400';
    if (d.includes('agri')) return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400';
    return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400';
  };

  const loadData = async (email: string) => {
    try {
      const district = getContractorDistrict(email);
      const [projResp, compResp] = await Promise.all([
        projectApi.get('/projects'),
        feedbackApi.get('/feedback').catch(() => ({ data: [] }))
      ]);

      // Contractors manage projects in their registered district
      const filteredProj = projResp.data.filter(
        (p: Project) => p.location.toLowerCase() === district.toLowerCase()
      );
      setProjects(filteredProj);
      
      const filteredComp = compResp.data.filter(
        (c: Complaint) => filteredProj.map((p: Project) => p.id).includes(c.project_id)
      );
      setComplaints(filteredComp);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load contractor workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem('user_email') || '';
    setUserEmail(email);
    if (email) {
      loadData(email);
    }
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCompletion(project.completion);
    setStatus(project.status);
    setUpdateError(null);
    setUpdateSuccess(null);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const resp = await projectApi.put(`/projects/${selectedProject.id}`, {
        status,
        completion: Number(completion)
      });
      setUpdateSuccess('Milestone completion updated!');
      setSelectedProject(resp.data);
      loadData(userEmail);
    } catch (err: any) {
      setUpdateError(err?.response?.data?.detail ?? 'Failed to submit progress audit');
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !docFile) return;
    setUploadError(null);
    setUploadSuccess(null);
    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('project_id', selectedProject.id);
      formData.append('document_type', docType);
      formData.append('file', docFile);

      await documentApi.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess('Clearance report uploaded successfully!');
      setDocFile(null);
      const fileInput = document.getElementById('contractor-doc-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail ?? 'Failed to upload document certificate');
    } finally {
      setUploadingDoc(false);
    }
  };

  const contractorDistrict = getContractorDistrict(userEmail);

  // Derived metrics
  const activeContracts = projects.length;
  const avgCompletion = activeContracts > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.completion, 0) / activeContracts) 
    : 0;
  const openComplaintsCount = complaints.filter(c => c.status === 'OPEN').length;
  const totalOutlay = projects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8 pb-12 bg-slate-50 min-h-screen text-slate-900 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contractor Workspace Console</h2>
            <p className="text-sm text-slate-500 mt-1">Manage infrastructure bids, upload completion certificates, and review public site grievances.</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            District Workspace: {contractorDistrict}
          </span>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <MetricCard
            label="Active Contracts Won"
            value={`${activeContracts} Works`}
            borderAccent="border-blue-600"
            trend="Tamil Nadu Bid Allocation"
            trendDirection="neutral"
            icon={
              <svg className="w-5 h-5 text-blue-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0 1 12 3c1.2 0 2.392.04 3.571.121m-9.71 6.137a9 9 0 0 1 10.462-6.23M3 10.5c0 7.142 7.5 11.25 7.5 11.25S18 17.642 18 10.5" />
              </svg>
            }
          />
          <MetricCard
            label="Avg Contract Completion"
            value={`${avgCompletion}%`}
            borderAccent="border-emerald-600"
            trend="Average progress rate"
            trendDirection="up"
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
            }
          />
          <MetricCard
            label="Open Quality Grievances"
            value={`${openComplaintsCount} Issues`}
            borderAccent="border-red-500"
            trend="Unresolved citizen complaints"
            trendDirection={openComplaintsCount > 0 ? "down" : "neutral"}
            icon={
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
          />
          <MetricCard
            label="Total Contract Value"
            value={formatCurrency(totalOutlay)}
            borderAccent="border-indigo-600"
            trend="Capital Outlay Pool"
            trendDirection="neutral"
            icon={
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.957-.659-1.006-.879-1.006-2.303 0-3.182s2.9-.879 4.07 0c.513.385.972.85 1.282 1.397m-7.658 3.262H3m18 0h-3.262" />
              </svg>
            }
          />
        </div>

        {/* Workspace Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Won Contracts Panel (Left) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">My Assigned Infrastructure Sites</h3>
              
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">Loading active site datasets...</div>
              ) : error ? (
                <div className="text-xs text-red-500 font-bold">{error}</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold">No won bids registered in {contractorDistrict} District.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((p) => {
                    const projectComplaints = complaints.filter(
                      c => c.project_id === p.id && c.status === 'OPEN'
                    ).length;

                    return (
                      <ProjectCard
                        key={p.id}
                        name={p.name}
                        location={p.location}
                        department={p.department}
                        budget={formatCurrency(p.budget)}
                        completion={p.completion}
                        riskLevel={p.risk_level || 'Low'}
                        complaintsCount={projectComplaints}
                        imageUrl={getBannerImage(p.department)}
                        onClickView={() => handleSelectProject(p)}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Site Editor Panel (Right) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Progress Log Editor */}
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Log Site Completion</h3>
              {selectedProject ? (
                <form onSubmit={handleUpdateProgress} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 block truncate">{selectedProject.name}</span>
                    <span className="text-slate-450 block mt-0.5 font-bold uppercase tracking-wider">{selectedProject.department}</span>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Site Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Inspection Scheduled">Inspection Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                      <span>Completion:</span>
                      <span className="text-blue-600">{completion}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={completion}
                      onChange={(e) => setCompletion(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 shadow-sm transition"
                  >
                    Submit Completion Audits
                  </button>
                  {updateError && <p className="text-[10px] text-red-500 font-semibold">{updateError}</p>}
                  {updateSuccess && <p className="text-[10px] text-green-650 font-semibold">{updateSuccess}</p>}
                </form>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">Select an assigned project from the list to update progress status.</p>
              )}
            </Card>

            {/* Document upload card */}
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Tender Agreements & Drawings</h3>
              {selectedProject ? (
                <form onSubmit={handleUploadDoc} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 block truncate">{selectedProject.name}</span>
                    <span className="text-slate-450 block mt-0.5 font-bold uppercase tracking-wider">Site ID: {selectedProject.id.slice(0,8)}</span>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Tender Document">Tender Document</option>
                      <option value="Inspection Report">Inspection Report</option>
                      <option value="Budget Report">Budget Report</option>
                      <option value="Completion Certificate">Completion Certificate</option>
                      <option value="Before Construction Photo">Before Construction Photo</option>
                      <option value="After Completion Photo">After Completion Photo</option>
                      <option value="Inspection Photo">Inspection Photo</option>
                      <option value="Progress Photo">Progress Photo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Choose file</label>
                    <input
                      id="contractor-doc-file"
                      type="file"
                      required
                      onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                      className="text-[9px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 shadow-sm transition"
                  >
                    {uploadingDoc ? 'Uploading...' : 'Upload Report'}
                  </button>
                  {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
                  {uploadSuccess && <p className="text-[10px] text-green-650 font-semibold">{uploadSuccess}</p>}
                </form>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">Select a project to upload contract agreements or engineering drawings.</p>
              )}
            </Card>

            {/* Quality warnings */}
            <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800">Quality Grievance Warnings</h3>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {complaints.filter(c => c.status === 'OPEN').length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">All systems clear. No defects reported.</p>
                ) : (
                  complaints.filter(c => c.status === 'OPEN').map((c) => (
                    <div key={c.id} className="p-3 border border-red-100 bg-red-50/30 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-red-800 uppercase tracking-wider">{c.issue_type}</span>
                        <span className="text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">{c.description}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
