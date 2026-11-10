import { History, ScanSearch, Settings, X } from 'lucide-react';
const NAV_ITEMS = [{
  page: 'analyze',
  label: 'Analyze',
  icon: ScanSearch
}, {
  page: 'history',
  label: 'History',
  icon: History
}, {
  page: 'settings',
  label: 'Settings',
  icon: Settings
}];
function NavContent({
  activePage,
  onNavigate
}) {
  return <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <ScanSearch className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">Duplicate Checker</p>
          <p className="text-xs leading-normal text-slate-500">Requirement analysis</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {NAV_ITEMS.map(item => {
        const isActive = item.page === activePage;
        const Icon = item.icon;
        return <button key={item.page} type="button" onClick={() => onNavigate(item.page)} aria-current={isActive ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>;
      })}
      </nav>

      <div className="px-5 py-5">
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs leading-normal text-slate-500">
          Showing sample data. Live sources are not connected yet.
        </p>
      </div>
    </div>;
}
export default function AppSidebar({
  activePage,
  isOpen,
  onNavigate,
  onClose
}) {
  const handleNavigate = page => {
    onNavigate(page);
    onClose();
  };
  return <>
      <aside className="absolute inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <NavContent activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {isOpen && <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl" aria-label="Navigation">
            <button type="button" onClick={onClose} aria-label="Close navigation" className="absolute right-3 top-6 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <NavContent activePage={activePage} onNavigate={handleNavigate} />
          </aside>
        </div>}
    </>;
}
