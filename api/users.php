<?php
// api/users.php
require_once 'auth_middleware.php';

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    requireAdmin();
    $pdo = getConnection();
    $stmt = $pdo->query("SELECT id, name, email, role, avatar FROM users ORDER BY name");
    jsonResponse(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($action === 'create') {
    requireAdmin();
    $pdo = getConnection();
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = 'user';

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
    requireAdmin();
    $pdo = getConnection();
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
    requireAdmin();
    $pdo = getConnection();
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

if ($action === 'update_profile') {
    requireAuth();
    $pdo = getConnection();
    $id = (int)$_SESSION['user_id'];
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');

    if (!$name || !$email) {
        jsonResponse(['success' => false, 'message' => 'Nome e e-mail são obrigatórios.']);
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $stmt->execute([$name, $email, $id]);
        $_SESSION['role'] = $_SESSION['role'] ?? 'user';
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao atualizar perfil.']);
    }
}

if ($action === 'update_avatar') {
    requireAuth();
    $pdo = getConnection();
    $id = (int)($_POST['id'] ?? $_SESSION['user_id']);
    
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['avatar'];
        $type = mime_content_type($file['tmp_name']);
        
        if (strpos($type, 'image/') !== 0) {
            jsonResponse(['success' => false, 'message' => 'Arquivo inválido. Escolha uma imagem.']);
        }
        
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        if (!$ext) {
            $mimeTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
            $ext = $mimeTypes[$type] ?? 'jpg';
        }
        
        $filename = 'avatar_' . $id . '_' . time() . '.' . $ext;
        $filepath = '../img/' . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $avatarUrl = 'img/' . $filename;
            
            try {
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmt->execute([$avatarUrl, $id]);
                
                jsonResponse(['success' => true, 'avatar' => $avatarUrl]);
            } catch (PDOException $e) {
                jsonResponse(['success' => false, 'message' => 'Erro ao salvar avatar: ' . $e->getMessage()]);
            }
        } else {
            jsonResponse(['success' => false, 'message' => 'Erro ao fazer upload da imagem.']);
        }
    }
    jsonResponse(['success' => false, 'message' => 'Nenhum arquivo enviado.']);
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
