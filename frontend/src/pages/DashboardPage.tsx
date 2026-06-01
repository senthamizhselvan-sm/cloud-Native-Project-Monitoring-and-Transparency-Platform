const metrics = [
  { label: 'Active projects', value: '128' },
  { label: 'Delayed projects', value: '14' },
  { label: 'Budget utilization', value: '68%' },
  { label: 'Citizen feedback', value: '42 open' },
];

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Overview</p>
        <h2 className="mt-2 text-4xl font-bold">Monitor public projects with transparency.</h2>
        <p className="mt-3 max-w-3xl text-slate-200">
          A unified cloud portal for citizens, officers, engineers, and contractors to track progress,
          costs, documents, and grievances.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
