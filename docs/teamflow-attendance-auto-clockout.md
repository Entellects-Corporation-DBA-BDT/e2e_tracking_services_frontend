# Candidate attendance: nine-hour shift limit

TeamFlow candidate work sessions automatically close after **nine elapsed hours**. The server records the exact cutoff using UTC, including overnight shifts and daylight saving changes. Existing employee attendance rules are unchanged.

A missed clock-out no longer remains working across subsequent days. The next visit shows Clock In again. Saved work progress and blockers are preserved; automatic logout does not claim that unfinished work was completed. Closed sessions feed draft weekly timesheets using their actual recorded duration.

Administrators with **TeamFlow Attendance edit permission and ALL scope** can select **Correct attendance** from the attendance list or a candidate's attendance history under View work. Enter the actual login/logout times in US Eastern Time and a correction reason. Sessions cannot exceed nine hours or end in the future. Corrections update draft hours and retain the audit trail. Submitted linked timesheets must first be rejected through the existing review workflow. Approved timesheets remain locked. Recorded profile sessions cannot be edited or archived through the generic record form.

## Backend deployment

The local PHP backend includes `modules/teamflow/shift_policy.php`, the updated attendance/model/routes files, and `scripts/close_teamflow_shifts.php`. No additional database migration is needed when the existing TeamFlow weekly collaboration schema is installed.

Deploy the contents of `.server-audit/teamflow-attendance-backend.zip` into the PHP API directory, preserving the directory structure. Deploy the rebuilt frontend with it.

Configure the hosting scheduler to run the CLI task **every minute**, with the same database environment as the API. Substitute the real absolute PHP and API paths:

```cron
* * * * * /usr/bin/php /absolute/path/to/api/scripts/close_teamflow_shifts.php >> /private/logs/teamflow-shifts.log 2>&1
```

For a manual check:

```sh
php scripts/close_teamflow_shifts.php
```

The command outputs a count of sessions closed. It is safe to repeat. API requests also reconcile overdue shifts, so the exact nine-hour cutoff is retained if the scheduler runs late. The scheduler is required to persist automatic logouts while nobody is using the application. This repository change does not configure the remote hosting scheduler.

The live timer is capped at nine hours and refreshes attendance at the cutoff, on focus, and on visibility changes. Automatic closure applies to live profile clock sessions; incomplete legacy source records are retained for review rather than being assigned invented hours.
