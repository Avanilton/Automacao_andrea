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
                    COALESCE(i.nomeFantasia, 'Condomínio (Não cadastrado)') as property_name, 
                    c.idImovel as property_code,
                    c.idCliente as client_code, 
                    c.nomeCliente as client_name, 
                    0 as value,
                    (SELECT b.BLOCO FROM tbbloco b WHERE b.IDIMOVEL = c.idImovel AND b.IDEMPRESA = c.idEmpresa LIMIT 1) as bloco,
                    '' as apto,
                    (SELECT s.SITUACAO FROM tbsituacao s WHERE s.IDEMPRESA = c.idEmpresa LIMIT 1) as situacao
                FROM tbcliente c
                LEFT JOIN tbimovel i ON c.idImovel = i.idImovel AND c.idEmpresa = i.idEmpresa
                WHERE EXISTS (SELECT 1 FROM tbboleto b WHERE b.idCliente = c.idCliente AND b.pago = 0 AND b.cancelado = 0 AND b.dataVecto < CURDATE())";
                
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

if ($action === 'fetch_client_details') {
    $client_code = $_GET['client_code'] ?? '';
    if (!$client_code) {
        jsonResponse(['error' => 'client_code é obrigatório'], 400);
    }
    
    try {
        $pdoCondado = getCondadoConnection();
        
        // 1. Fetch Contact Data
        $sqlContact = "SELECT fonece, dddce, foneco, dddco, email, email2, email3 
                       FROM tbcliente WHERE idCliente = ? LIMIT 1";
        $stmtContact = $pdoCondado->prepare($sqlContact);
        $stmtContact->execute([$client_code]);
        $contact = $stmtContact->fetch();
        
        // 2. Fetch Due Boletos (Taxas)
        $sqlTaxas = "SELECT COUNT(*) as boletos_em_atraso 
                     FROM tbboleto 
                     WHERE idCliente = ? AND pago = 0 AND cancelado = 0 AND dataVecto < CURDATE()";
        $stmtTaxas = $pdoCondado->prepare($sqlTaxas);
        $stmtTaxas->execute([$client_code]);
        $taxas = $stmtTaxas->fetch();
        
        jsonResponse([
            'success' => true, 
            'contact' => $contact ?: null, 
            'taxas' => $taxas ? $taxas['boletos_em_atraso'] : 0
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false, 
            'error' => 'Falha ao buscar detalhes no banco do Condado: ' . $e->getMessage()
        ], 500);
    }
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
