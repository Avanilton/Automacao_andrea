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
    $data = file_get_contents("php://input");
    file_put_contents($settingsFile, $data);
    echo json_encode(['success' => true]);
    exit;
}
?>
