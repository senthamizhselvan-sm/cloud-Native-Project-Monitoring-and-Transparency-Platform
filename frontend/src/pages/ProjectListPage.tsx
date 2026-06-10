import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../services/api';

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  status: string;
  completion: number;
  location: string;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Projects</p>
          <h2 className="text-3xl font-bold">Tracked public works</h2>
        </div>
      </div>

      {loading && <p className="text-slate-600 text-sm">Loading projects...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="text-slate-600 text-sm">No projects found. Use the Officer Dashboard to create projects.</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Budget</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link to={`/projects/${project.id}`} className="text-blue-700 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{project.department}</td>
                  <td className="px-6 py-4 text-slate-600">{project.location}</td>
                  <td className="px-6 py-4 text-slate-600">₹{project.budget.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                      project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                      project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                      project.status === 'Delayed' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{project.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
