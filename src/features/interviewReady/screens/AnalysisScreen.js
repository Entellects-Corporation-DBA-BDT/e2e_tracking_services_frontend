import { ArrowRight, ArrowLeft, Search, CheckCircle2, AlertCircle, HelpCircle, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { LoadingOverlay, SkeletonLines } from '../components/Loading';
import { DemoBanner } from '../components/DemoBanner';
const STATUS_STYLES = {
    Supported: { badge: 'bg-teal-100 text-teal-700', icon: CheckCircle2 },
    'Partially Supported': { badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    'Not Evidenced': { badge: 'bg-navy-100 text-navy-600', icon: HelpCircle },
};
function Section({ title, icon: Icon, items, color = 'text-navy-700', }) {
    if (!items.length)
        return null;
    return (<div className="card p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-navy-900">
        <Icon className={`h-5 w-5 ${color}`}/> {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm text-navy-700 leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-300"/>
            <span>{item}</span>
          </li>))}
      </ul>
    </div>);
}
export function AnalysisScreen({ loading, error, analysis, isDemo, onBack, onContinue, onRetry }) {
    return (<div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <span className="badge bg-teal-100 text-teal-700">
          <Search className="h-3 w-3"/> Step 3
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">
          Resume-to-job match analysis
        </h2>
        <p className="mt-2 text-navy-600">
          An evidence-based comparison of your resume against the job requirements. "Not Evidenced" means the
          resume does not establish that qualification — it does not mean you lack it.
        </p>
      </div>

      {isDemo && analysis && <DemoBanner message="This is DEMO analysis using fictional sample data, not analysis of your uploaded resume."/>}

      {loading && (<div className="card p-6">
          <LoadingOverlay label="Comparing your resume to the job description..."/>
          <div className="mt-6 space-y-6">
            <SkeletonLines lines={3}/>
            <SkeletonLines lines={4}/>
          </div>
        </div>)}

      {!loading && error && (<div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">We could not complete the analysis.</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button type="button" onClick={onRetry} className="btn-outline mt-4">
                Try again
              </button>
            </div>
          </div>
        </div>)}

      {!loading && !error && analysis && (<>
          <div className="card p-5 bg-navy-700 text-white border-navy-700">
            <p className="text-sm leading-relaxed opacity-95">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section title="Relevant experience and strengths" icon={TrendingUp} items={analysis.strengths} color="text-teal-500"/>
            <Section title="Requirements supported by your resume" icon={CheckCircle2} items={analysis.supportedSkills} color="text-teal-500"/>
            <Section title="Requirements not evidenced" icon={AlertCircle} items={analysis.gaps} color="text-amber-500"/>
            <Section title="Transferable skills" icon={Target} items={analysis.transferableSkills} color="text-teal-500"/>
            <Section title="Areas needing clarification" icon={HelpCircle} items={analysis.clarifications} color="text-navy-500"/>
            <Section title="Wording and organization suggestions" icon={Lightbulb} items={analysis.wordingSuggestions} color="text-navy-500"/>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-navy-900">Requirement-by-requirement breakdown</h3>
            <p className="mt-1 text-xs text-navy-500">
              Statuses are coaching assessments, not hiring predictions.
            </p>
            <div className="mt-4 space-y-3">
              {analysis.requirementMatches.map((r, i) => {
                const Style = STATUS_STYLES[r.status];
                const Icon = Style.icon;
                return (<div key={i} className="rounded-lg border border-navy-100 bg-navy-50/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-900 flex-1">{r.requirement}</p>
                      <span className={`badge ${Style.badge} flex-shrink-0`}>
                        <Icon className="h-3 w-3"/> {r.status}
                      </span>
                    </div>
                    {r.evidence && (<p className="mt-2 text-sm text-navy-700">
                        <span className="font-medium text-navy-500">Evidence: </span>
                        {r.evidence}
                      </p>)}
                    {r.status === 'Not Evidenced' && (<p className="mt-2 text-xs text-navy-400 italic">
                        Not evidenced does not mean you lack this qualification — it means your resume does not
                        currently establish it.
                      </p>)}
                    <p className="mt-2 text-sm text-navy-600">
                      <span className="font-medium text-navy-500">Recommended action: </span>
                      {r.recommendedAction}
                    </p>
                  </div>);
            })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4"/> Back
            </button>
            <button type="button" onClick={onContinue} className="btn-primary w-full sm:w-auto">
              Tailor my resume <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        </>)}
    </div>);
}
