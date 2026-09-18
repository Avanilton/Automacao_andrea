<?php
require_once 'config.php';

header('Content-Type: text/plain');
set_time_limit(0);

try {
    $pdoCondado = getCondadoConnection();
    
    echo "Conectado. Testando contagem de boletos...\n";
    $start = microtime(true);
    
    $stmt = $pdoCondado->query("SELECT COUNT(*) FROM tbboleto WHERE pago = 0 AND cancelado = 0");
    $count = $stmt->fetchColumn();
    
    $end = microtime(true);
    echo "Total de boletos em aberto: $count\n";
    echo "Tempo da query: " . round($end - $start, 2) . " segundos\n";

} catch (Exception $e) {
    error_log('[CobrancaTask] test_condado: ' . $e->getMessage());
    echo "Erro ao testar conexão. Verifique os logs do servidor.";
}
