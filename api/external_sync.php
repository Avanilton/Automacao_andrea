<?php
// api/external_sync.php
// ESQUELETO: envia a "Descrição das Atividades (Atendimento)" em JSON via POST
// para a API do outro site/banco. Preencher EXTERNAL_API_URL e EXTERNAL_API_TOKEN
// no .env quando tiver acesso ao outro ambiente.
require_once 'auth_middleware.php';

$action = $_GET['action'] ?? '';

if ($action === 'push_activity') {
    requireCsrf();
    $pdo = getConnection();
    $task_id = (int)($_POST['task_id'] ?? 0);
    canAccessTask($pdo, $task_id);
    $content = trim($_POST['content'] ?? '');

    if ($content === '') {
        jsonResponse(['success' => false, 'error' => 'Descrição da atividade vazia.']);
    }

    $apiUrl = getenv('EXTERNAL_API_URL') ?: '';
    $apiToken = getenv('EXTERNAL_API_TOKEN') ?: '';

    // Outro ambiente ainda não configurado: não quebra o fluxo local
    if ($apiUrl === '' || $apiToken === '') {
        error_log('[CobrancaTask] push_activity ignorado: EXTERNAL_API_URL/TOKEN não configurados.');
        jsonResponse(['success' => true, 'skipped' => true, 'message' => 'Integração externa não configurada.']);
    }

    // Busca dados da tarefa para montar o payload
    $stmt = $pdo->prepare("SELECT id, property_name, client_code, client_name, status FROM tasks WHERE id = ?");
    $stmt->execute([$task_id]);
    $task = $stmt->fetch();

    // TODO: ajustar os nomes dos campos conforme o contrato da API externa
    $payload = [
        'task_id' => (int)$task['id'],
        'property_name' => $task['property_name'] ?? null,
        'client_code' => $task['client_code'] ?? null,
        'client_name' => $task['client_name'] ?? null,
        'status' => $task['status'] ?? null,
        'activity_description' => $content,
        'sent_at' => date('c'),
    ];

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiToken, // TODO: trocar pelo esquema de auth da API externa
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        error_log('[CobrancaTask] push_activity falhou: HTTP ' . $httpCode . ' ' . $curlError);
        jsonResponse(['success' => false, 'error' => 'Falha ao enviar atividade para o sistema externo.']);
    }

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Ação inválida.'], 404);
