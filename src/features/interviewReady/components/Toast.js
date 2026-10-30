import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};
const STYLES = {
    success: 'border-teal-200 bg-teal-50 text-teal-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-navy-200 bg-navy-50 text-navy-900',
};
export function ToastViewport({ toasts, onDismiss }) {
    return (<div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
            const Icon = ICONS[t.kind];
            return (<ToastItem key={t.id} toast={t} Icon={Icon} onDismiss={onDismiss} styleClass={STYLES[t.kind]}/>);
        })}
    </div>);
}
function ToastItem({ toast, Icon, onDismiss, styleClass, }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);
    return (<div className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-up ${styleClass}`} role="status" aria-live="polite">
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0"/>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm opacity-90">{toast.message}</p>}
      </div>
      <button type="button" onClick={() => onDismiss(toast.id)} className="rounded p-1 hover:bg-black/5" aria-label="Dismiss notification">
        <X className="h-4 w-4"/>
      </button>
    </div>);
}
export function useToasts() {
    return {
        push: () => Math.random().toString(36).slice(2),
    };
}
export function ToastBoundary({ children }) {
    return <>{children}</>;
}
