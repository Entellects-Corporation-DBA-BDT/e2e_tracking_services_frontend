import { delay } from '../mocks/delay';
import { FALLBACK_SCENARIO, findScenario } from '../mocks/sampleStories';
const SEARCH_DELAY_MS = 2400;
export const mockDriveService = {
  async searchDocuments(queries) {
    const scenario = findScenario(queries) ?? FALLBACK_SCENARIO;
    await delay(SEARCH_DELAY_MS);
    if (scenario.driveError) throw new Error(scenario.driveError);
    return scenario.driveMatches;
  }
};
export const realDriveService = {
  async searchDocuments() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  }
};
