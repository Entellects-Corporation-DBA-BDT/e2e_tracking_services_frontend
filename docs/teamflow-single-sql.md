# One-file TeamFlow installation for the verified server

Use `.server-audit/TEAMFLOW_COMPLETE_INTEGRATION.sql` instead of manually running the four schema migrations and a separate data import. It combines their current contents in the required order.

1. Back up the server E2E database.
2. Select that database in phpMyAdmin, choose **Import**, select the complete file and run it. The database account needs permission to create/execute temporary procedures.
3. Check the final import result. For the reported baseline, 92 existing candidate profiles remain and 72 new Candidate profiles are added, giving 164. Original work data includes 46 projects, 220 issues, 145 weekly timesheets, 895 daily work records and 434 reports.
4. Deploy the matching PHP backend and React build as described in the TeamFlow integration guide. SQL alone does not deploy application code. View historical records using their original week/date filters.

This file is tailored to the supplied diagnostic: source user 19 already belongs to E2E user 53/profile 5, and source user 54 belongs to E2E user 52/profile 4. Those accounts keep their existing passwords, roles and profile data. New profiles use a separate source namespace; all imported owner links use the new destination IDs. Existing candidate references reserve user IDs even if a linked login is missing.

There is no need to undo earlier schema migrations before using this file. Existing schema additions are checked/reapplied; explicit permission rows are retained. Original work tables must be empty for a first import. Repeating the same completed source import skips data insertion. An interrupted schema installation may leave additive schema changes; original data is committed only after the data transaction succeeds.

The SQL includes private account hashes and business information; keep it out of Git and public website folders. Document/photo binaries are separate. SQL retains their references as Awaiting upload.

Regenerate locally with `python scripts/build_teamflow_complete_sql.py`. Keep the individual source migrations for maintenance and existing deployment history; using this combined file does not require deleting them.
