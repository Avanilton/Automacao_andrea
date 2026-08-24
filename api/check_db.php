<?php
require_once 'config.php';
try {
    $pdo = getCondadoConnection();
    $stmt = $pdo->query("DESCRIBE tbcliente");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
