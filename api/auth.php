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

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
