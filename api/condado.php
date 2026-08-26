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
        $pdoLocal = getDBConnection(); // LER DO CACHE LOCAL!
        
        $sql = "SELECT 
                    property_name, 
                    property_code,
                    client_code, 
                    client_name, 
                    0 as value,
                    bloco,
                    '' as apto,
                    situacao
                FROM cache_clientes c";
                
        $params = [];
        
        if (!empty($search)) {
            $sql .= " WHERE (c.client_name LIKE ? OR c.property_name LIKE ? OR c.client_code LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " LIMIT 50";
        
        $stmt = $pdoLocal->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $data]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false, 
            'error' => 'Falha ao ler cache de clientes: ' . $e->getMessage()
        ], 500);
    }
}

if ($action === 'fetch_client_details') {
    $client_code = $_GET['client_code'] ?? '';
    if (!$client_code) {
        jsonResponse(['error' => 'client_code é obrigatório'], 400);
    }
    
    try {
        $pdoLocal = getDBConnection(); // LER DO CACHE LOCAL
        
        // 1. Fetch Contact Data
        $sqlContact = "SELECT fonece, dddce, foneco, dddco, email, email2, email3 
                       FROM cache_clientes WHERE client_code = ? LIMIT 1";
        $stmtContact = $pdoLocal->prepare($sqlContact);
        $stmtContact->execute([$client_code]);
        $contact = $stmtContact->fetch();
        
        // 2. Fetch Due Boletos (Taxas)
        $sqlTaxas = "SELECT COUNT(*) as boletos_em_atraso 
                     FROM cache_boletos 
                     WHERE client_code = ?";
        $stmtTaxas = $pdoLocal->prepare($sqlTaxas);
        $stmtTaxas->execute([$client_code]);
        $taxas = $stmtTaxas->fetch();
        
        $sqlBoletos = "SELECT numero_doc, total as valor, dataVecto 
                       FROM cache_boletos 
                       WHERE client_code = ?
                       ORDER BY dataVecto ASC";
        $stmtBoletos = $pdoLocal->prepare($sqlBoletos);
        $stmtBoletos->execute([$client_code]);
        $boletos = $stmtBoletos->fetchAll();
        
        jsonResponse([
            'success' => true, 
            'contact' => $contact ?: null, 
            'taxas' => $taxas ? $taxas['boletos_em_atraso'] : 0,
            'boletos' => $boletos ?: []
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false, 
            'error' => 'Falha ao buscar detalhes no cache local: ' . $e->getMessage()
        ], 500);
    }
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
