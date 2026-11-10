import { useEffect } from 'react';
import { X } from 'lucide-react';
import AnalysisView from '../analyze/AnalysisView';
import { VerdictBadge } from '../Badges';
import { formatDateTime } from '../../lib/presentation';
export default function AnalysisModal({
  analysis,
  onClose
}) {
  useEffect(() => {
    const handleKey = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="analysis-modal-title">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-blue-700">{analysis.storyKey || 'No key'}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{formatDateTime(analysis.createdAt)}</span>
              <VerdictBadge verdict={analysis.verdict} />
            </div>
            <h2 id="analysis-modal-title" className="mt-2 text-lg font-semibold leading-tight text-slate-900">
              {analysis.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close saved analysis" className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">
          <AnalysisView understanding={analysis.understanding} sources={analysis.sources} verdict={analysis} />
        </div>
      </div>
    </div>;
}
