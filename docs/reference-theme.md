# Reference theme

The shared theme is loaded last from src/index.js through src/styles/referenceTheme.css. It uses the supplied dashboard reference: navy navigation, a blue/violet active selection, pale blue backgrounds, white rounded information cards and pastel profile heroes. Light and dark appearance modes remain supported.

It covers dashboard resource pages, profile/record views, attendance/configuration panels, tables, filters, form inputs, onboarding, registration, About, Contact and public data forms. Existing route, permission, API, document locking, employee ID and attendance/IP logic is unchanged. The employee profile also fixes a malformed separator character.

Deploy the updated frontend production build. This theme requires no PHP or database changes. Local browser screenshots and fixture audit output are stored under .server-audit/reference-theme; fixture data never writes to the employee API. They are development artifacts and are not required for deployment.

Validation includes 38 focused frontend regression tests, CSS parsing, production build, and browser checks at 1440px and 390px. Existing unrelated lint/bundle warnings remain.
## Profile categories
All dashboard pages, including the profile, use the same navy grouped sidebar, logo, resource search and expandable resource groups. Its icon tabs select a single category panel: Overview, Personal, Family & References, Banking, Employment, Time Tracking, Leave, Training, Documents, or Activity. Narrow screens retain stacked cards, a horizontally scrollable tab strip, and bottom navigation. Keyboard arrows, Home and End select profile tabs.

Personal shows only personal information. Education and certifications have their own inline editors inside Training. Completion links open the relevant category. Document locks, edit permissions, employee ID allocation and attendance IP restrictions remain unchanged.

Projects and project metrics have been removed. Performance opens the existing recruiter or bench-sales performance route according to the employee role and current viewer permissions. Other roles show the action as unavailable. Overview uses actual profile completion, uploaded document count, hours and days present; attendance percentages require a recorded working-day denominator.

Deploy the frontend production build. These changes require no PHP or database migration. Browser fixtures and audit scripts are local development artifacts only.

Profile Leave Management now lives in the Leave tab. The profile Attendance Insights report hides leave controls; the main Attendance Management page keeps them. Leave submission and review retain the existing permission checks and APIs.

Profile photos: employees can add or replace their portrait from the profile cover. Authorized employee editors can change other employee portraits. JPEG, PNG and WebP files are limited to 2 MB, 6000 pixels per dimension and 16 megapixels. Files use the existing encrypted employee storage and authenticated GET/POST employees/{id}/photo routes. General employee edits preserve the current portrait. Deploy modules/employee/EmployeePhotoService.php, routes.php and model.php with the frontend build; no database migration is required. The existing private employee document directory and encryption key must remain configured.

Inline profile editors initialize from the already loaded complete employee record, avoiding a redundant blocking API request. Other employee-detail reads have a 15-second timeout. The profile navbar no longer reserves its hidden section-navigation row. Photo integration fixtures and scripts/test_employee_photo.py are development checks, not deployment dependencies.

Profile refinement: portrait editing uses a centered portal dialog above the page, with keyboard focus and Escape dismissal. Its button sits below the avatar. Profile categories use a compact single row, with horizontal scrolling when needed to keep labels complete; Performance is the final navigation action. Document file pickers share styled upload cards while existing limits and locking remain intact. These presentation changes require only the frontend build.
