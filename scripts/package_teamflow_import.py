"""Prepare a PRIVATE server import bundle. Does not connect to or modify a database."""
import argparse
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ['20261111_teamflow_integration.sql', '20261112_candidate_portal_route.sql',
              '20261112_candidate_profile_attendance.sql', '20261113_teamflow_weekly_collaboration.sql']

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', required=True, type=Path)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--uploads', type=Path, help='Original TeamFlow server folder containing uploads/')
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding='utf-8'))
    if data.get('format') != 'e2e-teamflow-v1' or not data.get('tables', {}).get('users'):
        raise SystemExit('A valid, nonempty TeamFlow import manifest is required.')
    files = [(args.manifest, 'private/teamflow-import.json'),
             (args.backend / 'scripts/import_teamflow.php', 'backend/scripts/import_teamflow.php'),
             (ROOT / 'docs/teamflow-server-data-import.md', 'README.md')]
    for folder in ['modules/teamflow', 'modules/chat']:
        files += [(p, 'backend/' + p.relative_to(args.backend).as_posix())
                  for p in (args.backend / folder).rglob('*.php')]
    files += [(ROOT / 'migrations' / name, 'backend/migrations/' + name) for name in MIGRATIONS]
    if args.uploads:
        upload_root = args.uploads / 'uploads'
        if not upload_root.is_dir():
            raise SystemExit('--uploads must be the original server folder containing uploads/.')
        files += [(p, 'private/original-server/' + p.relative_to(args.uploads).as_posix())
                  for p in upload_root.rglob('*') if p.is_file()]
    for path, _ in files:
        if not path.is_file():
            raise SystemExit('Required package source missing: ' + str(path))
    output = ROOT / '.server-audit/teamflow-server-import.zip'
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        for path, name in files:
            archive.write(path, name)
    print(json.dumps({'success': True, 'private_package': str(output),
                      'users': len(data['tables']['users']), 'files': len(files)}))

if __name__ == '__main__':
    main()
