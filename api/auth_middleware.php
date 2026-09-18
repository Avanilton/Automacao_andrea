<?php
require_once 'config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'error' => 'Não autenticado. Faça login novamente.'], 401);
    }
}

function requireAdmin() {
    requireAuth();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        jsonResponse(['success' => false, 'error' => 'Acesso negado. Apenas administradores podem realizar esta ação.'], 403);
    }
}

function requireCsrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (empty($token) || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
            jsonResponse(['success' => false, 'error' => 'Token CSRF inválido.'], 403);
        }
    }
}

function generateCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function getCurrentUserId() {
    requireAuth();
    return (int)$_SESSION['user_id'];
}

function getCurrentUserRole() {
    requireAuth();
    return $_SESSION['role'] ?? 'user';
}

function canAccessTask($pdo, $taskId) {
    $userId = getCurrentUserId();
    if (getCurrentUserRole() === 'admin') return true;
    
    $stmt = $pdo->prepare("SELECT assigned_to FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();
    if (!$task) jsonResponse(['success' => false, 'error' => 'Tarefa não encontrada.'], 404);
    
    if ($task['assigned_to'] == $userId) return true;
    
    $stmt = $pdo->prepare("SELECT 1 FROM task_shares WHERE task_id = ? AND user_id = ?");
    $stmt->execute([$taskId, $userId]);
    if ($stmt->fetch()) return true;
    
    jsonResponse(['success' => false, 'error' => 'Você não tem acesso a esta tarefa.'], 403);
    return false;
}
?>
