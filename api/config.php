<?php
// api/config.php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

set_exception_handler(function($e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'error' => 'Erro interno do servidor', 
        'details' => $e->getMessage()
    ]);
    exit;
});

// Configurações do Banco de Dados Local (cobrancatask)
define('DB_HOST', 'localhost');
define('DB_NAME', 'bvgarantia_cobrancatask');
define('DB_USER', 'bvgarantia_bv');
define('DB_PASS', 'L[2u[r%}dY_ScSAk');

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
        ob_clean();
        die(json_encode(['error' => 'Falha na conexão com o banco local: ' . $e->getMessage()]));
    }
}

function getCondadoConnection() {
    // ---- AMBIENTE DE PRODUÇÃO (Conexão com o Condado Oficial) ----
    try {
        $dsn = "mysql:host=" . CONDADO_DB_HOST . ";port=" . CONDADO_DB_PORT . ";dbname=" . CONDADO_DB_NAME . ";charset=utf8";
        $pdo = new PDO($dsn, CONDADO_DB_USER, CONDADO_DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        ob_clean();
        die(json_encode(['error' => 'Falha na conexão com o Condado: ' . $e->getMessage()]));
    }
}

function jsonResponse($data, $statusCode = 200) {
    if (ob_get_length()) ob_clean();
    http_response_code($statusCode);
    header('Content-Type: application/json');
    $json = json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        echo json_encode(['error' => 'Erro de codificação JSON: ' . json_last_error_msg()]);
    } else {
        echo $json;
    }
    exit;
}
?>
