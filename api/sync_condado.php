<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdoLocal = getConnection();
    
    // 1. Criar as tabelas locais se não existirem
    $sqlCreate = "
        CREATE TABLE IF NOT EXISTS cache_clientes (
            client_code INT PRIMARY KEY,
            property_code INT,
            property_name VARCHAR(255),
            client_name VARCHAR(255),
            bloco VARCHAR(50),
            situacao VARCHAR(100),
            fonece VARCHAR(50), dddce VARCHAR(10),
            foneco VARCHAR(50), dddco VARCHAR(10),
            email VARCHAR(255), email2 VARCHAR(255), email3 VARCHAR(255)
        );
        
        CREATE TABLE IF NOT EXISTS cache_boletos (
            idBoleto INT PRIMARY KEY,
            client_code INT,
            total DECIMAL(10,2),
            dataVecto DATE,
            numero_doc VARCHAR(100)
        );
    ";
    $pdoLocal->exec($sqlCreate);

    $pdoCondado = getCondadoConnection();

    // 2. Sincronizar Clientes Inadimplentes com todos os dados calculados
    $stmtClientes = $pdoCondado->query("
        SELECT 
            c.idCliente as client_code, 
            c.idImovel as property_code,
            COALESCE(i.nomeFantasia, 'Condomínio (Não cadastrado)') as property_name, 
            c.nomeCliente as client_name, 
            (SELECT b.BLOCO FROM tbbloco b WHERE b.IDIMOVEL = c.idImovel AND b.IDEMPRESA = c.idEmpresa LIMIT 1) as bloco,
            (SELECT s.SITUACAO FROM tbsituacao s WHERE s.IDEMPRESA = c.idEmpresa LIMIT 1) as situacao,
            c.fonece, c.dddce, c.foneco, c.dddco, c.email, c.email2, c.email3
        FROM tbcliente c
        LEFT JOIN tbimovel i ON c.idImovel = i.idImovel AND c.idEmpresa = i.idEmpresa
        WHERE EXISTS (
            SELECT 1 FROM tbboleto b 
            WHERE b.idCliente = c.idCliente 
            AND b.pago = 0 
            AND b.cancelado = 0 
            AND b.dataVecto < CURDATE()
        )
    ");
    $clientes = $stmtClientes->fetchAll(PDO::FETCH_ASSOC);
    
    $pdoLocal->exec("TRUNCATE TABLE cache_clientes");
    if (!empty($clientes)) {
        $insertCliente = $pdoLocal->prepare("
            INSERT INTO cache_clientes (
                client_code, property_code, property_name, client_name, bloco, situacao, 
                fonece, dddce, foneco, dddco, email, email2, email3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $uniqueData = [];
        foreach ($clientes as $c) {
            $uniqueData[$c['client_code']] = $c;
        }
        $clientes = array_values($uniqueData);
        
        foreach ($clientes as $c) {
            $insertCliente->execute([
                $c['client_code'], $c['property_code'], $c['property_name'], $c['client_name'], 
                $c['bloco'], $c['situacao'],
                $c['fonece'], $c['dddce'], $c['foneco'], $c['dddco'], 
                $c['email'], $c['email2'], $c['email3']
            ]);
        }
    }

    // 3. Sincronizar Boletos Vencidos
    $stmtBoletos = $pdoCondado->query("
        SELECT idBoleto, idCliente as client_code, total, dataVecto 
        FROM tbboleto 
        WHERE pago = 0 AND cancelado = 0 AND dataVecto < CURDATE()
    ");
    $boletos = $stmtBoletos->fetchAll(PDO::FETCH_ASSOC);
    
    $pdoLocal->exec("TRUNCATE TABLE cache_boletos");
    if (!empty($boletos)) {
        $insertBoleto = $pdoLocal->prepare("INSERT INTO cache_boletos (idBoleto, client_code, total, dataVecto, numero_doc) VALUES (?, ?, ?, ?, ?)");
        foreach ($boletos as $b) {
            $insertBoleto->execute([
                $b['idBoleto'], $b['client_code'], 
                $b['total'], $b['dataVecto'], $b['idBoleto']
            ]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Sincronização concluída com sucesso!',
        'stats' => [
            'clientes_inadimplentes' => count($clientes),
            'boletos_vencidos' => count($boletos)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
