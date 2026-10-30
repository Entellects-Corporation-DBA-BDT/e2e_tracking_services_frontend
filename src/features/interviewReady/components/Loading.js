import { Loader2 } from 'lucide-react';
export function Spinner({ className = 'h-5 w-5' }) {
    return <Loader2 className={`animate-spin ${className}`} aria-hidden="true"/>;
}
export function LoadingOverlay({ label }) {
    return (<div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <Spinner className="h-8 w-8 text-teal-500"/>
      <p className="text-sm font-medium text-navy-700">{label}</p>
    </div>);
}
export function SkeletonLines({ lines = 4 }) {
    return (<div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (<div key={i} className="skeleton h-4" style={{ width: `${85 - i * 8}%` }}/>))}
    </div>);
}
export function ButtonSpinner({ label }) {
    return (<span className="inline-flex items-center gap-2">
      <Spinner className="h-4 w-4"/>
      {label}
    </span>);
}
