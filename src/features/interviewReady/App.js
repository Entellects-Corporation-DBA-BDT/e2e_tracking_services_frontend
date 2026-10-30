import './interviewReady.css';
import {cancelInterviewRequests} from './lib/ai';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import { ProgressHeader } from './components/ProgressHeader';
import { PrivacyBanner } from './components/PrivacyBanner';
import { ToastViewport } from './components/Toast';
import { useToastState } from './lib/useToast';
import { isUsableText } from './lib/document';
import { fetchConfigStatus, analyzeMatch, tailorResume, generateQuestions, evaluateAnswer, generateReport, AiError, } from './lib/ai';
import { DEMO_RESUME, DEMO_JD, DEMO_ANALYSIS, DEMO_QUESTIONS, DEMO_FEEDBACK, DEMO_TAILORED, DEMO_REPORT, } from './lib/demoData';
import { resumeToPlainText } from './lib/download';
import { InputsScreen } from './screens/InputsScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { TailorScreen } from './screens/TailorScreen';
import { InterviewSetupScreen } from './screens/InterviewSetupScreen';
import { InterviewScreen } from './screens/InterviewScreen';
import { ReportScreen } from './screens/ReportScreen';
const emptyResume = {
    kind: 'resume',
    fileName: null,
    rawText: '',
    editedText: '',
    source: 'paste',
};
const emptyJd = {
    kind: 'jd',
    fileName: null,
    rawText: '',
    editedText: '',
    jobTitle: '',
    companyName: '',
    source: 'paste',
};
function InterviewSession({onReset}) {
    const { toasts, dismiss, push } = useToastState();
    const [step, setStep] = useState('inputs');
    const [resume, setResume] = useState(emptyResume);
    const [jd, setJd] = useState(emptyJd);
    const [isDemo, setIsDemo] = useState(false);
    const [config, setConfig] = useState(null);
    // Analysis
    const [analysis, setAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);
    // Tailoring
    const [tailored, setTailored] = useState(null);
    const [tailorLoading, setTailorLoading] = useState(false);
    const [tailorError, setTailorError] = useState(null);
    const [pendingClarifications, setPendingClarifications] = useState([]);
    const [submittingClarifications, setSubmittingClarifications] = useState(false);
    // Interview
    const [questions, setQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionsError, setQuestionsError] = useState(null);
    const [, setInterviewSetup] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [results, setResults] = useState([]);
    const [retryQueue, setRetryQueue] = useState([]);
    // Report
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    // Probe config status on mount
    useEffect(() => {
        let active=true;fetchConfigStatus().then(value=>{if(active)setConfig(value)});return()=>{active=false;cancelInterviewRequests();};
    }, []);
    const completed = useMemo(() => {
        const set = new Set();
        if (isUsableText(resume.editedText) && isUsableText(jd.editedText))
            set.add('inputs');
        if (set.has('inputs'))
            set.add('review');
        if (analysis)
            set.add('analysis');
        if (tailored)
            set.add('tailor');
        if (questions.length > 0)
            set.add('interviewSetup');
        if (results.length > 0)
            set.add('interview');
        if (report)
            set.add('report');
        return set;
    }, [resume, jd, analysis, tailored, questions, results, report]);
    const reachable = useMemo(() => {
        const set = new Set(['inputs']);
        if (completed.has('inputs'))
            set.add('review');
        if (completed.has('review'))
            set.add('analysis');
        if (completed.has('analysis'))
            set.add('tailor');
        if (completed.has('tailor'))
            set.add('interviewSetup');
        if (completed.has('interviewSetup'))
            set.add('interview');
        if (completed.has('interview'))
            set.add('report');
        return set;
    }, [completed]);
    const navigate = useCallback((target) => {
        if (!analysisLoading&&!tailorLoading&&!questionsLoading&&!reportLoading&&reachable.has(target))
            setStep(target);
    }, [reachable,analysisLoading,tailorLoading,questionsLoading,reportLoading]);
    // --- Handlers ---
    const invalidateDocuments=(setter,value)=>{
        setter(value);setAnalysis(null);setTailored(null);setQuestions([]);setResults([]);setReport(null);setPendingClarifications([]);setRetryQueue([]);setCurrentQIndex(0);
    };
    const handleInputsContinue = () => {
        if (isUsableText(resume.editedText) && isUsableText(jd.editedText)) {
            setStep('review');
        }
    };
    const handleReviewContinue = async () => {
        setStep('analysis');
        await runAnalysis();
    };
    const runAnalysis = async () => {
        if (isDemo) {
            setAnalysisLoading(true);
            setAnalysisError(null);
            await delay(700);
            setAnalysis(DEMO_ANALYSIS);
            setAnalysisLoading(false);
            return;
        }
        setAnalysisLoading(true);
        setAnalysisError(null);
        try {
            const a = await analyzeMatch(resume.editedText, jd.editedText, jd.jobTitle, jd.companyName);
            setAnalysis(a);
        }
        catch (err) {
            setAnalysisError(errMessage(err));
        }
        finally {
            setAnalysisLoading(false);
        }
    };
    const handleAnalysisContinue = async () => {
        setStep('tailor');
        await runTailor([]);
    };
    const runTailor = async (clarifications) => {
        if (isDemo) {
            setTailorLoading(true);
            setTailorError(null);
            await delay(900);
            const demo = { ...DEMO_TAILORED, fullText: resumeToPlainText(DEMO_TAILORED) };
            setTailored(demo);
            setPendingClarifications(demo.clarificationsNeeded);
            setTailorLoading(false);
            return;
        }
        setTailorLoading(true);
        setTailorError(null);
        try {
            const t = await tailorResume(resume.editedText, jd.editedText, jd.jobTitle, jd.companyName, clarifications);
            setTailored(t);
            setPendingClarifications(t.clarificationsNeeded);
        }
        catch (err) {
            setTailorError(errMessage(err));
        }
        finally {
            setTailorLoading(false);
        }
    };
    const handleSubmitClarifications = async (answers) => {
        setSubmittingClarifications(true);
        try {
            await runTailor(answers);
            push('success', 'Clarifications incorporated', 'Your tailored resume was updated with confirmed details.');
        }
        catch (err) {
            push('error', 'Could not re-tailor', errMessage(err));
        }
        finally {
            setSubmittingClarifications(false);
        }
    };
    const handleTailorContinue = () => {
        setStep('interviewSetup');
    };
    const handleStartInterview = async (setup) => {
        setInterviewSetup(setup);
        if (isDemo) {
            setQuestionsLoading(true);
            setQuestionsError(null);
            await delay(800);
            setQuestions(DEMO_QUESTIONS);
            setQuestionsLoading(false);
            setStep('interview');
            setCurrentQIndex(0);
            setResults([]);
            return;
        }
        setQuestionsLoading(true);
        setQuestionsError(null);
        try {
            const qs = await generateQuestions(resume.editedText, jd.editedText, setup, jd.jobTitle);
            if (qs.length !== 10) {
                throw new AiError('The AI did not return exactly 10 questions. Please try again.');
            }
            setQuestions(qs);
            setStep('interview');
            setCurrentQIndex(0);
            setResults([]);
        }
        catch (err) {
            setQuestionsError(errMessage(err));
        }
        finally {
            setQuestionsLoading(false);
        }
    };
    const handleSubmitAnswer = async (questionId, answer) => {
        const q = questions.find((x) => x.id === questionId);
        if (!q)
            return null;
        if (isDemo) {
            await delay(700);
            const fb = { ...DEMO_FEEDBACK };
            upsertResult({ question: q, answer, feedback: fb, skipped: false, submittedAt: Date.now() });
            return fb;
        }
        try {
            const fb = await evaluateAnswer(q, answer, resume.editedText, jd.editedText);
            upsertResult({ question: q, answer, feedback: fb, skipped: false, submittedAt: Date.now() });
            return fb;
        }
        catch (err) {
            push('error', 'Could not evaluate answer', errMessage(err));
            return null;
        }
    };
    const handleSkip = (questionId) => {
        const q = questions.find((x) => x.id === questionId);
        if (!q)
            return;
        upsertResult({ question: q, answer: null, feedback: null, skipped: true, submittedAt: Date.now() });
    };
    const handleRetryQuestion = (questionId) => {
        setResults((prev) => prev.filter((r) => r.question.id !== questionId));
    };
    const upsertResult = (r) => {
        setResults((prev) => {
            const without = prev.filter((x) => x.question.id !== r.question.id);
            return [...without, r].sort((a, b) => a.question.index - b.question.index);
        });
    };
    const handleNextFromInterview = async () => {
        // finished all questions
        await runReport();
        setStep('report');
    };
    const handleEndInterview = async () => {
        await runReport();
        setStep('report');
    };
    const runReport = async () => {
        if (isDemo) {
            setReportLoading(true);
            await delay(600);
            const demoReport = {
                ...DEMO_REPORT,
                perQuestion: results.map((r) => ({
                    questionId: r.question.id,
                    question: r.question.text,
                    category: r.question.category,
                    skipped: r.skipped,
                    ratings: r.feedback?.ratings || [],
                    feedbackSummary: r.feedback
                        ? `Done well: ${r.feedback.doneWell.join('; ')}`
                        : 'Skipped.',
                })),
                answeredCount: results.filter((r) => !r.skipped).length,
                skippedCount: results.filter((r) => r.skipped).length,
                incomplete: results.length<questions.length||results.some((r) => r.skipped),
            };
            setReport({...demoReport,unansweredCount:Math.max(0,questions.length-results.length)});
            setReportLoading(false);
            return;
        }
        setReportLoading(true);
        try {
            const rep = await generateReport(results, resume.editedText, jd.editedText);
            // Attach perQuestion from local results
            rep.perQuestion = results.map((r) => ({
                questionId: r.question.id,
                question: r.question.text,
                category: r.question.category,
                skipped: r.skipped,
                ratings: r.feedback?.ratings || [],
                feedbackSummary: r.feedback
                    ? `Done well: ${r.feedback.doneWell.join('; ')}. Missing: ${r.feedback.missingOrUnclear.join('; ')}.`
                    : 'Skipped or not answered.',
            }));
            rep.answeredCount = results.filter((r) => !r.skipped).length;
            rep.skippedCount = results.filter((r) => r.skipped).length;
            rep.incomplete = results.some((r) => r.skipped) || results.filter((r) => !r.skipped).length === 0;
            setReport({...rep,unansweredCount:Math.max(0,questions.length-results.length)});
        }
        catch (err) {
            push('error', 'Could not compile report', errMessage(err));
            // Build a minimal local report so the user still gets something
            const fallback = {
                answeredCount: results.filter((r) => !r.skipped).length,
                skippedCount: results.filter((r) => r.skipped).length,
                perQuestion: results.map((r) => ({
                    questionId: r.question.id,
                    question: r.question.text,
                    category: r.question.category,
                    skipped: r.skipped,
                    ratings: r.feedback?.ratings || [],
                    feedbackSummary: r.feedback
                        ? `Done well: ${r.feedback.doneWell.join('; ')}.`
                        : 'Skipped or not answered.',
                })),
                strongestAreas: [],
                improvementAreas: [],
                topicsToStudy: [],
                practicePlan: [],
                overallNote: 'The AI summary was unavailable; per-question feedback is shown below.',
                incomplete: results.length<questions.length||results.some((r) => r.skipped),
            };
            setReport({...fallback,unansweredCount:Math.max(0,questions.length-results.length)});
        }
        finally {
            setReportLoading(false);
        }
    };
    const handleRetryMissed = (indices) => {
        if (indices.length === 0)
            return;
        // Reset those results and jump to the first one
        setResults((prev) => prev.filter((r) => !indices.includes(r.question.index)));
        setRetryQueue(indices);
        setCurrentQIndex(indices[0]);
        setStep('interview');
    };
    const handleNewInterview = () => {
        setQuestions([]);
        setResults([]);
        setReport(null);
        setRetryQueue([]);
        setCurrentQIndex(0);
        setInterviewSetup(null);
        setStep('interviewSetup');
    };
    const handleBackToResume = () => {
        setStep('tailor');
    };
    const handleLoadDemo = () => {
        setAnalysis(null);setTailored(null);setQuestions([]);setResults([]);setReport(null);setPendingClarifications([]);setAnalysisError(null);setTailorError(null);setQuestionsError(null);setStep('inputs');
        setIsDemo(true);
        setResume({
            kind: 'resume',
            fileName: 'demo-resume.txt',
            rawText: DEMO_RESUME,
            editedText: DEMO_RESUME,
            source: 'demo',
        });
        setJd({
            kind: 'jd',
            fileName: 'demo-jd.txt',
            rawText: DEMO_JD,
            editedText: DEMO_JD,
            jobTitle: 'Senior Frontend Engineer',
            companyName: 'Acme Cloud',
            source: 'demo',
        });
        push('info', 'Demo data loaded', 'Sample resume and job description filled in. Results will be labeled DEMO.');
    };
    const handleClearSession = () => {
        cancelInterviewRequests();onReset();
        setResume(emptyResume);
        setJd(emptyJd);
        setIsDemo(false);
        setAnalysis(null);
        setAnalysisError(null);
        setTailored(null);
        setTailorError(null);
        setPendingClarifications([]);
        setQuestions([]);
        setResults([]);
        setReport(null);
        setRetryQueue([]);
        setCurrentQIndex(0);
        setInterviewSetup(null);
        setStep('inputs');
        push('success', 'Session cleared', 'All documents and progress have been erased from memory.');
    };
    const handleError = useCallback((message) => push('error', 'Could not read file', message), [push]);
    return (<div className="interview-ready min-h-screen bg-navy-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-navy-100 sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-white">
                <FileText className="h-5 w-5"/>
              </span>
              <div>
                <h1 className="text-base font-bold text-navy-900 leading-none">InterviewReady AI</h1>
                <p className="text-[11px] text-navy-500 mt-0.5">Resume tailoring & mock interview practice</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isDemo && (<span className="badge bg-amber-100 text-amber-800 border border-amber-200">
                  <MessageSquare className="h-3 w-3"/> Demo mode
                </span>)}
            </div>
          </div>
          <ProgressHeader current={step} onNavigate={navigate} completed={completed} reachable={reachable}/>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <PrivacyBanner config={config} isDemo={isDemo} onUseDemo={handleLoadDemo} onClearSession={handleClearSession}/>
        </div>

        {step === 'inputs' && (<InputsScreen resume={resume} jd={jd} onResumeChange={value=>invalidateDocuments(setResume,value)} onJdChange={value=>invalidateDocuments(setJd,value)} onError={handleError} onContinue={handleInputsContinue} onLoadDemo={handleLoadDemo}/>)}

        {step === 'review' && (<ReviewScreen resume={resume} jd={jd} onBack={() => setStep('inputs')} onContinue={handleReviewContinue} onResumeChange={value=>invalidateDocuments(setResume,value)} onJdChange={value=>invalidateDocuments(setJd,value)}/>)}

        {step === 'analysis' && (<AnalysisScreen loading={analysisLoading} error={analysisError} analysis={analysis} isDemo={isDemo} onBack={() => setStep('review')} onContinue={handleAnalysisContinue} onRetry={runAnalysis}/>)}

        {step === 'tailor' && (<TailorScreen onUpdate={setTailored} loading={tailorLoading} error={tailorError} tailored={tailored} isDemo={isDemo} originalText={resume.editedText} pendingClarifications={pendingClarifications} onBack={() => setStep('analysis')} onContinue={handleTailorContinue} onRetry={() => runTailor([])} onSubmitClarifications={handleSubmitClarifications} submittingClarifications={submittingClarifications}/>)}

        {step === 'interviewSetup' && (<InterviewSetupScreen loading={questionsLoading} error={questionsError} isDemo={isDemo} onBack={() => setStep('tailor')} onStart={handleStartInterview} onRetry={(s) => handleStartInterview(s)}/>)}

        {step === 'interview' && questions.length > 0 && (<InterviewScreen retryQueue={retryQueue} questions={questions} isDemo={isDemo} onSubmitAnswer={handleSubmitAnswer} onSkip={handleSkip} onNext={handleNextFromInterview} onRetryQuestion={handleRetryQuestion} onEnd={handleEndInterview} results={results} currentIndex={currentQIndex} setCurrentIndex={setCurrentQIndex}/>)}

        {step === 'report' && (<ReportScreen loading={reportLoading} report={report} results={results} isDemo={isDemo} retryQueue={retryQueue} onDownloadPdf={() => push('success', 'Report downloaded', 'Your PDF report has been saved.')} onRetryMissed={handleRetryMissed} onNewInterview={handleNewInterview} onBackToResume={handleBackToResume} onBack={() => setStep('interview')}/>)}
      </main>

      <footer className="border-t border-navy-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-navy-400">
            InterviewReady AI · Single-user session · Content is not persisted
          </p>
          <p className="text-xs text-navy-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5"/> Coaching assessments, not hiring predictions
          </p>
        </div>
      </footer>

      <ToastViewport toasts={toasts} onDismiss={dismiss}/>
    </div>);
}
function errMessage(err) {
    if (err instanceof Error)
        return err.message;
    return 'An unexpected error occurred. Please try again.';
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function InterviewReady(){const [session,setSession]=useState(0);return <InterviewSession key={session} onReset={()=>setSession(value=>value+1)}/>;}
