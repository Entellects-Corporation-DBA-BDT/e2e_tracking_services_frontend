import { SOURCE_LABELS } from '../types';
const CLOSED_JIRA_STATUSES = ['done', 'closed', 'resolved'];
function tag(matches, source) {
  return matches.map(match => ({
    match,
    source
  }));
}
function bestOf(candidates) {
  return [...candidates].sort((a, b) => b.match.score - a.match.score)[0];
}
function isClosed(status) {
  return CLOSED_JIRA_STATUSES.includes((status ?? '').trim().toLowerCase());
}
function computeVerdict(jiraMatches, driveMatches, githubMatches, thresholds) {
  const {
    similar,
    strong
  } = thresholds;
  const jira = tag(jiraMatches, 'jira');
  const drive = tag(driveMatches, 'drive');
  const github = tag(githubMatches, 'github');
  const everything = [...jira, ...drive, ...github];
  const implemented = bestOf([...github, ...jira].filter(({
    match,
    source
  }) => match.score >= strong && (source === 'github' || isClosed(match.status))));
  if (implemented) {
    return {
      verdict: 'ALREADY_IMPLEMENTED',
      confidence: implemented.match.score,
      explanation: `"${implemented.match.title}" in ${SOURCE_LABELS[implemented.source]} matches this requirement closely, so the functionality appears to exist already.`
    };
  }
  const documented = bestOf(drive.filter(({
    match
  }) => match.score >= strong));
  if (documented) {
    return {
      verdict: 'ALREADY_DOCUMENTED',
      confidence: documented.match.score,
      explanation: `"${documented.match.title}" in Google Drive describes this requirement closely. Review it before building anything new.`
    };
  }
  const related = bestOf(everything.filter(({
    match
  }) => match.score >= similar));
  if (related) {
    return {
      verdict: 'PARTIALLY_EXISTS',
      confidence: related.match.score,
      explanation: `"${related.match.title}" in ${SOURCE_LABELS[related.source]} overlaps with this requirement. Some of the work may already exist.`
    };
  }
  const topScore = Math.max(0, ...everything.map(({
    match
  }) => match.score));
  return {
    verdict: 'NEW',
    confidence: Math.min(100, Math.max(0, 100 - topScore)),
    explanation: 'No stories, documents, or code closely match this requirement. It appears to be new work.'
  };
}
export const verdictService = {
  computeVerdict
};
