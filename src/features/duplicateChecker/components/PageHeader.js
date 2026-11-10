export default function PageHeader({
  title,
  subtitle,
  action
}) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900">{title}</h1>
        <p className="mt-1.5 text-sm leading-normal text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>;
}
