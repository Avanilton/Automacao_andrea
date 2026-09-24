<?php
// api/config.php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Carregar variáveis de ambiente do .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim(trim($value), "\"'"); // Remove quotes if present
        if (!getenv($key)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

set_exception_handler(function($e) {
    error_log('[CobrancaTask] ' . $e->getMessage());
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Erro interno do servidor']);
    exit;
});

// Configurações do Banco de Dados Local
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'bvgarantia_cobrancatask');
define('DB_USER', getenv('DB_USER') ?: 'bvgarantia_cobranca');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Configurações do Banco Externo (Condado)
define('CONDADO_DB_HOST', getenv('CONDADO_DB_HOST') ?: 'sistemasnovacorp.com.br');
define('CONDADO_DB_PORT', getenv('CONDADO_DB_PORT') ?: '5643');
define('CONDADO_DB_NAME', getenv('CONDADO_DB_NAME') ?: 'novacorpconect');
define('CONDADO_DB_USER', getenv('CONDADO_DB_USER') ?: 'Intelligence');
define('CONDADO_DB_PASS', getenv('CONDADO_DB_PASS') ?: '');

function getConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET wait_timeout=5"
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log('[CobrancaTask] Falha conexão local: ' . $e->getMessage());
        ob_clean();
        http_response_code(503);
        die(json_encode(['success' => false, 'error' => 'Falha na conexão com o banco de dados']));
    }
}

function getCondadoConnection() {
    try {
        $dsn = "mysql:host=" . CONDADO_DB_HOST . ";port=" . CONDADO_DB_PORT . ";dbname=" . CONDADO_DB_NAME . ";charset=utf8";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET wait_timeout=10"
        ];
        $pdo = new PDO($dsn, CONDADO_DB_USER, CONDADO_DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log('[CobrancaTask] Falha conexão Condado: ' . $e->getMessage());
        ob_clean();
        http_response_code(503);
        die(json_encode(['success' => false, 'error' => 'Falha na conexão com o sistema externo']));
    }
}

function jsonResponse($data, $statusCode = 200) {
    if (ob_get_length()) ob_clean();
    http_response_code($statusCode);
    header('Content-Type: application/json');
    $json = json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        echo json_encode(['error' => 'Erro de codificação JSON']);
    } else {
        echo $json;
    }
    exit;
}
?>
