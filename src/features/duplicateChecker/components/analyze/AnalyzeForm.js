import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { isValidStoryKey } from '../../lib/analysis';
const INPUT_CLASS = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-slate-700';
export default function AnalyzeForm({
  isRunning,
  samples,
  onSubmit
}) {
  const [mode, setMode] = useState('key');
  const [storyKey, setStoryKey] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [error, setError] = useState(null);
  function loadSample(key) {
    const sample = samples.find(item => item.storyKey === key);
    if (!sample) return;
    setMode('paste');
    setStoryKey(sample.storyKey);
    setTitle(sample.title);
    setDescription(sample.description);
    setAcceptanceCriteria(sample.acceptanceCriteria);
    setError(null);
  }
  function handleSubmit(event) {
    event.preventDefault();
    const key = storyKey.trim().toUpperCase();
    if (key && !isValidStoryKey(key)) {
      setError('Enter a Jira key in the format PROJ-123.');
      return;
    }
    if (mode === 'key' && !key) {
      setError('Enter a Jira story key, such as PROJ-123.');
      return;
    }
    if (mode === 'paste' && !title.trim()) {
      setError('Add a story title so we know what to look for.');
      return;
    }
    setError(null);
    onSubmit({
      storyKey: key,
      title: mode === 'paste' ? title : '',
      description: mode === 'paste' ? description : '',
      acceptanceCriteria: mode === 'paste' ? acceptanceCriteria : ''
    });
  }
  return <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Input method">
        {['key', 'paste'].map(option => <button key={option} type="button" role="radio" aria-checked={mode === option} onClick={() => setMode(option)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${mode === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {option === 'key' ? 'Jira story key' : 'Paste story'}
          </button>)}
      </div>

      {mode === 'key' ? <div>
          <label htmlFor="story-key" className={LABEL_CLASS}>Story key</label>
          <input id="story-key" value={storyKey} onChange={event => setStoryKey(event.target.value)} placeholder="PROJ-123" autoComplete="off" className={INPUT_CLASS} />
          <p className="mt-1.5 text-xs leading-normal text-slate-500">We will fetch the title, description, and criteria from Jira.</p>
        </div> : <div className="space-y-4">
          <div>
            <label htmlFor="story-key-optional" className={LABEL_CLASS}>
              Story key <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input id="story-key-optional" value={storyKey} onChange={event => setStoryKey(event.target.value)} placeholder="PROJ-123" autoComplete="off" className={INPUT_CLASS} />
          </div>
          <div>
            <label htmlFor="story-title" className={LABEL_CLASS}>Title</label>
            <input id="story-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Short summary of the story" className={INPUT_CLASS} />
          </div>
          <div>
            <label htmlFor="story-description" className={LABEL_CLASS}>Description</label>
            <textarea id="story-description" value={description} onChange={event => setDescription(event.target.value)} rows={4} placeholder="What the user needs and why" className={`${INPUT_CLASS} resize-y`} />
          </div>
          <div>
            <label htmlFor="story-criteria" className={LABEL_CLASS}>Acceptance criteria</label>
            <textarea id="story-criteria" value={acceptanceCriteria} onChange={event => setAcceptanceCriteria(event.target.value)} rows={4} placeholder={'- One criterion per line'} className={`${INPUT_CLASS} resize-y`} />
          </div>
        </div>}

      {samples.length > 0 && <div>
          <label htmlFor="sample-story" className={LABEL_CLASS}>Try a sample story</label>
          <select id="sample-story" value="" onChange={event => loadSample(event.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
            <option value="" disabled>Choose a demo scenario</option>
            {samples.map(sample => <option key={sample.storyKey} value={sample.storyKey}>
                {sample.storyKey}: {sample.title}
              </option>)}
          </select>
        </div>}

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

      <button type="submit" disabled={isRunning} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0">
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {isRunning ? 'Analyzing...' : 'Analyze requirement'}
      </button>
    </form>;
}
