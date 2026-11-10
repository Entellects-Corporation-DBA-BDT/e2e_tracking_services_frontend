import { SOURCE_LABELS } from '../types';
const STORY_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;
export function isValidStoryKey(key) {
  return STORY_KEY_PATTERN.test(key);
}
export function buildStoryText(story) {
  return [story.title, story.description, story.acceptanceCriteria].map(part => part.trim()).filter(Boolean).join('\n\n');
}
export function buildAnalysis({
  id,
  createdAt,
  story,
  understanding,
  sources,
  verdict
}) {
  const storyKey = story.storyKey.trim().toUpperCase();
  const failedSources = Object.values(sources).filter(source => source.status === 'error').map(source => SOURCE_LABELS[source.source]);
  const incompleteNote = failedSources.length > 0 ? ` ${failedSources.join(' and ')} could not be searched, so this result may be incomplete.` : '';
  return {
    id,
    createdAt,
    storyKey,
    title: story.title.trim() || `Story ${storyKey}`,
    understanding,
    sources,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    explanation: `${verdict.explanation}${incompleteNote}`
  };
}
export function toSourceResult(source, search) {
  return search().then(matches => ({
    source,
    status: 'ok',
    matches
  }), error => ({
    source,
    status: 'error',
    errorMessage: error instanceof Error ? error.message : 'Something went wrong.',
    matches: []
  }));
}
