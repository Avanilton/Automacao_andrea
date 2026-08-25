<?php
// api/tasks.php
require_once 'config.php';
session_start();

// Simulação de sessão para desenvolvimento
$user_id = $_SESSION['user_id'] ?? 1; // 1 = Admin

$action = $_GET['action'] ?? '';
$pdo = getConnection();

if ($action === 'list') {
    // Listar tarefas não excluídas
    $stmt = $pdo->query("SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC");
    $tasks = $stmt->fetchAll();
    
    // Buscar compartilhamentos
    $stmtShares = $pdo->query("SELECT task_id, user_id FROM task_shares");
    $shares = $stmtShares->fetchAll();
    
    // Mapear compartilhamentos para as tarefas
    foreach ($tasks as &$task) {
        $task['shared_with'] = [];
        foreach ($shares as $share) {
            if ($share['task_id'] == $task['id']) {
                $task['shared_with'][] = (string)$share['user_id']; // Javascript espera string na nossa logica
            }
        }
        // Aliases to match JS mocks if necessary (mock had 'name' instead of property_name)
        // JS mock usa t.name e t.client, então vamos criar alias
        $task['name'] = $task['property_name'];
        $task['client'] = $task['client_name'];
        $task['type'] = 'Cobrança'; // mock fallback
    }
    
    jsonResponse(['success' => true, 'tasks' => $tasks]);
}

if ($action === 'list_trash') {
    $stmt = $pdo->query("SELECT * FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC");
    $tasks = $stmt->fetchAll();
    jsonResponse(['success' => true, 'tasks' => $tasks]);
}

if ($action === 'soft_delete') {
    $task_id = $_POST['task_id'] ?? 0;
    $stmt = $pdo->prepare("UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$task_id]);
    jsonResponse(['success' => true]);
}

if ($action === 'restore') {
    $task_id = $_POST['task_id'] ?? 0;
    $stmt = $pdo->prepare("UPDATE tasks SET deleted_at = NULL WHERE id = ?");
    $stmt->execute([$task_id]);
    jsonResponse(['success' => true]);
}

if ($action === 'force_delete') {
    $task_id = $_POST['task_id'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->execute([$task_id]);
    jsonResponse(['success' => true]);
}

if ($action === 'create') {
    // Distribuir tarefas
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(!isset($data['tasks']) || !isset($data['assigned_to'])) {
        jsonResponse(['error' => 'Dados inválidos'], 400);
    }
    
    $assigned_to = $data['assigned_to'];
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO tasks (property_name, client_code, client_name, value, due_date, assigned_to, created_by, bloco, apto, situacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach($data['tasks'] as $task) {
            $stmt->execute([
                $task['property_name'],
                $task['client_code'],
                $task['client_name'],
                $task['value'],
                $data['due_date'] ?? null,
                $assigned_to,
                $user_id,
                $task['bloco'] ?? null,
                $task['apto'] ?? null,
                $task['situacao'] ?? null
            ]);
        }
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch(Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Erro ao salvar tarefas: ' . $e->getMessage()], 500);
    }
}

if ($action === 'update_status') {
    $task_id = $_POST['task_id'] ?? 0;
    $status = $_POST['status'] ?? '';
    
    $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?");
    $stmt->execute([$status, $task_id]);
    
    jsonResponse(['success' => true]);
}

if ($action === 'add_update') {
    // Adicionar Atendimento
    $task_id = $_POST['task_id'] ?? 0;
    $content = $_POST['content'] ?? '';
    
    $stmt = $pdo->prepare("INSERT INTO task_updates (task_id, user_id, content) VALUES (?, ?, ?)");
    $stmt->execute([$task_id, $user_id, $content]);
    
    // Se o status for todo, muda para in_progress automaticamente
    $stmtStatus = $pdo->prepare("UPDATE tasks SET status = 'in_progress' WHERE id = ? AND status = 'todo'");
    $stmtStatus->execute([$task_id]);
    
    jsonResponse(['success' => true]);
}

if ($action === 'reassign') {
    $task_id = $_POST['task_id'] ?? 0;
    $new_user_id = $_POST['user_id'] ?? 0;
    
    // Update owner and remove from shares if they were shared
    $stmt = $pdo->prepare("UPDATE tasks SET assigned_to = ? WHERE id = ?");
    $stmt->execute([$new_user_id, $task_id]);
    
    $stmtDel = $pdo->prepare("DELETE FROM task_shares WHERE task_id = ? AND user_id = ?");
    $stmtDel->execute([$task_id, $new_user_id]);
    
    jsonResponse(['success' => true]);
}

if ($action === 'share_task') {
    $task_id = $_POST['task_id'] ?? 0;
    $user_id_to_share = $_POST['user_id'] ?? 0;
    
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO task_shares (task_id, user_id) VALUES (?, ?)");
        $stmt->execute([$task_id, $user_id_to_share]);
        jsonResponse(['success' => true]);
    } catch(Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()]);
    }
}

if ($action === 'unshare_task') {
    $task_id = $_POST['task_id'] ?? 0;
    $user_id_to_unshare = $_POST['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM task_shares WHERE task_id = ? AND user_id = ?");
    $stmt->execute([$task_id, $user_id_to_unshare]);
    
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Ação inválida'], 404);
?>
