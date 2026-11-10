import { CheckCircle2, Circle, Loader2, TriangleAlert } from 'lucide-react';
const STEPS = [{
  id: 'understanding',
  label: 'Understanding story'
}, {
  id: 'jira',
  label: 'Searching Jira'
}, {
  id: 'drive',
  label: 'Searching Google Drive'
}, {
  id: 'github',
  label: 'Searching GitHub'
}, {
  id: 'verdict',
  label: 'Final verdict'
}];
function StepIcon({
  status
}) {
  if (status === 'done') {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  }
  if (status === 'running') {
    return <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />;
  }
  if (status === 'failed') {
    return <TriangleAlert className="h-5 w-5 text-rose-600" aria-hidden="true" />;
  }
  return <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />;
}
const STATUS_TEXT = {
  pending: 'Waiting',
  running: 'In progress',
  done: 'Complete',
  failed: 'Failed'
};
export default function ProgressTracker({
  steps
}) {
  return <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5" aria-label="Analysis progress">
      {STEPS.map(step => {
      const status = steps[step.id];
      return <li key={step.id} className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors duration-300 sm:flex-col sm:justify-center sm:text-center ${status === 'running' ? 'border-blue-200 bg-blue-50/60' : status === 'failed' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
            <StepIcon status={status} />
            <div className="min-w-0">
              <p className={`text-sm font-medium leading-tight ${status === 'pending' ? 'text-slate-500' : 'text-slate-900'}`}>
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{STATUS_TEXT[status]}</p>
            </div>
          </li>;
    })}
    </ol>;
}
