<?php
require_once __DIR__ . '/api/config.php';
$pdo = getCondadoConnection();

$stmt = $pdo->query("SELECT * FROM Tbimovel");
if (!$stmt) {
    echo "Erro na query Tbimovel: " . print_r($pdo->errorInfo(), true) . "<br>";
    $stmt = $pdo->query("SELECT * FROM tbimovel");
    if (!$stmt) {
        echo "Erro na query tbimovel: " . print_r($pdo->errorInfo(), true) . "<br>";
    }
}

if ($stmt) {
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($data);
    echo "</pre>";
}
?>
