import { useParams } from 'react-router-dom';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Project details</p>
        <h2 className="mt-2 text-3xl font-bold">Project #{projectId}</h2>
      </div>
      <p className="text-slate-600">
        This page will display budget utilization, document history, progress images, assigned engineer,
        and citizen feedback for the selected project.
      </p>
    </section>
  );
}
