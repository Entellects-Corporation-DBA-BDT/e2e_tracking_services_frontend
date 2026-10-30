# InterviewReady AI integration

## Direct website link

Use `/ai-tools/interview-ready` on the E2E frontend domain. It opens publicly in the full-screen AI Tools shell without the dashboard sidebar. The AI Tools header includes Resume Match, Document Check and InterviewReady AI. Pasted links need the same SPA index.html fallback as the other tools.

## Original source and preserved workflow

Ported from the supplied `Model_Interview_Questions-main.zip` (InterviewReady AI). All frontend components and helpers are React JavaScript `.js` files under `src/features/interviewReady`; there is no Vite app, TypeScript source, Tailwind build step or second frontend server. The original compiled theme is scoped to `.interview-ready` so its resets and utility styles do not affect E2E pages.

Preserved: PDF/DOCX/TXT upload and paste (10 MB), extraction review/edit, resume/JD evidence analysis, truthful tailoring and clarifications, original/tailored view and change log, editable summary, copy and DOCX/PDF export, difficulty/focus options, exactly ten distinct questions, submit/skip/retry/pause/resume/end confirmation, question feedback/ratings, report PDF, selected weak/skipped-question retry, new interview, return to resume, privacy explanation, clear-session confirmation, and explicitly labelled fictional demo mode.

The PDF parser reuses the existing self-hosted worker; scanned image-only PDFs prompt for pasted text, matching the original tool. PDFs are limited to 40 pages. Demo feedback is not a real assessment. Coaching ratings do not predict hiring outcomes.

Corrections made while integrating: clearing remounts the session and aborts pending requests; edited inputs invalidate old outputs; early-ended reports are marked incomplete; retry uses original question indices; edited summary is reflected in exports; duplicate or malformed question batches are rejected; modal keyboard focus is contained and restored. No synthetic technical-accuracy rating is invented when the provider omits it.

## Existing Supabase project: required live AI setup

The user selected the same project already configured for Resume Match. Frontend requests read the existing generated `public/resume-match/config.json`; the prestart/prebuild hook publishes only the public URL and anon key from the existing environment. No additional browser secret or Supabase SDK is needed.

A metadata-only probe returned HTTP 404 for `ai-assist` during integration. The function must be deployed before live analysis can work. The frontend accurately displays setup/network errors and keeps user inputs; it does not silently replace live analysis with demo output.

1. In the existing Supabase dashboard, add Edge Function secrets:
   - `AI_API_KEY`: your AI provider key (server secret only).
   - `AI_API_BASE`: optional, defaults to `https://api.openai.com/v1`.
   - `AI_MODEL`: optional, original default `gpt-5-mini`; choose a model supported by your account.
   - `AI_PROVIDER_NAME`: optional display label.
2. Deploy the included pure JavaScript gateway `supabase/functions/ai-assist/index.js` to that project. With an authenticated Supabase CLI, run from this repository:

   ```sh
   supabase functions deploy ai-assist --project-ref YOUR_EXISTING_PROJECT_REF
   ```

   `supabase/config.toml` sets the JavaScript entrypoint and keeps JWT verification enabled. Use the existing public JWT anon key for this deployment; never expose a service-role key. CLI authentication/deployment access and the server-side provider key were not available to this session, so no live function was deployed or paid AI request made.
3. Refresh InterviewReady AI. Its GET probe should say the AI service is configured. Test a non-sensitive sample before entering candidate content.

Supabase supports JavaScript entrypoints via the function configuration: https://supabase.com/docs/guides/functions/function-configuration . The bundled gateway preserves the original analyze/tailor/questions/feedback/report task schemas and prompts, with request limits, timeout and safer error handling. A public tool can incur provider usage; configure the project's normal usage controls before promoting its link.

Do not put `AI_API_KEY` in React `.env` variables or in public configuration. Provider requests are made only by the gateway. The existing E2E PHP backend and database are unchanged. No database migration is required.

## Privacy

Documents are parsed in the browser. The application keeps documents, text, analysis and interview state in React memory only; refresh, clear or leaving the tool discards it. Actual AI actions send the necessary text through Supabase to the configured provider. Report requests contain question text and feedback, excluding full resumes, job descriptions and raw answers. No application code logs candidate text or saves it to a database/browser storage. Downloaded files remain on the user's device. Normal provider/platform retention policies still apply.

## Frontend deployment and verification

Deploy both package files and use `npm ci`, then `npm run build`. New runtime dependencies are `docx` (DOCX export) and `lucide-react` (React icons). Deploy the complete build including existing local PDF/OCR assets. All existing tools remain available. Deploy the Supabase function separately; copying it to the frontend web root does not run it.

Focused tests: `src/features/interviewReady/App.test.js`, `src/features/interviewReady/lib/ai.test.js`. Optional development helpers: `node scripts/test_interview_gateway.js` (fake provider contract tests), `node scripts/verify_interview_ready_browser.js` (local Chrome with fictional source/controlled AI responses, no live AI calls). Browser screenshots, reports and fictional downloads are kept in ignored `.server-audit/interview-ready`.

## Integration validation

- 16 focused tests passed across the three AI tool components and interview API adapter. The full interview regression also verifies selected skipped-question retry.
- JavaScript gateway contract tests passed using fake provider responses, with no live AI requests.
- Final production build passed with only existing unrelated repository warnings.
- Chrome passed the public direct link, full analysis/tailoring/interview/report flow with controlled AI fixtures, failed-answer retry, pause/resume, edited DOCX/PDF downloads and re-import, early-end labelling, report payload privacy, clearing/reload, labelled demo and mobile fit. Existing Document Check OCR and public Resume Match route checks also passed.
- Live provider behavior is not verified until the Supabase function and server secret are configured. No candidate information was sent to a live AI provider during these checks.

## Private `.env` key and secure setup commands

`AI_API_KEY` in the root `.env` is useful to the server-side setup helper; React deliberately cannot read it. Do not rename it to a `REACT_APP_` or `VITE_` variable. The browser only receives the public Supabase URL and anon key.

- `npm run interview:check`: loads the private `.env`, checks provider model metadata without a generation request, then probes the configured Supabase function. It prints status only, never key values. A successful metadata check confirms authentication/model access, not available billing quota or successful generation.
- `npm run interview:setup`: performs the same checks, verifies Supabase deployment access, uploads only the allowlisted AI secrets using a temporary private file, removes that file in a finally block, deploys the JavaScript function and checks readiness. It derives the existing project from the configured Supabase URL. Authenticate with `npx supabase login`, or set `SUPABASE_ACCESS_TOKEN` privately. This credential is distinct from the public anon key.

The helper uses the official Supabase CLI through npm; it is a development/deployment helper, not frontend code or another app service. It does not deploy unrelated functions, touch the database, or expose `.env`. Commands and secret handling are based on https://supabase.com/docs/guides/functions/secrets and https://developers.openai.com/api/docs/guides/production-best-practices#api-keys .

Latest verification: the updated provider key passed model access (HTTP 200), but the configured Supabase `ai-assist` endpoint returned HTTP 404. Deployment was attempted and requires Supabase login on this computer; no provider secret was uploaded by that failed attempt. Run `npx supabase login` privately, then `npm run interview:setup` to deploy to the already configured project.

The exact gateway also passed all five live provider operations locally with fictional input: analysis, tailoring, ten distinct interview questions, answer feedback and report generation. Frontend tests passed (six tests). This verifies the provider key and gateway behavior, not deployment readiness. The inspected `.env` has the provider key, Supabase URL and public anon key, but no `SUPABASE_ACCESS_TOKEN`. An anon key cannot deploy functions. Authenticate the Supabase CLI or add that separate personal access token privately before running setup.

`npm run interview:check` now exits with an error when the function is missing or unconfigured, even when the provider key itself is valid. A successful model metadata request alone does not establish that the application is ready.

`node scripts/test_interview_live.js` performs real analysis, tailoring, question generation, answer feedback and reporting against the deployed endpoint using fictional data. It makes five generation requests and incurs provider usage. `--local-provider` instead runs the exact gateway code locally against the provider; success in that mode does not mean the Supabase function has been deployed. Neither mode prints secrets or generated candidate content. The helper is a development tool and is not part of the browser build.

## Dark mode

InterviewReady follows the shared AI Tools theme toggle. Screen backgrounds, cards, headings, inputs, banners, progress, reports, skeletons and confirmation/privacy dialogs use the dark palette. The existing theme preference persists on refresh; candidate content remains in memory only.

Dark-mode Chrome verification passed the full controlled interview workflow, dark report/confirmation styling, mobile fit and theme persistence across refresh. See the latest verification above for provider and deployment status.

Dark button visibility correction: primary, teal, outline, ghost and destructive controls now have explicit dark surfaces; disabled controls remain readable rather than fading. Chrome measured a minimum text contrast of 5.17:1 among the checked rendered report buttons and passed hover, keyboard-focus, pressed-state and confirmation-dialog checks, alongside the full controlled interview workflow.

## InterviewSession invalid element after deployment

This React error means a rendered component resolves to `undefined`; it is not a database or AI-key error. The local screen exports match their imports and the complete workflow renders with the locked dependencies. The footer now uses `ShieldCheck` instead of the optional `Github` brand export. The workflow regression tests deliberately make `Github` unavailable to check this case. The exact component in the reported live bundle could not be inspected because the supplied URL returned HTTP 404 from the verification environment.

Deploy `package.json` and `package-lock.json` together with the full source, then run `npm ci` and `npm run build` in the frontend folder. Serve the complete generated `build` folder, including its matching JavaScript chunks. If PM2 runs the React development server instead, restart that existing frontend process after installing the locked dependencies. Do not mix files from different builds or update only one JavaScript bundle. Hard-refresh the browser after deployment. No SQL migration or AI-secret change is required for this rendering correction.
