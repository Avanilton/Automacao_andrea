<?php
require_once __DIR__ . '/api/config.php';
$pdo = getCondadoConnection();

$stmt = $pdo->query("SELECT * FROM tbimovel");
$data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : ['error' => $pdo->errorInfo()];

file_put_contents(__DIR__ . '/dump_imoveis.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Dump criado em dump_imoveis.json";
?>
