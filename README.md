# E2E Tracking Services Frontend

E2E Tracking Services is a React single-page application for managing recruiting and workforce operations. It provides public company pages, authenticated dashboards, role/resource-based navigation, reporting, and workflows for candidates, jobs, submissions, vendors, clients, training, onboarding, and employee status.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Application configuration](#application-configuration)
- [How the application works](#how-the-application-works)
- [Routes](#routes)
- [Project structure](#project-structure)
- [Available commands](#available-commands)
- [Testing](#testing)
- [Production build and deployment](#production-build-and-deployment)
- [Branding, SEO, and link previews](#branding-seo-and-link-previews)
- [Security and operations](#security-and-operations)
- [Troubleshooting](#troubleshooting)
- [Maintenance checklist](#maintenance-checklist)

## Features

- Public home, about, contact, and registration pages
- JWT-based authentication and protected dashboard routes
- Resource-based sidebar visibility and route authorization
- Dashboard summary cards, charts, filters, and recent activities
- Recruiting and bench-sales workflows
- Candidate and job management
- Prime-vendor and client management
- Hot-list and training management
- Candidate onboarding and employee-status reporting
- Responsive dashboard and modal/form layouts
- Application favicon, installable-app manifest, search metadata, and social-sharing metadata

## Technology

| Area | Technology |
| --- | --- |
| UI | React 19 |
| Build tooling | Create React App / `react-scripts` 5 |
| Routing | React Router 7 |
| HTTP | Axios |
| Authentication storage | `js-cookie` and browser `localStorage` |
| JWT parsing | `jwt-decode` |
| Charts | Recharts |
| Icons | React Icons |
| Testing | Jest and React Testing Library |
| Performance reporting | Web Vitals |

## Requirements

Install the following before running the project:

- Node.js 20 LTS or another version compatible with `react-scripts` 5
- npm (included with Node.js)
- The E2E Tracking backend API
- A modern browser

The frontend expects the backend to support authentication, resource permissions, dashboard data, and the feature APIs used under `src/api/`.

## Local setup

1. Clone the repository and enter its directory.

   ```bash
   git clone <repository-url>
   cd e2e_tracking_services_frontend
   ```

2. Install the locked dependency versions.

   ```bash
   npm ci
   ```

   Use `npm install` only when intentionally updating dependencies or when no lockfile is available.

3. Configure and start the backend API.

4. Confirm the development API URL in `src/Config/env.js`.

5. Start the frontend.

   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Application configuration

### API base URL

The shared Axios client is defined in `src/api/axiosInstance.js`. It imports `baseUrl` from `src/Config/env.js` and automatically attaches a bearer token to protected API requests.

Current configuration:

```js
const ENV = {
  development: {
    baseUrl: "http://localhost/api",
  },
  production: {
    baseUrl: "http://localhost/api",
  },
};

const currentEnv = process.env.REACT_APP_ENV || "development";
```

Select an environment when starting or building the application:

```bash
# macOS/Linux
REACT_APP_ENV=production npm run build
```

```powershell
# PowerShell
$env:REACT_APP_ENV = "production"
npm run build
```

Important configuration notes:

- Change the `production.baseUrl` value to the real HTTPS backend URL before deployment.
- `src/Config/constants.js` contains a separate URL but is not used by the shared Axios client at present.
- `baseUrlImg` in `src/Config/env.js` is also hard-coded. Update it if backend-hosted images are used in production.
- Create React App embeds `REACT_APP_*` values at build time. Rebuild after changing them.
- Never place secrets, private API keys, database credentials, or signing keys in frontend configuration; browser bundles are public.

### Backend expectations

The frontend expects JSON responses from the configured `/api` base URL. Key API areas include:

- Authentication and current-user resources
- Applications and dashboard analytics
- Candidates
- Jobs
- Prime vendors

Other dashboard pages may call their APIs directly from their page or form modules. Keep backend CORS settings aligned with the frontend origin in local and production environments.

## How the application works

### Startup and routing

`src/index.js` mounts the application into `#root`. `src/App.js` creates the browser router and separates public pages from the protected `/dashboard/*` area.

Because the app uses `BrowserRouter`, the web server must return `index.html` for unknown frontend paths. This makes direct visits and refreshes work on routes such as `/dashboard/candidates` and `/dashboard/jobs`.

### Authentication flow

1. The login form calls `loginUser` in `src/api/authApi.js`.
2. A successful response stores the JWT in the `jwtToken` cookie for 30 days.
3. Basic user information is stored in `localStorage` under `userData`.
4. The frontend requests `/resource/my` to obtain the user's permitted resources and first available route.
5. The Axios request interceptor adds `Authorization: Bearer <token>` to protected requests.
6. `src/components/Secure.js` checks for an existing, unexpired token and validates access to the current route.
7. Missing, expired, invalid, or unauthorized sessions are redirected to `/`.

### Permissions and navigation

The backend-provided resource list controls dashboard access:

- Only resources with `can_view === 1` appear in the sidebar.
- `src/pages/Dashboard/SidebarConfig.js` maps backend `resource_name` values to icons and routes.
- `Secure.js` verifies that the current path matches an allowed resource.
- `/dashboard` remains available to an authenticated user.

When adding a protected module, update all of the following as needed:

1. The backend resource and permission response
2. `src/pages/Dashboard/SidebarConfig.js`
3. The nested route in `src/pages/Dashboard/index.js`
4. The page component, API module, forms, and styles

### Data access

Feature API functions live under `src/api/` and use the shared Axios instance. Pages and forms call those functions, manage loading/error state, and refresh lists following successful create, update, or delete operations.

## Routes

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Home page and login entry point |
| `/about` | Product/company information |
| `/contact` | Contact information |
| `/register` | Registration |

### Protected routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Summary, analytics, and recent activity |
| `/dashboard/recruiting` | Recruiting workflow |
| `/dashboard/bench-sales` | Bench-sales workflow |
| `/dashboard/hotlist` | Hot-list management |
| `/dashboard/jobs` | Job management |
| `/dashboard/jobview/:jobId` | Job details and related workflow |
| `/dashboard/vendors` | Prime-vendor management |
| `/dashboard/clients` | Client management |
| `/dashboard/candidates` | Candidate management |
| `/dashboard/training` | Training management |
| `/dashboard/candidate-onboarding` | Candidate onboarding |
| `/dashboard/employee-status` | Employee-status reporting |

Access to protected feature routes depends on the resource permissions returned by the backend.

## Project structure

```text
public/
  index.html             HTML shell, favicon, SEO, and social metadata
  logo.png               Main favicon and social-sharing logo
  manifest.json          Installable web-app metadata
  robots.txt             Search-crawler policy
src/
  api/                   Shared Axios client and feature API functions
  components/            Reusable components and route security
  Config/                Environment and URL configuration
  forms/                 Create, edit, view, and confirmation forms
  pages/                 Public pages and dashboard modules
  styles/                Global, page, and dashboard CSS
  utils/                 JWT/user and permission helpers
  App.js                  Top-level routes
  index.js                React entry point
```

Keep new feature code in the matching layer. API communication belongs in `src/api`, route-level UI belongs in `src/pages`, reusable UI belongs in `src/components`, and form workflows belong in `src/forms`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server on port 3000 |
| `npm test` | Run Jest in interactive watch mode |
| `npm run build` | Create an optimized production build in `build/` |
| `npm run eject` | Eject Create React App configuration; irreversible and normally unnecessary |

## Testing

Run the test suite interactively:

```bash
npm test
```

Run it once, as expected in CI:

```bash
npm test -- --watchAll=false
```

Before merging a change, verify at minimum:

- Authentication success and failure behavior
- Permission-based navigation and protected-route redirects
- List loading, search, filtering, and pagination
- Create, view, update, and delete flows affected by the change
- Error, empty, and loading states
- Responsive behavior on desktop and mobile widths
- Direct refresh of every changed route

Add focused tests near the affected code. API modules should verify endpoint, payload, parameters, and multipart headers where applicable. UI tests should prefer user-visible behavior over implementation details.

## Production build and deployment

1. Configure the production API URL in `src/Config/env.js`.
2. Build with the production environment selected.

   ```powershell
   $env:REACT_APP_ENV = "production"
   npm run build
   ```

3. Deploy the generated `build/` directory to a static host or web server.
4. Configure HTTPS.
5. Configure an SPA fallback so all non-file requests return `index.html`.
6. Confirm the backend allows the deployed frontend origin through CORS.
7. Verify `/logo.png` and `/manifest.json` are publicly accessible.
8. Smoke-test public routes, login, every permitted dashboard route, logout, and direct route refreshes.

Example Nginx fallback:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Do not cache `index.html` for long periods. Hashed JavaScript and CSS assets can use long-lived immutable caching, while `index.html` should update quickly after a release.

## Branding, SEO, and link previews

Brand and metadata settings are maintained in `public/index.html` and `public/manifest.json`.

- Browser favicon: `%PUBLIC_URL%/logo.png`
- Apple touch icon: `%PUBLIC_URL%/logo.png`
- Search description, keywords, and crawler instructions
- Open Graph metadata for services such as WhatsApp and Facebook
- Twitter/X summary-card metadata
- Existing document title: `E2E Tracking`

Social-preview requirements:

- The deployed logo URL must be public and accessible without authentication.
- Social crawlers cache previews, so changes may not appear immediately.
- For the most reliable social previews, production Open Graph image values should resolve to an absolute HTTPS URL.
- If the application is hosted below a subpath, set Create React App's public URL/homepage configuration appropriately before building.

Do not add page-level favicon overrides. A single declaration in `public/index.html` keeps the icon consistent across client-side routes.

## Security and operations

- Serve the frontend and backend over HTTPS in production.
- Keep JWT expiry and authorization enforced by the backend; frontend route checks are a usability layer, not a security boundary.
- Prefer secure, same-site, HTTP-only authentication cookies when backend architecture permits. The current cookie is created from browser JavaScript and therefore cannot be HTTP-only.
- Avoid logging tokens, personal data, candidate documents, or API responses containing sensitive information.
- Validate file type and size on both frontend and backend for document uploads.
- Restrict CORS to trusted origins in production.
- Review dependency updates and security advisories regularly.
- Keep development, staging, and production API endpoints separate.
- Monitor frontend errors and failed API requests in production.
- Backward-incompatible backend response changes must be coordinated with frontend releases.

## Troubleshooting

### API requests fail or use the wrong server

- Check `src/Config/env.js`.
- Confirm `REACT_APP_ENV` was set before starting or building.
- Restart the development server after configuration changes.
- Rebuild and redeploy after production configuration changes.
- Confirm backend availability, path prefix, HTTPS, and CORS settings.

### Login succeeds but the dashboard redirects home

- Confirm the response contains a valid, unexpired JWT.
- Check that the `jwtToken` cookie exists.
- Confirm `/resource/my` succeeds with the bearer token.
- Verify the backend resource route matches `SidebarConfig.js` and has `can_view: 1`.

### A sidebar item does not appear

- Confirm the backend returns its resource.
- Confirm `can_view` is numeric `1`.
- Confirm `resource_name` exactly matches a key in `SidebarConfig.js`.
- Confirm the dashboard route exists.

### Refreshing a nested route returns 404

Configure the deployment server to fall back to `index.html`. This is required by `BrowserRouter` and cannot be fixed by adding duplicate HTML files for individual routes.

### Favicon or social preview is outdated

- Hard-refresh the browser and clear site data when testing favicon changes.
- Confirm the deployed `/logo.png` returns an image with HTTP 200.
- Check the generated `build/index.html` metadata.
- Allow for WhatsApp, Facebook, and other social-preview caches to expire or use their official preview/debugging tools.

### Production build fails

- Use a supported Node.js version.
- Delete and reinstall dependencies only when necessary, preferably with `npm ci`.
- Review the first compilation error rather than later cascading errors.
- Run tests separately to distinguish test failures from bundle failures.

## Maintenance checklist

For each change:

1. Keep the change scoped and avoid unrelated formatting rewrites.
2. Reuse the shared Axios instance and existing permission flow.
3. Add loading, empty, success, and error handling where relevant.
4. Preserve responsive behavior and accessibility labels.
5. Add or update focused tests.
6. Run `npm test -- --watchAll=false`.
7. Run `npm run build`.
8. Test direct refreshes for affected routes.
9. Update this README when routes, configuration, dependencies, deployment requirements, or operational behavior change.
10. Review the final diff for secrets, local-only URLs, debug logging, and accidental generated files.

For releases, record the deployed frontend version, compatible backend version, configuration changes, database/API migrations, verification results, and rollback plan in the team's release process.
