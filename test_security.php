<?php
$baseUrl = 'http://localhost/Automacao_andrea-main/api';
$results = [];

function test($name, $expected, $actual) {
    global $results;
    $pass = (strpos($actual, $expected) !== false);
    $results[] = ['name' => $name, 'pass' => $pass, 'expected' => $expected, 'actual' => $actual];
    $status = $pass ? 'PASS' : 'FAIL';
    echo ($pass ? "\033[32m" : "\033[31m") . "[$status]\033[0m $name\n";
    if (!$pass) {
        echo "  Esperado: $expected\n";
        echo "  Recebido: $actual\n";
    }
}

function curl($url, $post = null, $cookies = '') {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    if ($post !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    }
    if ($cookies) {
        curl_setopt($ch, CURLOPT_COOKIE, $cookies);
    }
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

function extractSessionCookie($response) {
    preg_match('/Set-Cookie: ([^\r\n]+)/', $response, $matches);
    if ($matches) {
        preg_match('/PHPSESSID=([^;]+)/', $matches[1], $m);
        if ($m) return 'PHPSESSID=' . $m[1];
    }
    return '';
}

function getBody($response) {
    $parts = explode("\r\n\r\n", $response, 2);
    return $parts[1] ?? $parts[0];
}

echo "=== TESTES DE SEGURANÇA ===\n\n";

// --- TESTE 1: Endpoints sem autenticação ---
echo "--- 1. Acessar endpoints SEM LOGIN (deve retornar 401) ---\n";

$r = curl("$baseUrl/tasks.php?action=list");
test("tasks.php sem login", "autenticado", getBody($r));

$r = curl("$baseUrl/users.php?action=list");
test("users.php sem login", "autenticado", getBody($r));

$r = curl("$baseUrl/reports.php");
test("reports.php sem login", "autenticado", getBody($r));

$r = curl("$baseUrl/condado.php?action=fetch_data");
test("condado.php sem login", "autenticado", getBody($r));

$r = curl("$baseUrl/tickets.php?action=create", "subject=test&message=test");
test("tickets.php sem login", "autenticado", getBody($r));

$r = curl("$baseUrl/settings.php?action=save", '{"test":true}');
test("settings.php save sem login", "autenticado", getBody($r));

echo "\n";

// --- TESTE 2: Login ---
echo "--- 2. Login com credenciais corretas ---\n";

$r = curl("$baseUrl/auth.php?action=login", "email=admin@cobrancatask.com&password=password");
$body = getBody($r);
test("Login admin", '"success":true', $body);
$sessionCookie = extractSessionCookie($r);
echo "  Cookie: " . ($sessionCookie ? "obtido" : "FALHOU") . "\n\n";

// --- TESTE 3: Endpoints COM sessão admin ---
echo "--- 3. Acessar endpoints COM SESSÃO ADMIN (deve funcionar) ---\n";

$r = curl("$baseUrl/tasks.php?action=list", null, $sessionCookie);
test("tasks.php com admin", '"success":true', getBody($r));

$r = curl("$baseUrl/users.php?action=list", null, $sessionCookie);
test("users.php com admin", '"success":true', getBody($r));

$r = curl("$baseUrl/settings.php?action=get", null, $sessionCookie);
test("settings.php com admin", 'view_tarefas', getBody($r));

echo "\n";

// --- TESTE 4: Criar usuário comum e testar restrição ---
echo "--- 4. Criar usuário comum e testar restrições ---\n";

// Criar usuário
$testEmail = 'teste_' . time() . '@test.com';
$r = curl("$baseUrl/users.php?action=create", "name=TesteUser&email=$testEmail&password=123456", $sessionCookie);
$body = getBody($r);
test("Criar usuário teste", '"success":true', $body);

// Login como usuário comum
$r = curl("$baseUrl/auth.php?action=login", "email=$testEmail&password=123456");
$body = getBody($r);
test("Login usuário comum", '"success":true', $body);
$userCookie = extractSessionCookie($r);

// Tentar listar usuários (só admin)
$r = curl("$baseUrl/users.php?action=list", null, $userCookie);
test("User comum → users/list (deve negar)", "administradores", getBody($r));

// Tentar criar usuário (só admin)
$r = curl("$baseUrl/users.php?action=create", "name=Hacker&email=hacker@test.com&password=123456", $userCookie);
test("User comum → users/create (deve negar)", "administradores", getBody($r));

// Tentar salvar settings (só admin)
$r = curl("$baseUrl/settings.php?action=save", '{"test":true}', $userCookie);
test("User comum → settings/save (deve negar)", "administradores", getBody($r));

// Deletar usuário teste (só admin)
$r = curl("$baseUrl/users.php?action=delete", "id=99999", $userCookie);
test("User comum → users/delete (deve negar)", "administradores", getBody($r));

// Logar como admin e limpar
$r = curl("$baseUrl/auth.php?action=login", "email=admin@cobrancatask.com&password=password");
$adminCookie = extractSessionCookie($r);

echo "\n";

// --- RESUMO ---
$passed = count(array_filter($results, fn($r) => $r['pass']));
$count = count($results);
$failed = $count - $passed;
echo "=== RESULTADO: $passed de $count testes passaram ===\n";
if ($failed > 0) {
    echo "\033[31m$failed teste(s) FALHARAM\033[0m\n";
} else {
    echo "\033[32mTodos os testes passaram!\033[0m\n";
}
?>
