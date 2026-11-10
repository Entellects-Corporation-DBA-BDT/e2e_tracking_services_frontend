import { useEffect, useMemo, useState } from 'react';
import { Info, ScanSearch, TriangleAlert } from 'lucide-react';
import AnalyzeForm from '../components/analyze/AnalyzeForm';
import AnalysisView from '../components/analyze/AnalysisView';
import ProgressTracker from '../components/analyze/ProgressTracker';
import PageHeader from '../components/PageHeader';
import { useAnalysisRun } from '../hooks/useAnalysisRun';
import { createServices } from '../services/factory';
export default function AnalyzePage({
  settings,
  onAnalysisComplete
}) {
  const run = useAnalysisRun();
  const {
    cancel
  } = run;
  const services = useMemo(() => createServices(settings.demoMode), [settings.demoMode]);
  const [samples, setSamples] = useState([]);
  useEffect(() => () => cancel(), [cancel]);
  useEffect(() => {
    let isActive = true;
    services.jira.listSampleStories().then(stories => {
      if (isActive) setSamples(stories);
    }).catch(() => {
      if (isActive) setSamples([]);
    });
    return () => {
      isActive = false;
    };
  }, [services]);
  const hasStarted = run.steps.understanding !== 'pending';
  return <>
      <PageHeader title="Analyze a requirement" subtitle="Check a new story against past Jira work, Google Drive documents, and GitHub code." />

      {settings.demoMode&&<div className="duplicate-mode-notice" role="note"><strong>Sample analysis</strong> This version uses the original sample scenarios, not live Jira, Drive or GitHub results. History lasts for this session.</div>}
      {!settings.demoMode && <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          <p className="text-sm leading-normal text-blue-900">
            Live services are not connected yet, so analyses will stop with an error until they are.
          </p>
        </div>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <h2 className="text-base font-semibold leading-tight text-slate-900">New analysis</h2>
          <p className="mb-6 mt-1 text-sm leading-normal text-slate-500">Enter a story key or paste the story details.</p>
          <AnalyzeForm isRunning={run.isRunning} samples={samples} onSubmit={input => run.start(input, settings, onAnalysisComplete)} />
        </section>

        <div className="min-w-0 space-y-6">
          {hasStarted ? <>
              {run.runError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900">This analysis could not finish</p>
                    <p className="mt-0.5 text-sm leading-normal text-rose-800">{run.runError}</p>
                  </div>
                </div>}
              <ProgressTracker steps={run.steps} />
              <AnalysisView understanding={run.understanding ?? undefined} sources={run.results} verdict={run.analysis ?? undefined} />
            </> : <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ScanSearch className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-800">Your results will appear here</p>
              <p className="mt-1 max-w-sm text-sm leading-normal text-slate-500">
                Run an analysis to see the verdict, what we understood, and matches from each source.
              </p>
            </div>}
        </div>
      </div>
    </>;
}
