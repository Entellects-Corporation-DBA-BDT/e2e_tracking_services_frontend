import { useState } from 'react';
import { Download, RotateCcw, Sparkles, TrendingUp, AlertCircle, BookOpen, CalendarDays, ArrowLeft, Star, Trophy, RefreshCw, CheckCircle2, SkipForward, } from 'lucide-react';
import { downloadTextPdf, reportToText } from '../lib/download';
import { LoadingOverlay } from '../components/Loading';
import { DemoBanner } from '../components/DemoBanner';
export function ReportScreen({ loading, report, results, isDemo, retryQueue, onDownloadPdf, onRetryMissed, onNewInterview, onBackToResume, onBack, }) {
    const [selectedRetry, setSelectedRetry] = useState(new Set());
    const weakIndices = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => !r.skipped && r.feedback)
        .filter(({ r }) => {
        const avg = avgRating(r.feedback.ratings);
        return avg < 3.5;
    })
        .map(({ r }) => r.question.index);
    const missedIndices = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.skipped || !r.feedback)
        .map(({ r }) => r.question.index);
    const retryable = [...new Set([...missedIndices, ...weakIndices])].sort((a, b) => a - b);
    const toggleRetry = (i) => {
        setSelectedRetry((prev) => {
            const next = new Set(prev);
            if (next.has(i))
                next.delete(i);
            else
                next.add(i);
            return next;
        });
    };
    const handleDownload = () => {
        if (!report)
            return;
        const body = reportToText({
            ...report,
            perQuestion: report.perQuestion.length
                ? report.perQuestion
                : results.map((r) => ({
                    question: r.question.text,
                    category: r.question.category,
                    skipped: r.skipped,
                    feedbackSummary: r.feedback
                        ? `Done well: ${r.feedback.doneWell.join('; ')}. Missing: ${r.feedback.missingOrUnclear.join('; ')}.`
                        : 'Skipped or not answered.',
                    ratings: r.feedback?.ratings || [],
                })),
        });
        downloadTextPdf('InterviewReady AI - Final Report', body, 'interview-report.pdf');
        onDownloadPdf();
    };
    if (loading) {
        return (<div className="card p-6">
        <LoadingOverlay label="Compiling your final report..."/>
      </div>);
    }
    if (!report) {
        return (<div className="card p-6 text-center">
        <AlertCircle className="h-8 w-8 text-navy-400 mx-auto"/>
        <p className="mt-3 text-sm text-navy-600">No report is available yet.</p>
        <button type="button" onClick={onBack} className="btn-outline mt-4">
          Back
        </button>
      </div>);
    }
    return (<div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center">
        <span className="badge bg-teal-100 text-teal-700">
          <Trophy className="h-3 w-3"/> Final report
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">Your mock interview report</h2>
      </div>

      {isDemo && <DemoBanner message="This is a DEMO report using fictional sample data, not a real assessment of your interview."/>}

      {report.incomplete && (<div className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4"/> Incomplete session: {report.skippedCount} question
            {report.skippedCount !== 1 ? 's' : ''} skipped. {report.unansweredCount||0} not attempted. Skipped questions are excluded from averages.
          </p>
        </div>)}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Answered" value={report.answeredCount} icon={CheckCircle2} color="text-teal-600"/>
        <StatCard label="Skipped" value={report.skippedCount} icon={SkipForward} color="text-navy-500"/>
        <StatCard label="Strongest areas" value={report.strongestAreas.length} icon={TrendingUp} color="text-teal-600"/>
        <StatCard label="Topics to study" value={report.topicsToStudy.length} icon={BookOpen} color="text-navy-600"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ListCard title="Strongest areas" icon={TrendingUp} items={report.strongestAreas} color="text-teal-600"/>
        <ListCard title="Main improvement areas" icon={AlertCircle} items={report.improvementAreas} color="text-amber-600"/>
        <ListCard title="Topics to study" icon={BookOpen} items={report.topicsToStudy} color="text-navy-600"/>
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <CalendarDays className="h-5 w-5 text-teal-500"/> Personalized practice plan
          </h3>
          <ul className="mt-3 space-y-2">
            {report.practicePlan.map((p, i) => (<li key={i} className="rounded-lg bg-navy-50 px-3 py-2">
                <p className="text-sm font-semibold text-navy-800">{p.day}</p>
                <p className="text-sm text-navy-600">{p.activity}</p>
                <p className="text-xs text-navy-400">Focus: {p.focus}</p>
              </li>))}
          </ul>
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-navy-900">Per-question feedback</h3>
        <div className="mt-4 space-y-3">
          {results.map((r, i) => (<div key={r.question.id} className="rounded-lg border border-navy-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy-400">Question {i + 1} · {r.question.category}</p>
                  <p className="mt-1 text-sm font-medium text-navy-900">{r.question.text}</p>
                </div>
                {r.skipped ? (<span className="badge bg-navy-100 text-navy-500 flex-shrink-0">
                    <SkipForward className="h-3 w-3"/> Skipped
                  </span>) : r.feedback ? (<div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, s) => (<Star key={s} className={`h-3 w-3 ${s < Math.round(avgRating(r.feedback.ratings)) ? 'fill-teal-400 text-teal-400' : 'text-navy-200'}`}/>))}
                  </div>) : null}
              </div>
              {r.feedback && (<div className="mt-2 space-y-1.5 text-sm">
                  {r.feedback.doneWell.length > 0 && (<p className="text-teal-700">
                      <span className="font-medium">Done well: </span>
                      {r.feedback.doneWell.join(' ')}
                    </p>)}
                  {r.feedback.missingOrUnclear.length > 0 && (<p className="text-amber-700">
                      <span className="font-medium">Missing: </span>
                      {r.feedback.missingOrUnclear.join(' ')}
                    </p>)}
                  {r.feedback.improvements.length > 0 && (<p className="text-navy-600">
                      <span className="font-medium">Improve: </span>
                      {r.feedback.improvements.join(' ')}
                    </p>)}
                </div>)}
            </div>))}
        </div>
      </div>

      {retryable.length > 0 && (<div className="card p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <RefreshCw className="h-5 w-5 text-teal-500"/> Retry missed or weak questions
          </h3>
          <p className="mt-1 text-sm text-navy-600">
            Select questions to retry. You can also retry questions already in the queue: {retryQueue.length > 0 ? retryQueue.map((i) => i + 1).join(', ') : 'none'}.
          </p>
          <ul className="mt-3 space-y-2">
            {retryable.map((i) => {
                const r = results.find(item=>item.question.index===i);
                return (<li key={i}>
                  <label className="flex items-start gap-3 rounded-lg border border-navy-100 p-3 cursor-pointer hover:bg-navy-50">
                    <input type="checkbox" checked={selectedRetry.has(i)} onChange={() => toggleRetry(i)} className="mt-0.5 accent-teal-500"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-navy-400">
                        Question {i + 1} · {r.skipped ? 'Skipped' : 'Weak'}
                      </p>
                      <p className="text-sm text-navy-800 truncate">{r.question.text}</p>
                    </div>
                  </label>
                </li>);
            })}
          </ul>
          <button type="button" onClick={() => onRetryMissed(Array.from(selectedRetry).sort((a, b) => a - b))} disabled={selectedRetry.size === 0} className="btn-teal mt-4">
            <RotateCcw className="h-4 w-4"/> Retry selected ({selectedRetry.size})
          </button>
        </div>)}

      <p className="text-xs text-navy-400 italic text-center">{report.overallNote}</p>

      {/* Actions */}
      <div className="card p-5 bg-navy-50/60">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleDownload} className="btn-primary">
            <Download className="h-4 w-4"/> Download report (PDF)
          </button>
          <button type="button" onClick={onNewInterview} className="btn-teal">
            <Sparkles className="h-4 w-4"/> Start a new interview
          </button>
          <button type="button" onClick={onBackToResume} className="btn-outline">
            Return to resume editing
          </button>
          <div className="flex-1"/>
          <button type="button" onClick={onBack} className="btn-ghost">
            <ArrowLeft className="h-4 w-4"/> Back
          </button>
        </div>
      </div>
    </div>);
}
function avgRating(ratings) {
    if (!ratings.length)
        return 0;
    return ratings.reduce((a, r) => a + r.score, 0) / ratings.length;
}
function StatCard({ label, value, icon: Icon, color, }) {
    return (<div className="card p-4 text-center">
      <Icon className={`h-5 w-5 mx-auto ${color}`}/>
      <p className="mt-1 text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>);
}
function ListCard({ title, icon: Icon, items, color, }) {
    return (<div className="card p-5">
      <h3 className={`flex items-center gap-2 text-base font-semibold text-navy-900`}>
        <Icon className={`h-5 w-5 ${color}`}/> {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-sm text-navy-400">None identified.</li>}
        {items.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm text-navy-700 leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-300"/>
            <span>{item}</span>
          </li>))}
      </ul>
    </div>);
}
