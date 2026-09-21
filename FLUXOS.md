# Fluxos do Sistema Cobrança Task

**Versão:** 1.5.0  
**Última atualização:** 21/09/2026

---

## Índice

1. [Login](#1-login)
2. [Criar Tarefas (Condado)](#2-criar-tarefas-condado)
3. [Distribuir Tarefas](#3-distribuir-tarefas)
4. [Kanban (Mover Cards)](#4-kanban-mover-cards)
5. [Detalhes da Tarefa](#5-detalhes-da-tarefa)
6. [Importar Planilha](#6-importar-planilha)
7. [Gerenciar Usuários](#7-gerenciar-usuários)
8. [Permissões](#8-permissões)
9. [Relatórios](#9-relatórios)
10. [Chamados (Tickets)](#10-chamados-tickets)
11. [Lixeira (Restaurar/Excluir)](#11-lixeira-restaurarexcluir)
12. [Configurações e Perfil](#12-configurações-e-perfil)
13. [Integração Condado (Sync)](#13-integração-condado-sync)
14. [Desenvolvimento](#14-desenvolvimento)

---

## 1. Login

**Objetivo:** Autenticar o usuário e criar sessão.

```
index.html → login.html → dashboard.html
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Clica "Área do Usuário" na landing page | Navega para `login.html` |
| 2 | Preenche e-mail e senha | — |
| 3 | Clica "Entrar" | — |
| 4 | — | JS envia POST para `api/auth.php?action=login` |
| 5 | — | PHP checa rate-limit (5 erros/15min = 429 por 5min), valida com `password_verify()`, regenera ID da sessão + CSRF novo, retorna dados do usuário + `csrf_token` |
| 6 | — | JS salva sessão no `localStorage` (`cobranca_user` + `cobranca_csrf`) |
| 7 | — | Redireciona para `dashboard.html` |

### Checar sessão e logout (v1.5.0)

- `GET api/auth.php?action=check` → `{success:true, user:{id, role}}` se vale; `401` se expirada (inclui timeout 10min).
- Logout agora via `POST api/auth.php?action=logout` com `X-CSRF-Token` (GET antigo ainda aceito); limpa sessão + cookie `PHPSESSID`.
- Cookie de sessão: `httponly` + `samesite=Lax` + `secure` em HTTPS.

### CSRF nos POSTs seguintes

Todo POST posterior envia o header `X-CSRF-Token` (wrapper do `fetch` em `js/app.js:3-13`). O backend valida com `requireCsrf()` e retorna HTTP 403 se o token for inválido.

### Detalhes Técnicos

**Arquivos envolvidos:**
- `login.html:23` — formulário
- `js/auth.js:56-88` — handler do login
- `api/auth.php:8-31` — processamento PHP

**Requisição:**
```
POST api/auth.php?action=login
FormData: email, password
```

**Resposta:**
```json
{
  "success": true,
  "user": { "id": 1, "name": "Admin", "email": "...", "role": "admin" },
  "csrf_token": "a8f3b2..."
}
```

**Sessão:**
- PHP: `$_SESSION['user_id']`, `$_SESSION['role']` e `$_SESSION['csrf_token']`
- Browser: `localStorage` com `cobranca_user` e `cobranca_csrf`

**Timer de inatividade:** 10 minutos (`js/auth.js:27-53`). Após idle, faz logout automático.

**Segurança pós-login:** Todos os endpoints da API (exceto `login`) verificam `$_SESSION['user_id']` via `requireAuth()`. Sem sessão válida, retorna HTTP 401.

---

## 2. Criar Tarefas (Condado)

**Objetivo:** Buscar clientes no Condado e criar tarefas de cobrança.

```
Botão "Criar Tarefas" → Modal de busca → Selecionar clientes → Distribuir → Tarefas criadas
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Clica "Criar tarefas" | `openCreateTaskModal()` abre modal |
| 2 | — | `fetchCondadoData('')` busca primeiros 50 clientes do cache |
| 3 | Digita termo de busca | Filtra resultados em tempo real |
| 4 | Marca checkboxes dos clientes | Seleciona quais criar |
| 5 | Clica "Distribuir Selecionados" | Abre modal de distribuição |
| 6 | Seleciona usuário no dropdown | — |
| 7 | Clica "Confirmar Distribuição" | Envia para API |

### Detalhes Técnicos

**Arquivos envolvidos:**
- `js/app.js:1007-1020` — `openCreateTaskModal()`
- `js/app.js:1022-1115` — `fetchCondadoData()`
- `js/app.js:1117-1143` — handler "Distribuir Selecionados"
- `js/app.js:1146-1199` — handler "Confirmar Distribuição"
- `api/condado.php:11-53` — busca no cache local
- `api/tasks.php:81-116` — inserção no banco

**Requisição de busca:**
```
GET api/condado.php?action=fetch_data&search=termo
```

**Requisição de criação:**
```
POST api/tasks.php?action=create
Content-Type: application/json
{
  "assigned_to": 103,
  "tasks": [
    {
      "property_name": "Apt 101 - Bloco A",
      "client_code": "C001",
      "client_name": "João Silva",
      "value": 1500.00,
      "bloco": "A",
      "apto": "101",
      "situacao": "ATIVO"
    }
  ]
}
```

**Banco de dados:**
- Tabela `tasks`: INSERT com `status = 'todo'`, `assigned_to`, `created_by`

---

## 3. Distribuir Tarefas

**Objetivo:** Atribuir tarefas existentes a um usuário.

> Nota: Na prática, a distribuição acontece junto com a criação (Fluxo 2). Este fluxo é o passo específico de selecionar o usuário.

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | No modal de distribuição, abre o dropdown | Lista usuários de `window.currentLoadedUsers` |
| 2 | Seleciona um usuário | — |
| 3 | Clica "Confirmar Distribuição" | Monta payload com `assigned_to` |
| 4 | — | POST para `api/tasks.php?action=create` |
| 5 | — | PHP insere tarefas com `assigned_to` definido |
| 6 | — | `loadTarefas()` e `loadKanbanCards()` recarregam |

---

## 4. Kanban (Mover Cards)

**Objetivo:** Alterar o status de uma tarefa arrastando o card entre colunas.

```
Coluna "A Fazer" → arrasta → Coluna "Atendendo"
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Clica e segura em um card | `dragCard()` salva o ID do card |
| 2 | Arrasta para outra coluna | Browser mostra preview do card |
| 3 | Solta na coluna destino | `dropCard()` move o card no DOM |
| 4 | — | Lê `data-status` da coluna destino |
| 5 | — | POST para `api/tasks.php?action=update_status` |
| 6 | — | PHP faz `UPDATE tasks SET status = ?` |
| 7 | — | `loadTarefas()` e `loadKanbanCards()` recarregam |

### Detalhes Técnicos

**Arquivos envolvidos:**
- `js/app.js:1215-1217` — `dragCard()`
- `js/app.js:1219-1253` — `dropCard()`
- `api/tasks.php:153-162` — `update_status`

**Status possíveis:**
| Status | Coluna | Cor |
|--------|--------|-----|
| `todo` | A Fazer | Cinza `#64748B` |
| `in_progress` | Atendendo | Azul `#3B82F6` |
| `done` | Finalizado | Verde `#10B981` |

**Requisição:**
```
POST api/tasks.php?action=update_status
FormData: task_id, status
```

**Colunas personalizadas:** Usuário pode adicionar colunas via " + Adicionar Coluna". Colunas ficam em memória (`localColumns`) e são perdidas ao recarregar a página.

---

## 5. Detalhes da Tarefa

**Objetivo:** Visualizar e editar informações detalhadas de uma tarefa.

```
Clica "Abrir" (lista) ou card (Kanban) → Modal de detalhes
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Clica "Abrir" ou no card | `openTaskDetails(id)` abre modal |
| 2 | — | Busca tarefa em `window.currentLoadedTasks` |
| 3 | — | Busca dados do cliente no Condado |
| 4 | Visualiza dados | Nome, cliente, status, contatos, boletos |
| 5 | Altera status no dropdown | `changeTaskStatus()` atualiza via API |
| 6 | Adiciona observação | `saveTaskDetails()` salva |
| 7 | Adiciona atendimento | `saveUpdate()` insere nota + muda status para `in_progress` |
| 8 | Reatribui tarefa | `reassignTaskToUser()` muda `assigned_to` |
| 9 | Compartilha | `shareTaskWithUser()` insere em `task_shares` |
| 10 | Fecha modal | — |

### Detalhes Técnicos

**Funções principais:**
- `openTaskDetails()` — `js/app.js:1514-1759`
- `changeTaskStatus()` — `js/app.js:1823-1840`
- `saveTaskDetails()` — `js/app.js:1691-1731`
- `saveUpdate()` — `js/app.js:1931-1970`
- `reassignTaskToUser()` — `js/app.js:1774-1788`
- `shareTaskWithUser()` — `js/app.js:1790-1805`
- `unshareTaskWithUser()` — `js/app.js:1807-1821`

**Auto-mudança de status:** Ao adicionar um atendimento, se o status for `todo`, muda automaticamente para `in_progress` (`api/tasks.php:174`).

**Endpoints utilizados:**
```
POST api/tasks.php?action=update_status    → mudar status
POST api/tasks.php?action=update_details  → salvar observações/datas
POST api/tasks.php?action=add_update      → adicionar atendimento (+ replica externa via syncActivityToExternal)
POST api/tasks.php?action=reassign        → reatribuir
POST api/tasks.php?action=share_task      → compartilhar
POST api/tasks.php?action=unshare_task    → remover compartilhamento
```

---

## 6. Importar Planilha

**Objetivo:** Importar tarefas em lote de uma planilha Excel (.xls/.xlsx).

```
Botão "Importar Planilha" → Selecionar arquivo → Processar → Confirmar → Tarefas criadas
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Clica "Importar Planilha" (admin) | Abre seletor de arquivo |
| 2 | Seleciona arquivo .xls ou .xlsx | — |
| 3 | — | SheetJS lê e processa o arquivo |
| 4 | — | Mapeia colunas para campos de tarefa |
| 5 | — | Mapeia nome do responsável para ID do usuário |
| 6 | Confirma importação | Envia para API |
| 7 | — | PHP insere em lote via transação |

### Detalhes Técnicos

**Arquivos envolvidos:**
- `js/app.js:472-476` — handler de mudança no input
- `js/app.js:478-491` — `handleTasksImport()`
- `js/app.js:493-597` — `processExcelFile()` (usa SheetJS/XLSX)
- `js/app.js:599-619` — `sendImportRequest()`
- `api/tasks.php:118-151` — `import_bulk`

**Mapeamento de colunas Excel:**
| Coluna | Campo |
|--------|-------|
| 0 | `client_code` (documento do morador) |
| 1 | `client_name` (nome do morador) |
| 2 | `bloco` (bloco/apartamento) |
| 3 | `due_date` (data de vencimento) |
| 4 | `observations` (encargos) |
| 5 | `value` (total da dívida) |
| 6 | `property_name` (nome do condomínio) |
| 7 | `assigned_to` (responsável — mapeado por nome) |

**Requisição:**
```
POST api/tasks.php?action=import_bulk
Content-Type: application/json
{ "tasks": [...] }
```

---

## 7. Gerenciar Usuários

**Objetivo:** Criar, editar e excluir usuários do sistema (apenas admin). Usuários comuns podem editar apenas seu próprio perfil.

### Criar Usuário (Admin)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Clica "+ Novo Usuário" | Abre modal com formulário |
| 2 | Preenche nome, e-mail, senha | — |
| 3 | Clica "Cadastrar" | `saveUser()` envia POST |
| 4 | — | `requireAdmin()` valida acesso; PHP valida e-mail único, faz `password_hash()`, insere com role='user' |
| 5 | — | `loadUsers()` recarrega lista |

### Editar Usuário (Admin)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Clica "Editar" | `editUser(id)` preenche modal com dados |
| 2 | Altera campos (incluindo role) | — |
| 3 | Clica "Cadastrar" | `saveUser()` envia POST com `action=update` |
| 4 | — | `requireAdmin()` valida acesso; PHP atualiza (com ou sem nova senha) |

### Excluir Usuário (Admin)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Clica "Excluir" | `deleteUser(id)` pede confirmação |
| 2 | Confirma | POST para `api/users.php?action=delete` |
| 3 | — | `requireAdmin()` valida acesso; PHP exclui (usuário ID 1 não pode ser excluído) |

### Editar Próprio Perfil (Qualquer Usuário Logado)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Vai em Configurações | Formulário com nome e e-mail |
| 2 | Altera dados | — |
| 3 | Clica "Salvar Perfil" | `saveProfile()` envia POST para `update_profile` |
| 4 | — | `requireAuth()` valida login; PHP atualiza apenas name/email do próprio usuário |
| 5 | — | **Não é possível alterar o próprio cargo** (role ignore) |

### Detalhes Técnicos

**Endpoints:**
```
GET  api/users.php?action=list            → listar (admin)
POST api/users.php?action=create          → criar (admin)
POST api/users.php?action=update          → editar (admin)
POST api/users.php?action=delete          → excluir (admin)
POST api/users.php?action=update_profile  → autoatendimento (qualquer logado)
POST api/users.php?action=update_avatar   → upload de avatar (qualquer logado)
```

**Segurança:**
- `list`, `create`, `update`, `delete` → `requireAdmin()` (HTTP 403 se não for admin)
- `update_profile`, `update_avatar` → `requireAuth()` (HTTP 401 se não estiver logado)
- `create` força role='user' — cargo só é definido pelo admin via `update`

---

## 8. Permissões

**Objetivo:** Controlar quais telas e funcionalidades os usuários padrão podem acessar.

```
Admin: Configurações → Permissões → Altera checkboxes → Salva → Efeito imediato
```

### Passo a passo

| # | Ação do Usuário | O que acontece |
|---|-----------------|----------------|
| 1 | Admin vai em Configurações | — |
| 2 | Clica "Gerenciar Permissões" | `loadPermissions()` popula checkboxes |
| 3 | Marca/desmarca permissões | — |
| 4 | Clica "Salvar Alterações" | `savePermissions()` envia POST |
| 5 | — | PHP salva em `api/settings.json` |
| 6 | — | `applySidebarPermissions()` esconde/mostra itens da sidebar |
| 7 | — | Toast de confirmação |

### Permissões disponíveis

| Permissão | Efeito |
|-----------|--------|
| `view_tarefas` | Mostra/esconde "Tarefas" na sidebar |
| `create_task` | Mostra/esconde botão "Criar Tarefas" |
| `distribute_task` | Controle de distribuição |
| `view_kanban` | Mostra/esconde "Kanban" na sidebar |
| `view_reports` | Mostra/esconde "Relatórios" na sidebar |
| `view_trash` | Mostra/esconde "Lixeira" na sidebar |
| `view_config` | Mostra/esconde "Configurações" na sidebar |

### Detalhes Técnicos

**Arquivos envolvidos:**
- `js/app.js:64-77` — carregamento inicial de permissões
- `js/app.js:85-103` — `applySidebarPermissions()`
- `js/app.js:622-645` — `loadPermissions()`
- `js/app.js:647-673` — `savePermissions()`
- `js/app.js:409-423` — guard em `loadView()`
- `js/app.js:960-976` — guard no click da sidebar
- `api/settings.php` — leitura/escrita do JSON
- `api/settings.json` — armazenamento

**Guard de navegação:** Tenta acessar uma tela sem permissão → `showToast('Você não tem permissão para acessar esta tela.', 'error')`

---

## 9. Relatórios

**Objetivo:** Visualizar estatísticas e rankings de atendimentos.

```
Sidebar: Relatórios → Dados carregados → Top 5 + modal completo
```

### Passo a passo

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Clica "Relatórios" na sidebar | `loadRelatorios()` é chamado |
| 2 | — | GET para `api/reports.php` |
| 3 | — | PHP executa 3 queries (total, ranking atendentes, ranking imóveis) |
| 4 | — | Retorna top 5 + lista completa de atendentes |
| 5 | Visualiza cards | Total, Top 5 Atendentes, Top 5 Imóveis |
| 6 | Clica "Ver todos" (se >5) | `openRankingModal()` abre modal com lista completa |

### Detalhes Técnicos

**Endpoints:**
```
GET api/reports.php
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_atendimentos": 984,
    "ranking_atendentes": [...top 5...],
    "ranking_atendentes_all": [...todos...],
    "ranking_imoveis": [...top 5...]
  }
}
```

**Filtro por papel:** Usuários padrão só veem tarefas atribuídas a eles ou compartilhadas.

---

## 10. Chamados (Tickets)

**Objetivo:** Sistema de suporte para abrir e acompanhar chamados.

### Abrir Chamado (Usuário)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Vai em Ajuda | Visualiza formulário de chamado |
| 2 | Preenche assunto e descrição | — |
| 3 | Clica "Enviar Chamado" | `sendTicket()` envia POST (apenas subject + message) |
| 4 | — | `requireAuth()` valida login |
| 5 | — | PHP obtém id, nome e e-mail do usuário **da sessão** (não do request) |
| 6 | — | PHP insere na tabela `tickets` |
| 7 | — | Feedback com número do chamado |

> **Segurança:** Os dados do usuário (id, nome, e-mail) são obtidos da sessão PHP no servidor. O cliente envia apenas assunto e descrição.

### Gerenciar Chamados (Admin)

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Vai em Configurações | `loadTickets()` carrega chamados |
| 2 | Visualiza tabela | ID, usuário, assunto, data, status |
| 3 | Clica "Iniciar" | Status → `em_andamento` |
| 4 | Clica "Resolver" | Status → `resolvido` |
| 5 | Clica "Ver" | `viewTicket()` abre modal com detalhes |

### Detalhes Técnicos

**Endpoints:**
```
POST api/tickets.php?action=create        → abrir chamado (logado)
GET  api/tickets.php?action=list          → listar (admin)
POST api/tickets.php?action=update_status → alterar status (admin)
```

**Status possíveis:** `aberto`, `em_andamento`, `resolvido`

---

## 11. Lixeira (Restaurar/Excluir)

**Objetivo:** Gerenciar tarefas excluídas (soft delete).

### Passo a passo

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Exclui tarefa (lista ou detalhes) | `deleteServerTask()` — soft delete |
| 2 | — | `UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP` |
| 3 | Admin vai na Lixeira | `loadLixeira()` carrega itens excluídos |
| 4 | Clica "Restaurar" | `restoreTrash()` — `deleted_at = NULL` |
| 5 | Clica "Excluir Permanente" | `forceDeleteTrash()` — `DELETE FROM tasks` |

### Detalhes Técnicos

**Endpoints:**
```
POST api/tasks.php?action=soft_delete   → move para lixeira
GET  api/tasks.php?action=list_trash    → lista excluídos
POST api/tasks.php?action=restore       → restaura
POST api/tasks.php?action=force_delete  → exclui permanentemente
```

**Proteção:** Exclusão permanente pede confirmação "Esta ação não pode ser desfeita".

---

## 12. Configurações e Perfil

**Objetivo:** Gerenciar dados pessoais, senha e avatar.

### Alterar Perfil

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Vai em Configurações | Formulário com nome e e-mail |
| 2 | Altera dados | — |
| 3 | Clica "Salvar Perfil" | `saveProfile()` envia POST |
| 4 | — | PHP atualiza `users` |
| 5 | — | Atualiza `localStorage` e sidebar |

### Alterar Senha

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Preenche senha atual + nova senha | — |
| 2 | Clica "Atualizar Senha" | `changePassword()` valida e envia |
| 3 | — | PHP verifica senha atual, faz hash da nova |

### Alterar Avatar

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Clica no avatar na sidebar | Abre seletor de arquivo |
| 2 | Seleciona imagem | — |
| 3 | — | `handleAvatarUpload()` envia FormData |
| 4 | — | PHP salva em `img/` e atualiza `users.avatar` |
| 5 | — | Atualiza sidebar e localStorage |

### Detalhes Técnicos

**Endpoints:**
```
POST api/users.php?action=update        → salvar perfil
POST api/auth.php?action=change_password → mudar senha
POST api/users.php?action=update_avatar  → upload avatar
```

**Validações de senha:** mínimo 6 caracteres, confirmação deve coincidir.

---

## 13. Integração Condado (Sync)

**Objetivo:** Sincronizar dados externos (clientes, boletos) do sistema Condado para o cache local.

```
Acesso manual → sync_condado.php → Passo 1 (boletos) → Passo 2 (clientes) → Concluído
```

### Passo a passo

| # | Ação | O que acontece |
|---|------|----------------|
| 1 | Acessa `api/sync_condado.php` (admin logado) | `requireAdmin()` valida; sem admin retorna 403 |
| 2 | Passo 1: Boletos | Conecta ao Condado, paga boletos em aberto |
| 3 | — | Insere em `cache_boletos` (lotes de 5000) |
| 4 | Passo 2: Clientes | Paga clientes, imóveis, blocos, situações |
| 5 | — | Insere em `cache_clientes` (lotes de 1000) |
| 6 | Concluído | Mostra totais sincronizados |

### Detalhes Técnicos

**Arquivo:** `api/sync_condado.php` (195 linhas)

**Mecanismo de auto-refresh:** Usa `<meta http-equiv='refresh' content='1; url=...'>` para processar em lotes sem timeout.

**Tabelas de cache:**
| Tabela | Dados |
|--------|-------|
| `cache_boletos` | ID, código do cliente, total, data de vencimento |
| `cache_clientes` | Código, imóvel, nome, bloco, situação, telefones, e-mails |

**Uso pelo sistema:** A tela de "Criar Tarefas" busca dados deste cache via `api/condado.php`.

---

## Resumo de Endpoints

| Endpoint | Métodos | Acesso | Ações |
|----------|---------|--------|-------|
| `api/auth.php` | GET, POST | Público (login) / Logado (demais) | login, logout, check, change_password |
| `api/tasks.php` | GET, POST | Logado (truncate: admin) | list, create, update_status, soft_delete, restore, force_delete, truncate_tasks, update_details, add_update, reassign, share_task, unshare_task, import_bulk, list_trash |
| `api/users.php` | GET, POST | Admin (list/create/update/delete) / Logado (update_profile/update_avatar) | list, create, update, delete, update_profile, update_avatar |
| `api/reports.php` | GET | Logado | Relatórios e rankings |
| `api/settings.php` | GET, POST | Logado (get) / Admin (save) | get, save permissões |
| `api/tickets.php` | GET, POST | Logado (create) / Admin (list/update_status) | create, list, update_status |
| `api/condado.php` | GET | Logado | fetch_data, fetch_client_details |
| `api/external_sync.php` | POST | Logado (dono/compartilhado/admin) | push_activity (esqueleto, replica atendimento em JSON) |
| `api/sync_condado.php` | GET | **Admin** | Sincronização completa |

---

## Diagrama de Navegação

```
index.html
  └── login.html
        └── dashboard.html (SPA)
              ├── Tarefas (loadTarefas)
              │     ├── Criar Tarefas (modal Condado)
              │     ├── Importar Planilha (Excel)
              │     └── Abrir Detalhes (modal)
              │           ├── Atualizar Status
              │           ├── Adicionar Observação
              │           ├── Adicionar Atendimento
              │           ├── Reatribuir
              │           └── Compartilhar
              ├── Kanban (loadKanbanCards)
              │     ├── Arrastar Cards
              │     └── Adicionar Coluna
              ├── Relatórios (loadRelatorios)
              │     └── Ver Todos (modal ranking)
              ├── Configurações
              │     ├── Perfil (salvar/atualizar)
              │     ├── Senha
              │     ├── Avatar
              │     ├── Permissões (admin)
              │     └── Chamados (admin)
              ├── Usuários (admin)
              │     ├── Criar
              │     ├── Editar
              │     └── Excluir
              ├── Lixeira (admin)
              │     ├── Restaurar
              │     └── Excluir Permanentemente
              └── Ajuda
                    └── Abrir Chamado
```

---

## 14. Desenvolvimento

**Objetivo:** Documentar a sequência de desenvolvimento, desde a edição do código até o deploy em produção.

### Ferramentas Utilizadas

| Ferramenta | Uso |
|------------|-----|
| **VS Code** | Editor de código principal |
| **Git** | Controle de versão |
| **GitHub** | Repositório remoto (backup e colaboração) |
| **XAMPP** | Servidor local (Apache + MySQL) |
| **VS Code SFTP Extension** | Upload automático para produção |
| **GitHub Actions** | Deploy automático via FTP |

### Sequência de Desenvolvimento

```
1. Abrir VS Code
       ↓
2. Editar os arquivos
       ↓
3. Salvar (Ctrl+S)
       ↓
4. Testar no navegador local
   http://localhost/Automacao_andrea-main/login.html
       ↓
5. Verificar se está funcionando
       ↓
6. Abrir terminal no VS Code (Ctrl+`)
       ↓
7. Verificar o que mudou
   git status
       ↓
8. Adicionar arquivos ao staging
   git add arquivo1.php arquivo2.js
       ↓
9. Criar commit com mensagem descritiva
   git commit -m "feat: descricao da alteracao"
       ↓
10. Enviar para o GitHub
    git push origin versoes
       ↓
11. (Opcional) Deploy para produção
```

### Estratégia de Branches

```
avanilton/main (repositório original)
      ↓ (fork)
origin/modificados (branch principal do fork)
      ↓
origin/versoes (branch de trabalho e versões)
      ↓
fix/* (branches de correção temporárias)
```

| Branch | Uso |
|--------|-----|
| `versoes` | Branch principal de trabalho — todas as alterações vão aqui |
| `fix/*` | Branches temporárias para correções específicas |
| `main` (avanilton) | Repositório original (upstream) |

### Convenção de Commits

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `feat:` | Nova funcionalidade | `feat: Paginacao de tarefas com botao Carregar Mais` |
| `fix:` | Correção de bug | `fix: Permissoes nao aplicadas na sidebar` |
| `docs:` | Documentação | `docs: Guia de uso para usuario final` |
| `chore:` | Manutenção | `chore: gitignore atualizado` |
| `Fix:` | Correção (alternativo) | `Fix: task_id dinamico ao salvar atendimento` |

### 2 Caminhos de Deploy

#### Caminho 1: VS Code SFTP (Upload Automático)

```
Editar arquivo → Salvar → VS Code SFTP envia para FTP → Produção atualizada
```

- **Configuração:** `.vscode/sftp.json`
- **Como funciona:** A extensão SFTP do VS Code detecta quando você salva um arquivo e faz upload automático para o servidor
- **Quando usar:** Para correções rápidas e alterações pequenas
- **Atenção:** Não passa pelo Git — não fica registrado no histórico

#### Caminho 2: GitHub Actions (Deploy Automático)

```
Commit → Push para main → GitHub Actions dispara → FTP-Deploy envia para cPanel → Produção atualizada
```

- **Configuração:** `.github/workflows/deploy.yml`
- **Como funciona:** Ao fazer push para a branch `main`, o GitHub Actions executa um workflow que envia todos os arquivos via FTP
- **Quando usar:** Para versões completas e alterações maiores
- **Vantagem:** Fica registrado no Git — pode voltar atrás se der problema

### Checklist Antes de Commitar

Antes de criar um commit, verifique:

- [ ] **Testou no navegador local?** — Acesse `http://localhost/Automacao_andrea-main/login.html`
- [ ] **Não quebrou nada?** — Teste as funcionalidades principais
- [ ] **Não tem erros no console?** — Abra o console do navegador (F12) e veja se tem erros vermelhos
- [ ] **PHP está funcionando?** — Teste as APIs no navegador ou Postman
- [ ] **Não subiu dados sensíveis?** — Verifique se não tem senhas ou chaves no código
- [ ] **Mensagem do commit está clara?** — Use o padrão `feat:`, `fix:`, `docs:`

### Comandos Úteis do Git

| Comando | O que faz |
|---------|-----------|
| `git status` | Mostra o que foi alterado |
| `git diff` | Mostra as diferenças linha por linha |
| `git log --oneline -5` | Mostra os últimos 5 commits |
| `git add .` | Adiciona todas as alterações |
| `git add arquivo.js` | Adiciona um arquivo específico |
| `git commit -m "msg"` | Cria um commit |
| `git push origin versoes` | Envia para o GitHub |
| `git stash` | Esconde alterações temporariamente |
| `git stash pop` | Recupera alterações escondidas |
| `git checkout -b nova-branch` | Cria e muda para uma nova branch |

### Deploy para Produção (Passo a Passo)

#### Via Git (Recomendado)

```bash
# 1. Verificar o que mudou
git status

# 2. Adicionar arquivos
git add api/reports.php js/app.js

# 3. Criar commit
git commit -m "feat: Nova funcionalidade X"

# 4. Enviar para GitHub
git push origin versoes

# 5. (Se necessário) Forçar deploy no Avanilton
git push avanilton versoes:main --force
```

#### Via ZIP (Quando não tem acesso ao Git)

1. Selecione os arquivos alterados
2. Compacte em um `.zip`
3. Envie para o superior
4. O superior sobe pelo cPanel File Manager ou FTP

### Credenciais e Segurança

| Serviço | Local da configuração | Observação |
|---------|----------------------|------------|
| **FTP Produção** | `.vscode/sftp.json` | Usado pelo VS Code SFTP Extension |
| **FTP Produção** | `.github/workflows/deploy.yml` | Usado pelo GitHub Actions (via Secrets) |
| **Banco Local** | `api/config.php` | Usado pelo sistema em produção |
| **Banco Externo** | `api/config.php` | Conexão com o Condado |

> **Recomendação:** Não commitar credenciais no Git. Usar variáveis de ambiente ou GitHub Secrets sempre que possível.

