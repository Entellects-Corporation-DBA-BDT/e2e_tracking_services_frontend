<?php
if(PHP_SAPI!=='cli')exit;
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
require 'C:/xampp/htdocs/E2E_Tracking/config/db.php';
$conn->multi_query(file_get_contents('C:/xampp/htdocs/E2E_Tracking/migrations/20261007_attendance_grace_period.sql'));
do{if($r=$conn->store_result())$r->free();}while($conn->more_results()&&$conn->next_result());
echo "Applied local attendance grace migration.\n";
