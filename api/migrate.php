<?php
require_once 'config.php';
try {
    $pdo = getConnection(); // the local task DB, not the Condado DB
    
    $queries = [
        "ALTER TABLE tasks ADD COLUMN bloco VARCHAR(255) DEFAULT NULL AFTER status",
        "ALTER TABLE tasks ADD COLUMN apto VARCHAR(255) DEFAULT NULL AFTER bloco",
        "ALTER TABLE tasks ADD COLUMN situacao VARCHAR(255) DEFAULT NULL AFTER apto"
    ];
    
    foreach ($queries as $q) {
        try {
            $pdo->exec($q);
            echo "Sucesso: $q<br>";
        } catch (PDOException $e) {
            echo "Erro: " . $e->getMessage() . "<br>";
        }
    }
    
} catch (Exception $e) {
    echo "Erro conexao: " . $e->getMessage();
}
?>
