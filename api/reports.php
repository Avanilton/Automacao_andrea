<?php
// api/reports.php
require_once 'config.php';
session_start();

// Simulação de sessão para desenvolvimento
$user_id = $_SESSION['user_id'] ?? 1; // 1 = Admin
$role = $_SESSION['role'] ?? 'user';

try {
    $pdo = getConnection();
    $where = "WHERE t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00'";
    $params = [];
    
    if ($role !== 'admin') {
        $where .= " AND (t.assigned_to = ? OR t.id IN (SELECT task_id FROM task_shares WHERE user_id = ?))";
        $params = [$user_id, $user_id];
    }
    
    // 1. Total Atendimentos
    $stmtTotal = $pdo->prepare("SELECT COUNT(*) as total FROM tasks t $where");
    $stmtTotal->execute($params);
    $totalAtendimentos = $stmtTotal->fetch()['total'];
    
    // 2. Ranking Atendentes
    // Group by assigned_to
    $stmtRankingAtendentes = $pdo->prepare("
        SELECT u.name as atendente, COUNT(t.id) as total 
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        $where
        GROUP BY t.assigned_to
        ORDER BY total DESC
    ");
    $stmtRankingAtendentes->execute($params);
    $rankingAtendentes = $stmtRankingAtendentes->fetchAll();
    
    // 3. Ranking Imóveis (Top 5)
    $stmtRankingImoveis = $pdo->prepare("
        SELECT t.property_name as imovel, COUNT(t.id) as total 
        FROM tasks t 
        $where
        GROUP BY t.property_name
        ORDER BY total DESC
        LIMIT 5
    ");
    $stmtRankingImoveis->execute($params);
    $rankingImoveis = $stmtRankingImoveis->fetchAll();
    
    jsonResponse([
        'success' => true,
        'data' => [
            'total_atendimentos' => $totalAtendimentos,
            'ranking_atendentes' => array_slice($rankingAtendentes, 0, 5),
            'ranking_atendentes_all' => $rankingAtendentes,
            'ranking_imoveis' => $rankingImoveis
        ]
    ]);
    
} catch (Exception $e) {
    jsonResponse(['error' => 'Erro ao gerar relatórios: ' . $e->getMessage()], 500);
}
?>
