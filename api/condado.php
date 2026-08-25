<?php
// api/condado.php
require_once 'config.php';
session_start();

// Verifica se está logado
if (!isset($_SESSION['user_id'])) {
    jsonResponse(['error' => 'Acesso negado'], 403);
}

$action = $_GET['action'] ?? 'fetch_data';

if ($action === 'fetch_data') {
    $search = $_GET['search'] ?? '';
    
    try {
        $pdoCondado = getCondadoConnection();
        
        $sql = "SELECT 
                    i.nomeFantasia as property_name, 
                    c.idCliente as client_code, 
                    c.nomeCliente as client_name, 
                    0 as value,
                    b.BLOCO as bloco,
                    '' as apto,
                    s.SITUACAO as situacao
                FROM tbcliente c
                LEFT JOIN tbimovel i ON c.idImovel = i.idImovel AND c.idEmpresa = i.idEmpresa
                LEFT JOIN tbbloco b ON c.idImovel = b.IDIMOVEL AND c.idEmpresa = b.IDEMPRESA
                LEFT JOIN tbsituacao s ON c.idEmpresa = s.IDEMPRESA /* A relação exata de situacao pode precisar de ajuste se existir idSituacao no cliente */
                WHERE 1=1";
                
        $params = [];
        
        if (!empty($search)) {
            $sql .= " AND (c.nomeCliente LIKE ? OR i.nomeFantasia LIKE ? OR c.idCliente LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " LIMIT 50";
        
        $stmt = $pdoCondado->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
        // Remove duplicadas ou dados estranhos se os JOINs multiplicarem as linhas
        // Como não sabemos a relação perfeita, vamos usar um hack para garantir unique clients
        $uniqueData = [];
        foreach($data as $row) {
            $uniqueData[$row['client_code']] = $row;
        }
        $data = array_values($uniqueData);
        
        jsonResponse(['success' => true, 'data' => $data]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false, 
            'error' => 'Falha ao conectar no banco do Condado: ' . $e->getMessage()
        ], 500);
    }
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
