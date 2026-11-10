# Duplicate Checker integration

Direct URL: `https://e2e.bedatatech.com/ai-tools/duplicate-checker`.

The tool is also available in the shared AI tools navigation and from the Recruiting page. It opens full-screen outside the E2E dashboard sidebar, using the same light/dark toggle as the other tools. Its own Analyze / History / Settings navigation is retained from the supplied ZIP, with mobile navigation.

## Features preserved from the ZIP

- Jira story-key input or pasted title, description and acceptance criteria.
- Four selectable original sample stories.
- Staged understanding, Jira, Google Drive, GitHub and verdict progress.
- Summary, business goal, entities, keywords, scored evidence and match reasons.
- NEW, ALREADY IMPLEMENTED, ALREADY DOCUMENTED and PARTIALLY EXISTS decisions with configurable matching thresholds.
- Original seeded sample history, search, verdict filtering and keyboard-accessible saved-analysis dialog.
- Connection setting previews, sample Drive connection toggle, language-model selection and Demo mode switch.
- Source errors and incomplete-analysis explanations. Failed searches now show a failed progress step.

## Important source limitations

The supplied application implements sample services only. All real Jira, Google Drive, GitHub and language-model methods are placeholders; the React application never calls Supabase. Switching Demo mode off therefore shows an explicit unsupported-live-connection error, rather than presenting samples as live results. Connection preview values remain in memory, are not sent anywhere, and disappear on reload. Do not enter production credentials into the preview fields.

No existing `.env` secrets are copied into browser code. Existing Supabase/OpenAI keys cannot activate the source's missing Jira, Drive and GitHub adapters. A future live implementation would need server-side adapters, authorized source scopes and credentials, and a defined search/scoring API. No live connector was deployed as part of this integration.

History and settings behave as in the original: session-memory state only; refreshing resets to the original samples. The original disabled “Export report — Coming soon” control is retained.

The ZIP contains an unused `requirements` table migration with public read/write/delete policies. No source module uses that table, so it is intentionally not deployed. No database migration is required for this feature.

## Technology and deployment

All application modules are React JavaScript (`.js`). Source TypeScript annotations and Vite aliases were removed. The original layout uses committed, scoped CSS generated from the ZIP's utility classes; no Tailwind or Vite runtime or new production dependency is required. Shared dashboard styles are unaffected.

Deploy the normal frontend production build, including its new lazy-loaded chunks. Keep the existing SPA rewrite so direct requests to `/ai-tools/duplicate-checker` serve `index.html`. No PHP backend changes or extra service are needed for the source's sample workflow.

Source: `src/features/duplicateChecker/`. Optional verification: `npm test -- --watchAll=false --runInBand --runTestsByPath src/features/duplicateChecker/App.test.js`. After building, `node scripts/verify_duplicate_checker_browser.js` opens isolated headless Chrome and checks the public route, sample analysis, history, settings, dark mode and mobile layout using fictional data only.
