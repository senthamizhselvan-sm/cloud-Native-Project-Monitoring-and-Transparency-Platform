import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import { ProjectCard } from '../design-system/components/Card';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  risk_level?: string;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation & View Mode
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const resp = await projectApi.get('/projects');
        setProjects(resp.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail ?? 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

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

  const formatCurrency = (value: number) => {
    const crores = value / 10000000;
    if (crores >= 1.0) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    return `₹${(value / 100000).toFixed(1)} Lakh`;
  };

  // Extract filter options dynamically
  const departments = ['All', ...Array.from(new Set(projects.map(p => p.department)))];
  const districts = ['All', ...Array.from(new Set(projects.map(p => p.location)))];
  const statuses = ['All', 'In Progress', 'Completed', 'Delayed', 'Planned'];

  // Apply filters
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    const matchesDistrict = selectedDistrict === 'All' || p.location === selectedDistrict;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    return matchesSearch && matchesDept && matchesDistrict && matchesStatus;
  });

  return (
    <section className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Infrastructure Workspace</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Tracked Public Works</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time status overview, budgets, physical progress, and site inspection galleries.</p>
        </div>
        
        {/* Toggle view control */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 ${
              viewMode === 'grid' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Cards Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 ${
              viewMode === 'table' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5 3.75h16.5m-16.5-11.25h16.5m-16.5-3.75h16.5" />
            </svg>
            Tabular list
          </button>
        </div>
      </div>

      {/* Dynamic Filters Panel */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, dept, key..."
              className="w-full text-xs pl-10 pr-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white transition"
            >
              <option disabled>Select Department</option>
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>

          {/* District/Location Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white transition"
            >
              <option disabled>Select Location</option>
              {districts.map(dist => (
                <option key={dist} value={dist}>{dist === 'All' ? 'All Districts' : `${dist} District`}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white transition"
            >
              <option disabled>Select Status</option>
              {statuses.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 text-xs font-semibold">
          No works matches selected search query filters.
        </div>
      )}

      {/* Renders Grid of Project Cards */}
      {!loading && !error && filteredProjects.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              location={project.location}
              department={project.department}
              budget={formatCurrency(project.budget)}
              completion={project.completion}
              riskLevel={project.risk_level || 'Low'}
              imageUrl={getBannerImage(project.department)}
              onClickView={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      {/* Renders Tabular list */}
      {!loading && !error && filteredProjects.length > 0 && viewMode === 'table' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-450 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-6 py-4 font-extrabold">Name</th>
                <th className="px-6 py-4 font-extrabold">Department</th>
                <th className="px-6 py-4 font-extrabold">District</th>
                <th className="px-6 py-4 font-extrabold">Budget</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 font-extrabold">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600 font-semibold">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-extrabold text-slate-800">
                    <Link to={`/projects/${project.id}`} className="text-blue-700 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{project.department}</td>
                  <td className="px-6 py-4">{project.location}</td>
                  <td className="px-6 py-4">{formatCurrency(project.budget)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold border ${
                      project.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      project.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      project.status === 'Delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-800 border-yellow-200'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{project.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
}
