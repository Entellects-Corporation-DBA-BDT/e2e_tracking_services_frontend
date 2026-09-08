<?php
// E2E business time uses US Eastern Time (EST/EDT with daylight-saving support).
date_default_timezone_set('America/New_York');

$host = "db5020514931.hosting-data.io";
$db_user  = "dbu2122358";
$pass = "E2E.Beedata@25541201";
$db   = "dbs15705513";

$conn = new mysqli($host, $db_user , $pass, $db);
// Keep MySQL NOW(), CURDATE(), and TIMESTAMP reads aligned with Eastern Time.
$easternOffset = (new DateTimeImmutable('now', new DateTimeZone('America/New_York')))->format('P');
$conn->query("SET time_zone = '" . $conn->real_escape_string($easternOffset) . "'");


if ($conn->connect_error) {
    die(json_encode(["error" => "DB Connection Failed"]));
}
?>