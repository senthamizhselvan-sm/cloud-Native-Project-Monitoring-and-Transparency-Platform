import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi, documentApi } from '../services/api';

interface DocumentItem {
  id: string;
  filename: string;
  file_url: string;
  document_type: string;
  version: number;
  uploaded_at: string;
}

interface Project {
  id: string;
  name: string;
  department: string;
  location: string;
}

export default function ProjectDocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Tender Document');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  async function loadData() {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, docRes] = await Promise.all([
        projectApi.get(`/projects/${projectId}`),
        documentApi.get(`/documents/project/${projectId}`)
      ]);
      setProject(projRes.data);
      setDocuments(docRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load project documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    loadData();
  }, [projectId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !file) return;
    try {
      setUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('document_type', docType);
      formData.append('file', file);

      await documentApi.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFile(null);
      const fileInput = document.getElementById('doc-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      loadData();
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail ?? 'File upload failed');
    } finally {
      setUploading(false);
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
        <h3 className="font-semibold text-lg">Error Loading Documents</h3>
        <p className="text-sm mt-1">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-sm underline mt-4 block text-blue-700 font-semibold">
          &larr; Back to projects
        </Link>
      </div>
    );
  }

  // Group versions by filename
  const groupedDocs: Record<string, DocumentItem[]> = {};
  documents.forEach((doc) => {
    if (!groupedDocs[doc.filename]) {
      groupedDocs[doc.filename] = [];
    }
    groupedDocs[doc.filename].push(doc);
  });

  // Sort versions descending
  Object.keys(groupedDocs).forEach((key) => {
    groupedDocs[key].sort((a, b) => b.version - a.version);
  });

  const isOfficerOrEngineer = role === 'Officer' || role === 'Engineer' || role === 'Admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pt-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{project.department} &bull; {project.location}</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{project.name} — Document Center</h2>
        </div>
        <Link to={`/projects/${projectId}`} className="text-sm text-blue-600 font-bold hover:underline">
          Back to Details &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Form */}
        {isOfficerOrEngineer && (
          <Card className="lg:col-span-4 p-5 border border-slate-200 rounded-xl shadow-sm bg-white h-fit">
            <h3 className="font-extrabold text-sm text-slate-800 mb-3">Upload New File / Version</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Document Type</label>
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
                  id="doc-upload-input"
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs"
                />
                <p className="text-[9px] text-slate-400 mt-1 leading-snug">
                  Note: Uploading a file with the same name as an existing document will automatically save it as a new version.
                </p>
              </div>

              {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}
              
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {uploading ? 'Uploading...' : 'Commit Upload'}
              </button>
            </form>
          </Card>
        )}

        {/* Documents Listing with Expandable Versions */}
        <div className={isOfficerOrEngineer ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <h3 className="font-extrabold text-sm text-slate-800">Managed Project Documents</h3>
          
          {Object.keys(groupedDocs).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              No files have been uploaded to this project repository yet.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDocs).map(([filename, versions]) => {
                const latestDoc = versions[0];
                return (
                  <Card key={filename} className="p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{filename}</h4>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            {latestDoc.document_type} &bull; Latest Version: v{latestDoc.version}
                          </div>
                        </div>
                      </div>
                      <a
                        href={latestDoc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                      >
                        Preview / Download v{latestDoc.version}
                      </a>
                    </div>

                    {/* Version history sublist */}
                    {versions.length > 1 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Version Logs</span>
                        <div className="mt-1.5 space-y-1.5 pl-2">
                          {versions.slice(1).map((ver) => (
                            <div key={ver.id} className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                              <span>Version {ver.version} (Uploaded: {new Date(ver.uploaded_at).toLocaleDateString()})</span>
                              <a
                                href={ver.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                Get File
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
