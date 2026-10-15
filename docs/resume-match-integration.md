# Resume Match in E2E Tracking

## Open the feature

Open Recruiting and choose **Resume Match**, or visit /dashboard/recruiting/resume-match. It inherits the Recruiting resource's view permission and the existing E2E login. A custom recruiting resource route also gets the same resume-match subpage.

## Included features

- Paste a job description or upload PDF, DOCX, or TXT.
- Upload and remove multiple resumes (up to 50, 10 MB per file).
- Search the supplied, explicitly labelled demo profiles by keyword and US state.
- Rank candidates with the original skill catalogue, aliases, category weights, explanations, matched/missing skills, and category breakdown.
- Expand candidate details and extracted resume text.
- Per-user comparison history with a reusable job description.
- Responsive light/dark presentation and background-worker scoring.

Files are parsed in the browser. Resume documents and extracted candidate text are not sent to PHP. History stores the first 5,000 job-description characters, selected source/state, candidate count, and top score. History ownership is taken from the authenticated user; a submitted user ID cannot change it.

Uploads and local demo search require no Supabase configuration. The TechFetch tab now calls the original Supabase techfetch-search function using the original email/password/keywords/state contract. Its techfetch-demo fallback is labelled explicitly. Real TechFetch access is not verified by this integration.

## Build and deployment

1. Run npm ci in the frontend and npm run build.
2. Deploy the complete build/ output. The prebuild hook copies the matching PDF worker to /resume-match/pdf.worker.min.mjs; serve .mjs as JavaScript and do not route that file to the SPA HTML fallback.
3. Deploy backend modules/resume_match/model.php, modules/resume_match/routes.php, and the updated backend index.php routing block.
4. Run migrations/20261013_resume_match.sql once on the existing E2E MySQL database. It creates only resume_match_history; it does not change users, employees, candidates, or jobs.
5. Keep REACT_APP_API_BASE_URL pointing at your E2E PHP server. For a live build, configure the live HTTPS API URL before running npm run build; keep localhost for local development.

The local migration has been applied. Live hosting needs the same migration and PHP module files. No additional backend dependencies or configuration secrets are needed.

## Verification commands

    npm test -- --watchAll=false --runInBand --runTestsByPath src/features/resumeMatch/multiResumeAnalyzer.test.js src/features/resumeMatch/fileParser.test.js src/pages/Dashboard/ResumeMatch.test.js
    npm run build

Backend verification:

    C:\xampp\php\php.exe C:\xampp\htdocs\E2E_Tracking\tests\resume_match_test.php

This covers scoring aliases and boundaries, rank order, parsing validation, demo/upload handling, stale-result clearing, history reuse, history ownership, request validation, and insert parameter counts. Backend HTTP verification also exercises JWT protection and saving/reading through Apache, cleaning up its temporary row.

Scanned image-only PDFs require OCR before upload, and legacy DOC files must be converted to DOCX or PDF. The score is a weighted keyword match, not an AI hiring decision.

## Source

The skill catalogue, scoring engine, and demonstration profiles were imported from the supplied Resume_Match_1-main project. The integrated runtime is independent of that folder. Uploads and local demos do not require Supabase; the optional TechFetch Edge Function search does.


## Verification status and existing test debt

The focused Resume Match checks and browser checks pass, including actual PDF/DOCX parsing and background-worker scoring. The Apache endpoint check passes authentication, saving/reading, validation, and rejection of a forged history owner.

The existing repository-wide suite is not fully green: App.test.js has a React Router/Jest resolution problem, and an existing employee-profile test still expects Date of Joining to be readonly although the unchanged implementation allows editing. Slow five-second tests passed on retry with a larger timeout. The employee and attendance implementations were not changed by this integration. Existing unrelated lint warnings remain in the production build.

Build tools were tested with Node 20.20.2. Parser versions are pinned and the lockfile is included.

Final focused verification: 11 tests passed, including preservation of rankings and release of controls after a history-save failure. History API requests have a 15-second timeout. Browser checks passed for the recruiting button/subpage, actual PDF/DOCX parsing, scoring workers, candidate details, labelled demos, history, mobile sizing, and dark theme.


Frontend technology: the interface uses the existing React application and JavaScript. The pdfjs-dist and mammoth dependencies only read PDF and DOCX files; they do not introduce another UI framework. Keep package.json and package-lock.json together for reproducible installs. scripts/sync_resume_match_worker.js runs automatically before start/build to supply the local PDF worker. scripts/verify_resume_match_browser.js is an optional local Chrome verification helper and is not needed on the deployment server. The PDF library worker uses its published .mjs format and must remain unchanged.


## Recruiting Candidate Feedback deployment

Candidate Feedback is an optional field immediately after Feedback in the Recruiting add/edit form, detail view and Excel download. Before deploying the updated applications backend, run migrations/20261014_recruiting_candidate_feedback.sql in the live E2E database. Then deploy modules/application/model.php and modules/application/controller.php together and rebuild/deploy the complete React build. Existing applications have an empty candidate feedback value; omitted fields are preserved during updates from other forms.


## TechFetch website search

Search TechFetch opens https://www.techfetch.com/ in a separate tab from either candidate source. Users sign in on TechFetch itself, search there and upload downloaded resumes into Resume Match. The external website link does not collect TechFetch passwords or import website results. The separate TechFetch search tab submits credentials to your configured Supabase function. Sample search stays explicitly labelled as demonstration data.


## GitHub Supabase search integration (2026-10-15)

Reference: https://github.com/beedatatech2024/Resume_Match_1 at commit 884bc3412c84e41a7f557ff9865e87b940f86bb8.

The frontend is React with .js components; no Vite, TypeScript frontend, new UI framework or Supabase client SDK is required. Existing E2E authentication and per-user PHP history remain in place. The scoring catalogue, aliases, weights, previews and upload pipeline remain available alongside the TechFetch search tab.

1. Copy the two settings in .env.resume-match.example into the existing frontend .env. Use your project HTTPS URL and public anon key only. REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are supported aliases.
2. Deploy supabase/functions/techfetch-search from the reference repository to that same Supabase project. Run the Supabase CLI from that repository: supabase functions deploy techfetch-search --project-ref YOUR_PROJECT_REF. The reference config uses verify_jwt=true. Do not turn authentication off to troubleshoot a bad key; use a compatible public anon JWT and check the deployment.
3. Restart npm start, or run npm ci then npm run build. The existing prestart/prebuild hook publishes only the two public settings to public/resume-match/config.json. They are public browser configuration, not server secrets. Never use a service-role key or sb_secret_ key. Do not put TechFetch credentials in .env.
4. Deploy the complete build, including resume-match/config.json and the PDF worker. Ensure the JSON path is served as JSON rather than the SPA HTML fallback. Both settings are fixed at build/start time; editing .env on a static hosting server will not update an already built frontend.
5. Deploy the updated PHP modules/resume_match/model.php and modules/resume_match/routes.php to support history sources techfetch and techfetch-demo. The existing history source VARCHAR(16) accommodates both; no additional database migration is needed for these source names.
6. In Recruiting > Resume Match > TechFetch, enter email, password, keywords and state. Search sends credentials only in the HTTPS POST body to your configured Supabase function. The integrated frontend does not store them in cookies/localStorage/history, and clears the password after each attempt. Your deployed function is responsible for its own credential handling and logging.

Important limitation: the reference function sends the supplied password as a Bearer token to https://www.techfetch.com/api/resume/search and falls back to hardcoded sample candidates if that attempt fails. Setting Supabase URL/anon key enables the function call, not a verified TechFetch website login. E2E labels source=techfetch-demo as demonstration data and never treats an unlabelled response as live data. Replace the provider implementation with TechFetch's documented integration when available. Do not use an account password as an API token unless TechFetch explicitly specifies this method.

The original function is a Supabase backend deployment (Deno), separate from React hosting and the existing PHP server. Its TypeScript source is not part of the React frontend. Supabase login/signup from the standalone sample is intentionally replaced by the existing E2E session; search history remains scoped to that E2E user. Supabase search_history tables/policies are not used by this integration.


## Compact search workspace

TechFetch Search is the default tab, followed by Resume Search (uploaded resumes), then Demo Search. Desktop screens use a viewport-height workspace with the job description, source controls and results side by side; long panels scroll independently. Smaller screens use a stacked layout to keep fields readable. Transitions respect reduced-motion preferences.


## Demo Search removal

The standalone Demo Search tab and local sample-search logic have been removed. The page now offers TechFetch Search (default) and Resume Search only. Existing history labels are retained. A techfetch-demo response from the external Supabase function is still explicitly labelled as fallback data, since that function is deployed separately and its output must not be represented as live results.
