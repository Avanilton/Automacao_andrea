<?php
// api/config.php

// Configurações do Banco de Dados Local (cobrancatask)
define('DB_HOST', 'localhost');
define('DB_NAME', 'cobrancatask');
define('DB_USER', 'root'); // Mudar no cPanel
define('DB_PASS', ''); // Mudar no cPanel

// Configurações do Banco Externo (Condado - novacorpconect)
define('CONDADO_DB_HOST', 'sistemasnovacorp.com.br');
define('CONDADO_DB_PORT', '5643');
define('CONDADO_DB_NAME', 'novacorpconect');
define('CONDADO_DB_USER', 'Intelligence');
define('CONDADO_DB_PASS', '@bv2026@');

function getConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        die(json_encode(['error' => 'Falha na conexão com o banco local: ' . $e->getMessage()]));
    }
}

function getCondadoConnection() {
    // ---- AMBIENTE DE TESTE LOCAL ----
    // Usa a mesma conexão do banco local (cobrancatask) para testar os cadastros
    return getConnection();

    /* 
    // ---- AMBIENTE DE PRODUÇÃO (Descomente ao subir pro cPanel) ----
    try {
        $dsn = "mysql:host=" . CONDADO_DB_HOST . ";port=" . CONDADO_DB_PORT . ";dbname=" . CONDADO_DB_NAME . ";charset=utf8";
        $pdo = new PDO($dsn, CONDADO_DB_USER, CONDADO_DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        die(json_encode(['error' => 'Falha na conexão com o Condado: ' . $e->getMessage()]));
    }
    */
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
