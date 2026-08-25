<?php
require_once 'api/config.php';

try {
    $pdo = getCondadoConnection();
    
    $query1 = "
    SELECT
        SUM(
            CASE
                WHEN M.tipoMvto = 2
                    THEN (M.valorRecebido - M.troco)
            END
        ) AS valorCredito,

        SUM(
            CASE
                WHEN M.tipoMvto = 1
                    THEN M.valorMvto
            END
        ) AS valorDebito,

        T.tipoPgto,
        M.idTipoPgto

    FROM tbCaixaMovi M,
         tbTipoPgto T

    WHERE M.id.idEmpresa = T.idEmpresa
      AND M.idTipoPgto = T.id.idTipoPgto
      AND M.id.idFuncionario = 1
      AND M.id.idEmpresa = 75
      AND M.transferido = false

    GROUP BY
        T.tipoPgto,
        M.idTipoPgto;
    ";

    $query2 = "
    SELECT
        *
    FROM tbConta
    WHERE inativo = 0
      AND id.idEmpresa = 75;
    ";

    $results = [];

    try {
        $stmt1 = $pdo->query($query1);
        $results['query1'] = $stmt1->fetchAll();
    } catch (Exception $e) {
        $results['query1_error'] = $e->getMessage();
    }

    try {
        $stmt2 = $pdo->query($query2);
        $results['query2'] = $stmt2->fetchAll();
    } catch (Exception $e) {
        $results['query2_error'] = $e->getMessage();
    }

    echo json_encode($results, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
