import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, SkipForward, Square, AlertCircle, CheckCircle2, RotateCcw, Star, Lightbulb, ThumbsUp, ThumbsDown, Edit3, Info, } from 'lucide-react';
import { LoadingOverlay, ButtonSpinner } from '../components/Loading';
import { ConfirmModal } from '../components/Modal';
import { DemoBanner } from '../components/DemoBanner';
export function InterviewScreen({ retryQueue=[], questions, isDemo, onSubmitAnswer, onSkip, onNext, onRetryQuestion, onEnd, results, currentIndex, setCurrentIndex, }) {
    const question = questions[currentIndex];
    const existing = results.find((r) => r.question.id === question?.id);
    const [answer, setAnswer] = useState(existing?.answer || '');
    const [phase, setPhase] = useState(existing ? (existing.skipped ? 'skipped' : 'feedback') : 'answering');
    const [feedback, setFeedback] = useState(existing?.feedback || null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [paused, setPaused] = useState(false);
    const [endConfirm, setEndConfirm] = useState(false);
    const [submitError, setSubmitError] = useState(false);
    const answerRef = useRef(null);
    // Reset state when question changes
    useEffect(() => {
        const ex = results.find((r) => r.question.id === question?.id);
        setAnswer(ex?.answer || '');
        setFeedback(ex?.feedback || null);
        setPhase(ex ? (ex.skipped ? 'skipped' : 'feedback') : 'answering');
        setError(null);
        setSubmitError(false);
        setSubmitting(false);
    }, [question?.id, results, question]);
    if (!question) {
        return null;
    }
    const handleSubmit = async () => {
        if (submitting || paused)
            return;
        if (!answer.trim()) {
            setError('Please write an answer before submitting, or skip the question.');
            return;
        }
        setSubmitting(true);
        setError(null);
        setSubmitError(false);
        setPhase('evaluating');
        try {
            const fb = await onSubmitAnswer(question.id, answer.trim());
            if (!fb) {
                // Keep the answer visible; allow retry
                setPhase('answering');
                setSubmitError(true);
                setError('The AI request failed. Your answer is preserved — you can retry.');
                return;
            }
            setFeedback(fb);
            setPhase('feedback');
        }
        catch {
            setPhase('answering');
            setSubmitError(true);
            setError('The AI request failed. Your answer is preserved — you can retry.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleSkip = () => {
        if (submitting)
            return;
        onSkip(question.id);
        setPhase('skipped');
    };
    const handleRetryQuestion = () => {
        onRetryQuestion(question.id);
        setAnswer('');
        setFeedback(null);
        setPhase('answering');
        setError(null);
        answerRef.current?.focus();
    };
    const handleNext = () => {
        if(retryQueue.length){const next=retryQueue.find(index=>index>currentIndex);if(next!==undefined)setCurrentIndex(next);else onNext();return;}
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
        else {
            onNext();
        }
    };
    const isLast = currentIndex === questions.length - 1;
    const progressPct = ((currentIndex + (phase === 'feedback' || phase === 'skipped' ? 1 : 0)) / questions.length) * 100;
    return (<div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {isDemo && <DemoBanner message="Demo mode: feedback uses fictional sample data, not real assessment of your answer."/>}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm font-medium text-navy-700">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-navy-500">{question.category}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300" style={{ width: `${progressPct}%` }} role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}/>
        </div>
      </div>

      {/* Pause banner */}
      {paused && (<div className="card p-3 bg-navy-50 border-navy-200 flex items-center justify-between">
          <p className="text-sm font-medium text-navy-700 flex items-center gap-2">
            <Pause className="h-4 w-4"/> Interview paused. Your progress is saved.
          </p>
          <button type="button" className="btn-teal text-xs" onClick={() => setPaused(false)}>
            <Play className="h-3.5 w-3.5"/> Resume
          </button>
        </div>)}

      {/* Question card */}
      <div className="card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{question.category}</p>
        <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-navy-900 text-balance leading-snug">
          {question.text}
        </h2>
        <p className="mt-2 text-sm text-navy-500">
          <Info className="inline h-3.5 w-3.5 mr-1"/>
          Intent: {question.intent}
        </p>
      </div>

      {/* Answer input */}
      <div className="card p-5">
        <label className="label" htmlFor="answer-input">
          Your answer
        </label>
        <textarea ref={answerRef} id="answer-input" className="input text-sm leading-relaxed h-40 resize-y scrollbar-thin" placeholder="Write your answer here. Be specific and use real examples from your experience." value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={submitting || phase === 'feedback' || phase === 'skipped' || paused} aria-label="Your answer to the interview question"/>
        {error && (<p className="mt-2 text-sm text-red-600 flex items-start gap-1.5" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0"/>
            <span>{error}</span>
          </p>)}
        {submitError && (<p className="mt-1 text-xs text-navy-500">
            Your answer was not lost. Press "Submit Answer" again to retry.
          </p>)}
      </div>

      {/* Feedback */}
      {phase === 'feedback' && feedback && (<FeedbackCard feedback={feedback}/>)}

      {phase === 'skipped' && (<div className="card p-5 bg-navy-50 border-navy-200">
          <p className="text-sm text-navy-700 flex items-center gap-2">
            <SkipForward className="h-4 w-4"/> You skipped this question. It will be excluded from averages and
            labeled in the final report.
          </p>
        </div>)}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {phase === 'answering' || phase === 'evaluating' || submitError ? (<>
            <button type="button" onClick={handleSubmit} disabled={submitting || paused || !answer.trim()} className="btn-primary">
              {submitting ? <ButtonSpinner label="Evaluating..."/> : 'Submit Answer'}
            </button>
            <button type="button" onClick={handleSkip} disabled={submitting || paused} className="btn-outline">
              <SkipForward className="h-4 w-4"/> Skip
            </button>
            <button type="button" onClick={() => setPaused((p) => !p)} disabled={submitting} className="btn-outline">
              {paused ? <Play className="h-4 w-4"/> : <Pause className="h-4 w-4"/>}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <div className="flex-1"/>
            <button type="button" onClick={() => setEndConfirm(true)} className="btn-danger">
              <Square className="h-4 w-4"/> End Interview
            </button>
          </>) : (<>
            <button type="button" onClick={handleNext} className="btn-teal">
              {isLast ? 'View final report' : 'Next Question'}
              <ArrowRight className="h-4 w-4"/>
            </button>
            <button type="button" onClick={handleRetryQuestion} className="btn-outline">
              <RotateCcw className="h-4 w-4"/> Retry
            </button>
            {phase === 'skipped' && !feedback && (<button type="button" onClick={() => {
                    setPhase('answering');
                    setError(null);
                }} className="btn-outline">
                <Edit3 className="h-4 w-4"/> Answer now
              </button>)}
            <div className="flex-1"/>
            <button type="button" onClick={() => setEndConfirm(true)} className="btn-danger">
              <Square className="h-4 w-4"/> End Interview
            </button>
          </>)}
      </div>

      {phase === 'evaluating' && (<div className="card p-6">
          <LoadingOverlay label="Evaluating your answer..."/>
        </div>)}

      <ConfirmModal open={endConfirm} title="End the interview?" message="This will end the interview and take you to your final report. Answered and skipped questions so far will be included. This cannot be undone." confirmLabel="End interview" danger onConfirm={() => {
            setEndConfirm(false);
            onEnd();
        }} onCancel={() => setEndConfirm(false)}/>
    </div>);
}
function FeedbackCard({ feedback }) {
    return (<div className="card p-5 sm:p-6 animate-slide-up space-y-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-teal-500"/>
        <h3 className="text-base font-semibold text-navy-900">Feedback on your answer</h3>
      </div>

      <p className="text-xs text-navy-500 italic">{feedback.note}</p>

      {/* Ratings */}
      {feedback.ratings.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feedback.ratings.map((r, i) => (<RatingBar key={i} rating={r}/>))}
        </div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeedbackList title="What was done well" icon={ThumbsUp} items={feedback.doneWell} color="text-teal-600" bulletColor="bg-teal-400"/>
        <FeedbackList title="What was missing or unclear" icon={ThumbsDown} items={feedback.missingOrUnclear} color="text-amber-600" bulletColor="bg-amber-400"/>
        {feedback.corrections.length > 0 && (<FeedbackList title="Factual / technical corrections" icon={AlertCircle} items={feedback.corrections} color="text-red-600" bulletColor="bg-red-400"/>)}
        <FeedbackList title="Actionable improvements" icon={Lightbulb} items={feedback.improvements} color="text-navy-600" bulletColor="bg-navy-400"/>
      </div>

      {feedback.structure && (<div className="rounded-lg bg-navy-50 border border-navy-100 px-4 py-3">
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Suggested structure</p>
          <p className="mt-1 text-sm text-navy-800">{feedback.structure}</p>
        </div>)}

      <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-4">
        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">A stronger example (grounded in your experience)</p>
        <p className="mt-2 text-sm text-navy-800 leading-relaxed whitespace-pre-wrap">{feedback.strongerExample}</p>
      </div>
    </div>);
}
function RatingBar({ rating }) {
    return (<div className="rounded-lg border border-navy-100 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy-700">{rating.dimension}</p>
        <div className="flex items-center gap-0.5" aria-label={`Rating ${rating.score} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3.5 w-3.5 ${i < rating.score ? 'fill-teal-400 text-teal-400' : 'text-navy-200'}`}/>))}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-navy-500 leading-relaxed">{rating.rationale}</p>
    </div>);
}
function FeedbackList({ title, icon: Icon, items, color, bulletColor, }) {
    if (!items.length)
        return null;
    return (<div>
      <p className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${color}`}>
        <Icon className="h-3.5 w-3.5"/> {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm text-navy-700 leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${bulletColor}`}/>
            <span>{item}</span>
          </li>))}
      </ul>
    </div>);
}
