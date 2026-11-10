export const SAMPLE_SCENARIOS = [{
  id: 'bulk-vendor-import',
  input: {
    storyKey: 'PROJ-301',
    title: 'Bulk import vendor contacts from CSV',
    description: 'Procurement needs to upload a spreadsheet of vendor contacts so they do not have to enter each one manually.',
    acceptanceCriteria: '- Accepts .csv files up to 5 MB\n- Shows a preview with row-level validation errors\n- Imports valid rows and reports skipped rows'
  },
  understanding: {
    summary: 'Procurement wants to bulk import vendor contacts from a CSV file, with validation and a preview.',
    businessGoal: 'Reduce manual data entry time during procurement onboarding.',
    keywords: ['vendor', 'contacts', 'csv', 'import', 'bulk', 'upload', 'validation'],
    entities: ['Vendor contacts', 'Procurement', 'CSV import']
  },
  jiraMatches: [{
    title: 'Customer list import from spreadsheet',
    url: 'https://jira.example.com/browse/PROJ-87',
    score: 38,
    context: 'PROJ-87 · Done',
    reason: 'Also imports tabular data, but only for customers rather than vendors.',
    status: 'Done'
  }, {
    title: 'Clean up duplicate contact records',
    url: 'https://jira.example.com/browse/PROJ-152',
    score: 24,
    context: 'PROJ-152 · In Progress',
    reason: 'Works on contact records, but has no import capability.',
    status: 'In Progress'
  }],
  driveMatches: [],
  driveError: 'The Drive folder took too long to respond, so documents were not searched.',
  githubCodeMatches: [{
    title: 'csvParser.ts',
    url: 'https://github.example.com/acme/platform/blob/main/src/utils/csvParser.ts',
    score: 31,
    context: 'acme/platform · src/utils',
    reason: 'A generic CSV parser exists, but it has no vendor flow or validation screen.'
  }, {
    title: 'ContactTable.tsx',
    url: 'https://github.example.com/acme/web-app/blob/main/src/components/ContactTable.tsx',
    score: 22,
    context: 'acme/web-app · src/components',
    reason: 'Displays contacts in a table, with no upload or bulk actions.'
  }],
  githubPullRequestMatches: [{
    title: 'Draft: contact import spike (#201)',
    url: 'https://github.example.com/acme/platform/pull/201',
    score: 29,
    context: 'acme/platform · PR #201 · Closed',
    reason: 'Early spike for parsing contact files that was never merged.'
  }]
}, {
  id: 'password-reset',
  input: {
    storyKey: 'PROJ-412',
    title: 'Allow users to reset their password through an emailed link',
    description: 'Users who forget their password should be able to request a reset link by email and set a new password.',
    acceptanceCriteria: '- Reset link expires after 30 minutes\n- Link can only be used once\n- User is notified by email when the password changes'
  },
  understanding: {
    summary: 'Users need a self-service password reset flow delivered by email.',
    businessGoal: 'Cut password-related support tickets and keep accounts secure.',
    keywords: ['password', 'reset', 'email', 'link', 'account', 'expire'],
    entities: ['Password reset', 'Email notifications', 'User accounts']
  },
  jiraMatches: [{
    title: 'Password reset emails for customer accounts',
    url: 'https://jira.example.com/browse/PROJ-198',
    score: 86,
    context: 'PROJ-198 · Done',
    reason: 'Closed story that already delivered the emailed reset link flow.',
    status: 'Done'
  }, {
    title: 'Session timeout warning',
    url: 'https://jira.example.com/browse/PROJ-260',
    score: 27,
    context: 'PROJ-260 · Done',
    reason: 'Related account security UX, but does not touch password reset.',
    status: 'Done'
  }],
  driveMatches: [{
    title: 'Account security requirements v2',
    url: 'https://drive.example.com/file/account-security-v2',
    score: 52,
    context: 'Shared drive · Security',
    reason: 'Lists password reset as a required account control.'
  }],
  githubCodeMatches: [{
    title: 'passwordReset.ts',
    url: 'https://github.example.com/acme/platform/blob/main/src/auth/passwordReset.ts',
    score: 94,
    context: 'acme/platform · src/auth',
    reason: 'Reset token generation and expiry logic already exist in this module.'
  }, {
    title: 'reset-email.tsx',
    url: 'https://github.example.com/acme/web-app/blob/main/src/emails/reset-email.tsx',
    score: 71,
    context: 'acme/web-app · src/emails',
    reason: 'Email template for the reset link is already built.'
  }],
  githubPullRequestMatches: [{
    title: 'Add 30 minute expiry to reset tokens (#482)',
    url: 'https://github.example.com/acme/platform/pull/482',
    score: 90,
    context: 'acme/platform · PR #482 · Merged',
    reason: 'Merged change that enforces the 30 minute link expiry.'
  }]
}, {
  id: 'quarterly-access-review',
  input: {
    storyKey: 'PROJ-377',
    title: 'Run and record a quarterly access review for admin accounts',
    description: 'Security must review all admin accounts every quarter and keep evidence of each review.',
    acceptanceCriteria: '- Admin account list is exported each quarter\n- Reviewer signs off on each account\n- Evidence is stored for audit'
  },
  understanding: {
    summary: 'Security needs a recurring quarterly review of admin access with audit evidence.',
    businessGoal: 'Meet audit requirements for privileged access control.',
    keywords: ['access', 'review', 'admin', 'quarterly', 'audit', 'evidence', 'security'],
    entities: ['Admin accounts', 'Access reviews', 'Audit evidence']
  },
  jiraMatches: [{
    title: 'Quarterly audit checklist',
    url: 'https://jira.example.com/browse/PROJ-310',
    score: 55,
    context: 'PROJ-310 · Open',
    reason: 'Covers the audit schedule but not admin account sign-off.',
    status: 'Open'
  }],
  driveMatches: [{
    title: 'Access Review SOP v3',
    url: 'https://drive.example.com/file/access-review-sop-v3',
    score: 83,
    context: 'Shared drive · Policies / Security',
    reason: 'Describes the quarterly admin review steps and evidence retention.'
  }],
  githubCodeMatches: [{
    title: 'export-admin-users.ts',
    url: 'https://github.example.com/acme/platform/blob/main/scripts/export-admin-users.ts',
    score: 28,
    context: 'acme/platform · scripts',
    reason: 'Exports admin users, but has no review or sign-off flow.'
  }],
  githubPullRequestMatches: [{
    title: 'Schedule quarterly admin export (#317)',
    url: 'https://github.example.com/acme/platform/pull/317',
    score: 33,
    context: 'acme/platform · PR #317 · Merged',
    reason: 'Schedules the admin export but not the review sign-off.'
  }]
}, {
  id: 'weekly-usage-digest',
  input: {
    storyKey: 'PROJ-290',
    title: 'Send a weekly usage digest email to team leads',
    description: "Team leads should receive a weekly summary of their team's tool usage every Monday morning.",
    acceptanceCriteria: '- Sent every Monday at 08:00 local time\n- Includes active users and the top 5 tools\n- Team leads can opt out'
  },
  understanding: {
    summary: 'Team leads need a recurring Monday email summarizing team tool usage.',
    businessGoal: 'Give managers visibility into adoption without opening dashboards.',
    keywords: ['weekly', 'digest', 'email', 'team', 'leads', 'usage', 'summary'],
    entities: ['Team leads', 'Usage analytics', 'Scheduled email']
  },
  jiraMatches: [{
    title: 'Monthly usage report for admins',
    url: 'https://jira.example.com/browse/PROJ-266',
    score: 66,
    context: 'PROJ-266 · In Progress',
    reason: 'Uses the same usage data, but is monthly and only for admins.',
    status: 'In Progress'
  }],
  driveMatches: [{
    title: 'Analytics reporting ideas',
    url: 'https://drive.example.com/file/analytics-reporting-ideas',
    score: 34,
    context: 'Shared drive · Product',
    reason: 'Brainstorm notes that mention digests but no decisions.'
  }],
  githubCodeMatches: [{
    title: 'usageSummary.ts',
    url: 'https://github.example.com/acme/platform/blob/main/src/reports/usageSummary.ts',
    score: 61,
    context: 'acme/platform · src/reports',
    reason: 'Builds usage summaries that could feed a weekly email, but has no scheduler.'
  }],
  githubPullRequestMatches: [{
    title: 'Usage summary job for digests (#430)',
    url: 'https://github.example.com/acme/platform/pull/430',
    score: 44,
    context: 'acme/platform · PR #430 · Open',
    reason: 'Work in progress on a usage job. No email sending yet.'
  }]
}];
export const FALLBACK_SCENARIO = SAMPLE_SCENARIOS[0];
export function findScenarioByKey(key) {
  const normalized = key.trim().toUpperCase();
  return SAMPLE_SCENARIOS.find(scenario => scenario.input.storyKey === normalized);
}
export function findScenario(words) {
  const wordSet = new Set(words);
  let best;
  let bestScore = 0;
  for (const scenario of SAMPLE_SCENARIOS) {
    const score = scenario.understanding.keywords.filter(keyword => wordSet.has(keyword)).length;
    if (score > bestScore) {
      best = scenario;
      bestScore = score;
    }
  }
  return best;
}
