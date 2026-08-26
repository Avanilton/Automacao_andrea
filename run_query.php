<?php
require_once 'api/config.php';

try {
    $pdo = getCondadoConnection();
    
    $query1 = "
    SELECT
        SUM(
            CASE
                WHEN M.TIPOMVTO = 2
                    THEN (M.VALORRECEBIDO - M.TROCO)
                ELSE 0
            END
        ) AS valorCredito,

        SUM(
            CASE
                WHEN M.TIPOMVTO = 1
                    THEN M.VALORMVTO
                ELSE 0
            END
        ) AS valorDebito

    FROM tbCaixaMovi M
    WHERE M.IDEMPRESA = 75;
    ";

    $query2 = "
    SELECT
        *
    FROM tbConta
    WHERE IDEMPRESA = 75;
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
