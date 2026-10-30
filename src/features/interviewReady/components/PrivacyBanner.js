import { useState } from 'react';
import { ShieldCheck, Settings, Sparkles, Trash2, Eye, ServerCog } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './Modal';
export function PrivacyBanner({ config, isDemo, onUseDemo, onClearSession }) {
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const configured = config?.configured ?? false;
    return (<>
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-navy-700 to-navy-800 text-white border-navy-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-300 flex-shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Privacy-first session</p>
              <p className="text-xs text-navy-100 mt-0.5 leading-relaxed">
                Content stays in your browser and is sent only to the configured AI provider for analysis. Nothing
                is stored in a database. Refreshing clears your progress.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => setPrivacyOpen(true)} className="btn-ghost text-xs text-navy-100 hover:bg-white/10">
              <Eye className="h-3.5 w-3.5"/> What is sent
            </button>
            {!configured && !isDemo && (<button type="button" onClick={onUseDemo} className="btn-teal text-xs">
                <Sparkles className="h-3.5 w-3.5"/> Try demo mode
              </button>)}
            <button type="button" onClick={() => setClearOpen(true)} className="btn-ghost text-xs text-navy-100 hover:bg-white/10">
              <Trash2 className="h-3.5 w-3.5"/> Clear session
            </button>
          </div>
        </div>
        {!configured && (<div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-400/15 border border-amber-300/30 px-3 py-2">
            <Settings className="mt-0.5 h-4 w-4 text-amber-300 flex-shrink-0"/>
            <p className="text-xs text-amber-100">
              {config?.message || 'Checking the AI service configuration.'} Add an <code className="font-mono bg-black/20 px-1 rounded">AI_API_KEY</code> edge
              function secret to enable real analysis. Until then, demo mode uses clearly-labeled fictional data.
            </p>
          </div>)}
        {configured && (<p className="mt-2 text-xs text-teal-200 flex items-center gap-1.5">
            <ServerCog className="h-3.5 w-3.5"/> AI configured: {config?.provider} · {config?.model}
          </p>)}
      </div>

      <Modal open={privacyOpen} title="What content is sent to the AI provider?" onClose={() => setPrivacyOpen(false)} maxWidth="max-w-lg" footer={<div className="flex justify-end">
            <button type="button" className="btn-outline" onClick={() => setPrivacyOpen(false)}>
              Got it
            </button>
          </div>}>
        <div className="space-y-3 text-sm text-navy-700 leading-relaxed">
          <p>
            InterviewReady AI uses a server-side endpoint (a Supabase Edge Function) to call the AI provider. Your
            API key stays on the server — it is never exposed to the browser.
          </p>
          <p>For each AI task, only the content necessary for that task is sent:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">Match analysis:</span> your resume text + job description text.</li>
            <li><span className="font-medium">Resume tailoring:</span> resume + job description + any clarification answers you confirm.</li>
            <li><span className="font-medium">Question generation:</span> resume + job description + difficulty/focus.</li>
            <li><span className="font-medium">Answer feedback:</span> the current question + your answer + resume + job description.</li>
            <li><span className="font-medium">Final report:</span> the per-question feedback and question text (not your full answers or resume).</li>
          </ul>
          <p>
            Full resumes and interview answers are <span className="font-medium">not logged</span>. Content is not
            persisted in any database or browser storage. All session state lives in memory and is cleared on
            refresh or when you press "Clear session".
          </p>
        </div>
      </Modal>

      <ConfirmModal open={clearOpen} title="Clear the entire session?" message="This will erase all documents, analysis, tailored resume, questions, and interview progress from memory. This cannot be undone." confirmLabel="Clear everything" danger onConfirm={() => {
            setClearOpen(false);
            onClearSession();
        }} onCancel={() => setClearOpen(false)}/>
    </>);
}
