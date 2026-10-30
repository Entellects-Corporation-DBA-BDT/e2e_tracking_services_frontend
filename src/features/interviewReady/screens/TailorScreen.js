import { useState } from 'react';
import { ArrowRight, ArrowLeft, Scissors, Check, X, Pencil, Copy, Download, FileText, HelpCircle, AlertCircle, RotateCcw, Sparkles, Plus, } from 'lucide-react';
import { LoadingOverlay, SkeletonLines, ButtonSpinner } from '../components/Loading';
import { Modal } from '../components/Modal';
import { DemoBanner } from '../components/DemoBanner';
import { copyToClipboard, downloadResumeDocx, downloadResumePdf, resumeToPlainText } from '../lib/download';
export function TailorScreen({ onUpdate, loading, error, tailored, isDemo, originalText, pendingClarifications, onBack, onContinue, onRetry, onSubmitClarifications, submittingClarifications, }) {
    const [showOriginal, setShowOriginal] = useState(false);
    const [showChanges, setShowChanges] = useState(true);
    const [editingSummary, setEditingSummary] = useState(false);
    const [summaryDraft, setSummaryDraft] = useState('');
    const [copied, setCopied] = useState(false);
    const [clarifyOpen, setClarifyOpen] = useState(false);
    const [clarifyDrafts, setClarifyDrafts] = useState({});
    const handleCopy = async () => {
        if (!tailored)
            return;
        await copyToClipboard(resumeToPlainText(tailored));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleDownloadDocx = async () => {
        if (tailored)
            await downloadResumeDocx(tailored);
    };
    const handleDownloadPdf = () => {
        if (tailored)
            downloadResumePdf(tailored);
    };
    const submitClarifications = () => {
        const answers = pendingClarifications.map((q, i) => ({
            questionId: `clar-${i}`,
            question: q,
            answer: (clarifyDrafts[`clar-${i}`] || '').trim(),
        }));
        const filled = answers.filter((a) => a.answer.length > 0);
        if (filled.length === 0) {
            setClarifyOpen(false);
            return;
        }
        onSubmitClarifications(filled);
        setClarifyOpen(false);
        setClarifyDrafts({});
    };
    return (<div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <span className="badge bg-teal-100 text-teal-700">
          <Scissors className="h-3 w-3"/> Step 4
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">
          Truthfully tailored resume
        </h2>
        <p className="mt-2 text-navy-600">
          Your resume is rewritten using only your actual experience. Employers, titles, dates, and education are
          preserved — nothing is invented. Review changes side by side and accept, reject, or edit them.
        </p>
      </div>

      {isDemo && tailored && <DemoBanner message="This is a DEMO tailored resume built from fictional sample data, not your uploaded resume."/>}

      {pendingClarifications.length > 0 && tailored && !loading && (<div className="card p-5 border-teal-200 bg-teal-50">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 text-teal-600 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-teal-900">
                We have {pendingClarifications.length} clarification question{pendingClarifications.length > 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-sm text-teal-800">
                Answering these lets the AI incorporate confirmed experience. Leave blank to skip — we never invent
                qualifications.
              </p>
              <button type="button" onClick={() => setClarifyOpen(true)} className="btn-teal mt-3 text-xs">
                <Plus className="h-3.5 w-3.5"/> Answer clarifications
              </button>
            </div>
          </div>
        </div>)}

      {loading && (<div className="card p-6">
          <LoadingOverlay label="Tailoring your resume truthfully..."/>
          <div className="mt-6 space-y-6">
            <SkeletonLines lines={3}/>
            <SkeletonLines lines={5}/>
          </div>
        </div>)}

      {!loading && error && (<div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">We could not tailor the resume.</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button type="button" onClick={onRetry} className="btn-outline mt-4">
                <RotateCcw className="h-4 w-4"/> Try again
              </button>
            </div>
          </div>
        </div>)}

      {!loading && !error && tailored && (<>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowOriginal((v) => !v)} className="btn-outline text-xs" aria-pressed={showOriginal}>
              <FileText className="h-3.5 w-3.5"/> {showOriginal ? 'Hide' : 'Show'} original
            </button>
            <button type="button" onClick={() => setShowChanges((v) => !v)} className="btn-outline text-xs" aria-pressed={showChanges}>
              <Sparkles className="h-3.5 w-3.5"/> {showChanges ? 'Hide' : 'Show'} change log
            </button>
            <div className="flex-1"/>
            <button type="button" onClick={handleCopy} className="btn-outline text-xs">
              <Copy className="h-3.5 w-3.5"/> {copied ? 'Copied!' : 'Copy text'}
            </button>
            <button type="button" onClick={handleDownloadDocx} className="btn-outline text-xs">
              <Download className="h-3.5 w-3.5"/> DOCX
            </button>
            <button type="button" onClick={handleDownloadPdf} className="btn-teal text-xs">
              <Download className="h-3.5 w-3.5"/> PDF
            </button>
          </div>

          <div className={`grid gap-5 ${showOriginal ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {showOriginal && (<div className="card p-5">
                <h3 className="text-sm font-semibold text-navy-500 mb-3">Original resume</h3>
                <pre className="text-xs text-navy-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto scrollbar-thin">
                  {originalText}
                </pre>
              </div>)}
            <div className="card p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-teal-600 mb-3">Tailored resume</h3>
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                <section>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Professional Summary</h4>
                    <button type="button" onClick={() => {
                setSummaryDraft(tailored.professionalSummary);
                setEditingSummary(true);
            }} className="btn-ghost text-xs px-2 py-1" aria-label="Edit summary">
                      <Pencil className="h-3 w-3"/> Edit
                    </button>
                  </div>
                  {editingSummary ? (<div className="mt-2 space-y-2">
                      <textarea className="input text-sm h-32" value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)}/>
                      <div className="flex gap-2">
                        <button type="button" className="btn-teal text-xs" onClick={() => {
                    onUpdate({...tailored,professionalSummary:summaryDraft.trim(),fullText:undefined});
                    setEditingSummary(false);
                }}>
                          <Check className="h-3.5 w-3.5"/> Save
                        </button>
                        <button type="button" className="btn-ghost text-xs" onClick={() => setEditingSummary(false)}>
                          <X className="h-3.5 w-3.5"/> Cancel
                        </button>
                      </div>
                    </div>) : (<p className="mt-2 text-sm text-navy-800 leading-relaxed">{tailored.professionalSummary}</p>)}
                </section>

                {tailored.skills.length > 0 && (<section>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Skills</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tailored.skills.map((s, i) => (<span key={i} className="badge bg-teal-50 text-teal-700 border border-teal-100">
                          {s}
                        </span>))}
                    </div>
                  </section>)}

                {tailored.experience.length > 0 && (<section>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Experience</h4>
                    <div className="mt-2 space-y-4">
                      {tailored.experience.map((e, i) => (<div key={i} className="border-l-2 border-teal-200 pl-3">
                          <p className="text-sm font-semibold text-navy-900">{e.title}</p>
                          <p className="text-xs text-navy-500">
                            {e.company} · {e.dates}
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {e.bullets.map((b, j) => (<li key={j} className="text-sm text-navy-700 flex items-start gap-1.5">
                                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-teal-400"/>
                                <span>{b}</span>
                              </li>))}
                          </ul>
                        </div>))}
                    </div>
                  </section>)}

                {tailored.projects.length > 0 && (<section>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Projects</h4>
                    <div className="mt-2 space-y-2">
                      {tailored.projects.map((p, i) => (<div key={i}>
                          <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                          <p className="text-sm text-navy-700">{p.description}</p>
                        </div>))}
                    </div>
                  </section>)}

                {tailored.education.length > 0 && (<section>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Education</h4>
                    <ul className="mt-2 space-y-1">
                      {tailored.education.map((ed, i) => (<li key={i} className="text-sm text-navy-700">
                          {ed}
                        </li>))}
                    </ul>
                  </section>)}

                {tailored.certifications.length > 0 && (<section>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-navy-400">Certifications</h4>
                    <ul className="mt-2 space-y-1">
                      {tailored.certifications.map((c, i) => (<li key={i} className="text-sm text-navy-700">
                          {c}
                        </li>))}
                    </ul>
                  </section>)}
              </div>
            </div>
          </div>

          {showChanges && tailored.changeLog.length > 0 && (<div className="card p-5">
              <h3 className="text-base font-semibold text-navy-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-500"/> Change log
              </h3>
              <p className="mt-1 text-xs text-navy-500">
                Gap analysis and learning suggestions are kept separate from your downloadable resume.
              </p>
              <ul className="mt-3 space-y-2">
                {tailored.changeLog.map((c, i) => (<li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                    <span className={`badge flex-shrink-0 ${c.type === 'rewritten'
                        ? 'bg-teal-100 text-teal-700'
                        : c.type === 'reordered'
                            ? 'bg-navy-100 text-navy-600'
                            : c.type === 'added'
                                ? 'bg-teal-50 text-teal-600'
                                : 'bg-red-50 text-red-600'}`}>
                      {c.type}
                    </span>
                    <span>
                      <span className="font-medium">{c.section}:</span> {c.change}
                    </span>
                  </li>))}
              </ul>
            </div>)}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4"/> Back
            </button>
            <button type="button" onClick={onContinue} className="btn-primary w-full sm:w-auto">
              Continue to interview setup <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        </>)}

      <Modal open={clarifyOpen} title="Answer clarification questions" onClose={() => setClarifyOpen(false)} maxWidth="max-w-xl" footer={<div className="flex justify-end gap-3">
            <button type="button" className="btn-outline" onClick={() => setClarifyOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-teal" onClick={submitClarifications} disabled={submittingClarifications}>
              {submittingClarifications ? <ButtonSpinner label="Re-tailoring..."/> : 'Submit answers'}
            </button>
          </div>}>
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Only confirmed answers will be incorporated. Leave any blank to skip. We never invent qualifications.
          </p>
          {pendingClarifications.map((q, i) => (<div key={i}>
              <label className="label" htmlFor={`clar-${i}`}>
                {q}
              </label>
              <textarea id={`clar-${i}`} className="input text-sm h-20" placeholder="Describe your actual experience, or leave blank to skip." value={clarifyDrafts[`clar-${i}`] || ''} onChange={(e) => setClarifyDrafts((d) => ({ ...d, [`clar-${i}`]: e.target.value }))}/>
            </div>))}
        </div>
      </Modal>
    </div>);
}
