<?php
require_once 'api/config.php';
$pdo = getCondadoConnection();

$stmtImoveis = $pdo->query("SELECT * FROM tbimovel LIMIT 10");
$imoveis = $stmtImoveis ? $stmtImoveis->fetchAll(PDO::FETCH_ASSOC) : 'Falhou: ' . implode(',', $pdo->errorInfo());

$stmtClientes = $pdo->query("SELECT idEmpresa, idImovel, idCliente FROM tbcliente LIMIT 10");
$clientes = $stmtClientes ? $stmtClientes->fetchAll(PDO::FETCH_ASSOC) : 'Falhou: ' . implode(',', $pdo->errorInfo());

header('Content-Type: application/json');
echo json_encode([
    'imoveis' => $imoveis,
    'clientes' => $clientes
], JSON_PRETTY_PRINT);
?>
