<?php
// api/condado.php
require_once 'auth_middleware.php';
$user_id = getCurrentUserId();

$action = $_GET['action'] ?? 'fetch_data';

if ($action === 'fetch_data') {
    $search = $_GET['search'] ?? '';
    
    try {
        $pdoLocal = getConnection(); // LER DO CACHE LOCAL!
        
        $sql = "SELECT 
                    c.property_name, 
                    c.property_code,
                    c.client_code, 
                    c.client_name, 
                    SUM(b.total) as value,
                    c.bloco,
                    '' as apto,
                    c.situacao
                FROM cache_clientes c
                INNER JOIN cache_boletos b ON c.client_code = b.client_code
                WHERE (c.situacao NOT LIKE '%INATIVO%' OR c.situacao IS NULL)";
                
        $params = [];
        
        if (!empty($search)) {
            $sql .= " AND (c.client_name LIKE ? OR c.property_name LIKE ? OR c.client_code LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " GROUP BY c.client_code, c.property_name, c.property_code, c.client_name, c.bloco, c.situacao";
        $sql .= " LIMIT 50";
        
        $stmt = $pdoLocal->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $data]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false, 
            'error' => 'Falha ao ler cache de clientes'
        ], 500);
    }
}

if ($action === 'fetch_client_details') {
    $client_code = $_GET['client_code'] ?? '';
    if (!$client_code) {
        jsonResponse(['error' => 'client_code é obrigatório'], 400);
    }
    
    try {
        $pdoLocal = getConnection(); // LER DO CACHE LOCAL
        
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
            'error' => 'Falha ao buscar detalhes no cache local'
        ], 500);
    }
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
