import { Download } from 'lucide-react';
import SourceCard from './SourceCard';
import UnderstandingCard from './UnderstandingCard';
import VerdictBanner from './VerdictBanner';
const SOURCE_ORDER = ['jira', 'drive', 'github'];
export default function AnalysisView({
  understanding,
  sources,
  verdict
}) {
  return <div className="space-y-6">
      {verdict && <>
          <VerdictBanner verdict={verdict} />
          <div className="flex justify-end">
            <button type="button" disabled title="Export is coming soon" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-400">
              <Download className="h-4 w-4" aria-hidden="true" />
              Export report
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Coming soon</span>
            </button>
          </div>
        </>}

      {understanding && <UnderstandingCard understanding={understanding} />}

      <div className="grid gap-5 lg:grid-cols-3">
        {SOURCE_ORDER.map(source => <SourceCard key={source} source={source} result={sources[source]} />)}
      </div>
    </div>;
}
