# Import the TeamFlow records on the server

**SQL migrations create tables and permissions; they do not contain the original user/work rows.** Deploying only those files leaves the new TeamFlow tables empty. A separate, one-time data import is required on each destination database.

Do not import the original TeamFlow SQL directly into the E2E database. Its user IDs conflict with E2E IDs. The importer creates Candidate accounts, preserves original usernames/password hashes, and remaps user references across projects, issues, timesheets, daily work, reports and memberships.

## Single SQL alternative (phpMyAdmin)

### Server with 92 existing profiles (verified mapping)

Use `.server-audit/20261113_teamflow_data_preserve_existing.sql` for the server whose diagnostic shows original user 19 linked to E2E user 53/profile 5, and original user 54 linked to E2E user 52/profile 4. This file checks those exact links before importing. It preserves all existing profiles and credentials/roles, creates the 72 missing Candidate accounts, and imports the original work tables using the correct owner IDs. The existing Admin and HR accounts keep their current credentials and privileges; their original TeamFlow passwords are not substituted.

New profiles use the source key `teamflow_original_20261113`, avoiding collisions with the existing profiles' old source IDs. The import ledger retains the complete original-user-to-destination-user/profile mapping, including the two reused accounts. With the reported baseline of 92 profiles, the resulting profile count is 164. Work tables must still be empty; this file does not merge existing projects, timesheets or reports. Back up, select the same E2E database and import the complete file through phpMyAdmin. Do not execute individual chunk procedures. Attachment references remain Awaiting upload. Use this file instead of the original empty-destination data SQL.

The corrected generator allocates new account IDs above both `MAX(users.id)` and `MAX(teamflow_candidates.user_id)`. This avoids assigning an ID already referenced by a pre-existing candidate profile whose user account is missing. It preserves those existing profiles for separate review. Candidate ID lookups use their linked user ID, so splitting the SQL into stored-procedure chunks cannot change the owner mapping through `LAST_INSERT_ID()` restoration.

The private file `.server-audit/20261113_teamflow_all_data.sql` contains the original data, not just schema. After applying the four migrations, select the server's E2E database in phpMyAdmin and import this single file. Back up first. The database account needs CREATE ROUTINE/EXECUTE permissions for the temporary import procedures. The import uses a transaction, creates new destination user IDs, updates related references and refuses conflicting accounts or nonempty TeamFlow tables. A repeat import of the same source skips duplicate insertion.

This file contains original password hashes and personal/business data. Keep it private and outside the web root. It inserts document references as **Awaiting upload**; PDF/image binaries cannot be restored by this data-only SQL. Upload replacement attachments through the application afterward, or choose the PHP importer below instead if you want it to copy available attachments during the initial import. Do not run both methods expecting the second to add attachments: the source import ledger prevents a second import.

The SQL method imports the original dataset; it does not copy subsequent changes made in the local E2E application. Historical timesheets are visible under their original week/date filters.

## Private package

The prepared local package is `.server-audit/teamflow-server-import.zip`. It contains the data manifest, original available uploads, PHP importer, TeamFlow/chat backend files and four migrations. It contains private account hashes and business documents: transfer it by SFTP into a **private directory outside the website root**, for example `/root/teamflow-import/`. Never upload it into a publicly served folder or commit it to Git.

The package does not contain database connection secrets. PHP continues using the server's existing `config/db.php`.

## Server steps

1. Back up the server database and private attachment storage.
2. Extract the ZIP in `/root/teamflow-import/`. Copy its `backend/modules/teamflow/`, `backend/modules/chat/`, `backend/scripts/import_teamflow.php` and `backend/migrations/` files into the corresponding folders of the **existing PHP API**. Preserve the existing backend configuration. The PHP API directory is separate from the React frontend directory.
3. Apply these migrations to that API's database in order using phpMyAdmin or your normal migration process:
   - `20261111_teamflow_integration.sql`
   - `20261112_candidate_portal_route.sql`
   - `20261112_candidate_profile_attendance.sql`
   - `20261113_teamflow_weekly_collaboration.sql`
4. In the existing PHP API directory, preview the import (no row changes):

   ```bash
   php scripts/import_teamflow.php --manifest=/root/teamflow-import/private/teamflow-import.json --uploads=/root/teamflow-import/private/original-server
   ```

5. If the preview succeeds, import the records:

   ```bash
   php scripts/import_teamflow.php --manifest=/root/teamflow-import/private/teamflow-import.json --uploads=/root/teamflow-import/private/original-server --apply
   ```

   Both commands must use the same `TEAMFLOW_FILE_DIR` configuration as the PHP web process. Ensure PHP can write/read this private destination. The importer copies original uploads into private storage; missing source documents stay marked **Awaiting upload** for later replacement.
6. Deploy the latest React build and the initial TeamFlow backend registration/auth changes described in `docs/teamflow-integration.md` if not already deployed. Sign out/in. An administrator should see 74 candidate accounts, 46 projects, 220 issues, 145 weekly timesheets, 895 daily work records and 434 reports from the original dataset. Candidates see only their own permitted records. Change week/date filters to the historical dates to see imported timesheets and work sessions.

## If the import stops

- **Already imported:** rerunning the same completed source returns `already_imported`; it does not duplicate or overwrite records.
- **Account conflict:** an existing destination account matches a source email/username. The importer stops to protect its role and password. Resolve the account mapping before importing; do not delete live accounts to bypass the check.
- **Destination not empty:** existing TeamFlow rows need review before a first import. The importer deliberately refuses to overwrite them.
- **SQL #1644 / destination not empty:** run `.server-audit/teamflow_import_diagnostic.sql` in the same server database and share its count/status result tables. It reads only row counts, import dates and mapping counts. Do not truncate tables or delete the import ledger to bypass the error. Matching counts alone do not prove records are identical; an existing or partial import needs comparison before any repair.
- **Tables missing:** apply the migrations to the database used by the PHP API, not another database.
- **Rows exist but page is empty:** check the current week/status filters, the role's resource permissions, and whether the frontend is calling the intended PHP API/database.

The import uses a transaction and verifies account preservation and row counts before commit. A failed import rolls back inserted data. The local import does not populate your live server automatically.

## Regenerate the private package locally

```powershell
python scripts/package_teamflow_import.py --backend C:/xampp/htdocs/E2E_Tracking --manifest .server-audit/teamflow-import.json --uploads C:/Users/ADMIN/Desktop/TeamFlowManager/server
```

This packaging command reads files only; it does not modify either database. Keep the resulting ZIP private.
