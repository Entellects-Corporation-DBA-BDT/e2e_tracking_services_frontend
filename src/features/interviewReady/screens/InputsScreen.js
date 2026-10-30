import { DocumentPanel } from '../components/DocumentPanel';
import { ShieldCheck, Sparkles, ArrowRight, FileText, Briefcase } from 'lucide-react';
import { isUsableText } from '../lib/document';
export function InputsScreen({ resume, jd, onResumeChange, onJdChange, onError, onContinue, onLoadDemo, }) {
    const resumeUsable = isUsableText(resume.editedText);
    const jdUsable = isUsableText(jd.editedText);
    const canContinue = resumeUsable && jdUsable;
    return (<div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <span className="badge bg-teal-100 text-teal-700">
          <Sparkles className="h-3 w-3"/> Step 1
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">
          Upload your resume and the job description
        </h2>
        <p className="mt-2 text-navy-600">
          Provide both documents so we can compare them and tailor your resume. You can upload a PDF, DOCX, or TXT
          file, or paste the text directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-navy-500">
            <FileText className="h-4 w-4"/> Your resume
          </div>
          <DocumentPanel kind="resume" document={resume} onChange={onResumeChange} onError={onError}/>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-navy-500">
            <Briefcase className="h-4 w-4"/> Job description
          </div>
          <DocumentPanel kind="jd" document={jd} onChange={onJdChange} onError={onError}/>
        </div>
      </div>

      <div className="card p-4 sm:p-5 bg-navy-50/60 border-navy-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-600 flex-shrink-0"/>
            <p className="text-sm text-navy-700 max-w-xl">
              Your documents stay in your browser session. They are sent only to the configured AI provider for
              analysis and are not stored in a database. Refreshing this page will clear your progress.
            </p>
          </div>
          <button type="button" onClick={onLoadDemo} className="btn-outline text-xs whitespace-nowrap">
            <Sparkles className="h-3.5 w-3.5"/> Load demo sample
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-navy-500">
          {canContinue
            ? 'Both documents are ready to analyze.'
            : 'Add at least 20 words to each document to continue.'}
        </p>
        <button type="button" onClick={onContinue} disabled={!canContinue} className="btn-primary w-full sm:w-auto">
          Continue to Review <ArrowRight className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
