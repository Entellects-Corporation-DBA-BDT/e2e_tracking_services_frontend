# Standalone AI tools

These public frontend routes open without the dashboard sidebar or dashboard navbar:

- `/ai-tools/resume-match`
- `/ai-tools/document-check`
- `/ai-tools/interview-ready`

On beedatatechnology.com, add links to these paths on the domain serving the E2E React frontend. For example, replace YOUR-E2E-FRONTEND-DOMAIN below with the actual frontend hostname:

```html
<a href="https://YOUR-E2E-FRONTEND-DOMAIN/ai-tools/resume-match" target="_blank" rel="noopener noreferrer">Resume Match</a>
<a href="https://YOUR-E2E-FRONTEND-DOMAIN/ai-tools/document-check" target="_blank" rel="noopener noreferrer">Document Check</a>
```

Visitors do not need an E2E account for local resume matching or local document checks. Saved matching history is shown only to an authenticated account with Recruiting view access; backend permissions still apply. The standalone pages do not expose employee data or matching history to guests. TechFetch search still uses the existing configured Supabase function and its credentials/access requirements; these new URLs do not enable live TechFetch API access or change demo-fallback labelling.

Build with `npm ci` followed by `npm run build`. Deploy the complete build including PDF/OCR assets and Resume Match public configuration. Configure the frontend web server to serve `index.html` for these two application routes so pasted links and refresh work. Continue serving actual JS, model and worker files as files. No backend route or database migration is required. Existing Recruiting buttons now open the standalone tools, and legacy dashboard tool routes redirect there after existing dashboard access checks.

InterviewReady AI setup, privacy and separate Supabase deployment: see [interview-ready-integration.md](interview-ready-integration.md). Its live AI actions require the ai-assist gateway and server-side provider key.
