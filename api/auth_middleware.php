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

function getCurrentUserId() {
    requireAuth();
    return (int)$_SESSION['user_id'];
}

function getCurrentUserRole() {
    requireAuth();
    return $_SESSION['role'] ?? 'user';
}
?>
