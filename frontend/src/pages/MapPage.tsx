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
    if (norm.includes(key)) {
      return value;
    }
  }
  const def = LOCATION_COORDINATES['default'];
  const jitterLat = (Math.random() - 0.5) * 1.5;
  const jitterLng = (Math.random() - 0.5) * 1.5;
  return [def[0] + jitterLat, def[1] + jitterLng];
};

const getEmojiMarker = (status: string, completion: number, riskLevel?: string) => {
  let colorClass = 'text-blue-600';
  const normStatus = status.toLowerCase();
  
  if (riskLevel === 'High') {
    colorClass = 'text-rose-600';
  } else if (normStatus.includes('complete')) {
    colorClass = 'text-emerald-600';
  } else if (completion > 80) {
    colorClass = 'text-cyan-600';
  } else if (normStatus.includes('delay') || normStatus.includes('critical') || riskLevel === 'Medium') {
    colorClass = 'text-amber-500';
  } else if (normStatus.includes('plan')) {
    colorClass = 'text-indigo-500';
  } else {
    colorClass = 'text-slate-500';
  }

  const pinSvg = `
    <div class="${colorClass}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35)); cursor: pointer;">
      <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: pinSvg,
    className: 'custom-marker-svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  location: string;
  status: string;
  completion: number;
  assigned_engineer: string | null;
  risk_score?: number;
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

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const res = await projectApi.get('/projects');
        setProjects(res.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch projects for the map. Please verify that the project-service is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const departments = Array.from(new Set(projects.map((p) => p.department)));
  const statuses = Array.from(new Set(projects.map((p) => p.status)));
  const locations = TAMIL_NADU_DISTRICTS;

  const filteredProjects = projects.filter((p) => {
    return (
      (selectedDept === '' || p.department === selectedDept) &&
      (selectedStatus === '' || p.status === selectedStatus) &&
      (selectedLocation === '' || p.location.trim().toLowerCase() === selectedLocation.trim().toLowerCase())
    );
  });

  const getStatusVariant = (status: string) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Geographical GIS Tracking Map</h2>
          <p className="text-slate-500 text-sm mt-1">Interactive map monitoring real-time civil project progress and risk scores across districts.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/public"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold transition"
          >
            Public Portal
          </Link>
          <Link
            to="/projects"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition shadow-sm"
          >
            Project List
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 shadow-sm rounded-xl p-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((stat) => (
              <option key={stat} value={stat}>{stat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">District / Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Districts</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Map Section */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 text-red-700 p-8 text-center rounded-xl">
          <p className="font-semibold">{error}</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-200 rounded-xl shadow-sm h-[500px]">
          <MapContainer
            center={[11.1271, 78.6569]}
            zoom={7}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredProjects.map((project) => {
              const position = getCoordinates(project.location);
              return (
                <Marker
                  key={project.id}
                  position={position}
                  icon={getEmojiMarker(project.status, project.completion, project.risk_level)}
                >
                  <Popup>
                    <div className="p-1 space-y-2.5 text-slate-800 w-[240px] font-sans">
                      <div className="relative h-24 rounded-lg overflow-hidden -mx-1 -mt-1 shadow-sm">
                        <img
                          src={getProjectImage(project.department, project.name)}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-bold text-xs leading-snug text-blue-900">{project.name}</div>
                        <div className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                          {project.department} &bull; {project.location}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100/80 text-[10px]">
                        <div>
                          <span className="block text-[8px] font-semibold text-slate-400 uppercase">Budget</span>
                          <span className="font-bold text-slate-800">{formatCurrency(project.budget)}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-semibold text-slate-400 uppercase">Risk Level</span>
                          <span className={`font-bold ${
                            project.risk_level === 'High' ? 'text-red-600' :
                            project.risk_level === 'Medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            <span className="inline-flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full inline-block ${
                                project.risk_level === 'High' ? 'bg-red-500' :
                                project.risk_level === 'Medium' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                              <span>{project.risk_level || 'Low'}</span>
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-medium">Completion Rate:</span>
                          <span className="font-bold text-slate-700">{project.completion}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1"
                            style={{ width: `${project.completion}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-100">
                        👨‍💻 Engineer: <span className="font-semibold text-slate-700 font-mono">{project.assigned_engineer || 'Unassigned'}</span>
                      </div>

                      <div className="flex justify-end pt-1 bg-slate-50 -mx-3 -mb-3 p-2.5 rounded-b-lg border-t border-slate-100">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 hover:underline transition"
                        >
                          Audit Progress Details &rarr;
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

      {/* Map Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center py-4 bg-white/80 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-2xl font-black text-slate-800">{filteredProjects.length}</div>
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">Filtered Projects</div>
        </Card>
        <Card className="text-center py-4 bg-white/80 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-2xl font-black text-green-600">
            {filteredProjects.filter(p => p.status.toLowerCase().includes('complete') || p.status === 'Completed').length}
          </div>
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">Completed</div>
        </Card>
        <Card className="text-center py-4 bg-white/80 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-2xl font-black text-blue-600">
            {filteredProjects.filter(p => p.completion > 0 && p.completion < 100).length}
          </div>
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">In Progress</div>
        </Card>
        <Card className="text-center py-4 bg-white/80 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-2xl font-black text-red-500">
            {filteredProjects.filter(p => p.risk_level === 'High' || p.status === 'Delayed').length}
          </div>
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">Critical High Risk</div>
        </Card>
      </div>
    </div>
  );
}
