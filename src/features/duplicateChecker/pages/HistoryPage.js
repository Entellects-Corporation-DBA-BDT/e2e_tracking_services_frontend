import { useCallback, useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import AnalysisModal from '../components/history/AnalysisModal';
import HistoryTable from '../components/history/HistoryTable';
import PageHeader from '../components/PageHeader';
import { VERDICT_META } from '../lib/presentation';
const VERDICT_OPTIONS = Object.keys(VERDICT_META);
export default function HistoryPage({
  analyses
}) {
  const [query, setQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const closeModal = useCallback(() => setSelected(null), []);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return analyses.filter(analysis => {
      if (verdictFilter !== 'ALL' && analysis.verdict !== verdictFilter) return false;
      if (!term) return true;
      return `${analysis.storyKey} ${analysis.title}`.toLowerCase().includes(term);
    });
  }, [analyses, query, verdictFilter]);
  return <>
      <PageHeader title="Analysis history" subtitle="Every requirement you have checked, with its verdict. Select a row to reopen the full result." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by story key or title" aria-label="Search analyses" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15" />
        </div>
        <select value={verdictFilter} onChange={event => setVerdictFilter(event.target.value)} aria-label="Filter by verdict" className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 sm:w-64">
          <option value="ALL">All verdicts</option>
          {VERDICT_OPTIONS.map(verdict => <option key={verdict} value={verdict}>
              {VERDICT_META[verdict].label}
            </option>)}
        </select>
      </div>

      {filtered.length === 0 ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-800">
            {analyses.length === 0 ? 'No analyses yet' : 'No analyses match your filters'}
          </p>
          <p className="mt-1 text-sm leading-normal text-slate-500">
            {analyses.length === 0 ? 'Run an analysis and it will be saved here.' : 'Try a different search term or verdict.'}
          </p>
        </div> : <HistoryTable analyses={filtered} onSelect={setSelected} />}

      {selected && <AnalysisModal analysis={selected} onClose={closeModal} />}
    </>;
}
