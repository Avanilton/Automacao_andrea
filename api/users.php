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
    requireCsrf();
    $pdo = getConnection();
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = 'user';

    if (!$name || !$email || !$password) {
        jsonResponse(['success' => false, 'message' => 'Nome, e-mail e senha são obrigatórios.']);
    }

    // S4f: valida formato do e-mail também na criação
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'E-mail inválido.'], 400);
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
        jsonResponse(['success' => false, 'message' => 'Erro ao criar usuário.']);
    }
}

if ($action === 'update') {
    requireAdmin();
    requireCsrf();
    $pdo = getConnection();
    $id = (int)($_POST['id'] ?? 0);
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'user';

    if (!$id || !$name || !$email) {
        jsonResponse(['success' => false, 'message' => 'ID, Nome e e-mail são obrigatórios.']);
    }

    // S4a: e-mail precisa ter formato válido
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'E-mail inválido.'], 400);
    }

    // S4b: cargo só pode ser um dos dois conhecidos
    if (!in_array($role, ['admin', 'user'], true)) {
        jsonResponse(['success' => false, 'message' => 'Cargo inválido.'], 400);
    }

    // S4c: nunca permite rebaixar o admin principal (ID 1)
    if ($id === 1 && $role !== 'admin') {
        jsonResponse(['success' => false, 'message' => 'O administrador principal não pode ser rebaixado.'], 403);
    }

    // S4d: e-mail já usado por OUTRO usuário? bloqueia
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
    $stmt->execute([$email, $id]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Este e-mail já está em uso por outro usuário.'], 409);
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
        jsonResponse(['success' => false, 'message' => 'Erro ao atualizar usuário.']);
    }
}

if ($action === 'delete') {
    requireAdmin();
    requireCsrf();
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
    requireCsrf();
    $pdo = getConnection();
    $id = (int)$_SESSION['user_id'];
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');

    if (!$name || !$email) {
        jsonResponse(['success' => false, 'message' => 'Nome e e-mail são obrigatórios.']);
    }

    // S4e: mesmo na autoedição, valida formato e duplicidade
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'E-mail inválido.'], 400);
    }
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
    $stmt->execute([$email, $id]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Este e-mail já está em uso por outro usuário.'], 409);
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
    requireCsrf();
    $pdo = getConnection();
    $id = (int)$_SESSION['user_id'];
    if (getCurrentUserRole() === 'admin' && isset($_POST['id'])) {
        $id = (int)$_POST['id'];
    }
    
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['avatar'];

        // Limite de 2MB
        if ($file['size'] > 2 * 1024 * 1024) {
            jsonResponse(['success' => false, 'message' => 'Imagem muito grande. Máximo 2MB.']);
        }

        $type = mime_content_type($file['tmp_name']);
        $mimeTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
        if (!isset($mimeTypes[$type])) {
            jsonResponse(['success' => false, 'message' => 'Arquivo inválido. Envie JPG, PNG, GIF ou WEBP.']);
        }
        // Extensão vem do tipo real do arquivo, nunca do nome enviado
        $ext = $mimeTypes[$type];
        
        $filename = 'avatar_' . $id . '_' . time() . '.' . $ext;
        $filepath = '../img/' . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $avatarUrl = 'img/' . $filename;
            
            try {
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmt->execute([$avatarUrl, $id]);
                
                jsonResponse(['success' => true, 'avatar' => $avatarUrl]);
            } catch (PDOException $e) {
                jsonResponse(['success' => false, 'message' => 'Erro ao salvar avatar.']);
            }
        } else {
            jsonResponse(['success' => false, 'message' => 'Erro ao fazer upload da imagem.']);
        }
    }
    jsonResponse(['success' => false, 'message' => 'Nenhum arquivo enviado.']);
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
