<?php
require_once 'c:/Users/Administrador/Documents/Projetos BV/Automacao_andrea/api/config.php';
$pdoCondado = getCondadoConnection();

try {
    $stmt = $pdoCondado->query("
        SELECT c.idCliente as client_code
        FROM tbcliente c
        LEFT JOIN tbimovel i ON c.idImovel = i.idImovel AND c.idEmpresa = i.idEmpresa
        WHERE c.idCliente > 0
        ORDER BY c.idCliente ASC LIMIT 100
    ");
    echo 'Test 1 (WITH JOIN): Success. Rows: ' . count($stmt->fetchAll()) . "\n";
} catch (Exception $e) {
    echo 'Test 1 (WITH JOIN) Failed: ' . $e->getMessage() . "\n";
}

try {
    $stmt2 = $pdoCondado->query("
        SELECT c.idCliente as client_code
        FROM tbcliente c
        WHERE c.idCliente > 0
        ORDER BY c.idCliente ASC LIMIT 100
    ");
    echo 'Test 2 (NO JOIN): Success. Rows: ' . count($stmt2->fetchAll()) . "\n";
} catch (Exception $e) {
    echo 'Test 2 (NO JOIN) Failed: ' . $e->getMessage() . "\n";
}
