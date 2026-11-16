<?php
// Synthetic API-test fixture: refuses to operate against an application database.
if(PHP_SAPI!=='cli')exit(2);
$backend=getenv('E2E_BACKEND_PATH')?:'C:/xampp/htdocs/E2E_Tracking';
require $backend.'/config/db.php';
if(!str_starts_with($conn->query('SELECT DATABASE() n')->fetch_assoc()['n'],'e2e_teamflow_verify_'))exit(3);
if(($argv[1]??'')==='delete'){
 $stmt=$conn->prepare("DELETE FROM teamflow_files WHERE id=? AND original_path='uploads/uploads/legacy-proof.png'");
 $stmt->bind_param('i',$argv[2]);$stmt->execute();exit;
}
$report=(int)($argv[1]??0);
$stmt=$conn->prepare("INSERT INTO teamflow_files(entity_type,entity_id,original_path,original_name,missing,created_at) SELECT 'reports',id,'uploads/uploads/legacy-proof.png','legacy-proof.png',1,NOW() FROM teamflow_reports WHERE id=? AND reportText='Synthetic report'");
$stmt->bind_param('i',$report);$stmt->execute();if($stmt->affected_rows!==1)exit(4);echo $conn->insert_id;
