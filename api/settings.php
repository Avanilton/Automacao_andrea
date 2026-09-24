<?php
require_once 'auth_middleware.php';

$action = $_GET['action'] ?? 'get';
$settingsFile = __DIR__ . '/settings.json';

if ($action === 'get') {
    requireAuth();
    if (file_exists($settingsFile)) {
        echo file_get_contents($settingsFile);
    } else {
        echo json_encode([
            'view_tarefas' => true,
            'create_task' => false,
            'distribute_task' => false,
            'view_kanban' => true,
            'view_reports' => false,
            'view_trash' => false,
            'view_config' => false
        ]);
    }
    exit;
}

if ($action === 'save') {
    requireAdmin();
    requireCsrf();
    // S3: só aceita as 7 chaves conhecidas, todas booleanas — resto é descartado
    $allowedKeys = ['view_tarefas', 'create_task', 'distribute_task', 'view_kanban', 'view_reports', 'view_trash', 'view_config'];
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonResponse(['success' => false, 'error' => 'JSON inválido.'], 400);
    }
    $clean = [];
    foreach ($allowedKeys as $key) {
        // Se a chave não veio, assume false (checkbox desmarcado)
        $clean[$key] = !empty($data[$key]);
    }
    file_put_contents($settingsFile, json_encode($clean, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
    exit;
}
?>
