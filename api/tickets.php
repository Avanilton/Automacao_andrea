<?php
// api/tickets.php
require_once 'auth_middleware.php';

$action = $_GET['action'] ?? '';

if ($action === 'create') {
    requireAuth();
    requireCsrf();
    $pdo = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = (int)$_SESSION['user_id'];
    $stmtUser = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $userInfo = $stmtUser->fetch();
    $user_name = $userInfo['name'] ?? '';
    $user_email = $userInfo['email'] ?? '';
    $subject = trim($data['subject'] ?? '');
    $message = trim($data['message'] ?? '');

    if (!$user_id || !$user_name || !$user_email || !$subject || !$message) {
        jsonResponse(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    }

    // S18: trava spam — tamanho máximo + ritmo máximo
    if (mb_strlen($subject) > 150) {
        jsonResponse(['success' => false, 'message' => 'Assunto muito longo (máx. 150 caracteres).'], 400);
    }
    if (mb_strlen($message) > 2000) {
        jsonResponse(['success' => false, 'message' => 'Mensagem muito longa (máx. 2000 caracteres).'], 400);
    }
    $stmtRate = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE user_id = ? AND created_at > (NOW() - INTERVAL 1 HOUR)");
    $stmtRate->execute([$user_id]);
    if ((int)$stmtRate->fetchColumn() >= 5) {
        jsonResponse(['success' => false, 'message' => 'Limite de 5 chamados por hora. Tente mais tarde.'], 429);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO tickets (user_id, user_name, user_email, subject, message) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $user_name, $user_email, $subject, $message]);
        jsonResponse(['success' => true, 'message' => 'Chamado aberto com sucesso!', 'ticket_id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao abrir chamado.']);
    }
}

if ($action === 'list') {
    requireAdmin();
    $pdo = getConnection();
    $stmt = $pdo->query("SELECT * FROM tickets ORDER BY created_at DESC");
    jsonResponse(['success' => true, 'tickets' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($action === 'update_status') {
    requireAdmin();
    requireCsrf();
    $pdo = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    $id = $data['id'] ?? 0;
    $status = $data['status'] ?? '';

    if (!$id || !in_array($status, ['aberto', 'em_andamento', 'resolvido'])) {
        jsonResponse(['success' => false, 'message' => 'Dados inválidos.']);
    }

    try {
        $stmt = $pdo->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao atualizar.']);
    }
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
