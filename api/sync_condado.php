<?php
require_once 'config.php';

// Limpa qualquer buffer iniciado no config.php para mostrar texto instantaneamente
while (ob_get_level()) {
    ob_end_flush();
}

header('Content-Type: text/html; charset=utf-8');
session_start();

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$lastId = isset($_GET['lastId']) ? (int)$_GET['lastId'] : 0;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$pdoLocal = getConnection();
$pdoCondado = getCondadoConnection();

echo "<div style='font-family: Arial; text-align: center; margin-top: 50px;'>";
echo "<h2>🔄 Sincronização Inteligente em Andamento...</h2>";
echo "<p>Conectando aos bancos de dados...</p>";
flush(); // Força o envio pro navegador

try {
    if ($step === 1) {
        // ETAPA 1: Boletos
        if ($lastId === 0) {
            // Setup inicial das tabelas
            $pdoLocal->exec("
                CREATE TABLE IF NOT EXISTS cache_clientes (
                    client_code INT PRIMARY KEY, property_code INT, property_name VARCHAR(255),
                    client_name VARCHAR(255), bloco VARCHAR(50), situacao VARCHAR(100),
                    fonece VARCHAR(50), dddce VARCHAR(10), foneco VARCHAR(50), dddco VARCHAR(10),
                    email VARCHAR(255), email2 VARCHAR(255), email3 VARCHAR(255)
                );
                CREATE TABLE IF NOT EXISTS cache_boletos (
                    idBoleto INT PRIMARY KEY, client_code INT, total DECIMAL(10,2),
                    dataVecto DATE, numero_doc VARCHAR(100)
                );
                TRUNCATE TABLE cache_boletos;
            ");
            echo "<p>Preparando banco de dados local...</p>";
        }

        echo "<p>Baixando boletos... (Processando a partir do ID: $lastId)</p>";
        flush(); // Força envio pro navegador
        
        $stmt = $pdoCondado->prepare("
            SELECT idBoleto, idCliente as client_code, total, dataVecto 
            FROM tbboleto 
            WHERE idBoleto > :lastId AND pago = 0 AND cancelado = 0 AND dataVecto < CURDATE()
            ORDER BY idBoleto ASC LIMIT 5000
        ");
        $stmt->bindValue(':lastId', $lastId, PDO::PARAM_INT);
        $stmt->execute();
        $boletos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($boletos)) {
            echo "<p>Todos os boletos foram importados!</p>";
            echo "<meta http-equiv='refresh' content='1; url=?step=2&offset=0'>";
        } else {
            $insertBoleto = $pdoLocal->prepare("INSERT INTO cache_boletos (idBoleto, client_code, total, dataVecto, numero_doc) VALUES (?, ?, ?, ?, ?)");
            foreach ($boletos as $b) {
                $insertBoleto->execute([$b['idBoleto'], $b['client_code'], $b['total'], $b['dataVecto'], $b['idBoleto']]);
                $lastId = $b['idBoleto'];
            }
            echo "<p>✔ " . count($boletos) . " boletos inseridos. Redirecionando para o próximo lote...</p>";
            echo "<meta http-equiv='refresh' content='1; url=?step=1&lastId=$lastId'>";
        }
    } 
    elseif ($step === 2) {
        // ETAPA 2: Clientes
        if ($lastId === 0) {
            $pdoLocal->exec("TRUNCATE TABLE cache_clientes");
        }

        echo "<p>Baixando dados de TODOS os clientes e condomínios... (Processando a partir do ID: $lastId)</p>";
        flush();

        // Busca os imóveis para memória
        $stmtImoveis = $pdoCondado->query("SELECT * FROM tbimovel");
        $imoveis = [];
        if ($stmtImoveis) {
            while ($row = $stmtImoveis->fetch(PDO::FETCH_ASSOC)) {
                $rowLower = array_change_key_case($row, CASE_LOWER);
                $empresa = (int)(isset($rowLower['idempresa']) ? $rowLower['idempresa'] : 0);
                $imovel = (int)(isset($rowLower['idimovel']) ? $rowLower['idimovel'] : 0);
                $nome = trim(isset($rowLower['nomefantasia']) ? (string)$rowLower['nomefantasia'] : 'Condomínio Sem Nome');
                
                if ($empresa !== 0) {
                    $imoveis[$empresa . '_' . $imovel] = $nome;
                }
                $imoveis[$imovel] = $nome; 
            }
        }

        // Busca blocos para memória (simulando MIN)
        $stmtBlocos = $pdoCondado->query("SELECT * FROM tbbloco");
        $blocos = [];
        if ($stmtBlocos) {
            while ($row = $stmtBlocos->fetch(PDO::FETCH_ASSOC)) {
                $rowLower = array_change_key_case($row, CASE_LOWER);
                $empresa = (int)(isset($rowLower['idempresa']) ? $rowLower['idempresa'] : 0);
                $imovel = (int)(isset($rowLower['idimovel']) ? $rowLower['idimovel'] : 0);
                $bloco = trim(isset($rowLower['bloco']) ? (string)$rowLower['bloco'] : '');
                
                $key = $empresa . '_' . $imovel;
                if (!isset($blocos[$key]) || strcmp($bloco, $blocos[$key]) < 0) {
                    $blocos[$key] = $bloco;
                }
            }
        }

        // Busca situações para memória (simulando MIN)
        $stmtSituacoes = $pdoCondado->query("SELECT * FROM tbsituacao");
        $situacoes = [];
        if ($stmtSituacoes) {
            while ($row = $stmtSituacoes->fetch(PDO::FETCH_ASSOC)) {
                $rowLower = array_change_key_case($row, CASE_LOWER);
                $empresa = (int)(isset($rowLower['idempresa']) ? $rowLower['idempresa'] : 0);
                $situacao = trim(isset($rowLower['situacao']) ? (string)$rowLower['situacao'] : '');
                
                if (!isset($situacoes[$empresa]) || strcmp($situacao, $situacoes[$empresa]) < 0) {
                    $situacoes[$empresa] = $situacao;
                }
            }
        }

        $stmtClientes = $pdoCondado->prepare("
            SELECT c.idEmpresa, c.idCliente as client_code, c.idImovel as property_code,
                   c.nomeCliente as client_name, c.fonece, c.dddce, c.foneco, c.dddco, c.email, c.email2, c.email3
            FROM tbcliente c
            WHERE c.idCliente > :lastId
            ORDER BY c.idCliente ASC LIMIT 1000
        ");
        $stmtClientes->bindValue(':lastId', $lastId, PDO::PARAM_INT);
        $stmtClientes->execute();
        $clientes = $stmtClientes->fetchAll(PDO::FETCH_ASSOC);

        if (empty($clientes)) {
            echo "<p>Todos os clientes foram importados!</p>";
            echo "<meta http-equiv='refresh' content='1; url=?step=3'>";
        } else {
            $insertCliente = $pdoLocal->prepare("
                INSERT IGNORE INTO cache_clientes (client_code, property_code, property_name, client_name, bloco, situacao, fonece, dddce, foneco, dddco, email, email2, email3) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($clientes as $c) {
                $cLower = array_change_key_case($c, CASE_LOWER);
                $emp = (int)(isset($cLower['idempresa']) ? $cLower['idempresa'] : 0);
                $imo = (int)(isset($cLower['property_code']) ? $cLower['property_code'] : 0);
                
                $keyCompleta = $emp . '_' . $imo;
                
                if (isset($imoveis[$keyCompleta])) {
                    $propName = $imoveis[$keyCompleta];
                } elseif (isset($imoveis[$imo]) && $imo !== 0) {
                    $propName = $imoveis[$imo];
                } else {
                    $propName = 'Condomínio (Não cadastrado) - ID: ' . $imo;
                }
                
                $blocoName = isset($blocos[$keyCompleta]) ? $blocos[$keyCompleta] : NULL;
                $sitName = isset($situacoes[$emp]) ? $situacoes[$emp] : NULL;
                
                $insertCliente->execute([
                    $cLower['client_code'] ?? 0, $imo, $propName, $cLower['client_name'] ?? '', 
                    $blocoName, $sitName, $cLower['fonece'] ?? '', $cLower['dddce'] ?? '', $cLower['foneco'] ?? '', $cLower['dddco'] ?? '', 
                    $cLower['email'] ?? '', $cLower['email2'] ?? '', $cLower['email3'] ?? ''
                ]);
                $lastId = $cLower['client_code'] ?? $lastId;
            }
            
            echo "<p>✔ Mais " . count($clientes) . " clientes inseridos. Redirecionando para o próximo lote...</p>";
            echo "<meta http-equiv='refresh' content='1; url=?step=2&lastId=$lastId'>";
        }
    } 
    elseif ($step === 3) {
        // CONCLUÍDO
        $countBol = $pdoLocal->query("SELECT COUNT(*) FROM cache_boletos")->fetchColumn();
        $countCli = $pdoLocal->query("SELECT COUNT(*) FROM cache_clientes")->fetchColumn();
        echo "<h2 style='color:green;'>✅ Sincronização Concluída com Sucesso!</h2>";
        echo "<p><strong>Total de Boletos Vencidos:</strong> $countBol</p>";
        echo "<p><strong>Total de Clientes Inadimplentes:</strong> $countCli</p>";
        echo "<p><a href='../index.html'>Voltar para o sistema</a></p>";
    }
} catch (Exception $e) {
    echo "<h3 style='color:red;'>❌ Ocorreu um erro: " . $e->getMessage() . "</h3>";
}
echo "</div>";
?>
