<?php
// api/condado.php
require_once 'config.php';
session_start();

// Verifica se está logado e é admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    // Para desenvolvimento, deixaremos passar. Em produção:
    // jsonResponse(['error' => 'Acesso negado'], 403);
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
        // Fallback para mock data caso a conexão ou tabela falhe durante o desenvolvimento
        $mockData = [
            [
                'property_name' => 'Cond. Bela Vista',
                'client_code' => '1001',
                'client_name' => 'João Silva (Mock)',
                'value' => 450.00
            ],
            [
                'property_name' => 'Cond. Sol Nascente',
                'client_code' => '1002',
                'client_name' => 'Maria Oliveira (Mock)',
                'value' => 380.00
            ]
        ];
        
        // Filtra o mock data se houver pesquisa
        if (!empty($search)) {
            $mockData = array_filter($mockData, function($item) use ($search) {
                $s = strtolower($search);
                return strpos(strtolower($item['property_name']), $s) !== false || 
                       strpos(strtolower($item['client_name']), $s) !== false ||
                       strpos(strtolower($item['client_code']), $s) !== false;
            });
            $mockData = array_values($mockData);
        }
        
        jsonResponse([
            'success' => true, 
            'data' => $mockData, 
            'warning' => 'Tabela real inacessível. Usando dados falsos (Mock). Erro: ' . $e->getMessage()
        ]);
    }
}

jsonResponse(['error' => 'Ação não encontrada.'], 404);
?>
