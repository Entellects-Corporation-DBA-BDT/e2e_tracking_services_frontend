import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScoreBadge } from '../Badges';
import { SOURCE_META, TONE_CLASSES } from '../../lib/presentation';
const MAX_MATCHES = 5;
export default function SourceCard({
  source,
  result
}) {
  const meta = SOURCE_META[source];
  const Icon = meta.icon;
  return <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-slate-900">{meta.label}</h3>
          <p className="text-xs text-slate-500">{meta.hint}</p>
        </div>
      </header>

      <div className="flex-1 pt-4">
        {!result && <div className="flex items-center gap-2 text-sm text-slate-500" aria-busy="true">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
            Searching {meta.label}...
          </div>}

        {result?.status === 'error' && <div className={`flex gap-3 rounded-xl border p-3 ${TONE_CLASSES.amber.panel}`}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-900">{meta.label} search failed</p>
              <p className="mt-1 text-xs leading-normal text-amber-900/80">{result.errorMessage}</p>
            </div>
          </div>}

        {result?.status === 'ok' && result.matches.length === 0 && <p className="text-sm text-slate-500">No related items were found.</p>}

        {result?.status === 'ok' && result.matches.length > 0 && <ul className="space-y-3">
            {result.matches.slice(0, MAX_MATCHES).map(match => <li key={match.url} className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <a href={match.url} target="_blank" rel="noopener noreferrer" className="min-w-0 text-sm font-medium leading-normal text-blue-700 hover:underline focus:outline-none focus-visible:underline">
                    {match.title}
                  </a>
                  <ScoreBadge score={match.score} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{match.context}</p>
                <p className="mt-2 text-xs leading-normal text-slate-700">{match.reason}</p>
              </li>)}
          </ul>}
      </div>
    </section>;
}
