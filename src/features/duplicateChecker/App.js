import './duplicateChecker.css';
import './duplicateCheckerUtilities.css';
import { useState } from 'react';
import { Menu, ScanSearch } from 'lucide-react';
import AppSidebar from './components/AppSidebar';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { DEFAULT_SETTINGS } from './mocks/settings';
import { SEED_ANALYSES } from './mocks/history';
function App() {
  const [page, setPage] = useState('analyze');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [analyses, setAnalyses] = useState(SEED_ANALYSES);
  const updateSettings = patch => {
    setSettings(current => ({
      ...current,
      ...patch
    }));
  };
  const addAnalysis = analysis => {
    setAnalyses(current => [analysis, ...current]);
  };
  return <div className="duplicate-checker"><div className="duplicate-tool-layout min-h-screen bg-slate-50 font-sans text-slate-900">
      <AppSidebar activePage={page} isOpen={isNavOpen} onNavigate={setPage} onClose={() => setIsNavOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setIsNavOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-900">Duplicate Checker</span>
          </div>
        </header>

        <main className="duplicate-tool-main mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {page === 'analyze' && <AnalyzePage settings={settings} onAnalysisComplete={addAnalysis} />}
          {page === 'history' && <HistoryPage analyses={analyses} />}
          {page === 'settings' && <SettingsPage settings={settings} onChange={updateSettings} />}
        </main>
      </div>
    </div></div>;
}
export default App;
