<?php
// Pure policy checks: no database connection, credentials or live authorization writes.
require __DIR__.'/../.server-audit/profile-session-backend/modules/auth/self_profile.php';
function checkPolicy($condition,$message){if(!$condition)throw new RuntimeException($message);}
foreach([[],['can_view'=>0,'can_edit'=>1,'can_manage'=>1,'data_scope'=>'ALL']] as $denied){$own=selfProfilePermission($denied);checkPolicy($own['can_view']===1&&$own['data_scope']==='OWN','Baseline must be own-only.');foreach($own as $key=>$value)if(str_starts_with($key,'can_')&&$key!=='can_view')checkPolicy($value===0,'No additional action grants.');}
$explicit=['can_view'=>1,'can_edit'=>1,'data_scope'=>'ALL'];checkPolicy(selfProfilePermission($explicit)===$explicit,'Existing explicit grants must be preserved.');
$other=['id'=>10,'resource'=>'employees','permissions'=>['view'=>false,'manage'=>false],'scope'=>'OWN'];$resources=selfProfileResources([$other]);checkPolicy($resources[0]===$other,'Directory permissions must not change.');checkPolicy(count($resources)===2&&$resources[1]['scope']==='OWN','Missing own-profile resource must be available.');
$resources=selfProfileResources([['resource'=>'profile','permissions'=>['view'=>false,'edit'=>true],'scope'=>'ALL']]);checkPolicy($resources[0]['permissions']['view']===true&&$resources[0]['permissions']['edit']===false&&$resources[0]['scope']==='OWN','An explicit view denial must not promote the old scope or edit action.');
echo json_encode(['success'=>true,'own_only_baseline'=>true,'no_new_admin_or_edit_grants'=>true,'explicit_grants_preserved'=>true,'directory_permissions_unchanged'=>true]).PHP_EOL;
