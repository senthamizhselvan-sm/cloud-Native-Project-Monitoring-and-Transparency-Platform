const projects = [
  { id: '1', name: 'Village Water Tank', completion: '60%', department: 'Water Supply' },
  { id: '2', name: 'District School Block', completion: '42%', department: 'Education' },
  { id: '3', name: 'Urban Drainage Corridor', completion: '81%', department: 'Urban Development' },
];

export default function ProjectListPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Projects</p>
        <h2 className="text-3xl font-bold">Tracked public works</h2>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 font-medium text-slate-900">{project.name}</td>
                <td className="px-6 py-4 text-slate-600">{project.department}</td>
                <td className="px-6 py-4 text-slate-600">{project.completion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
