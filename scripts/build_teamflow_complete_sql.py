"""Build one PRIVATE schema + data SQL for the verified existing-server mapping."""
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ['20261111_teamflow_integration.sql', '20261112_candidate_portal_route.sql',
              '20261112_candidate_profile_attendance.sql', '20261113_teamflow_weekly_collaboration.sql']

def main():
    subprocess.run([sys.executable, str(ROOT / 'scripts/generate_teamflow_data_sql.py'),
                    '--preserve-server-candidates'], cwd=ROOT, check=True, capture_output=True)
    header = '''-- PRIVATE TEAMFLOW COMPLETE INSTALL: schema, permissions and original source data.
-- Select the existing E2E database in phpMyAdmin and import this WHOLE file.
-- Back up first. Existing E2E base tables and backend code are prerequisites.
-- Replaces the need to run four separate TeamFlow migrations and the data SQL manually.
-- No table/data reset. Existing accounts/profiles remain intact.
-- Uses the verified server mapping: source 19 -> user 53/profile 5; source 54 -> user 52/profile 4.
-- New users retain original passwords; reused Admin/HR users retain current credentials/roles.
-- Schema statements commit independently; original data import is transactional.
-- Existing TeamFlow work data blocks a first import rather than being overwritten.
-- Attachment binaries are separate; their references are marked Awaiting upload.
SET NAMES utf8mb4;

'''
    parts = [header]
    for filename in MIGRATIONS:
        parts += [f'\n-- SCHEMA/PERMISSIONS: {filename}\n',
                  (ROOT / 'migrations' / filename).read_text(encoding='utf-8'), '\n']
    parts += ['\n-- ORIGINAL DATA: retain existing server profiles and remap new user IDs.\n',
              (ROOT / '.server-audit/20261113_teamflow_data_preserve_existing.sql').read_text(encoding='utf-8')]
    output = ROOT / '.server-audit/TEAMFLOW_COMPLETE_INTEGRATION.sql'
    output.write_text(''.join(parts), encoding='utf-8')
    print(json.dumps({'success':True, 'private_file':str(output), 'schema_migrations':4,
                      'new_accounts':72, 'existing_accounts_reused':2}))

if __name__ == '__main__':
    main()
