<?php
require_once 'config.php';
try {
    $pdo = getCondadoConnection();
    
    $res = [];
    foreach(['tbimovel', 'tbbloco', 'tbsituacao'] as $tb) {
        $stmt = $pdo->query("DESCRIBE $tb");
        $res[$tb] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    echo json_encode($res);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
