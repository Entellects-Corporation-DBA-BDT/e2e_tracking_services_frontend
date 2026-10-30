import { useState } from 'react';
import { ArrowRight, ArrowLeft, MessageSquare, Gauge, Layers } from 'lucide-react';
import { LoadingOverlay, SkeletonLines } from '../components/Loading';
import { AlertCircle } from 'lucide-react';
import { DemoBanner } from '../components/DemoBanner';
const DIFFICULTIES = [
    { id: 'Beginner', label: 'Beginner', desc: 'Warm-up and foundational questions.' },
    { id: 'Intermediate', label: 'Intermediate', desc: 'Standard depth for the role.' },
    { id: 'Advanced', label: 'Advanced', desc: 'Deeper technical and situational probes.' },
];
const FOCUSES = [
    { id: 'Technical', label: 'Technical', desc: 'Functional knowledge and problem-solving.' },
    { id: 'Behavioral', label: 'Behavioral', desc: 'Past behavior and collaboration.' },
    { id: 'Mixed', label: 'Mixed', desc: 'A balanced mix of all question types.' },
];
export function InterviewSetupScreen({ loading, error, isDemo, onBack, onStart, onRetry, }) {
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [focus, setFocus] = useState('Mixed');
    return (<div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <span className="badge bg-teal-100 text-teal-700">
          <MessageSquare className="h-3 w-3"/> Step 5
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900 text-balance">
          Set up your mock interview
        </h2>
        <p className="mt-2 text-navy-600">
          We will generate exactly 10 practice questions from your resume and the job description. Choose your
          difficulty and focus. Questions never assume experience you do not have.
        </p>
      </div>

      {isDemo && <DemoBanner message="Demo mode will generate 10 sample questions from fictional data, not your resume."/>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <Gauge className="h-5 w-5 text-teal-500"/> Difficulty
          </h3>
          <div className="mt-3 space-y-2">
            {DIFFICULTIES.map((d) => (<label key={d.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${difficulty === d.id ? 'border-teal-400 bg-teal-50' : 'border-navy-200 hover:border-navy-300'}`}>
                <input type="radio" name="difficulty" value={d.id} checked={difficulty === d.id} onChange={() => setDifficulty(d.id)} className="mt-0.5 accent-teal-500"/>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{d.label}</p>
                  <p className="text-xs text-navy-500">{d.desc}</p>
                </div>
              </label>))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <Layers className="h-5 w-5 text-teal-500"/> Interview focus
          </h3>
          <div className="mt-3 space-y-2">
            {FOCUSES.map((f) => (<label key={f.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${focus === f.id ? 'border-teal-400 bg-teal-50' : 'border-navy-200 hover:border-navy-300'}`}>
                <input type="radio" name="focus" value={f.id} checked={focus === f.id} onChange={() => setFocus(f.id)} className="mt-0.5 accent-teal-500"/>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{f.label}</p>
                  <p className="text-xs text-navy-500">{f.desc}</p>
                </div>
              </label>))}
          </div>
        </div>
      </div>

      {loading && (<div className="card p-6">
          <LoadingOverlay label="Generating 10 tailored interview questions..."/>
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<SkeletonLines key={i} lines={2}/>))}
          </div>
        </div>)}

      {!loading && error && (<div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">We could not generate questions.</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button type="button" onClick={() => onRetry({ difficulty, focus })} className="btn-outline mt-4">
                Try again
              </button>
            </div>
          </div>
        </div>)}

      {!loading && !error && (<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4"/> Back
          </button>
          <button type="button" onClick={() => onStart({ difficulty, focus })} className="btn-primary w-full sm:w-auto">
            Generate 10 questions <ArrowRight className="h-4 w-4"/>
          </button>
        </div>)}
    </div>);
}
