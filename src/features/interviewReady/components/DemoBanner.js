import { Sparkles, AlertTriangle } from 'lucide-react';
export function DemoBanner({ message }) {
    return (<div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-amber-900 animate-fade-in" role="status">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0"/>
      <div className="flex-1">
        <p className="text-sm font-bold flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5"/> DEMO MODE
        </p>
        <p className="mt-0.5 text-sm leading-relaxed">{message}</p>
      </div>
    </div>);
}
