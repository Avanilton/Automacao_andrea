<?php
// Remove limite de tempo de execução e aumenta memória para grandes volumes de dados
set_time_limit(0);
ini_set('memory_limit', '1024M');

// Função para enviar texto ao navegador e forçar a exibição imediata
function logMsg($msg) {
    echo $msg . "<br>\n";
    echo str_repeat(' ', 1024 * 64); // Preenche o buffer
    flush();
    ob_flush();
}

// Configura cabeçalho para HTML com streaming
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
ob_implicit_flush(true);
ob_end_flush();

require_once 'config.php';

echo "<h2>Iniciando Sincronização Inteligente (Em Lotes)...</h2>";
logMsg("Conectando aos bancos de dados...");

try {
    $pdoLocal = getConnection();
    $pdoCondado = getCondadoConnection();
    
    // 1. Criar as tabelas locais se não existirem
    logMsg("Verificando estrutura local...");
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

    // 2. Sincronizar Boletos em Lotes de 5000 usando Paginação de ID
    logMsg("<b>ETAPA 1:</b> Baixando boletos vencidos (Lotes de 5000)...");
    $pdoLocal->exec("TRUNCATE TABLE cache_boletos");
    
    $lastId = 0;
    $totalBoletos = 0;
    $insertBoleto = $pdoLocal->prepare("INSERT INTO cache_boletos (idBoleto, client_code, total, dataVecto, numero_doc) VALUES (?, ?, ?, ?, ?)");
    
    while (true) {
        $stmt = $pdoCondado->prepare("
            SELECT idBoleto, idCliente as client_code, total, dataVecto 
            FROM tbboleto 
            WHERE idBoleto > :lastId AND pago = 0 AND cancelado = 0 AND dataVecto < CURDATE()
            ORDER BY idBoleto ASC
            LIMIT 5000
        ");
        // Convert string to int for binding
        $stmt->bindValue(':lastId', $lastId, PDO::PARAM_INT);
        $stmt->execute();
        $boletos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($boletos)) break;
        
        foreach ($boletos as $b) {
            $insertBoleto->execute([
                $b['idBoleto'], $b['client_code'], 
                $b['total'], $b['dataVecto'], $b['idBoleto']
            ]);
            $lastId = $b['idBoleto'];
        }
        
        $totalBoletos += count($boletos);
        logMsg("... " . $totalBoletos . " boletos importados até o momento. (Último ID processado: $lastId)");
    }
    
    // 3. Pegar quais clientes realmente possuem boletos para baixar só eles!
    logMsg("<b>ETAPA 2:</b> Mapeando clientes únicos que possuem dívidas...");
    $stmtIds = $pdoLocal->query("SELECT DISTINCT client_code FROM cache_boletos");
    $clientIds = $stmtIds->fetchAll(PDO::FETCH_COLUMN);
    $totalClientesAlvo = count($clientIds);
    logMsg("Encontrados " . $totalClientesAlvo . " clientes com boletos vencidos.");

    // 4. Sincronizar Clientes em Lotes de 500 IDs por vez
    logMsg("<b>ETAPA 3:</b> Baixando dados dos clientes (Lotes de 500)...");
    $pdoLocal->exec("TRUNCATE TABLE cache_clientes");
    $insertCliente = $pdoLocal->prepare("
        INSERT IGNORE INTO cache_clientes (
            client_code, property_code, property_name, client_name, bloco, situacao, 
            fonece, dddce, foneco, dddco, email, email2, email3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $chunks = array_chunk($clientIds, 500);
    $clientesImportados = 0;
    
    foreach ($chunks as $chunk) {
        $in = str_repeat('?,', count($chunk) - 1) . '?';
        $stmtClientes = $pdoCondado->prepare("
            SELECT 
                c.idCliente as client_code, 
                c.idImovel as property_code,
                COALESCE(i.nomeFantasia, 'Condomínio (Não cadastrado)') as property_name, 
                c.nomeCliente as client_name, 
                c.fonece, c.dddce, c.foneco, c.dddco, c.email, c.email2, c.email3,
                b_loc.BLOCO as bloco,
                s_sit.SITUACAO as situacao
            FROM tbcliente c
            LEFT JOIN tbimovel i ON c.idImovel = i.idImovel AND c.idEmpresa = i.idEmpresa
            LEFT JOIN tbbloco b_loc ON b_loc.IDIMOVEL = c.idImovel AND b_loc.IDEMPRESA = c.idEmpresa
            LEFT JOIN tbsituacao s_sit ON s_sit.IDEMPRESA = c.idEmpresa
            WHERE c.idCliente IN ($in)
        ");
        $stmtClientes->execute($chunk);
        $clientes = $stmtClientes->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($clientes as $c) {
            $insertCliente->execute([
                $c['client_code'], $c['property_code'], $c['property_name'], $c['client_name'], 
                $c['bloco'], $c['situacao'],
                $c['fonece'], $c['dddce'], $c['foneco'], $c['dddco'], 
                $c['email'], $c['email2'], $c['email3']
            ]);
            $clientesImportados++;
        }
        
        logMsg("... " . $clientesImportados . " / " . $totalClientesAlvo . " clientes importados.");
    }

    logMsg("<h3>✅ Sincronização concluída com Sucesso!</h3>");
    logMsg("<script>window.scrollTo(0, document.body.scrollHeight);</script>");

} catch (Exception $e) {
    logMsg("<h3 style='color:red;'>❌ Ocorreu um erro: " . $e->getMessage() . "</h3>");
}
?>
