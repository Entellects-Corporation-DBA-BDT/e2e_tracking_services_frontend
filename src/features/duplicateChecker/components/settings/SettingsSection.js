import { CircleCheck, Link2 } from 'lucide-react';
export const INPUT_CLASS = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15';
export function SettingsSection({
  title,
  description,
  icon,
  children
}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-normal text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>;
}
export function Field({
  id,
  label,
  hint,
  children
}) {
  return <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-normal text-slate-500">{hint}</p>}
    </div>;
}
export function ConnectButton({
  connected,
  onToggle
}) {
  if (connected) {
    return <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
          <CircleCheck className="h-4 w-4" aria-hidden="true" />
          Connected (sample)
        </span>
        <button type="button" onClick={onToggle} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100">
          Disconnect
        </button>
      </div>;
  }
  return <button type="button" onClick={onToggle} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:translate-y-0">
      <Link2 className="h-4 w-4" aria-hidden="true" />
      Connect Google Drive
    </button>;
}
