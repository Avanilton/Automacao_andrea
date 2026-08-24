<?php
// api/users.php
require_once 'config.php';
session_start();

$action = $_GET['action'] ?? '';
$pdo = getConnection();

if ($action === 'list') {
    $stmt = $pdo->query("SELECT id, name, email, role, avatar FROM users ORDER BY name");
    jsonResponse(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($action === 'create') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'user';

    if (!$name || !$email || !$password) {
        jsonResponse(['success' => false, 'message' => 'Nome, e-mail e senha são obrigatórios.']);
    }

    // Verificar se email já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Este e-mail já está em uso.']);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $role]);
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao criar usuário: ' . $e->getMessage()]);
    }
}

if ($action === 'update') {
    $id = $_POST['id'] ?? 0;
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'user';

    if (!$id || !$name || !$email) {
        jsonResponse(['success' => false, 'message' => 'ID, Nome e e-mail são obrigatórios.']);
    }

    try {
        if (!empty($password)) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?");
            $stmt->execute([$name, $email, $hash, $role, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?");
            $stmt->execute([$name, $email, $role, $id]);
        }
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao atualizar usuário: ' . $e->getMessage()]);
    }
}

if ($action === 'delete') {
    $id = $_POST['id'] ?? 0;
    
    if ($id == 1) { // Proteção básica para o admin inicial
        jsonResponse(['success' => false, 'message' => 'O administrador principal não pode ser excluído.']);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Este usuário possui tarefas vinculadas e não pode ser excluído.']);
    }
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
