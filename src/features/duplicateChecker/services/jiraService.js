import { delay } from '../mocks/delay';
import { FALLBACK_SCENARIO, findScenario, findScenarioByKey, SAMPLE_SCENARIOS } from '../mocks/sampleStories';
const SEARCH_DELAY_MS = 1700;
export const mockJiraService = {
  async getStory(key) {
    await delay(300);
    const scenario = findScenarioByKey(key);
    if (scenario) return scenario.input;
    return {
      storyKey: key.trim().toUpperCase(),
      title: '',
      description: '',
      acceptanceCriteria: ''
    };
  },
  async listSampleStories() {
    return SAMPLE_SCENARIOS.map(scenario => scenario.input);
  },
  async searchSimilarStories(queries, excludeKey) {
    await delay(SEARCH_DELAY_MS);
    const scenario = findScenario(queries) ?? FALLBACK_SCENARIO;
    return scenario.jiraMatches.filter(match => !excludeKey || !match.url.endsWith(`/${excludeKey}`));
  }
};
export const realJiraService = {
  async getStory() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  },
  async listSampleStories() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  },
  async searchSimilarStories() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  }
};
