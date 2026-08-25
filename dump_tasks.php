<?php
require 'api/config.php';
$pdo = getConnection();
$stmt = $pdo->query("DESCRIBE tasks");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
