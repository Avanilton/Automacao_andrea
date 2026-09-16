<?php
require_once 'config.php';
session_start();

$action = $_GET['action'] ?? 'get';
$settingsFile = __DIR__ . '/settings.json';

if ($action === 'get') {
    if (file_exists($settingsFile)) {
        echo file_get_contents($settingsFile);
    } else {
        echo json_encode([
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
    $data = file_get_contents("php://input");
    file_put_contents($settingsFile, $data);
    echo json_encode(['success' => true]);
    exit;
}
?>
