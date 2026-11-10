import { useCallback, useRef, useState } from 'react';
import { buildAnalysis, buildStoryText, toSourceResult } from '../lib/analysis';
import { createServices } from '../services/factory';
const SOURCE_IDS = ['jira', 'drive', 'github'];
const INITIAL_STEPS = {
  understanding: 'pending',
  jira: 'pending',
  drive: 'pending',
  github: 'pending',
  verdict: 'pending'
};
function describeError(error) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
export function useAnalysisRun() {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [understanding, setUnderstanding] = useState(null);
  const [results, setResults] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [runError, setRunError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const runIdRef = useRef(0);
  const setStep = useCallback((id, status) => {
    setSteps(previous => ({
      ...previous,
      [id]: status
    }));
  }, []);
  const cancel = useCallback(() => {
    runIdRef.current += 1;
    setIsRunning(false);
  }, []);
  const start = useCallback(async (input, settings, onComplete) => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isCurrent = () => runIdRef.current === runId;
    const services = createServices(settings.demoMode);
    setSteps(INITIAL_STEPS);
    setUnderstanding(null);
    setResults({});
    setAnalysis(null);
    setRunError(null);
    setIsRunning(true);
    setStep('understanding', 'running');
    let story;
    let storyUnderstanding;
    try {
      story = input.title.trim() ? input : await services.jira.getStory(input.storyKey);
      storyUnderstanding = await services.llm.understandStory(buildStoryText(story));
    } catch (error) {
      if (!isCurrent()) return;
      setStep('understanding', 'failed');
      setRunError(describeError(error));
      setIsRunning(false);
      return;
    }
    if (!isCurrent()) return;
    setUnderstanding(storyUnderstanding);
    setStep('understanding', 'done');
    const queries = storyUnderstanding.keywords;
    const collect = (id, search) => toSourceResult(id, search).then(result => {
      if (isCurrent()) {
        setResults(previous => ({
          ...previous,
          [id]: result
        }));
        setStep(id, result.status==='error'?'failed':'done');
      }
      return result;
    });
    SOURCE_IDS.forEach(id => setStep(id, 'running'));
    const [jira, drive, github] = await Promise.all([collect('jira', () => services.jira.searchSimilarStories(queries, story.storyKey)), collect('drive', () => services.drive.searchDocuments(queries)), collect('github', async () => {
      const [code, pullRequests] = await Promise.all([services.github.searchCode(queries), services.github.searchPullRequests(queries)]);
      return [...code, ...pullRequests];
    })]);
    if (!isCurrent()) return;
    setStep('verdict', 'running');
    const verdict = services.verdict.computeVerdict(jira.matches, drive.matches, github.matches, {
      similar: settings.similarThreshold,
      strong: settings.strongThreshold
    });
    const result = buildAnalysis({
      id: `analysis-${Date.now()}`,
      createdAt: new Date().toISOString(),
      story,
      understanding: storyUnderstanding,
      sources: {
        jira,
        drive,
        github
      },
      verdict
    });
    setAnalysis(result);
    setStep('verdict', 'done');
    setIsRunning(false);
    onComplete(result);
  }, [setStep]);
  return {
    steps,
    understanding,
    results,
    analysis,
    runError,
    isRunning,
    start,
    cancel
  };
}
