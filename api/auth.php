<?php
// api/auth.php
require_once 'config.php';
session_start();

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'error' => 'Preencha todos os campos.']);
    }
    
    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        
        // Remove password from response
        unset($user['password']);
        
        jsonResponse(['success' => true, 'user' => $user]);
    } else {
        jsonResponse(['success' => false, 'error' => 'Credenciais inválidas.']);
    }
}

if ($action === 'logout') {
    session_destroy();
    jsonResponse(['success' => true]);
}

if ($action === 'change_password') {
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';

    if (empty($current_password) || empty($new_password)) {
        jsonResponse(['success' => false, 'error' => 'Preencha todos os campos.']);
    }

    if (strlen($new_password) < 6) {
        jsonResponse(['success' => false, 'error' => 'A nova senha deve ter no mínimo 6 caracteres.']);
    }

    $user_id = $_SESSION['user_id'] ?? null;
    if (!$user_id) {
        jsonResponse(['success' => false, 'error' => 'Sessão expirada. Faça login novamente.']);
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($current_password, $user['password'])) {
        jsonResponse(['success' => false, 'error' => 'Senha atual incorreta.']);
    }

    $hash = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hash, $user_id]);

    jsonResponse(['success' => true, 'message' => 'Senha atualizada com sucesso!']);
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
