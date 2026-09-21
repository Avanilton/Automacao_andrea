<?php
// api/auth.php
require_once 'auth_middleware.php';

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    // S6: trava força-bruta — 5 erros em 15min bloqueia por 5min (por sessão)
    $now = time();
    if (!empty($_SESSION['login_block_until']) && $_SESSION['login_block_until'] > $now) {
        $wait = (int)($_SESSION['login_block_until'] - $now);
        jsonResponse(['success' => false, 'error' => 'Muitas tentativas. Aguarde ' . $wait . 's e tente de novo.'], 429);
    }
    if (empty($_SESSION['login_attempts_time']) || ($now - $_SESSION['login_attempts_time']) > 15 * 60) {
        $_SESSION['login_attempts'] = 0;
        $_SESSION['login_attempts_time'] = $now;
    }

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
        // Login OK: zera contador, troca ID da sessão e gera CSRF novo
        $_SESSION['login_attempts'] = 0;
        unset($_SESSION['login_block_until']);
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['last_activity'] = $now;
        unset($_SESSION['csrf_token']);
        $csrfToken = generateCsrfToken();
        
        unset($user['password']);
        
        jsonResponse(['success' => true, 'user' => $user, 'csrf_token' => $csrfToken]);
    } else {
        // Erro: conta +1 e atrasa 1s (desacelera robô de senhas)
        $_SESSION['login_attempts'] = (int)($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['login_block_until'] = $now + 5 * 60;
        }
        sleep(1);
        jsonResponse(['success' => false, 'error' => 'Credenciais inválidas.'], 401);
    }
}

// S7: check existia na doc mas não no código — diz se a sessão ainda vale
if ($action === 'check') {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'error' => 'Não autenticado.'], 401);
    }
    requireAuth(); // também valida o timeout de 10min
    jsonResponse(['success' => true, 'user' => [
        'id' => (int)$_SESSION['user_id'],
        'role' => $_SESSION['role'] ?? 'user',
    ]]);
}

if ($action === 'logout') {
    // S8: aceita POST (recomendado) e mantém GET por compatibilidade; limpa tudo
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        requireCsrf();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    jsonResponse(['success' => true]);
}

if ($action === 'change_password') {
    requireCsrf();
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';

    if (empty($current_password) || empty($new_password)) {
        jsonResponse(['success' => false, 'error' => 'Preencha todos os campos.']);
    }

    if (strlen($new_password) < 6) {
        jsonResponse(['success' => false, 'error' => 'A nova senha deve ter no mínimo 6 caracteres.']);
    }

    $user_id = getCurrentUserId();

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
