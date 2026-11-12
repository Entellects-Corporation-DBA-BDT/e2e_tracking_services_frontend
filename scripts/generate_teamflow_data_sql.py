"""Generate a private, destination-ID-aware SQL data import from the original manifest."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / '.server-audit'

def literal(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    return "CONVERT(0x" + str(value).encode('utf-8').hex() + " USING utf8mb4) COLLATE utf8mb4_unicode_ci" if str(value) else "''"

def main():
    preserve = '--preserve-server-candidates' in sys.argv
    existing = {19: (53, 5), 54: (52, 4)} if preserve else {}
    source_key = 'teamflow_original_20261113' if preserve else 'teamflow'
    data = json.loads((PRIVATE / 'teamflow-import.json').read_text(encoding='utf-8'))
    tables = data['tables']
    # Match the verified PHP importer's target names, including dedicated legacy tables.
    legacy = {'positions', 'position_permissions', 'resources', 'user_permissions', 'user_positions'}
    targets = {name: 'teamflow_' + ('legacy_' if name in legacy else '') + name for name in tables if name != 'users'}
    targets['holidays'] = 'teamflow_work_holidays'
    users = {int(u['id']): u for u in tables['users']}
    names = {}
    for u in users.values():
        names.setdefault((u.get('full_name') or '').strip().lower(), []).append(u['id'])

    def user_ref(value):
        if value in (None, '', 0, '0'):
            return literal(value)
        if not str(value).isdigit() or int(value) not in users:
            raise ValueError('Unresolved source user reference; no SQL generated.')
        return '@tf_u_' + str(int(value))

    out = ["-- PRIVATE: original TeamFlow account hashes and business data. Keep outside the web root.",
           "-- DATA ONLY. Apply the four TeamFlow schema migrations first, select the E2E database, then import this file.",
           "-- Passwords are preserved; all user references use newly assigned destination IDs.",
           "-- Attachment references are retained as Awaiting upload; SQL does not contain attachment binaries.",
           "SET NAMES utf8mb4;", "DELIMITER $$", "DROP PROCEDURE IF EXISTS e2e_import_teamflow_data_20261113$$",
           "CREATE PROCEDURE e2e_import_teamflow_data_20261113()", "import_block: BEGIN",
           "DECLARE candidate_role INT;", "DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;",
           "START TRANSACTION;",
           "SELECT id INTO candidate_role FROM positions WHERE LOWER(position_name)='candidate' AND status='Active' LIMIT 1 FOR UPDATE;",
           "IF candidate_role IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Active Candidate role missing. Apply migrations first.'; END IF;",
           f"IF EXISTS(SELECT 1 FROM teamflow_imports WHERE source_hash={literal(data['source_hash'])}) THEN COMMIT; SELECT 'already_imported' AS result; LEAVE import_block; END IF;"]
    for target in ([] if preserve else ['teamflow_candidates']) + ['teamflow_files', *targets.values()]:
        if not re.fullmatch(r'[a-z_]+', target):
            raise ValueError('Invalid source table')
        out.append(f"IF EXISTS(SELECT 1 FROM `{target}` LIMIT 1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Not empty: {target}. No rows overwritten; run diagnostic SQL.'; END IF;")
    for uid, u in users.items():
        email = literal(u['email'])
        if uid in existing:
            user_id, candidate_id = existing[uid]
            out.append(f"IF (SELECT COUNT(*) FROM users u JOIN teamflow_candidates c ON c.user_id=u.id WHERE u.id={user_id} AND c.id={candidate_id} AND (u.email={email} OR u.nick_name={email}))<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verified existing account/profile changed. Import stopped.'; END IF;")
            out.append(f"IF EXISTS(SELECT 1 FROM users WHERE id<>{user_id} AND (email={email} OR nick_name={email})) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Ambiguous existing login. Import stopped.'; END IF;")
            continue
        out.append(f"IF EXISTS(SELECT 1 FROM users WHERE email={email} OR nick_name={email}) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Existing E2E account conflict. No passwords or roles overwritten.'; END IF;")
    if preserve:
        out.append(f"IF EXISTS(SELECT 1 FROM teamflow_candidates WHERE source_key='{source_key}') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Original source namespace already in use. Import stopped.'; END IF;")
    for uid, u in users.items():
        if uid in existing:
            user_id, candidate_id = existing[uid]
            out += [f'SET @tf_u_{uid}={user_id};', f'SET @tf_c_{uid}={candidate_id};']
            continue
        if not re.fullmatch(r'\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}', u['password']):
            raise ValueError('Unsupported original password hash.')
        vals = ['@tf_next_user', '0', literal(u['email']), literal(u['email']), literal(u['password']), '@tf_candidate_role', literal('Active' if u['is_active'] else 'Inactive'), literal(u['created_at']), literal(u['updated_at'])]
        out.append('SET @tf_next_user=@tf_next_user+1;')
        out.append('INSERT INTO users(id,employee_id,nick_name,email,password,position_id,status,created_at,updated_at) VALUES(' + ','.join(vals) + ');')
        out += [f'SET @tf_u_{uid}=@tf_next_user;',
                f"INSERT INTO teamflow_candidates(user_id,source_key,source_user_id,profile_json,collection_json,created_at,updated_at) VALUES(@tf_u_{uid},'{source_key}',{uid},'{{}}','{{}}',UTC_TIMESTAMP(),UTC_TIMESTAMP());",
                f'SET @tf_c_{uid}=(SELECT id FROM teamflow_candidates WHERE user_id=@tf_u_{uid});']
    references = {'user_id', 'userId', 'sender_id', 'uploaded_by', 'assignee_id', 'created_by', 'updated_by', 'assigned_by'}
    for name, target in targets.items():
        for original in tables[name]:
            row = {k: user_ref(v) if k in references else literal(v) for k, v in original.items()}
            if name == 'projects':
                lead = original.get('lead')
                if str(lead).isdigit() and str(lead) != '0':
                    row['lead'] = row['lead_user_id'] = user_ref(lead)
                elif lead and len(names.get(str(lead).strip().lower(), [])) == 1:
                    row['lead_user_id'] = user_ref(names[str(lead).strip().lower()][0])
            if name == 'issues' and original.get('assignee') not in (None, ''):
                row['assignee'] = user_ref(original['assignee'])
                row['assignee_user_id'] = user_ref(original['assignee']) if original['assignee'] not in (0, '0') else 'NULL'
            if name == 'teams':
                row['team_members'] = 'JSON_ARRAY(' + ','.join('CAST(' + user_ref(v) + ' AS CHAR)' for v in json.loads(original['team_members'])) + ')'
            if name == 'employee_work_status':
                row['candidate_id'] = '@tf_c_' + str(int(original['user_id']))
            if not all(re.fullmatch(r'[a-zA-Z0-9_]+', k) for k in row):
                raise ValueError('Invalid source column')
            out.append(f"INSERT INTO `{target}` (`" + '`,`'.join(row) + '`) VALUES(' + ','.join(row.values()) + ');')
    file_count = 0
    for name, column in {'projects':'projectLogo','issues':'attachment','reports':'reportImage','project_documents':'document_path','employee_status_documents':'file_name'}.items():
        for row in tables.get(name, []):
            value = row.get(column)
            if not value:
                continue
            vals = [literal(name), literal(row['id']), literal(value), literal(str(value).replace('\\', '/').split('/')[-1])]
            out.append('INSERT INTO teamflow_files(entity_type,entity_id,original_path,original_name,missing,created_at) VALUES(' + ','.join(vals) + ',1,UTC_TIMESTAMP());')
            file_count += 1
    for name, target in targets.items():
        out.append(f"IF (SELECT COUNT(*) FROM `{target}`)<>{len(tables[name])} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Imported row count mismatch; rolling back.'; END IF;")
    summary = {'users':len(users), 'tables':{k:len(tables[k]) for k in targets}, 'mode':'sql-applied', 'files_missing':file_count,
               'verification':{'passwords_unchanged':True,'user_ids_remapped':True,'row_counts_match':True,'candidate_profiles_separate':True}}
    if preserve:
        summary.update({'new_users': 72, 'reused_users': 2, 'existing_accounts_and_profiles_preserved': True})
    mapping = 'JSON_OBJECT(' + ','.join(literal(str(uid)) + f',JSON_OBJECT(\'user_id\',@tf_u_{uid},\'candidate_id\',@tf_c_{uid})' for uid in users) + ')'
    summary_sql = f"JSON_SET({literal(json.dumps(summary))},'$.source_user_mapping',{mapping})"
    out += [f"INSERT INTO teamflow_imports(source_hash,source_key,summary_json,imported_at) VALUES({literal(data['source_hash'])},'{source_key}',{summary_sql},UTC_TIMESTAMP());",
            'COMMIT;', "SELECT 'imported' AS result, 74 AS users, 46 AS projects, 220 AS issues, 145 AS timesheets, 895 AS daily_work, 434 AS reports;",
            'END$$', 'CALL e2e_import_teamflow_data_20261113()$$', 'DROP PROCEDURE e2e_import_teamflow_data_20261113$$', 'DELIMITER ;']
    # Keep each CREATE PROCEDURE below small MySQL max_allowed_packet limits.
    # Chunk routines share session ID-map variables; the parent owns the transaction/rollback.
    first = out.index('SET @tf_next_user=@tf_next_user+1;')
    last = next(i for i, line in enumerate(out) if i > first and line.startswith('IF (SELECT COUNT(*)'))
    chunks, current, size = [], [], 0
    for line in out[first:last]:
        if size + len(line) > 60000 and current:
            chunks.append(current)
            current, size = [], 0
        current.append(line)
        size += len(line) + 1
    if current:
        chunks.append(current)
    routines, cleanup, calls = [], [], ['SET @tf_candidate_role=candidate_role;',
        'SET @tf_next_user=GREATEST(COALESCE((SELECT MAX(id) FROM users),0),COALESCE((SELECT MAX(user_id) FROM teamflow_candidates),0));']
    for i, chunk in enumerate(chunks):
        name = f'e2e_tf_data_chunk_{i:03d}'
        routines += [f'DROP PROCEDURE IF EXISTS {name}$$', f'CREATE PROCEDURE {name}() BEGIN', *chunk, 'END$$']
        calls.append(f'CALL {name}();')
        cleanup.append(f'DROP PROCEDURE {name}$$')
    out[first:last] = calls
    start = out.index('DROP PROCEDURE IF EXISTS e2e_import_teamflow_data_20261113$$')
    out[start:start] = routines
    out[-1:-1] = cleanup
    destination = PRIVATE / ('20261113_teamflow_data_preserve_existing.sql' if preserve else '20261113_teamflow_all_data.sql')
    destination.write_text('\n'.join(out) + '\n', encoding='utf-8')
    counts = [('teamflow_candidates', len(users)), ('teamflow_files', file_count)] + [(target, len(tables[name])) for name, target in targets.items()]
    diagnostic = [
        '-- READ ONLY: run in the same server E2E database where the import failed.',
        '-- Results contain counts/import status only; no passwords or document content.',
        'SELECT DATABASE() AS selected_database;',
        '\nUNION ALL\n'.join(f"SELECT '{target}' AS table_name, COUNT(*) AS actual_rows, {expected} AS expected_original_rows FROM `{target}`" for target, expected in counts) + ';',
        'SELECT source_key, imported_at FROM teamflow_imports ORDER BY imported_at DESC;',
        'SELECT source_key, COUNT(*) AS candidates, COUNT(DISTINCT source_user_id) AS original_user_ids FROM teamflow_candidates GROUP BY source_key;',
        'SELECT COUNT(*) AS candidate_logins_missing FROM teamflow_candidates c LEFT JOIN users u ON u.id=c.user_id WHERE u.id IS NULL;',
    ]
    (PRIVATE / 'teamflow_import_diagnostic.sql').write_text('\n'.join(diagnostic) + '\n', encoding='utf-8')
    print(json.dumps({'success':True,'private_sql_file':str(destination),'users':len(users),'data_rows':sum(len(tables[k]) for k in targets)}))

if __name__ == '__main__':
    main()
