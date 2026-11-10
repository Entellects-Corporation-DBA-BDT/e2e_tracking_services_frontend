import { buildAnalysis } from '../lib/analysis';
import { SAMPLE_SCENARIOS } from './sampleStories';
import { DEFAULT_SETTINGS } from './settings';
import { verdictService } from '../services/verdictService';
const SEED_TIMES = ['2026-10-27T09:12:00.000Z', '2026-10-27T14:40:00.000Z', '2026-10-28T10:05:00.000Z', '2026-10-28T16:30:00.000Z'];
const thresholds = {
  similar: DEFAULT_SETTINGS.similarThreshold,
  strong: DEFAULT_SETTINGS.strongThreshold
};
const seeded = SAMPLE_SCENARIOS.map((scenario, index) => {
  const sources = {
    jira: {
      source: 'jira',
      status: 'ok',
      matches: scenario.jiraMatches
    },
    drive: scenario.driveError ? {
      source: 'drive',
      status: 'error',
      errorMessage: scenario.driveError,
      matches: []
    } : {
      source: 'drive',
      status: 'ok',
      matches: scenario.driveMatches
    },
    github: {
      source: 'github',
      status: 'ok',
      matches: [...scenario.githubCodeMatches, ...scenario.githubPullRequestMatches]
    }
  };
  const verdict = verdictService.computeVerdict(scenario.jiraMatches, sources.drive.matches, sources.github.matches, thresholds);
  return buildAnalysis({
    id: `seed-${index + 1}`,
    createdAt: SEED_TIMES[index % SEED_TIMES.length],
    story: scenario.input,
    understanding: scenario.understanding,
    sources,
    verdict
  });
});
export const SEED_ANALYSES = seeded.reverse();
