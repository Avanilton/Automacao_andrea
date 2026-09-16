<?php
// api/tickets.php
require_once 'config.php';
session_start();

$action = $_GET['action'] ?? '';

if ($action === 'create') {
    $pdo = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = $data['user_id'] ?? 0;
    $user_name = trim($data['user_name'] ?? '');
    $user_email = trim($data['user_email'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $message = trim($data['message'] ?? '');

    if (!$user_id || !$user_name || !$user_email || !$subject || !$message) {
        jsonResponse(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO tickets (user_id, user_name, user_email, subject, message) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $user_name, $user_email, $subject, $message]);
        jsonResponse(['success' => true, 'message' => 'Chamado aberto com sucesso!', 'ticket_id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Erro ao abrir chamado: ' . $e->getMessage()]);
    }
}

if ($action === 'list') {
    $pdo = getConnection();
    $stmt = $pdo->query("SELECT * FROM tickets ORDER BY created_at DESC");
    jsonResponse(['success' => true, 'tickets' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($action === 'update_status') {
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
        jsonResponse(['success' => false, 'message' => 'Erro ao atualizar: ' . $e->getMessage()]);
    }
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
