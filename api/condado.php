<?php
// api/condado.php
require_once 'config.php';
session_start();

// Verifica se está logado e é admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    jsonResponse(['error' => 'Acesso negado'], 403);
}

$action = $_GET['action'] ?? 'fetch_data';

if ($action === 'fetch_data') {
    $search = $_GET['search'] ?? '';
    
    try {
        $pdoCondado = getCondadoConnection();
        
        // A tabela informada é tbcliente
        // Vamos assumir que os campos sejam algo como: nome, condominio, codigo, valor
        // Se os nomes das colunas forem diferentes no banco real, ajuste aqui.
        $sql = "SELECT 
                    condominio as property_name, 
                    codigo as client_code, 
                    nome as client_name, 
                    valor as value 
                FROM tbcliente 
                WHERE 1=1";
                
        $params = [];
        
        if (!empty($search)) {
            $sql .= " AND (nome LIKE ? OR condominio LIKE ? OR codigo LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " LIMIT 50";
        
        $stmt = $pdoCondado->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
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
