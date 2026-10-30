import { ArrowRight, ArrowLeft, ClipboardCheck, FileText, Briefcase } from 'lucide-react';
import { countWords,isUsableText } from '../lib/document';
export function ReviewScreen({ resume, jd, onBack, onContinue, onResumeChange, onJdChange, }) {
    return (<div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <span className="badge bg-teal-100 text-teal-700">
          <ClipboardCheck className="h-3 w-3"/> Step 2
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">
          Review the extracted text
        </h2>
        <p className="mt-2 text-navy-600">
          We extracted the text below. Please review and correct anything that looks wrong before analysis —
          the AI can only work with what it sees here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-500">
              <FileText className="h-4 w-4"/> Resume
              {resume.fileName && <span className="text-navy-400 font-normal">· {resume.fileName}</span>}
            </div>
            <span className="text-xs text-navy-400">{countWords(resume.editedText)} words</span>
          </div>
          <textarea maxLength={100000} className="input font-mono text-xs leading-relaxed h-96 resize-y scrollbar-thin" value={resume.editedText} onChange={(e) => onResumeChange({ ...resume, editedText: e.target.value })} spellCheck={false} aria-label="Review and edit resume text"/>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-500">
              <Briefcase className="h-4 w-4"/> Job description
              {jd.fileName && <span className="text-navy-400 font-normal">· {jd.fileName}</span>}
            </div>
            <span className="text-xs text-navy-400">{countWords(jd.editedText)} words</span>
          </div>
          <textarea maxLength={100000} className="input font-mono text-xs leading-relaxed h-96 resize-y scrollbar-thin" value={jd.editedText} onChange={(e) => onJdChange({ ...jd, editedText: e.target.value })} spellCheck={false} aria-label="Review and edit job description text"/>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4"/> Back
        </button>
        <button type="button" onClick={onContinue} disabled={!isUsableText(resume.editedText)||!isUsableText(jd.editedText)} className="btn-primary w-full sm:w-auto">
          Analyze Resume and JD <ArrowRight className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
