# Documentação do Projeto Cobrança Task

**Versão:** 1.0.12  
**Última atualização:** 17/09/2026

---

## Visão Geral

O **Cobrança Task** é um sistema web para gestão de cobranças e tarefas de condomínios. O sistema permite criar tarefas a partir de dados de clientes (integração com API externa "Condado"), distribuí-las entre usuários, acompanhar o progresso via Kanban e gerar relatórios gerenciais.

### Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Backend | PHP 8.2 |
| Banco de dados | MySQL / MariaDB 10.4 |
| Hospedagem | XAMPP (local) / cPanel (produção) |
| Controle de versão | GitHub |

### Como Rodar Localmente

1. Instale o [XAMPP](https://www.apachefriends.org/)
2. Clone o repositório para `C:\xampp\htdocs\Automacao_andrea-main`
3. Inicie o Apache e o MySQL pelo Painel XAMPP
4. Acesse `http://localhost/Automacao_andrea-main/login.html`
5. Login padrão: `admin@cobrancatask.com` / `password`

---

## Estrutura de Pastas

```
Automacao_andrea-main/
├── api/                    # Backend PHP (APIs)
│   ├── config.php          # Configurações do banco de dados
│   ├── auth.php            # Autenticação (login/logout)
│   ├── tasks.php           # CRUD de tarefas
│   ├── users.php           # Gerenciamento de usuários
│   ├── reports.php         # Relatórios e estatísticas
│   ├── settings.php        # Configurações do sistema
│   ├── tickets.php         # Sistema de chamados
│   ├── condado.php         # Integração com API Condado
│   ├── sync_condado.php    # Sincronização de dados
│   ├── test_condado.php    # Teste de conexão
│   └── settings.json       # Permissões de usuários
├── css/                    # Estilos
│   └── style.css           # Estilo principal (tema claro/escuro)
├── js/                     # JavaScript frontend
│   ├── app.js              # Lógica principal da aplicação (SPA)
│   ├── auth.js             # Autenticação e sessão
│   └── theme.js            # Toggle de tema (claro/escuro)
├── img/                    # Imagens
│   ├── logo.svg            # Logo principal
│   ├── logo1.svg           # Logo variante
│   └── avatar_*.png        # Avatares de usuários
├── dashboard.html          # Dashboard principal (SPA)
├── login.html              # Página de login
├── index.html              # Página inicial (landing page)
├── database.sql            # Schema do banco de dados
├── DOCUMENTACAO.md         # Este arquivo
└── .gitignore              # Regras de ignore do Git
```

---

## Arquivos de Produção

### HTML

#### `index.html`
Página inicial (landing page) com apresentação do sistema. Possui link para login e botão de ação. Carrega o `css/style.css` e o favicon.

#### `login.html`
Página de autenticação. Formulário com campos de e-mail e senha. Redireciona para `dashboard.html` após login bem-sucedido. Carrega `js/auth.js` e `js/theme.js`.

#### `dashboard.html`
Dashboard principal e mais importante do sistema. É uma **SPA (Single Page Application)** que carrega todas as visualizações dinamicamente via JavaScript. Contém:

- **Sidebar** com navegação (Tarefas, Kanban, Relatórios, Configurações, Ajuda)
- **Área principal** onde as views são renderizadas
- **Modais** para criação de tarefas, distribuição, detalhes, etc.
- **Versão do sistema** exibida no rodapé da sidebar (v1.0.12)

---

### CSS

#### `css/style.css`
Estilo principal do sistema (1185 linhas). Funcionalidades:

- **Variáveis CSS** para temas claro/escuro
- **Cores da marca BV Garantia**: Verde escuro `#1B3A2A`, Dourado `#8B6E2F`, Preto `#1A1A1A`
- **Layout responsivo** com sidebar colapsável
- **Componentes**: cards, tabelas, botões, modais, toasts, badges
- **Animações**: transições suaves, slide-in de modais, fade de toasts
- **Scrollbar personalizada**
- **Google Fonts Inter** para tipografia

---

### JavaScript Frontend

#### `js/app.js`
Arquivo principal da aplicação (2441 linhas). Contém toda a lógica do frontend:

**Sessão e Usuário:**
- Leitura da sessão via `localStorage` (`cobranca_user`)
- Exibição do nome, perfil e avatar na sidebar
- Controle de visibilidade baseado no papel (admin/usuário)

**Navegação SPA:**
- `loadView(viewName)` — renderiza views dinamicamente
- Navegação via sidebar com hash URLs
- Guard de permissões — impede acesso a telas não autorizadas

**Permissões:**
- `window.appPermissions` — objeto global de permissões
- `applySidebarPermissions()` — esconde/mostra itens da sidebar
- `loadPermissions()` / `savePermissions()` — gerencia checkboxes de permissão

**Tarefas:**
- `loadTarefas(page)` — carrega tarefas com paginação (50 por página)
- `loadMoreTarefas()` — botão "Carregar Mais"
- `renderTarefasRows()` — renderiza linhas da tabela
- `openTaskDetails()` — abre modal com detalhes da tarefa
- `deleteServerTask()` — move tarefa para lixeira

**Kanban:**
- `loadKanbanCards()` — carrega cards progressivamente
- `injectKanbanCards()` — injeta cards nas colunas
- `dragCard()` / `dropCard()` — drag and drop de cards
- `promptAddColumn()` — adiciona colunas personalizadas

**Relatórios:**
- `loadRelatorios()` — carrega dados dos relatórios
- `renderRankingRow()` — renderiza linhas de ranking
- `openRankingModal()` — abre modal com ranking completo

**Configurações:**
- `saveProfile()` — salva dados do perfil
- `handleSettingsAvatarUpload()` — upload de avatar
- `loadTickets()` — carrega chamados abertos
- `updateTicketStatus()` — altera status de chamado

**Chamados (Tickets):**
- `sendTicket()` — envia novo chamado
- `viewTicket()` — visualiza detalhes do chamado

**Outros:**
- `showToast(message, type)` — exibe notificações toast
- `filterTarefas()` / `filterKanban()` — busca nas listas
- Integração com API Condado para busca de clientes

---

#### `js/auth.js`
Gerencia autenticação e sessão (101 linhas):

- `handleLogin()` — envia formulário de login para `api/auth.php`
- `checkSession()` — verifica se o usuário está logado
- `handleLogout()` — limpa localStorage e redireciona para login
- **Timeout de 10 minutos** — logout automático por inatividade

---

#### `js/theme.js`
Toggle de tema claro/escuro (19 linhas):

- Lê tema salvo no `localStorage`
- Alterna atributo `data-theme` no `<html>`
- Salva preferência do usuário

---

### PHP API

#### `api/config.php`
Configurações e bootstrap do sistema (81 linhas):

- **Credenciais do banco local**: `bvgarantia_cobrancatask`
- **Credenciais do banco externo (Condado)**: `novacorpconect`
- `getConnection()` — conexão PDO com o banco local
- `getCondadoConnection()` — conexão PDO com o banco externo
- `jsonResponse()` — helper para respostas JSON
- Handler de erros com `set_exception_handler`

---

#### `api/auth.php`
API de autenticação (73 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=login` | POST | Valida e-mail e senha, retorna dados do usuário |
| `?action=logout` | GET | Destroi a sessão |
| `?action=check` | GET | Verifica se a sessão é válida |

---

#### `api/tasks.php`
API de tarefas (254 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=list` | GET | Lista tarefas com paginação (`page`, `limit`) |
| `?action=create` | POST | Cria tarefas em lote |
| `?action=update_status` | POST | Atualiza status (todo/in_progress/done) |
| `?action=soft_delete` | POST | Move tarefa para lixeira |
| `?action=restore` | POST | Restaura tarefa da lixeira |
| `?action=force_delete` | POST | Exclui tarefa permanentemente |
| `?action=truncate_tasks` | POST | Limpa todas as tarefas |
| `?action=update_details` | POST | Atualiza detalhes (datas, observações) |
| `?action=share_task` | POST | Compartilha tarefa com outro usuário |
| `?action=unshare_task` | POST | Remove compartilhamento |
| `?action=reassign` | POST | Reatribui tarefa para outro usuário |
| `?action=import_bulk` | POST | Importa tarefas em lote (via planilha) |
| `?action=list_trash` | GET | Lista tarefas excluídas |

---

#### `api/users.php`
API de usuários (130 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=list` | GET | Lista todos os usuários |
| `?action=get` | GET | Busca usuário por ID |
| `?action=create` | POST | Cria novo usuário |
| `?action=update` | POST | Atualiza dados do usuário |
| `?action=delete` | POST | Exclui usuário |
| `?action=update_avatar` | POST | Atualiza foto do perfil |

---

#### `api/reports.php`
API de relatórios (63 linhas):

- Retorna total de atendimentos
- Ranking de atendentes (top 5 + lista completa)
- Ranking de imóveis (top 5)
- Filtra dados por papel do usuário (admin vê tudo, usuário só as suas)

---

#### `api/settings.php`
API de configurações (31 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=get` | GET | Lê permissões do `settings.json` |
| `?action=save` | POST | Salva permissões no `settings.json` |

---

#### `api/tickets.php`
API de chamados (58 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=create` | POST | Abre novo chamado |
| `?action=list` | GET | Lista chamados (admin vê todos) |
| `?action=update_status` | POST | Atualiza status (aberto/em_andamento/resolvido) |

---

#### `api/condado.php`
API de integração com Condado (103 linhas):

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=fetch_data` | GET | Busca imóveis e clientes do Condado |
| `?action=fetch_inadimplentes` | GET | Busca dados de inadimplentes |
| `?action=fetch_clientes` | GET | Busca clientes no cache local |

---

#### `api/sync_condado.php`
Script de sincronização (195 linhas):

- Conecta ao banco Condado (externo)
- Puxa dados de imóveis, clientes e boletos
- Salva em tabelas de cache local (`cache_imoveis`, `cache_clientes`, `cache_boletos`)
- Retorna progresso em tempo real via HTML

---

#### `api/test_condado.php`
Script de diagnóstico (22 linhas):

- Testa conexão com o banco Condado
- Retorna número de registros na tabela `cache_boletos`

---

#### `api/settings.json`
Arquivo de configuração JSON:

```json
{
  "view_tarefas": true,
  "create_task": true,
  "distribute_task": false,
  "view_kanban": true,
  "view_reports": false,
  "view_trash": true,
  "view_config": false
}
```

Controla as permissões de acesso dos usuários padrão no sistema.

---

### Banco de Dados

#### `database.sql`
Schema do banco `bvgarantia_cobrancatask`:

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (id, name, email, password, role, avatar) |
| `tasks` | Tarefas de cobrança (property_name, client_name, status, assigned_to, etc.) |
| `task_shares` | Compartilhamento de tarefas entre usuários |
| `task_updates` | Histórico de atendimentos de cada tarefa |
| `tickets` | Chamados de suporte |
| `cache_imoveis` | Cache de imóveis do Condado |
| `cache_clientes` | Cache de clientes do Condado |
| `cache_boletos` | Cache de boletos do Condado |

---

## Scripts de Desenvolvimento

> **ATENÇÃO:** Estes scripts são apenas para desenvolvimento e diagnóstico. Não devem ser usados em produção.

### PHP (raiz)

| Arquivo | Descrição |
|---------|-----------|
| `debug_map.php` | Consulta tabelas do Condado (LIMIT 10) para inspecionar estrutura |
| `dump_imoveis.php` | Despeja todos os registros da tabela `Tbimovel` |
| `dump_tasks.php` | Exibe a estrutura da tabela `tasks` (DESCRIBE) |
| `run_query.php` | Executa query de agregação financeira no Condado |
| `test_hash.php` | Testa verificação de senhas com `password_verify` |
| `test_query.php` | Testa query JOIN entre `tbcliente` e `tbimovel` |

### JavaScript (raiz — Node.js)

| Arquivo | Descrição |
|---------|-----------|
| `check.js` | Conecta ao Condado e lista tabelas filtradas por empresa |
| `check_schema.js` | Inspeciona schemas das tabelas do Condado |
| `check_schema_2.js` | Variante do inspetor de schemas |
| `extrair_inadimplentes.js` | Extrai dados de inadimplentes e salva em JSON |
| `find_tables.js` | Lista todas as tabelas do banco Condado |
| `fix_emoji.js` | Corrige problemas de rendering de emoji no `app.js` |
| `run_query.js` | Executa queries via Node.js no Condado |
| `sample_data.js` | Busca dados de exemplo para testes |
| `test.js` | Testa inicialização do `app.js` com jsdom |
| `test_query.js` | Testa queries SQL no Condado |
| `test_query_3.js` | Queries adicionais de teste no Condado |

---

## Arquivos de Dados

| Arquivo | Descrição |
|---------|-----------|
| `resultado_condado.json` | Resultado de query com erro (coluna ausente no JOIN) |
| `resultado_condado_novo.json` | Resultado de query com erro (coluna desconhecida) |
| `resultado_inadimplentes.json` | Lista de clientes inadimplentes com valores |
| `schema_novo_query.json` | Referência dos schemas das tabelas do Condado |

---

## Imagens

| Arquivo | Descrição |
|---------|-----------|
| `img/logo.svg` | Logo principal (usado no login e landing page) |
| `img/logo1.svg` | Logo variante (usado na sidebar do dashboard) |
| `img/bg-landing.png` | Imagem de fundo da landing page |
| `favicon.png` | Ícone da aba do navegador |
| `img/avatar_*.png` | Avatares de usuários (uploads) |

---

## Configurações

| Arquivo | Descrição |
|---------|-----------|
| `.gitignore` | Exclui do Git: node_modules, .env, logs, debug, avatars, temp |
| `package.json` | Dependências Node.js: `jsdom` (testes), `mysql2` (acesso a DB) |
| `.github/workflows/deploy.yml` | Pipeline CI/CD — deploy via FTP para cPanel |
| `.vscode/sftp.json` | Configuração de sincronização FTP (VS Code) |

---

## Segurança

> **AVISO:** O arquivo `.vscode/sftp.json` contém credenciais FTP em texto plano. Recomenda-se adicionar ao `.gitignore` e rotacionar as credenciais expostas.

> Os scripts de desenvolvimento na raiz também contêm credenciais de banco de dados em texto plano.

---

## Controle de Versão

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.12 | 17/09/2026 | Ranking Top 5 com modal, versão no rodapé da sidebar |
| 1.0.11 | 16/09/2026 | Paginação de tarefas (50/página), carregamento progressivo Kanban |
| 1.0.10 | 16/09/2026 | Sistema de permissões aplicado na interface |
| 1.0.9 | 15/09/2026 | Melhoria visual do layout, correção da logo |
| 1.0.8 | 15/09/2026 | Botão trocar senha, dados do perfil |
| 1.0.0 | — | Estrutura base do projeto |
