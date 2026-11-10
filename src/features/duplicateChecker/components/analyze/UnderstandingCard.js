import { Sparkles } from 'lucide-react';
export default function UnderstandingCard({
  understanding
}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold leading-tight text-slate-900">What we understood</h3>
      </div>
      <p className="text-sm leading-normal text-slate-800">{understanding.summary}</p>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Business goal</dt>
          <dd className="mt-1.5 text-sm leading-normal text-slate-700">{understanding.businessGoal}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Modules involved</dt>
          <dd className="mt-1.5 flex flex-wrap gap-2">
            {understanding.entities.map(entity => <span key={entity} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {entity}
              </span>)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Keywords</dt>
          <dd className="mt-1.5 flex flex-wrap gap-2">
            {understanding.keywords.map(keyword => <span key={keyword} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {keyword}
              </span>)}
          </dd>
        </div>
      </dl>
    </section>;
}
