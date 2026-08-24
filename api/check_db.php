<?php
require_once 'config.php';
try {
    $pdo = getCondadoConnection();
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($tables);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
