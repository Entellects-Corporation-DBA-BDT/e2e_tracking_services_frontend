"""Apply only the reviewed own-profile hooks, after hash, scope and PHP checks."""
import hashlib,json,os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STAGE=ROOT/'.server-audit/profile-session-backend'
BACKEND=Path('C:/xampp/htdocs/E2E_Tracking')
PHP='C:/xampp/php/php.exe'
manifest=json.loads((STAGE/'baseline-hashes.json').read_text())
changes={
 'modules/auth/model.php':[("require_once __DIR__ . '/../../config/db.php';","require_once __DIR__ . '/../../config/db.php';\nrequire_once __DIR__.'/self_profile.php';"),("        return ['user'=>['id'=>(int)$user['id']","        $resources=selfProfileResources($resources);\n        return ['user'=>['id'=>(int)$user['id']")],
 'middleware/role.php':[("require_once __DIR__ . '/auth.php';","require_once __DIR__ . '/auth.php';\nrequire_once __DIR__.'/../modules/auth/self_profile.php';"),("return $stmt->get_result()->fetch_assoc()?:[];","$result=$stmt->get_result()->fetch_assoc()?:[];return $resourceName==='profile'?selfProfilePermission($result):$result;")]
}
prepared={}
for relative,replacements in changes.items():
 original=(BACKEND/relative).read_bytes()
 if hashlib.sha256(original).hexdigest()!=manifest[relative]:raise RuntimeError('Backend changed after review; refusing to overwrite: '+relative)
 text=original.decode('utf-8').replace('\r\n','\n')
 for before,after in replacements:
  if text.count(before)!=1:raise RuntimeError('Expected unique hook missing: '+relative)
  text=text.replace(before,after,1)
 if text!=(STAGE/relative).read_text(encoding='utf-8'):raise RuntimeError('Staged file contains changes beyond reviewed hooks: '+relative)
 prepared[relative]=text.replace('\n','\r\n' if b'\r\n' in original else '\n').encode('utf-8')
helper='modules/auth/self_profile.php'
if (BACKEND/helper).exists():raise RuntimeError('Policy helper already exists; review before applying again.')
for relative in [*changes,helper]:subprocess.run([PHP,'-l',str(STAGE/relative)],check=True,capture_output=True)
subprocess.run([PHP,str(ROOT/'scripts/test_self_profile_policy.php')],check=True,capture_output=True)
backup=ROOT/'.server-audit/profile-session-originals'
for relative in changes:
 destination=backup/relative;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes((BACKEND/relative).read_bytes())
# No credential, token, expiry, record-owner, non-profile or database rules are changed.
(BACKEND/helper).write_bytes((STAGE/helper).read_bytes())
written=[]
try:
 for relative,content in prepared.items():
  target=BACKEND/relative;temporary=target.with_suffix('.self-profile.tmp');temporary.write_bytes(content);os.replace(temporary,target);written.append(relative)
except Exception:
 for relative in written:(BACKEND/relative).write_bytes((backup/relative).read_bytes())
 raise
print('Applied four reviewed own-profile hook changes; original files backed up privately. No SQL or login/token changes.')
