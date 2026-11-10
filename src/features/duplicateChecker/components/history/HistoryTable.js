import { ChevronRight } from 'lucide-react';
import { ScoreBadge, VerdictBadge } from '../Badges';
import { formatDateTime } from '../../lib/presentation';
export default function HistoryTable({
  analyses,
  onSelect
}) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Story</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Verdict</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Confidence</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
            <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {analyses.map(analysis => <tr key={analysis.id} tabIndex={0} onClick={() => onSelect(analysis)} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(analysis);
          }
        }} className="group cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none">
              <td className="max-w-xs px-5 py-4">
                <p className="text-xs font-medium text-blue-700">{analysis.storyKey || 'No key'}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{analysis.title}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <VerdictBadge verdict={analysis.verdict} />
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <ScoreBadge score={analysis.confidence} />
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDateTime(analysis.createdAt)}</td>
              <td className="px-3 py-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>;
}
