import { mockDriveService, realDriveService } from './driveService';
import { mockGithubService, realGithubService } from './githubService';
import { mockJiraService, realJiraService } from './jiraService';
import { mockLlmService, realLlmService } from './llmService';
import { verdictService } from './verdictService';
export function createServices(demoMode) {
  return {
    jira: demoMode ? mockJiraService : realJiraService,
    drive: demoMode ? mockDriveService : realDriveService,
    github: demoMode ? mockGithubService : realGithubService,
    llm: demoMode ? mockLlmService : realLlmService,
    verdict: verdictService
  };
}
