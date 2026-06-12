import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { projectApi } from '../services/api';

// Geocoding dictionary for all 38 districts of Tamil Nadu
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  'ariyalur': [11.1378, 79.0743],
  'chengalpattu': [12.6917, 79.9778],
  'chennai': [13.0827, 80.2707],
  'coimbatore': [11.0168, 76.9558],
  'cuddalore': [11.7480, 79.7714],
  'dharmapuri': [12.1211, 78.1582],
  'dindigul': [10.3673, 77.9803],
  'erode': [11.3410, 77.7172],
  'kallakurichi': [11.7381, 78.9639],
  'kanchipuram': [12.8342, 79.7036],
  'kanyakumari': [8.0883, 77.5385],
  'karur': [10.9601, 78.0766],
  'krishnagiri': [12.5186, 78.2137],
  'madurai': [9.9252, 78.1198],
  'mayiladuthurai': [11.1085, 79.6521],
  'nagapattinam': [10.7672, 79.8444],
  'namakkal': [11.2189, 78.1672],
  'nilgiris': [11.4102, 76.6950],
  'perambalur': [11.2342, 78.8820],
  'pudukkottai': [10.3797, 78.8234],
  'ramanathapuram': [9.3639, 78.8395],
  'ranipet': [12.9272, 79.3328],
  'salem': [11.6643, 78.1460],
  'sivaganga': [9.8433, 78.4809],
  'tenkasi': [8.9595, 77.3150],
  'thanjavur': [10.7870, 79.1378],
  'theni': [10.0104, 77.4777],
  'thoothukudi': [8.7642, 78.1348],
  'tuticorin': [8.7642, 78.1348],
  'tiruchirappalli': [10.7905, 78.7047],
  'trichy': [10.7905, 78.7047],
  'tirunelveli': [8.7139, 77.7567],
  'tirupathur': [12.4934, 78.5678],
  'tiruppur': [11.1085, 77.3411],
  'tiruvallur': [13.1438, 79.9077],
  'tiruvannamalai': [12.2280, 79.0664],
  'tiruvarur': [10.7705, 79.6359],
  'vellore': [12.9165, 79.1325],
  'viluppuram': [11.9401, 79.4861],
  'virudhunagar': [9.5872, 77.9514],
  'default': [11.1271, 78.6569]
};

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
];

const getCoordinates = (locationName: string): [number, number] => {
  const norm = locationName.toLowerCase().trim();
  for (const [key, value] of Object.entries(LOCATION_COORDINATES)) {
    if (norm.includes(key)) return value;
  }
  const def = LOCATION_COORDINATES['default'];
  return [def[0] + (Math.random() - 0.5) * 0.8, def[1] + (Math.random() - 0.5) * 0.8];
};

const getEmojiMarker = (status: string, completion: number) => {
  let colorClass = 'text-blue-600';
  const normStatus = status.toLowerCase();
  if (normStatus.includes('complete')) {
    colorClass = 'text-emerald-600';
  } else if (completion > 80) {
    colorClass = 'text-cyan-600';
  } else if (normStatus.includes('delay')) {
    colorClass = 'text-rose-500';
  } else if (normStatus.includes('plan')) {
    colorClass = 'text-indigo-500';
  } else {
    colorClass = 'text-amber-500';
  }

  const pinSvg = `
    <div class="${colorClass}" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.35)); cursor: pointer;">
      <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: pinSvg,
    className: 'custom-portal-svg',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
  assigned_engineer?: string | null;
  risk_level?: string;
}

const getProjectImage = (dept: string, name: string) => {
  const d = dept.toLowerCase();
  const n = name.toLowerCase();
  if (d.includes('water') || n.includes('water') || n.includes('lake') || n.includes('supply')) {
    return "https://images.unsplash.com/photo-1548815717-fd1a48e5c3c9?auto=format&fit=crop&q=80&w=400";
  }
  if (d.includes('road') || n.includes('road') || n.includes('highway') || n.includes('bridge') || n.includes('pave')) {
    return "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400";
  }
  if (d.includes('smart') || n.includes('smart') || n.includes('drain') || n.includes('city') || n.includes('urban') || d.includes('sanitation')) {
    return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=400";
  }
  return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400";
};

export default function PublicPortal() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nearMeFilter, setNearMeFilter] = useState('Chennai');

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const res = await projectApi.get('/projects');
        setProjects(res.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch public works projects list.');
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || p.department === deptFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // KPI Computations
  const totalBudget = projects.reduce((acc, curr) => acc + curr.budget, 0);
  const avgCompletion = projects.length > 0 ? Math.round(projects.reduce((acc, curr) => acc + curr.completion, 0) / projects.length) : 0;
  const completedCount = projects.filter(p => p.status.toLowerCase().includes('complete') || p.status === 'Completed').length;
  const ongoingCount = projects.filter(p => p.completion > 0 && p.completion < 100).length;

  const departments = Array.from(new Set(projects.map(p => p.department)));
  const statuses = Array.from(new Set(projects.map(p => p.status)));

  const featuredProjects = projects.filter(p => p.completion >= 80 && p.status !== 'Completed').slice(0, 3);
  const recentCompletions = projects.filter(p => p.status === 'Completed').slice(0, 3);
  const projectsNearMe = projects.filter(p => p.location.toLowerCase().includes(nearMeFilter.toLowerCase())).slice(0, 4);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete')) return 'success';
    if (s.includes('progress') || s.includes('ongoing')) return 'info';
    if (s.includes('plan')) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Welcome */}
      <div className="text-center bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white rounded-2xl p-10 shadow-lg border border-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">Public Project Transparency Portal</h1>
        <p className="text-indigo-200 mt-3 max-w-2xl mx-auto text-sm md:text-base font-medium">
          Welcome to the citizen monitoring dashboard. Search, locate, and audit government construction works, budgets, timelines, and file grievances.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex flex-col justify-between py-5 px-6 border-t-4 border-blue-600 bg-white shadow-sm rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Projects</span>
          <span className="text-3xl font-extrabold text-slate-800 mt-1">{projects.length}</span>
        </Card>
        <Card className="flex flex-col justify-between py-5 px-6 border-t-4 border-emerald-600 bg-white shadow-sm rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invested Budget</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalBudget)}</span>
        </Card>
        <Card className="flex flex-col justify-between py-5 px-6 border-t-4 border-indigo-600 bg-white shadow-sm rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Progress</span>
          <span className="text-3xl font-extrabold text-indigo-700 mt-1">{avgCompletion}%</span>
        </Card>
        <Card className="flex flex-col justify-between py-5 px-6 border-t-4 border-yellow-500 bg-white shadow-sm rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Phase Split</span>
          <span className="flex items-center gap-2 mt-2 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>{ongoingCount} Ongoing</span>
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{completedCount} Done</span>
            </span>
          </span>
        </Card>
      </div>

      {/* Featured Projects Showcase */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-xl font-bold text-slate-800">Featured Projects (Nearing Completion)</h2>
          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">High Impact Works</span>
        </div>
        {loading ? (
          <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
        ) : featuredProjects.length === 0 ? (
          <p className="text-sm text-slate-500">No active featured projects.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map(p => (
              <Card key={p.id} className="p-0 overflow-hidden flex flex-col justify-between border border-slate-200 rounded-xl hover:shadow-md transition bg-white group">
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img src={getProjectImage(p.department, p.name)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="info">{p.completion}% Complete</Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{p.department} &bull; {p.location}</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <span className="font-bold text-slate-700 text-xs">{formatCurrency(p.budget)}</span>
                  <Link to={`/projects/${p.id}`} className="text-xs text-blue-600 font-bold hover:underline">View Progress &rarr;</Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completions & Success Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left completions list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Recent Completions</h3>
          {loading ? (
            <div className="h-44 bg-slate-50 rounded-xl animate-pulse" />
          ) : recentCompletions.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">No projects completed recently.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentCompletions.map(p => (
                <Card key={p.id} className="p-4 flex gap-4 border border-slate-200 rounded-xl hover:shadow-sm bg-white">
                  <img src={getProjectImage(p.department, p.name)} alt={p.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex flex-col justify-between overflow-hidden">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate capitalize">{p.department} &bull; {p.location}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success">Completed</Badge>
                      <Link to={`/projects/${p.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">Case Details</Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Success Stories card */}
        <Card className="lg:col-span-4 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 rounded-xl relative overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_90%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Success Story Spotlight</span>
            <h4 className="font-bold text-base mt-2 text-slate-100">Chennai Smart Drainage System</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Serving over 4 Lakh residents, the Chennai Smart Drainage system project finished 15 days ahead of schedule, preventing water-logging during the monsoon season.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Verified Citizen Audits</span>
            <span className="text-emerald-400 font-bold">100% Quality rating</span>
          </div>
        </Card>
      </div>

      {/* Projects Near Me section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-xl font-bold text-slate-800">Projects Near Me</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Select Location:</span>
            <select
              value={nearMeFilter}
              onChange={(e) => setNearMeFilter(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TAMIL_NADU_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-44 bg-slate-50 rounded-xl animate-pulse" />
        ) : projectsNearMe.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">No construction works currently registered in {nearMeFilter}.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {projectsNearMe.map(p => (
              <Card key={p.id} className="p-3 border border-slate-200 rounded-xl hover:shadow bg-white flex flex-col justify-between h-48">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug">{p.name}</h4>
                  <p className="text-[9px] text-slate-400 mt-1 capitalize">{p.department}</p>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{p.completion}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-indigo-600 h-1" style={{ width: `${p.completion}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="font-bold text-slate-800">{formatCurrency(p.budget)}</span>
                    <Link to={`/projects/${p.id}`} className="text-blue-600 font-bold hover:underline">Details</Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Geographical GIS Map (Local Construction Node Pins)</h3>
        {loading ? (
          <div className="flex items-center justify-center h-80 bg-white border border-slate-200 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden border border-slate-200 rounded-xl h-96 relative">
            <MapContainer
              center={[11.1271, 78.6569]}
              zoom={7}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredProjects.map((p) => {
                const coord = getCoordinates(p.location);
                return (
                  <Marker key={p.id} position={coord} icon={getEmojiMarker(p.status, p.completion)}>
                    <Popup>
                      <div className="p-2.5 space-y-1.5 text-slate-800 text-xs min-w-[200px] font-sans">
                        <div className="font-bold text-blue-900 leading-tight">{p.name}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{p.department} &bull; {p.location}</div>
                        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-100 my-1 text-[10px]">
                          <div>
                            <span className="block text-slate-400 font-semibold text-[8px] uppercase">Budget</span>
                            <strong>₹{(p.budget/10000000).toFixed(2)} Cr</strong>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-semibold text-[8px] uppercase">Completion</span>
                            <strong>{p.completion}%</strong>
                          </div>
                        </div>
                        {p.risk_level && (
                          <div className="text-[10px] flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Risk Assessment:</span>
                            <Badge variant={p.risk_level === 'High' ? 'danger' : p.risk_level === 'Medium' ? 'warning' : 'success'}>
                              {p.risk_level}
                            </Badge>
                          </div>
                        )}
                        <div className="flex justify-end pt-1.5">
                          <Link to={`/projects/${p.id}`} className="text-blue-600 font-bold hover:underline text-[10px]">
                            Full Profile Details &rarr;
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </Card>
        )}
      </div>

      {/* Search & Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Filters Panel */}
        <Card className="lg:col-span-3 h-fit space-y-4 border border-slate-200 rounded-xl">
          <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Filter Portal</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Search Keywords</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by project or district..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Project Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Right Projects Card Deck */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Public Works Catalog</h3>
            <span className="text-xs text-slate-500 font-semibold">Showing {filteredProjects.length} Projects</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-xs font-semibold">{error}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No matching public projects found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="flex flex-col justify-between hover:shadow-md transition duration-200 border border-slate-200 rounded-xl bg-white">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{project.name}</h4>
                      <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 capitalize font-medium">
                      {project.department} &bull; {project.location}
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Completion Rate</span>
                      <span className="font-bold text-slate-700">{project.completion}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.completion}%` }}></div>
                    </div>
                    
                    {project.risk_level && (
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>Risk Level:</span>
                            <span className="inline-flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full inline-block ${
                                project.risk_level === 'High' ? 'bg-red-500' :
                                project.risk_level === 'Medium' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                              <span>{project.risk_level}</span>
                            </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs mt-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                      <span className="font-extrabold text-slate-800">{formatCurrency(project.budget)}</span>
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold transition hover:underline"
                      >
                        View Public Data &rarr;
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
