import { delay } from '../mocks/delay';
import { FALLBACK_SCENARIO, findScenario } from '../mocks/sampleStories';
const CODE_DELAY_MS = 2000;
const PULL_REQUEST_DELAY_MS = 1500;
export const mockGithubService = {
  async searchCode(queries) {
    const scenario = findScenario(queries) ?? FALLBACK_SCENARIO;
    await delay(CODE_DELAY_MS);
    return scenario.githubCodeMatches;
  },
  async searchPullRequests(queries) {
    const scenario = findScenario(queries) ?? FALLBACK_SCENARIO;
    await delay(PULL_REQUEST_DELAY_MS);
    return scenario.githubPullRequestMatches;
  }
};
export const realGithubService = {
  async searchCode() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  },
  async searchPullRequests() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  }
};
