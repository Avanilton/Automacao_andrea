<?php
// migrate_devolutiva.php — adiciona coluna `devolutiva` em task_updates (idempotente)
require_once __DIR__ . '/api/config.php';

try {
    $pdo = getConnection();
    $check = $pdo->query("SHOW COLUMNS FROM task_updates LIKE 'devolutiva'")->fetch();
    if ($check) {
        echo "OK: coluna devolutiva já existe.\n";
        exit(0);
    }
    $pdo->exec("ALTER TABLE task_updates ADD COLUMN devolutiva VARCHAR(100) NULL DEFAULT NULL AFTER content");
    echo "OK: coluna devolutiva criada.\n";
} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
