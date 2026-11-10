import { TONE_CLASSES, VERDICT_META } from '../../lib/presentation';
export default function VerdictBanner({
  verdict
}) {
  const meta = VERDICT_META[verdict.verdict];
  const tone = TONE_CLASSES[meta.tone];
  const Icon = meta.icon;
  return <section className={`rounded-2xl border p-6 shadow-sm ${tone.panel}`} aria-live="polite">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Verdict</p>
          <h2 className={`mt-1 text-xl font-semibold leading-tight ${tone.text}`}>{meta.label}</h2>
          <p className="mt-2 text-sm leading-normal text-slate-800">{verdict.explanation}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium text-slate-500">Confidence</p>
          <p className="text-2xl font-semibold leading-tight text-slate-900">{verdict.confidence}%</p>
        </div>
      </div>
    </section>;
}
