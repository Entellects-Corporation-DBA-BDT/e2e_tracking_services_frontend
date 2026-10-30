import { FileText, Search, Scissors, MessageSquare, ClipboardList, CheckCircle2 } from 'lucide-react';
const STEPS = [
    { id: 'inputs', label: 'Upload Documents', icon: FileText },
    { id: 'review', label: 'Review Text', icon: ClipboardList },
    { id: 'analysis', label: 'Analyze Match', icon: Search },
    { id: 'tailor', label: 'Tailor Resume', icon: Scissors },
    { id: 'interviewSetup', label: 'Interview Setup', icon: MessageSquare },
    { id: 'interview', label: 'Practice', icon: MessageSquare },
    { id: 'report', label: 'Feedback', icon: CheckCircle2 },
];
export function ProgressHeader({ current, onNavigate, completed, reachable }) {
    const currentIndex = STEPS.findIndex((s) => s.id === current);
    return (<nav aria-label="Workflow progress" className="w-full">
      <ol className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin">
        {STEPS.map((step, idx) => {
            const isCurrent = step.id === current;
            const isCompleted = completed.has(step.id);
            const isReachable = reachable.has(step.id);
            const Icon = step.icon;
            return (<li key={step.id} className="flex items-center flex-shrink-0">
              <button type="button" onClick={() => isReachable && onNavigate(step.id)} disabled={!isReachable} aria-current={isCurrent ? 'step' : undefined} aria-label={`${step.label}${isCompleted ? ' (completed)' : ''}`} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isCurrent
                    ? 'bg-navy-700 text-white shadow-sm'
                    : isCompleted
                        ? 'text-teal-700 hover:bg-teal-50'
                        : isReachable
                            ? 'text-navy-700 hover:bg-navy-100'
                            : 'text-navy-300 cursor-not-allowed'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isCurrent
                    ? 'bg-teal-400 text-navy-900'
                    : isCompleted
                        ? 'bg-teal-500 text-white'
                        : 'bg-navy-100 text-navy-500'}`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4"/> : <Icon className="h-3.5 w-3.5"/>}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (<span className={`mx-0.5 h-px w-4 sm:w-6 ${idx < currentIndex ? 'bg-teal-400' : 'bg-navy-200'}`} aria-hidden="true"/>)}
            </li>);
        })}
      </ol>
    </nav>);
}
