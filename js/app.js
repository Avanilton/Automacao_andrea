// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // --- User Session ---
    let userStr = null;
    let user = null;
    try {
        userStr = localStorage.getItem('cobranca_user');
        if (userStr) {
            user = JSON.parse(userStr);
            const userNameEl = document.getElementById('sidebarUserName');
            const userRoleEl = document.getElementById('sidebarUserRole');
            const userAvatarEl = document.getElementById('sidebarAvatar');

            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Usu�rio';
            
            if (userAvatarEl && user.name) {
                if (user.avatar) {
                    userAvatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
                }
            }
            if (user.role === 'admin') {
                const adminSubmenu = document.getElementById('adminSubmenu');
                if (adminSubmenu) adminSubmenu.classList.remove('hidden');
                const navUsuarios = document.getElementById('navUsuarios');
                if (navUsuarios) navUsuarios.style.display = 'flex';
            } else {
                applySidebarPermissions();
            }
        }
    } catch (err) {
    console.error('Erro ao ler a sessão:', err);
}

// Carregar usuários no início (agora chamado no final do script)

// --- Sidebar Toggle ---
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// --- Mobile Menu Toggle ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

window.appPermissions = {
    view_tarefas: true,
    create_task: false,
    distribute_task: false,
    view_kanban: true,
    view_reports: false,
    view_trash: false,
    view_config: false
};

// Tenta carregar as permissões do servidor
fetch('api/settings.php?action=get')
    .then(res => res.json())
    .then(data => {
        if (data) window.appPermissions = data;
        applySidebarPermissions();
        // Se já estiver na view de tarefas, recarrega para aplicar a permissão no botão
        if (document.getElementById('view-tarefas')) {
            const btn = document.getElementById('btnShowCreateTask');
            if (btn) {
                btn.style.display = (user && (user.role === 'admin' || window.appPermissions.create_task)) ? 'block' : 'none';
            }
        }
    })
    .catch(e => console.error('Erro ao carregar permissões', e));

// --- Safe User Permissions ---
function safeGetPermissions() {
    return window.appPermissions;
}

// --- Apply Permissions to Sidebar ---
function applySidebarPermissions() {
    if (!user || user.role === 'admin') return;
    const perms = window.appPermissions;

    const navTarefas = document.querySelector('a.nav-item[data-view="tarefas"]');
    if (navTarefas) navTarefas.style.display = perms.view_tarefas ? 'flex' : 'none';

    const navKanban = document.querySelector('a.nav-item[data-view="kanban"]');
    if (navKanban) navKanban.style.display = perms.view_kanban ? 'flex' : 'none';

    const navRelatorios = document.querySelector('a.nav-item[data-view="relatorios"]');
    if (navRelatorios) navRelatorios.style.display = perms.view_reports ? 'flex' : 'none';

    const navLixeira = document.querySelector('a.nav-item[data-view="lixeira"]');
    if (navLixeira) navLixeira.style.display = perms.view_trash ? 'flex' : 'none';

    const navConfig = document.querySelector('a.nav-item[data-view="configuracoes"]');
    if (navConfig) navConfig.style.display = perms.view_config ? 'flex' : 'none';
}

// --- Navigation (SPA) ---
const navItems = document.querySelectorAll('.nav-item');
const currentViewTitle = document.getElementById('currentViewTitle');
const viewContainer = document.getElementById('viewContainer');

// HTML templates for views
const views = {
    tarefas: `
            <div class="view-section active" id="view-tarefas">
                <div class="flex-between" style="margin-bottom: 2rem;">
                    <h3>Minhas Tarefas</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div class="search-container">
                            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="search" id="searchTarefas" class="search-input" placeholder="Pesquisar registros..." onkeyup="if(typeof filterTarefas === 'function') filterTarefas()">
                        </div>
                        <input type="file" id="importTasksInput" accept=".xls,.xlsx" style="display:none">
                        <button class="btn-secondary" id="btnImportTasks" style="display: ${user && user.role === 'admin' ? 'block' : 'none'}">Importar Planilha</button>
                        <button class="btn-secondary danger-text" id="btnTruncateTasks" style="display: ${user && user.role === 'admin' ? 'block' : 'none'}" onclick="if(typeof truncateAllData === 'function') truncateAllData()">Zerar Dados</button>
                        <button class="btn-primary" id="btnShowCreateTask" style="display: ${user && (user.role === 'admin' || safeGetPermissions().create_task) ? 'block' : 'none'}">Criar tarefas</button>
                    </div>
                </div>
                
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Imóvel</th>
                                <th>Cliente</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tarefasList">
                            <!-- Tasks loaded here -->
                            <tr>
                                <td colspan="5" style="text-align:center">Carregando tarefas...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,
    kanban: `
            <div class="view-section active" id="view-kanban">
                <div class="flex-between" style="margin-bottom: 1rem;">
                    <h3>Kanban</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div class="search-container">
                            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="search" id="searchKanban" class="search-input" placeholder="Pesquisar registros..." onkeyup="if(typeof filterKanban === 'function') filterKanban()">
                        </div>
                        <button class="btn-primary btn-sm" onclick="promptAddColumn()">+ Adicionar Coluna</button>
                    </div>
                </div>
                <div class="kanban-board" id="kanbanBoard">
                    <!-- Columns will be injected dynamically here by loadKanbanCards() / loadColumns() -->
                </div>
            </div>
        `,
    relatorios: `
            <div class="view-section active" id="view-relatorios">
                <div class="flex-between" style="margin-bottom: 2rem;">
                    <h3>Relatórios Gerenciais</h3>
                    <button class="btn-primary btn-sm" onclick="loadRelatorios()">Atualizar Dados</button>
                </div>
                <div id="reportsContainer">
                    <p style="text-align:center;">Carregando relatórios...</p>
                </div>
            </div>
        `,
    lixeira: `
            <div class="view-section active" id="view-lixeira">
                <div class="flex-between" style="margin-bottom: 2rem;">
                    <h3>Lixeira (Soft Delete)</h3>
                    <button class="btn-secondary danger-text" onclick="emptyTrash()">Esvaziar Lixeira</button>
                </div>
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nome / Título</th>
                                <th>Excluído Em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="lixeiraList">
                            <tr><td colspan="4" style="text-align:center">Lixeira vazia ou carregando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,
    configuracoes: `<div class="view-section active" id="view-config">
            <h3 style="margin-bottom: 2rem;">Configurações</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Dados do Perfil</h4>
                    <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
                        <div class="avatar-circle" style="width: 80px; height: 80px; font-size: 2.5rem;" id="settingsAvatarPreview">${user && user.avatar ? '<img src="' + user.avatar + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">' : (user ? user.name.charAt(0).toUpperCase() : 'U')}</div>
                        <div>
                            <input type="file" id="settingsAvatarUpload" accept="image/*" style="display: none;" onchange="handleSettingsAvatarUpload(event)">
                            <button class="btn-secondary btn-sm" onclick="document.getElementById('settingsAvatarUpload').click()">Definir Avatar</button>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">JPG, GIF ou PNG. Max 1MB.</p>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Nome Completo</label>
                        <input type="text" class="form-control" id="profileName" value="${user ? user.name : ''}">
                    </div>
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" class="form-control" id="profileEmail" value="${user ? user.email : ''}">
                    </div>
                    <div id="profileMessage" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
                    <button class="btn-primary" style="margin-top: 1rem;" onclick="saveProfile()">Salvar Perfil</button>
                </div>
                
                <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Trocar Senha</h4>
                    <div class="input-group">
                        <label>Senha Atual</label>
                        <input type="password" id="currentPassword" class="form-control">
                    </div>
                    <div class="input-group">
                        <label>Nova Senha</label>
                        <input type="password" id="newPassword" class="form-control">
                    </div>
                    <div class="input-group">
                        <label>Confirmar Nova Senha</label>
                        <input type="password" id="confirmPassword" class="form-control">
                    </div>
                    <div id="passwordMessage" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
                    <button class="btn-primary" style="margin-top: 1rem;" onclick="changePassword()">Atualizar Senha</button>
                </div>
            </div>
            
            ${user && user.role === 'admin' ? `
            <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-top: 2rem;">
                <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Submenu Administrativo</h4>
                <p style="margin-bottom: 1rem; color: var(--text-muted);">Definir e ajustar permissões de acesso dos usuários no sistema.</p>
                <button class="btn-secondary" onclick="document.querySelector('[data-view=permissoes]').click()">Gerenciar Permissões</button>
            </div>

            <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-top: 2rem;">
                <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Chamados Abertos</h4>
                <div id="ticketsContainer">
                    <p style="color: var(--text-muted);">Carregando chamados...</p>
                </div>
            </div>
            ` : ''}
        </div>`,
    usuarios: `
            <div class="view-section active" id="view-usuarios">
                <div class="flex-between" style="margin-bottom: 2rem;">
                    <h3>Gerenciar Usuários</h3>
                    <button class="btn-primary" onclick="document.getElementById('createUserModal').classList.remove('hidden'); document.getElementById('modalOverlay').classList.remove('hidden');">+ Novo Usuário</button>
                </div>
                
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Perfil</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="usuariosList">
                            <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1rem;">Carregando usuários...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,
    permissoes: `
            <div class="view-section active" id="view-permissoes">
                <div class="flex-between" style="margin-bottom: 2rem;">
                    <div>
                        <h3>Permissões de Usuários</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Configure o que cada perfil pode acessar e executar no sistema.</p>
                    </div>
                    <button class="btn-primary" onclick="savePermissions()">Salvar Alterações</button>
                </div>
                
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0; overflow-x: auto;">
                    <table class="data-table" style="margin: 0; width: 100%;">
                        <thead>
                            <tr style="background: var(--bg-body);">
                                <th style="text-align: left; padding: 1.2rem;">Recurso / Tela</th>
                                <th style="text-align: center; width: 150px;">Administrador</th>
                                <th style="text-align: center; width: 150px;">Usuário Padrão</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Tarefas -->
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Tela: Tarefas</strong><br>
                                    <small style="color:var(--text-muted)">Acesso à lista inicial de tarefas.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled style="cursor: not-allowed;"></td>
                                <td style="text-align:center;"><input type="checkbox" checked id="perm_view_tarefas_user"></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Função: Criar Tarefas</strong><br>
                                    <small style="color:var(--text-muted)">Buscar dados na API do Condado e criar novas tarefas.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" id="perm_create_task_user"></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Função: Distribuir Tarefas</strong><br>
                                    <small style="color:var(--text-muted)">Atribuir tarefas para outros usuários.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" id="perm_distribute_task_user"></td>
                            </tr>
                            <!-- Kanban -->
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Tela: Kanban</strong><br>
                                    <small style="color:var(--text-muted)">Acesso ao quadro Kanban para mover cards.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" checked id="perm_view_kanban_user"></td>
                            </tr>
                            <!-- Relatórios -->
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Tela: Relatórios</strong><br>
                                    <small style="color:var(--text-muted)">Visualização de relatórios e métricas.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" id="perm_view_reports_user"></td>
                            </tr>
                            <!-- Lixeira -->
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1.2rem;">
                                    <strong>Tela: Lixeira</strong><br>
                                    <small style="color:var(--text-muted)">Ver, restaurar ou excluir itens deletados.</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" id="perm_view_trash_user"></td>
                            </tr>
                            <!-- Configurações -->
                            <tr>
                                <td style="padding: 1.2rem;">
                                    <strong>Tela: Configurações</strong><br>
                                    <small style="color:var(--text-muted)">Pode acessar a tela de configurações (O acesso aos menus de admin é sempre restrito).</small>
                                </td>
                                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                                <td style="text-align:center;"><input type="checkbox" checked id="perm_view_config_user"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,
    ajuda: `<div class="view-section active" id="view-ajuda">
            <h3 style="margin-bottom: 2rem;">Central de Ajuda</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Como fazer as tarefas?</h4>
                    <div style="margin-bottom: 1rem;">
                        <strong style="display:block; margin-bottom: 0.25rem;">1. Criar Tarefas</strong>
                        <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">Clique em "Criar Tarefas" no menu Tarefas para puxar os dados de clientes do Condado via integração API.</p>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="display:block; margin-bottom: 0.25rem;">2. Distribuir Tarefas</strong>
                        <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">Na modal de pesquisa, selecione os clientes desejados nos checkboxes e atribua em massa a um usuário.</p>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="display:block; margin-bottom: 0.25rem;">3. Workflow (Kanban)</strong>
                        <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">Abra o menu Kanban. Arraste os cards para a coluna "Atendendo". Clique no card para definir etiquetas, preencher checklists, datas e registrar tudo o que foi feito.</p>
                    </div>
                </div>

                <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Abrir Chamado</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Seu usuário e o horário da abertura serão registrados automaticamente.</p>
                    
                    <div class="input-group">
                        <label>Assunto</label>
                        <input type="text" id="ticketSubject" class="form-control" placeholder="Descreva o problema brevemente">
                    </div>
                    <div class="input-group">
                        <label>Descrição detalhada</label>
                        <textarea id="ticketMessage" class="form-control" rows="5" placeholder="Forneça os detalhes e passos para reproduzir o problema..."></textarea>
                    </div>
                    <div id="ticketFeedback" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
                    <button class="btn-primary" style="width: 100%;" onclick="sendTicket()">Enviar Chamado</button>
                </div>
            </div>
        </div>`
};

function loadView(viewName) {
    if (user && user.role !== 'admin') {
        const perms = window.appPermissions;
        const permMap = {
            'kanban': 'view_kanban',
            'relatorios': 'view_reports',
            'lixeira': 'view_trash',
            'configuracoes': 'view_config',
            'tarefas': 'view_tarefas'
        };
        const requiredPerm = permMap[viewName];
        if (requiredPerm && !perms[requiredPerm]) {
            showToast('Você não tem permissão para acessar esta tela.', 'error');
            return;
        }
    }

    let targetView = document.getElementById('rendered-view-' + viewName);
    if (!targetView) {
        targetView = document.createElement('div');
        targetView.id = 'rendered-view-' + viewName;
        targetView.innerHTML = views[viewName] || '<div>Não encontrado</div>';
        viewContainer.appendChild(targetView);
        targetView.isFirstLoad = true;
    } else {
        targetView.isFirstLoad = false;
    }
    
    Array.from(viewContainer.children).forEach(child => {
        if (child.id && child.id.startsWith('rendered-view-')) {
            child.style.display = 'none';
        }
    });
    targetView.style.display = 'block';

    // Setup view specific events
    if (viewName === 'tarefas') {
        if (targetView.isFirstLoad) loadTarefas();
    } else if (viewName === 'kanban') {
        if (targetView.isFirstLoad) loadKanbanCards();
    } else if (viewName === 'lixeira') {
        if (targetView.isFirstLoad) loadLixeira();
    } else if (viewName === 'usuarios') {
        if (targetView.isFirstLoad) loadUsers();
    } else if (viewName === 'permissoes') {
        if (targetView.isFirstLoad) loadPermissions();
    } else if (viewName === 'relatorios') {
        if (targetView.isFirstLoad && typeof loadRelatorios === 'function') loadRelatorios();
    } else if (viewName === 'configuracoes') {
        if (targetView.isFirstLoad) loadTickets();
    }
}

// Event Delegation para o botão "Criar Tarefas" que é injetado dinamicamente
document.addEventListener('click', (e) => {
    if (e.target.closest('#btnShowCreateTask')) {
        openCreateTaskModal();
    }
    if (e.target.closest('#btnImportTasks')) {
        const fileInput = document.getElementById('importTasksInput');
        if (fileInput) fileInput.click();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.id === 'importTasksInput') {
        handleTasksImport(e);
    }
});

function handleTasksImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Se os usuários não estiverem carregados, vamos tentar carregar para o cruzamento
    if (!window.currentLoadedUsers || window.currentLoadedUsers.length === 0) {
        if (typeof loadUsers === 'function') {
            loadUsers().then(() => processExcelFile(file));
            return;
        }
    }
    processExcelFile(file);
    e.target.value = ''; // reseta
}

function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = evt.target.result;
        try {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // O header:1 gera um array de arrays para podermos varrer livremente
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rows.length < 2) {
                showToast("A planilha parece estar vazia ou sem dados.", 'error');
                return;
            }

            const parsedTasks = [];

            // Pula a linha do cabeçalho (i = 1)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0 || !row[0]) continue; // linha vazia

                const docMorador = row[0] || '';
                const nomeMorador = row[1] || '';
                const blocoApto = row[2] || '';
                
                // Formatar data (se for numero serial do excel ou string)
                let dataVctoStr = '';
                if (typeof row[3] === 'number') {
                    // Converter serial para date JS (Ajuste basico excel -> js)
                    const dateInfo = new Date(Math.round((row[3] - 25569) * 86400 * 1000));
                    dataVctoStr = dateInfo.toISOString().split('T')[0];
                } else if (typeof row[3] === 'string') {
                    // Tenta converter DD/MM/YYYY para YYYY-MM-DD
                    const parts = row[3].split('/');
                    if(parts.length === 3) {
                        dataVctoStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        dataVctoStr = row[3];
                    }
                }

                const encargos = row[4] || '';
                const totalDivida = row[5] || 0;
                const nomeCondominio = row[6] || '';
                const usuarioResp = row[7] || ''; // Ex: "Adelaide"

                // Mapear usuario pelo nome (ignorando maiusculas/minusculas)
                let assignedUserId = user ? user.id : null; // Fallback para o usuário logado
                if (usuarioResp) {
                    const searchName = usuarioResp.trim().toLowerCase();
                    const cleanS = searchName.replace(/[^a-z]/g, '');
                    const foundUser = (window.currentLoadedUsers || []).find(u => {
                        const uName = u.name.toLowerCase();
                        const cleanU = uName.replace(/[^a-z]/g, '');
                        if (uName.includes(searchName) || searchName.includes(uName)) return true;
                        if (cleanU.includes(cleanS) || cleanS.includes(cleanU)) return true;
                        if (cleanU.replace('i', '') === cleanS.replace('i', '')) return true;
                        if (cleanU.replace('adival', 'adval') === cleanS.replace('adival', 'adval')) return true;
                        return false;
                    });
                    
                    if (foundUser) {
                        assignedUserId = foundUser.id;
                    }
                }

                let obsText = encargos ? `Encargos: R$ ${encargos}` : '';
                if (dataVctoStr) {
                    const parts = dataVctoStr.split('-');
                    const dispDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dataVctoStr;
                    obsText += (obsText ? '\n' : '') + `Data Vencimento do Boleto: ${dispDate}`;
                }

                parsedTasks.push({
                    client_code: docMorador,
                    client_name: nomeMorador,
                    bloco: blocoApto,
                    due_date: '', // Nao colocar no prazo do card
                    observations: obsText,
                    value: parseFloat(totalDivida) || 0,
                    property_name: nomeCondominio,
                    assigned_to: assignedUserId
                });
            }

            if (parsedTasks.length === 0) {
                showToast("Nenhuma tarefa válida encontrada na planilha.", 'error');
                return;
            }

            // Enviar para o backend
            if (confirm(`Deseja importar ${parsedTasks.length} tarefas da planilha?`)) {
                sendImportRequest(parsedTasks);
            }

        } catch (err) {
            console.error("Erro ao ler excel: ", err);
            showToast("Erro ao processar o arquivo. Verifique o console.", 'error');
        }
    };
    reader.readAsBinaryString(file);
}

function sendImportRequest(tasksList) {
    fetch('api/tasks.php?action=import_bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksList })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("Tarefas importadas com sucesso!");
            if (typeof loadTarefas === 'function') loadTarefas();
            if (typeof loadKanbanCards === 'function') loadKanbanCards();
        } else {
            showToast("Erro ao importar: " + (data.error || "Desconhecido"), 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Erro na requisição.", 'error');
    });
}

// --- Permissoes Logic ---
window.loadPermissions = function () {
    const perms = safeGetPermissions();

    const v_tarefas = document.getElementById('perm_view_tarefas_user');
    if (v_tarefas) v_tarefas.checked = perms.view_tarefas;

    const c_task = document.getElementById('perm_create_task_user');
    if (c_task) c_task.checked = perms.create_task;

    const d_task = document.getElementById('perm_distribute_task_user');
    if (d_task) d_task.checked = perms.distribute_task;

    const v_kanban = document.getElementById('perm_view_kanban_user');
    if (v_kanban) v_kanban.checked = perms.view_kanban;

    const v_reports = document.getElementById('perm_view_reports_user');
    if (v_reports) v_reports.checked = perms.view_reports;

    const v_trash = document.getElementById('perm_view_trash_user');
    if (v_trash) v_trash.checked = perms.view_trash;

    const v_config = document.getElementById('perm_view_config_user');
    if (v_config) v_config.checked = perms.view_config;
};

window.savePermissions = function () {
    const perms = {
        view_tarefas: document.getElementById('perm_view_tarefas_user')?.checked || false,
        create_task: document.getElementById('perm_create_task_user')?.checked || false,
        distribute_task: document.getElementById('perm_distribute_task_user')?.checked || false,
        view_kanban: document.getElementById('perm_view_kanban_user')?.checked || false,
        view_reports: document.getElementById('perm_view_reports_user')?.checked || false,
        view_trash: document.getElementById('perm_view_trash_user')?.checked || false,
        view_config: document.getElementById('perm_view_config_user')?.checked || false
    };

    fetch('api/settings.php?action=save', {
        method: 'POST',
        body: JSON.stringify(perms)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.appPermissions = perms;
                applySidebarPermissions();
                showToast("Permissões salvas com sucesso!");
            }
        })
        .catch(e => {
            showToast("Erro ao salvar permissões.", 'error');
        });
};


// Variável global para armazenar os usuários e poder editá-los sem chamar API de novo
window.currentLoadedUsers = [];

// --- Users Logic ---
window.loadUsers = async function () {
    const tbody = document.getElementById('usuariosList');

    try {
        const res = await fetch('api/users.php?action=list');
        const data = await res.json();

        if (data && data.success && data.users.length > 0) {
            window.currentLoadedUsers = data.users;
            if (tbody) {
                tbody.innerHTML = '';
                data.users.forEach(u => {
                    tbody.innerHTML += `
                            <tr>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="label" style="background-color: ${u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'};">${u.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
                                <td>
                                    <button class="btn-secondary btn-sm" onclick="editUser(${u.id})">Editar</button>
                                    <button class="btn-secondary btn-sm danger-text" style="margin-left:5px;" onclick="deleteUser(${u.id})">Excluir</button>
                                </td>
                            </tr>
                        `;
                });
            }
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum usuário encontrado.</td></tr>';
        }
    } catch (e) {
        console.error("Falha ao carregar usuários", e);
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao conectar com o banco de dados.</td></tr>';
    }
};

window.currentEditingUserId = null;

window.saveUser = async function () {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    if (!name || !email || (!password && !window.currentEditingUserId)) {
        showToast("Preencha nome e e-mail (a senha é obrigatória para novos usuários).", 'error');
        return;
    }

    try {
        const formData = new FormData();
        if (window.currentEditingUserId) formData.append('id', window.currentEditingUserId);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);

        const action = window.currentEditingUserId ? 'update' : 'create';
        const res = await fetch(`api/users.php?action=${action}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data && data.success) {
            showToast(`Usuário ${window.currentEditingUserId ? 'atualizado' : 'cadastrado'} com sucesso!`);
            document.getElementById('createUserModal').classList.add('hidden');
            document.getElementById('modalOverlay').classList.add('hidden');
            document.getElementById('formCreateUser').reset();
            window.currentEditingUserId = null;
            loadUsers();
        } else {
            showToast("Erro ao cadastrar/atualizar: " + (data.message || 'Desconhecido'), 'error');
        }
    } catch (e) {
        console.error(e);
        showToast("Falha ao comunicar com o servidor.", 'error');
    }
};

window.editUser = function (id) {
    let userToEdit = window.currentLoadedUsers.find(u => u.id == id);
    if (!userToEdit) return;

    window.currentEditingUserId = id;
    document.getElementById('newUserName').value = userToEdit.name;
    document.getElementById('newUserEmail').value = userToEdit.email;
    document.getElementById('newUserPassword').value = ''; // Deixa em branco, preenche só se for trocar
    document.getElementById('newUserRole').value = userToEdit.role;

    document.querySelector('#createUserModal h3').innerText = "Editar Usuário";
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('createUserModal').classList.remove('hidden');
};

window.changePassword = async function () {
    const msgEl = document.getElementById('passwordMessage');
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
        msgEl.textContent = 'Preencha todos os campos.';
        msgEl.style.color = '#ef4444';
        return;
    }

    if (newPass !== confirm) {
        msgEl.textContent = 'As senhas não coincidem.';
        msgEl.style.color = '#ef4444';
        return;
    }

    if (newPass.length < 6) {
        msgEl.textContent = 'A nova senha deve ter no mínimo 6 caracteres.';
        msgEl.style.color = '#ef4444';
        return;
    }

    try {
        const formData = new FormData();
        formData.append('current_password', current);
        formData.append('new_password', newPass);

        const res = await fetch('api/auth.php?action=change_password', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            msgEl.textContent = data.message || 'Senha atualizada!';
            msgEl.style.color = '#10B981';
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            msgEl.textContent = data.error || 'Erro ao atualizar senha.';
            msgEl.style.color = '#ef4444';
        }
    } catch (e) {
        msgEl.textContent = 'Erro de conexão com o servidor.';
        msgEl.style.color = '#ef4444';
    }
};

window.deleteUser = async function (id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
        const formData = new FormData();
        formData.append('id', id);

        const res = await fetch('api/users.php?action=delete', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data && data.success) {
            showToast("Usuário excluído com sucesso!");
            loadUsers();
        } else {
            showToast(data.message || 'Erro ao excluir usuário.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast("Falha ao comunicar com o servidor.", 'error');
    }
};

// Reseta o modal ao abrir pelo botão "Novo Usuário"
const btnNovoUser = document.querySelector('[onclick="document.getElementById(\'modalOverlay\').classList.remove(\'hidden\'); document.getElementById(\'createUserModal\').classList.remove(\'hidden\')"]');
if (btnNovoUser) {
    btnNovoUser.onclick = () => {
        window.currentEditingUserId = null;
        document.getElementById('formCreateUser').reset();
        document.querySelector('#createUserModal h3').innerText = "Novo Usuário";
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.getElementById('createUserModal').classList.remove('hidden');
    };
}

// --- Lixeira Logic ---
let trashItems = [
    // Mock data for demo since backend might not be fully hooked up yet
];

window.loadLixeira = async function () {
    const tbody = document.getElementById('lixeiraList');
    if (!tbody) return;

    try {
        const res = await fetch('api/tasks.php?action=list_trash');
        const data = await res.json();

        if (data.tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Lixeira vazia.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.tasks.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                    <td><span class="label" style="background-color: #3B82F6; cursor:default;">Tarefa</span></td>
                    <td>${item.property_name || item.name || 'Desconhecido'}</td>
                    <td>${item.deleted_at}</td>
                    <td>
                        <button class="btn-secondary btn-sm" onclick="restoreTrash(${item.id})">Restaurar</button>
                        <button class="btn-secondary btn-sm danger-text" onclick="forceDeleteTrash(${item.id})">Excluir Permanente</button>
                    </td>
                `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar lixeira.</td></tr>';
    }
}

window.restoreTrash = async function (id) {
    if (!confirm('Tem certeza que deseja restaurar este item?')) return;
    try {
        const formData = new FormData();
        formData.append('task_id', id);
        await fetch('api/tasks.php?action=restore', { method: 'POST', body: formData });
        showToast('Item restaurado com sucesso!');
        loadLixeira();
        loadTarefas();
        loadKanbanCards();
    } catch (e) {
        console.error(e);
        showToast('Erro ao restaurar item.', 'error');
    }
}

window.forceDeleteTrash = async function (id) {
    if (confirm('Tem certeza que deseja excluir PERMANENTEMENTE? Esta ação não pode ser desfeita.')) {
        try {
            const formData = new FormData();
            formData.append('task_id', id);
            await fetch('api/tasks.php?action=force_delete', { method: 'POST', body: formData });
            showToast('Item excluído para sempre.');
            loadLixeira();
        } catch (e) {
            console.error(e);
            showToast('Erro ao excluir item.', 'error');
        }
    }
}

window.emptyTrash = async function () {
    alert('A opção de esvaziar lixeira foi desabilitada temporariamente por segurança.');
}

// --- Delete Column ---
window.deleteColumn = function (status_key) {
    if (confirm('Deseja excluir esta coluna inteira? Ela será movida para a Lixeira.')) {
        const col = localColumns.find(c => c.status_key === status_key);
        if (col) {
            // Add to trash mock
            trashItems.push({
                id: Math.random(),
                type: 'Coluna',
                title: col.title,
                deleted_at: new Date().toLocaleString()
            });

            // Remove from local array
            localColumns = localColumns.filter(c => c.status_key !== status_key);
            loadKanbanCards(); // re-render
            showToast('Coluna excluída com sucesso.');
        }
    }
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // e.preventDefault();
        const viewName = item.getAttribute('data-view');

        // Permission guard for non-admin users
        if (user && user.role !== 'admin') {
            const perms = window.appPermissions;
            const permMap = {
                'kanban': 'view_kanban',
                'relatorios': 'view_reports',
                'lixeira': 'view_trash',
                'configuracoes': 'view_config',
                'tarefas': 'view_tarefas'
            };
            const requiredPerm = permMap[viewName];
            if (requiredPerm && !perms[requiredPerm]) {
                showToast('Você não tem permissão para acessar esta tela.', 'error');
                e.preventDefault();
                return;
            }
        }

        // Update active class
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update title
        currentViewTitle.textContent = item.textContent.trim();

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }

        loadView(viewName);
    });
});

// --- Modals Logic ---
const modalOverlay = document.getElementById('modalOverlay');
const closeBtns = document.querySelectorAll('.close-modal');

closeBtns.forEach(btn => {
    btn.addEventListener('click', closeModals);
});

function closeModals() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function openCreateTaskModal() {
    modalOverlay.classList.remove('hidden');
    document.getElementById('createTaskModal').classList.remove('hidden');

    fetchCondadoData('');

    const btnSearch = document.getElementById('btnSearchCondado');
    if (btnSearch) {
        btnSearch.onclick = () => {
            const search = document.getElementById('searchCondadoInput').value;
            fetchCondadoData(search);
        };
    }
}

async function fetchCondadoData(searchTerm = '') {
    const container = document.getElementById('condadoDataContainer');
    container.innerHTML = '<p style="text-align: center; padding: 2rem;">Buscando dados...</p>';

    let result = null;
    let isMockFallback = false;

    try {
        // Chamada real para a API PHP
        const res = await fetch(`api/condado.php?action=fetch_data&search=${encodeURIComponent(searchTerm)}`);
        result = await res.json();
    } catch (e) {
        // Se falhar (ex: rodando localmente sem PHP via file:// ou Live Server)
        isMockFallback = true;
        console.warn("Falha ao buscar da API PHP, usando dados simulados (Mock JS). Erro original:", e);
    }

    if (isMockFallback) {
        // Mock de dados (Fallback Client-side)
        let mockData = [
            { property_name: 'Cond. Bela Vista', client_code: '1001', client_name: 'João Silva (Mock JS)', value: 450.00 },
            { property_name: 'Cond. Sol Nascente', client_code: '1002', client_name: 'Maria Oliveira (Mock JS)', value: 380.00 },
            { property_name: 'Cond. Bosque das Flores', client_code: '1003', client_name: 'Carlos Santos (Mock JS)', value: 520.00 },
            { property_name: 'Cond. Morada dos Pássaros', client_code: '1004', client_name: 'Ana Souza (Mock JS)', value: 310.00 }
        ];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            mockData = mockData.filter(item =>
                item.property_name.toLowerCase().includes(s) ||
                item.client_name.toLowerCase().includes(s) ||
                item.client_code.toLowerCase().includes(s)
            );
        }

        result = {
            success: true,
            data: mockData,
            warning: 'Rodando localmente (sem PHP). Exibindo dados simulados (Mock) via Javascript.'
        };
    }

    if (!result.success) {
        container.innerHTML = `<p style="text-align: center; color: red;">Erro: ${result.error || 'Erro desconhecido'}</p>`;
        return;
    }

    // Se a API retornar um aviso (ex: falha de banco usando mock do PHP)
    let warningHtml = '';
    if (result.warning) {
        warningHtml = `<p style="color: #92400E; background: #FEF3C7; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.85rem;">⚠️ ${result.warning}</p>`;
    }

    const data = result.data || [];

    if (data.length === 0) {
        container.innerHTML = warningHtml + '<p style="text-align: center; padding: 2rem;">Nenhum cliente/condomínio encontrado.</p>';
        return;
    }

    let html = warningHtml + `
            <table class="data-table">
                <tr>
                    <th><input type="checkbox" id="checkAll"></th>
                    <th>Cód. Imóvel</th>
                    <th>Imóvel / Condomínio</th>
                    <th>Cliente</th>
                    <th>Bloco/Apto</th>
                    <th>Situação</th>
                </tr>`;

    data.forEach((row) => {
        let blocoApto = [row.bloco, row.apto].filter(Boolean).join(' / ');
        html += `
                <tr>
                    <td><input type="checkbox" class="task-check" 
                        value="${row.client_code}"
                        data-name="${row.property_name}"
                        data-client="${row.client_name}"
                        data-bloco="${row.bloco || ''}"
                        data-apto="${row.apto || ''}"
                        data-situacao="${row.situacao || ''}"
                        data-type="${row.type || 'Cobrança'}"></td>
                    <td>${row.property_code || ''}</td>
                    <td>${row.property_name}</td>
                    <td>${row.client_name}</td>
                    <td>${blocoApto}</td>
                    <td>${row.situacao || ''}</td>
                </tr>
            `;
    });
    html += `</table>`;
    container.innerHTML = html;
}

const btnDistribute = document.getElementById('btnDistributeTasks');
if (btnDistribute) {
    btnDistribute.onclick = async () => {
        const checked = document.querySelectorAll('.task-check:checked');
        if (checked.length === 0) {
            showToast('Selecione pelo menos uma tarefa para distribuir.', 'error');
            return;
        }

        // Hide previous modal, open new one
        document.getElementById('createTaskModal').classList.add('hidden');
        const distributeModal = document.getElementById('distributeTasksModal');
        distributeModal.classList.remove('hidden');

        const selectUser = document.getElementById('assignToUser');
        selectUser.innerHTML = '<option value="">Carregando usuários...</option>';

        const localUsers = window.currentLoadedUsers || [];
        if (localUsers.length > 0) {
            selectUser.innerHTML = '<option value="">-- Selecione um usuário --</option>';
            localUsers.forEach(u => {
                selectUser.innerHTML += `<option value="${u.id}">${u.name} (${u.role === 'admin' ? 'Administrador' : 'Usuário'})</option>`;
            });
        } else {
            selectUser.innerHTML = '<option value="">-- Vá na tela de Usuários e cadastre alguém --</option>';
        }
    };
}

const btnConfirmDistribute = document.getElementById('btnConfirmDistribute');
if (btnConfirmDistribute) {
    btnConfirmDistribute.onclick = () => {
        const userId = document.getElementById('assignToUser').value;
        if (!userId) {
            showToast('Selecione um usuário.', 'error');
            return;
        }

        const checked = document.querySelectorAll('.task-check:checked');

        const tasksToSave = Array.from(checked).map(cb => ({
            property_name: cb.getAttribute('data-name') || 'Imóvel Desconhecido',
            client_code: cb.value || '0',
            client_name: cb.getAttribute('data-client') || 'Sem Cliente',
            bloco: cb.getAttribute('data-bloco') || '',
            apto: cb.getAttribute('data-apto') || '',
            situacao: cb.getAttribute('data-situacao') || '',
            value: 0
        }));

        const payload = {
            assigned_to: userId,
            tasks: tasksToSave
        };

        fetch('api/tasks.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(`${tasksToSave.length} tarefa(s) distribuída(s) com sucesso.`);
                    document.getElementById('distributeTasksModal').classList.add('hidden');
                    const modalOverlay = document.getElementById('modalOverlay');
                    if (modalOverlay) modalOverlay.classList.add('hidden');
                    if (typeof loadTarefas === 'function') loadTarefas();
                    if (typeof loadKanbanCards === 'function') loadKanbanCards();
                } else {
                    showToast("Erro ao distribuir: " + (data.error || 'Erro desconhecido'), 'error');
                }
            })
            .catch(e => {
                console.error(e);
                showToast("Falha ao comunicar com o servidor.", 'error');
            });

        document.getElementById('distributeTasksModal').classList.add('hidden');
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) modalOverlay.classList.add('hidden');
    };
}

// --- Kanban Logic (Mock) ---
window.updateKanbanCounters = function () {
    localColumns.forEach(col => {
        const colElement = document.getElementById('col-' + col.status_key);
        if (colElement) {
            const cardsCount = colElement.querySelectorAll('.kanban-card').length;
            const badge = document.getElementById('badge-' + col.status_key);
            if (badge) {
                badge.innerText = cardsCount;
            }
        }
    });
}

window.dragCard = function (ev) {
    ev.dataTransfer.setData("card_id", ev.target.id);
}

window.dropCard = async function (ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("card_id");
    const card = document.getElementById(data);

    let dropzone = ev.target;
    // Ensure drop is on the column-cards container
    while (dropzone && !dropzone.classList.contains('column-cards')) {
        dropzone = dropzone.parentElement;
    }

    if (dropzone && card) {
        dropzone.appendChild(card);
        updateKanbanCounters();

        // Get new status from parent kanban-column data attribute
        const newStatus = dropzone.parentElement.getAttribute('data-status');
        const taskId = card.id.replace('card-', '');

        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('status', newStatus);
            await fetch('api/tasks.php?action=update_status', {
                method: 'POST',
                body: formData
            });

            // Atualiza a interface
            if (typeof loadTarefas === 'function') await loadTarefas();
            if (typeof loadKanbanCards === 'function') await loadKanbanCards();
        } catch (e) {
            console.error('Falha ao atualizar status na API', e);
        }
    }
}

window.currentLoadedTasks = [];

window.loadTarefas = async function () {
    const tbody = document.getElementById('tarefasList');
    if (!tbody) return;

    try {
        const res = await fetch('api/tasks.php?action=list&_t=' + new Date().getTime());
        const text = await res.text();

        try {
            const data = JSON.parse(text);
            if (data && data.success) {
                window.currentLoadedTasks = data.tasks;
            } else {
                console.error("API falhou ou não retornou success", data);
                if (data && data.error) {
                    alert("Erro no servidor: " + data.error + (data.details ? "\nDetalhes: " + data.details : ""));
                }
window.currentLoadedTasks = [];
window.currentOpenTaskId = null;
            }
        } catch (jsonErr) {
            console.error("Erro ao fazer parse do JSON. Resposta bruta:", text);
            alert("Erro ao carregar tarefas. Resposta do servidor não é JSON válido: " + text.substring(0, 150));
            window.currentLoadedTasks = [];
        }
    } catch (e) {
        console.error("Erro no fetch de loadTarefas", e);
        window.currentLoadedTasks = [];
    }

    if (window.currentLoadedTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma tarefa encontrada.</td></tr>';
        return;
    }

    const isAdmin = user && user.role === 'admin';
    const baseStyle = 'white-space: nowrap; font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; color: white; display: inline-block; text-align: center;';
    const statusMap = {
        todo: { label: 'A Fazer', bg: '#64748B' },
        in_progress: { label: 'Atendendo', bg: '#3B82F6' },
        doing: { label: 'Atendendo', bg: '#3B82F6' },
        done: { label: 'Finalizado', bg: '#10B981' }
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    const fragment = window.currentLoadedTasks;
    const len = fragment.length;

    for (let i = 0; i < len; i++) {
        const t = fragment[i];
        if (!isAdmin && t.assigned_to != user.id && !(t.shared_with || []).includes(String(user.id))) continue;

        const assignedUser = window.currentLoadedUsers ? window.currentLoadedUsers.find(u => u.id == t.assigned_to) : null;
        let userName = assignedUser ? assignedUser.name : 'Não atribuído';
        if (t.shared_with && t.shared_with.length > 0) userName += ` (+${t.shared_with.length})`;

        const clientText = t.client ? `${t.client} <br><small style="color:var(--text-muted)">Atendente: ${userName}</small>` : userName;

        let delBtn = isAdmin ? `<button class="btn-secondary danger-text" onclick="deleteServerTask('${t.id}')">Excluir</button>` : '';

        let statusInfo = statusMap[t.status] || (t.status ? { label: t.status.charAt(0).toUpperCase() + t.status.slice(1), bg: 'var(--primary)' } : { label: 'A Fazer', bg: '#64748B' });
        let dueWarning = '';
        if (t.due_date && t.status !== 'done') {
            const due = new Date(t.due_date + 'T00:00:00');
            const diffDays = Math.ceil((due - today) / 86400000);
            if (diffDays === 1) dueWarning = '<br><span class="label" style="background-color: var(--danger); font-size: 0.7rem; display:inline-block; margin-top:3px;" title="Vence amanhã">\u26A0\ufe0f Vence Amanhã</span>';
            else if (diffDays < 0) dueWarning = '<br><span class="label" style="background-color: var(--danger); font-size: 0.7rem; display:inline-block; margin-top:3px;" title="Atrasado">\u26A0\ufe0f Atrasado</span>';
        }

        html += `<tr><td>${t.name} ${dueWarning}</td><td>${clientText}</td><td>${t.created_at}</td><td><span class="label" style="${baseStyle} background: ${statusInfo.bg};">${statusInfo.label}</span></td><td><div class="table-actions"><button class="btn-secondary" onclick="openTaskDetails('${t.id}')">Abrir</button>${delBtn}</div></td></tr>`;
    }

    tbody.innerHTML = html;
}

window.filterTarefas = function() {
    const term = document.getElementById('searchTarefas') ? document.getElementById('searchTarefas').value.toLowerCase() : '';
    const rows = document.querySelectorAll('#tarefasList tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

window.filterKanban = function() {
    const term = document.getElementById('searchKanban') ? document.getElementById('searchKanban').value.toLowerCase() : '';
    const cards = document.querySelectorAll('.kanban-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(term)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

window.truncateAllData = async function() {
    if (!confirm('ATENÇÃO: Isto apagará TODAS as tarefas e dados do Kanban. Você tem certeza que deseja continuar?')) {
        return;
    }
    
    try {
        const res = await fetch('api/tasks.php?action=truncate_tasks', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast('Dados apagados com sucesso.');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('Erro ao apagar dados: ' + (data.error || 'Desconhecido'), 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Erro ao apagar dados. Verifique a conexão.', 'error');
    }
}

window.deleteServerTask = async function (id) {
    if (confirm("Tem certeza que deseja mover esta tarefa para a Lixeira?")) {
        try {
            const formData = new FormData();
            formData.append('task_id', id);
            await fetch('api/tasks.php?action=soft_delete', { method: 'POST', body: formData });
            loadTarefas();
            if (typeof loadKanbanCards === 'function') loadKanbanCards();
            showToast('Tarefa movida para a Lixeira.');
        } catch (e) { console.error(e); showToast('Erro ao excluir tarefa.', 'error'); }
    }
}

var localColumns = [
    { title: 'A Fazer', status_key: 'todo' },
    { title: 'Atendendo', status_key: 'in_progress' },
    { title: 'Finalizado', status_key: 'done' }
];

window.loadKanbanCards = async function () {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    board.innerHTML = ''; // clear

    // Render local columns
    localColumns.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.className = 'kanban-column';
        colDiv.id = 'col-' + col.status_key;
        colDiv.setAttribute('data-status', col.status_key);

        colDiv.innerHTML = `
                <div class="column-header">
                    <div>
                        <span>${col.title}</span>
                        <span class="badge" id="badge-${col.status_key}">0</span>
                    </div>
                    <button class="icon-btn danger-text" onclick="deleteColumn('${col.status_key}')" title="Excluir Coluna" style="padding:2px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="column-cards" ondragover="event.preventDefault()" ondrop="dropCard(event)">
                </div>
            `;
        board.appendChild(colDiv);
    });

    // Reusa dados já carregados, busca na API apenas se vazio
    if (!window.currentLoadedTasks || window.currentLoadedTasks.length === 0) {
        try {
            const res = await fetch('api/tasks.php?action=list&_t=' + new Date().getTime());
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data && data.success) {
                    window.currentLoadedTasks = data.tasks;
                } else {
                    if (data && data.error) {
                        alert("Erro no servidor (Kanban): " + data.error + (data.details ? "\nDetalhes: " + data.details : ""));
                    }
                }
            } catch (e) {
                console.error("Erro ao fazer parse do JSON no Kanban. Resposta bruta:", text);
            }
        } catch (e) {
            console.error("Erro no fetch de Kanban", e);
        }
    }

    const savedTasks = window.currentLoadedTasks || [];
    const isAdmin = user && user.role === 'admin';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pré-agrupa cards por coluna para evitar querySelector repetido
    const colCards = {};
    localColumns.forEach(col => {
        colCards[col.status_key] = [];
    });

    for (let i = 0; i < savedTasks.length; i++) {
        const t = savedTasks[i];
        if (!isAdmin && t.assigned_to != user.id && !(t.shared_with || []).includes(String(user.id))) continue;

        const assignedUser = window.currentLoadedUsers ? window.currentLoadedUsers.find(u => u.id == t.assigned_to) : null;
        let userName = assignedUser ? assignedUser.name : 'Não atribuído';
        if (t.shared_with && t.shared_with.length > 0) userName += ` (+${t.shared_with.length})`;

        let status = t.status || 'todo';
        let deleteBtn = isAdmin ? `<button class="icon-btn danger-text" style="position: absolute; top: 10px; right: 10px; padding: 2px; font-size: 0.75rem;" onclick="event.stopPropagation(); deleteServerTask('${t.id}')">Excluir</button>` : '';

        let dueWarning = '';
        if (t.due_date && t.status !== 'done') {
            const due = new Date(t.due_date + 'T00:00:00');
            const diffDays = Math.ceil((due - today) / 86400000);
            if (diffDays === 1) dueWarning = '<div style="margin-top:5px;"><span class="label" style="background-color: var(--danger); font-size: 0.7rem; margin-left: 5px;">\u26A0\ufe0f Vence Amanhã</span></div>';
            else if (diffDays < 0) dueWarning = '<div style="margin-top:5px;"><span class="label" style="background-color: var(--danger); font-size: 0.7rem; margin-left: 5px;">\u26A0\ufe0f Atrasado</span></div>';
        }

        const card = `<div class="kanban-card" id="card-${t.id}" style="position: relative;" draggable="true" ondragstart="dragCard(event)" onclick="openTaskDetails('${t.id}')">${deleteBtn}<div class="card-labels"><span class="label" style="background: var(--primary)">${t.type}</span></div>${dueWarning}<div class="card-title" style="margin-top: 5px;">${t.name}</div><div class="card-client">${t.client || 'Sem cliente'}</div><div class="card-footer" style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);"><span>Atrib: ${userName}</span></div></div>`;

        if (colCards[status]) {
            colCards[status].push(card);
        } else {
            if (colCards['todo']) colCards['todo'].push(card);
        }
    }

    // Injeta HTML de uma vez por coluna (evita innerHTML +=)
    for (const key in colCards) {
        if (colCards[key].length > 0) {
            const el = document.querySelector(`#col-${key} .column-cards`);
            if (el) el.innerHTML = colCards[key].join('');
        }
    }

    updateKanbanCounters();
}

window.promptAddColumn = function () {
    const title = prompt('Digite o nome da nova coluna:');
    if (!title) return;

    const status_key = title.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Add to local array
    localColumns.push({ title: title, status_key: status_key });

    // Reload board
    loadKanbanCards();
}

window.openTaskDetails = function (taskId) {
    window.currentOpenTaskId = taskId;
    let savedTasks = window.currentLoadedTasks || [];
    let t = savedTasks.find(task => task.id == taskId);
    if (!t) return;

    let localUsers = window.currentLoadedUsers || [];
    let assignedUser = localUsers.find(u => u.id == t.assigned_to);
    let userName = assignedUser ? assignedUser.name : 'Não atribuído';

    modalOverlay.classList.remove('hidden');
    document.getElementById('taskDetailsModal').classList.remove('hidden');

    const dynDetails = document.getElementById('dynamicClientDetails');
    if (dynDetails) dynDetails.innerHTML = '';
    const actLog = document.getElementById('activityLog');
    if (actLog) actLog.innerHTML = '';
    const taskUpdates = document.getElementById('taskUpdatesList');
    if (taskUpdates) taskUpdates.innerHTML = '';

    let statusOptionsHtml = '';
    if (typeof localColumns !== 'undefined') {
        let adjustedStatus = (t.status === 'doing') ? 'in_progress' : t.status;

        localColumns.forEach(c => {
            statusOptionsHtml += `<option value="${c.status_key}" ${adjustedStatus === c.status_key ? 'selected' : ''}>${c.title}</option>`;
        });
    } else {
        statusOptionsHtml = `<option value="todo" ${t.status === 'todo' ? 'selected' : ''}>A Fazer</option>
                                 <option value="in_progress" ${(t.status === 'doing' || t.status === 'in_progress') ? 'selected' : ''}>Atendendo</option>
                                 <option value="done" ${t.status === 'done' ? 'selected' : ''}>Finalizado</option>`;
    }

    document.getElementById('taskModalTitle').innerText = t.name || 'Detalhes da Tarefa';
    let blocoApto = [t.bloco, t.apto].filter(Boolean).join(' / ');
    let extraInfo = '';
    if (blocoApto) extraInfo += `<p><strong>Bloco/Apto:</strong> ${blocoApto}</p>`;
    if (t.situacao) extraInfo += `<p><strong>Situação:</strong> <span class="label" style="background:var(--bg-body); color:var(--text-main); border:1px solid var(--border)">${t.situacao}</span></p>`;
    
    // Taxas da planilha
    if (t.value && parseFloat(t.value) > 0) {
        extraInfo += `<div style="margin-top:10px; margin-bottom:10px; padding: 10px; border: 1px solid var(--danger); border-radius: 4px; background: #FEF2F2;">
            <p style="margin:0; color: var(--danger);"><strong>Taxas (Boletos Devidos):</strong> R$ ${parseFloat(t.value).toFixed(2)}</p>`;
        
        // Extrai a data de vencimento preenchida nas observações durante a importação
        if (t.observations && t.observations.includes('Data Vencimento do Boleto:')) {
            const match = t.observations.match(/Data Vencimento do Boleto:\s*([^\n]+)/);
            if (match && match[1]) {
                extraInfo += `<p style="margin: 5px 0 0 0; font-size: 0.9em; color: var(--danger);"><strong>Vencimento:</strong> ${match[1]}</p>`;
            }
        }
        extraInfo += `</div>`;
    }

    let created_at_br = t.created_at || 'N/A';
    if (created_at_br !== 'N/A') {
        const parts = created_at_br.split(' ');
        if (parts.length === 2) {
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
                created_at_br = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${parts[1]}`;
            }
        }
    }

    document.getElementById('taskDetailsContent').innerHTML = `
            <p><strong>Imóvel:</strong> ${t.name || 'N/A'}</p>
            <p><strong>Cliente:</strong> ${t.client || 'N/A'}</p>
            ${extraInfo}
            <p><strong>Tipo:</strong> ${t.type || 'N/A'}</p>
            <p style="display:flex; align-items:center;">
                <strong style="margin-right:5px;">Status:</strong> 
                <select id="selectTaskStatusModal" class="form-control form-sm" style="width:auto;" onchange="changeTaskStatus('${taskId}', this.value)">
                    ${statusOptionsHtml}
                </select>
            </p>
            <p><strong>Atribuído a:</strong> <span id="lblAssignedUser">${userName}</span></p>
            <p><strong>Criada em:</strong> ${created_at_br}</p>
            <div id="dynamicClientDetails" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border);">
                <p style="color:var(--text-muted); font-style:italic;">Carregando detalhes do cliente...</p>
            </div>
        `;

    // Fetch Taxas and Contatos
    if (t.client_code) {
        fetch(`api/condado.php?action=fetch_client_details&client_code=${t.client_code}`)
            .then(res => res.json())
            .then(data => {
                let detailsHtml = '';
                if (data.success) {
                    detailsHtml += `<p style="margin-bottom:10px;"><strong>Taxas (Boletos Devidos):</strong> <span class="label" style="background:var(--danger); color:white;">${data.taxas}</span></p>`;

                    if (data.contact) {
                        detailsHtml += `<p style="margin-bottom:5px;"><strong>Dados de Contato:</strong></p>`;
                        detailsHtml += `<ul style="margin: 0 0 10px 20px; font-size: 0.9rem; line-height: 1.5;">`;
                        if (data.contact.fonece) detailsHtml += `<li><strong>Telefone 1:</strong> (${data.contact.dddce || ''}) ${data.contact.fonece}</li>`;
                        if (data.contact.foneco) detailsHtml += `<li><strong>Telefone 2:</strong> (${data.contact.dddco || ''}) ${data.contact.foneco}</li>`;
                        if (data.contact.email) detailsHtml += `<li><strong>Email:</strong> ${data.contact.email}</li>`;
                        if (data.contact.email2) detailsHtml += `<li><strong>Email 2:</strong> ${data.contact.email2}</li>`;
                        if (data.contact.email3) detailsHtml += `<li><strong>Email 3:</strong> ${data.contact.email3}</li>`;
                        detailsHtml += `</ul>`;
                    } else {
                        detailsHtml += `<p><strong>Dados de Contato:</strong> Nenhum contato encontrado.</p>`;
                    }

                    if (data.boletos && data.boletos.length > 0) {
                        detailsHtml += `<div style="margin-bottom:10px;">
                                <p style="margin-bottom:5px;"><strong>Boletos em Atraso:</strong></p>
                                <ul style="margin: 0 0 10px 20px; font-size: 0.9rem; line-height: 1.5;">`;
                        data.boletos.forEach(b => {
                            const venc = b.dataVecto ? b.dataVecto.split('-').reverse().join('/') : 'N/D';
                            const valor = parseFloat(b.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            const numBoleto = b.numero_doc || b.idBoleto || 'N/D';
                            detailsHtml += `<li>Boleto <strong>#${numBoleto}</strong> - ${valor} (Venceu em: ${venc})</li>`;
                        });
                        detailsHtml += `</ul></div>`;
                    }
                } else {
                    detailsHtml = `<p style="color:var(--danger)">Erro ao carregar detalhes: ${data.error || 'Desconhecido'}</p>`;
                }
                const container = document.getElementById('dynamicClientDetails');
                if (container) container.innerHTML = detailsHtml;
            })
            .catch(err => {
                const container = document.getElementById('dynamicClientDetails');
                if (container) container.innerHTML = `<p style="color:var(--danger)">Erro de conexão ao carregar detalhes.</p>`;
            });
    } else {
        const container = document.getElementById('dynamicClientDetails');
        if (container) container.innerHTML = `<p style="color:var(--text-muted)">Tarefa sem código de cliente associado.</p>`;
    }


    // Renderizar a lista de usuários no menu lateral para reatribuir e compartilhar
    let assignContainer = document.getElementById('assignUserContainer');
    if (assignContainer) {
        let optionsHtml = '<option value="">-- Selecione --</option>';
        let shareOptionsHtml = '<option value="">-- Compartilhar com --</option>';

        localUsers.forEach(u => {
            optionsHtml += `<option value="${u.id}" ${t.assigned_to == u.id ? 'selected' : ''}>${u.name}</option>`;

            if (t.assigned_to != u.id && !(t.shared_with && t.shared_with.includes(String(u.id)))) {
                shareOptionsHtml += `<option value="${u.id}">${u.name}</option>`;
            }
        });

        let sharedBadges = '';
        if (t.shared_with && t.shared_with.length > 0) {
            t.shared_with.forEach(sid => {
                let su = localUsers.find(x => x.id == sid);
                if (su) {
                    sharedBadges += `<span class="label" style="background:var(--text-muted); margin-right:5px; margin-bottom:5px; display:inline-block;">${su.name} <span style="cursor:pointer; color:#ffcccc; margin-left:3px;" onclick="unshareTaskWithUser('${taskId}', '${su.id}')">&times;</span></span>`;
                }
            });
        }

        assignContainer.innerHTML = `
                <p style="font-size:0.8rem; font-weight:600; margin-bottom: 5px;">Transferir para:</p>
                <select id="selectReassignUser" class="form-control form-sm" style="width: 100%; margin-bottom: 10px;" onchange="reassignTaskToUser('${taskId}', this.value)">
                    ${optionsHtml}
                </select>
                <hr style="border:none; border-top: 1px solid var(--border); margin: 10px 0;">
                <p style="font-size:0.8rem; font-weight:600; margin-bottom: 5px;">Compartilhar com:</p>
                <div style="display:flex; gap: 5px; margin-bottom: 10px;">
                    <select id="selectShareUser" class="form-control form-sm" style="flex:1;">
                        ${shareOptionsHtml}
                    </select>
                    <button class="btn-primary btn-sm" onclick="shareTaskWithUser('${taskId}', document.getElementById('selectShareUser').value)">Add</button>
                </div>
                <div id="sharedBadgesContainer">
                    ${sharedBadges}
                </div>
            `;
    }

    // Set inputs for editing
    let elObs = document.getElementById('taskObservations');
    if (elObs) elObs.value = t.observations || '';

    let elStart = document.getElementById('taskStartDate');
    if (elStart) elStart.value = t.start_date || '';

    let elDue = document.getElementById('taskDueDate');
    if (elDue) elDue.value = t.due_date || '';

    // Bind Save Details Button
    const btnSaveDetails = document.getElementById('btnSaveTaskDetails');
    if (btnSaveDetails) {
        btnSaveDetails.onclick = async () => {
            const obs = document.getElementById('taskObservations').value;
            const start = document.getElementById('taskStartDate').value;
            const due = document.getElementById('taskDueDate').value;
            try {
                const formData = new FormData();
                formData.append('task_id', taskId);
                formData.append('observations', obs);
                formData.append('start_date', start);
                formData.append('due_date', due);

                const res = await fetch('api/tasks.php?action=update_details', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    t.observations = obs;
                    t.start_date = start;
                    t.due_date = due;
                    if (typeof logActivity === 'function') logActivity(`Detalhes da tarefa atualizados (Data/Obs)`);
                    showToast('Alterações salvas com sucesso!');
                    await reloadUIAndModal(null);
                } else {
                    showToast('Erro ao salvar alterações.', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Falha na comunicação ao tentar salvar.', 'error');
            }
        };
    }

    // Bind Delete Task Button
    const btnDeleteTask = document.getElementById('btnDeleteTask');
    if (btnDeleteTask) {
        btnDeleteTask.onclick = async () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa? Ela será enviada para a Lixeira.')) {
                try {
                    const formData = new FormData();
                    formData.append('task_id', taskId);
                    const res = await fetch('api/tasks.php?action=soft_delete', { method: 'POST', body: formData });
                    const result = await res.json();
                    if (result.success) {
                        showToast('Tarefa movida para a Lixeira.');
                        document.getElementById('taskDetailsModal').classList.add('hidden');
                        document.getElementById('modalOverlay').classList.add('hidden');
                        await loadTarefas();
                        await loadKanbanCards();
                    } else {
                        showToast('Erro ao excluir tarefa.', 'error');
                    }
                } catch (e) {
                    console.error(e);
                    showToast('Falha na comunicação com o servidor.', 'error');
                }
            }
        };
    }
}

// Helper to reload UI after changes
window.reloadUIAndModal = async function (taskId) {
    if (window.location.pathname.includes('dashboard.html')) {
        let viewTitle = document.getElementById('currentViewTitle');
        if (viewTitle && viewTitle.innerText === 'Tarefas' && typeof loadTarefas === 'function') {
            await loadTarefas();
        } else if (viewTitle && viewTitle.innerText === 'Quadro Kanban' && typeof loadKanbanCards === 'function') {
            await loadKanbanCards();
        }
    }
    if (taskId) openTaskDetails(taskId);
}

window.reassignTaskToUser = async function (taskId, newUserId) {
    if (!newUserId) return;
    try {
        const formData = new FormData();
        formData.append('task_id', taskId);
        formData.append('user_id', newUserId);
        await fetch('api/tasks.php?action=reassign', { method: 'POST', body: formData });

        let localUsers = window.currentLoadedUsers || [];
        let newUser = localUsers.find(u => u.id == newUserId);
        logActivity(`Tarefa transferida para: ${newUser ? newUser.name : 'Desconhecido'}`);

        await reloadUIAndModal(taskId);
    } catch (e) { console.error(e); }
}

window.shareTaskWithUser = async function (taskId, userId) {
    if (!userId) return;
    try {
        const formData = new FormData();
        formData.append('task_id', taskId);
        formData.append('user_id', userId);
        await fetch('api/tasks.php?action=share_task', { method: 'POST', body: formData });

        let localUsers = window.currentLoadedUsers || [];
        let sUser = localUsers.find(u => u.id == userId);
        logActivity(`Tarefa compartilhada com: ${sUser ? sUser.name : 'Desconhecido'}`);

        await reloadUIAndModal(taskId);
        showToast('Tarefa compartilhada com sucesso.');
    } catch (e) { console.error(e); showToast('Erro ao compartilhar tarefa.', 'error'); }
}

window.unshareTaskWithUser = async function (taskId, userId) {
    try {
        const formData = new FormData();
        formData.append('task_id', taskId);
        formData.append('user_id', userId);
        await fetch('api/tasks.php?action=unshare_task', { method: 'POST', body: formData });

        let localUsers = window.currentLoadedUsers || [];
        let sUser = localUsers.find(u => u.id == userId);
        logActivity(`Compartilhamento removido de: ${sUser ? sUser.name : 'Desconhecido'}`);

        await reloadUIAndModal(taskId);
        showToast('Compartilhamento removido.');
    } catch (e) { console.error(e); showToast('Erro ao remover compartilhamento.', 'error'); }
}

window.changeTaskStatus = async function (taskId, newStatus) {
    if (!newStatus) return;
    try {
        const formData = new FormData();
        formData.append('task_id', taskId);
        formData.append('status', newStatus);
        await fetch('api/tasks.php?action=update_status', { method: 'POST', body: formData });

        let colDef = typeof localColumns !== 'undefined' ? localColumns.find(c => c.status_key === newStatus) : null;
        let statusTitle = colDef ? colDef.title : newStatus;

        if (typeof logActivity === 'function') {
            logActivity(`Status alterado para: ${statusTitle}`);
        }

        await reloadUIAndModal(taskId);
    } catch (e) { console.error(e); }
}

// --- Kanban Modal Interactions ---

// Global helper for Activity Log
window.logActivity = function (message) {
    const logList = document.getElementById('activityLog');
    if (!logList) return;
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `<strong>Você:</strong> ${message} <span style="font-size: 0.7rem; color: var(--text-muted)">(${time})</span>`;
    logList.prepend(li); // put at top
}

// 1. Checklist Progress
window.updateChecklistProgress = function (checkboxEl = null) {
    const checkboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
    if (checkboxes.length === 0) return;
    const checked = document.querySelectorAll('#checklistContainer input[type="checkbox"]:checked');
    const percent = (checked.length / checkboxes.length) * 100;
    document.getElementById('checklistProgress').style.width = percent + '%';

    if (checkboxEl) {
        const itemName = checkboxEl.parentElement.textContent.trim();
        const action = checkboxEl.checked ? 'Marcou' : 'Desmarcou';
        window.logActivity(`${action} o item de checklist '${itemName}'`);
    }
};

const btnAddChecklist = document.getElementById('btnAddChecklist');
if (btnAddChecklist) {
    btnAddChecklist.onclick = () => {
        const input = document.getElementById('newChecklistItem');
        const text = input.value.trim();
        if (text) {
            const container = document.getElementById('checklistContainer');
            const label = document.createElement('label');
            label.className = 'checklist-item';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.justifyContent = 'space-between';
            label.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" onchange="updateChecklistProgress(this)"> 
                        <span>${text}</span>
                    </div>
                    <button type="button" class="icon-btn text-danger" onclick="this.closest('.checklist-item').remove(); updateChecklistProgress(); window.logActivity('Excluiu um item do checklist: ${text}');" title="Excluir item" style="padding: 2px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                `;
            container.appendChild(label);
            input.value = '';
            updateChecklistProgress();
            window.logActivity(`Adicionou um novo item ao checklist: '${text}'`);
        }
    };
}

// Update existing checkboxes to trigger log
const existingCheckboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
existingCheckboxes.forEach(cb => {
    cb.setAttribute('onchange', 'updateChecklistProgress(this)');
});

// 2. Add Label
const btnAddLabel = document.getElementById('btnAddLabel');
if (btnAddLabel) {
    btnAddLabel.onclick = () => {
        const text = prompt("Digite o nome da etiqueta (ex: Importante):");
        if (text) {
            const colors = ['#8B5CF6', '#10B981', '#EC4899', '#F97316'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const container = document.getElementById('labelsContainer');
            const span = document.createElement('span');
            span.className = 'label';
            span.style.backgroundColor = color;
            span.innerHTML = `${text} &times;`;
            span.onclick = function () {
                this.remove();
                window.logActivity(`Etiqueta removida: ${text}`);
            };
            container.appendChild(span);
            window.logActivity(`Adicionou a etiqueta: ${text}`);
        }
    };
}

// 3. Registrar Atendimento
const btnSaveUpdate = document.getElementById('btnSaveUpdate');
if (btnSaveUpdate) {
    btnSaveUpdate.onclick = async () => {
        const textInput = document.getElementById('taskUpdateText');
        const content = textInput.value.trim();
        if (!content) return;

        // Render local mockup list
        const updatesList = document.getElementById('taskUpdatesList');
        const newUpdate = document.createElement('div');
        newUpdate.style.border = '1px solid var(--border)';
        newUpdate.style.padding = '10px';
        newUpdate.style.borderRadius = 'var(--radius-sm)';
        newUpdate.style.marginBottom = '10px';
        newUpdate.style.backgroundColor = 'rgba(0,0,0,0.02)';
        newUpdate.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">
                    <strong>Você</strong> - ${new Date().toLocaleString()}
                </div>
                <p style="font-size: 0.9rem;">${content}</p>
            `;
        updatesList.prepend(newUpdate);
        textInput.value = '';
        window.logActivity(`Registrou um novo atendimento (nota)`);

        // Try to hit API if real ID is available (Mocked ID 1 here for demo)
        try {
            const formData = new FormData();
            formData.append('task_id', window.currentOpenTaskId);
            formData.append('content', content);

            await fetch('api/tasks.php?action=add_update', {
                method: 'POST',
                body: formData
            });
        } catch (e) {
            console.log('API não conectada, registrado apenas visualmente.', e);
        }
    };
} // <--- ESTA CHAVE ESTAVA FALTANDO!

// 4. Excluir Tarefa
// (O evento de exclusão foi movido para openTaskDetails para obter acesso ao taskId)

window.renderRankingRow = function (item, index, color) {
    const name = item.atendente || item.imovel || 'Desconhecido';
    return `<div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span><strong>#${index + 1}</strong> ${name}</span>
        <span class="label" style="background:${color}">${item.total}</span>
    </div>`;
};

window.openRankingModal = function (title, items, color) {
    const modal = document.getElementById('modalOverlay');
    if (!modal) return;

    let rowsHtml = '';
    items.forEach((item, i) => {
        rowsHtml += window.renderRankingRow(item, i, color);
    });

    const existing = document.getElementById('rankingModal');
    if (existing) existing.remove();

    const modalDiv = document.createElement('div');
    modalDiv.id = 'rankingModal';
    modalDiv.className = 'modal';
    modalDiv.style.cssText = 'max-width: 500px; max-height: 80vh; display: flex; flex-direction: column;';
    modalDiv.innerHTML = `
        <div class="modal-header">
            <h3>${title} (${items.length})</h3>
            <button class="close-modal icon-btn" onclick="document.getElementById('rankingModal').remove(); document.getElementById('modalOverlay').classList.add('hidden');">&times;</button>
        </div>
        <div class="modal-body" style="overflow-y: auto; flex: 1; max-height: 60vh;">
            ${rowsHtml}
        </div>
    `;
    modal.appendChild(modalDiv);
    modal.classList.remove('hidden');
};

window.loadRelatorios = async function () {
    const container = document.getElementById('reportsContainer');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;">Carregando...</p>';
    try {
        const res = await fetch('api/reports.php');
        const data = await res.json();

        if (data.success) {
            const total = data.data.total_atendimentos || 0;
            const atendentes = data.data.ranking_atendentes || [];
            const atendentesAll = data.data.ranking_atendentes_all || [];
            const imoveis = data.data.ranking_imoveis || [];

            let atendentesHtml = '';
            if (atendentes.length === 0) {
                atendentesHtml = '<p class="text-muted">Nenhum dado.</p>';
            } else {
                atendentes.forEach((a, i) => {
                    atendentesHtml += window.renderRankingRow(a, i, 'var(--primary)');
                });
            }

            let imoveisHtml = '';
            if (imoveis.length === 0) {
                imoveisHtml = '<p class="text-muted">Nenhum dado.</p>';
            } else {
                imoveis.forEach((im, i) => {
                    imoveisHtml += window.renderRankingRow(im, i, 'var(--secondary)');
                });
            }

            const verTodosBtn = atendentesAll.length > 5
                ? `<button class="btn-secondary" style="width:100%; margin-top:10px;" onclick="window.openRankingModal('Ranking Completo de Atendentes', window._allAtendentes, 'var(--primary)')">Ver todos (${atendentesAll.length})</button>`
                : '';

            container.innerHTML = `
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        
                        <div class="card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                            <h4 style="color:var(--text-muted); margin-bottom:10px;">Total de Atendimentos</h4>
                            <h1 style="font-size: 3rem; color:var(--primary); margin:0;">${total}</h1>
                        </div>
                        
                        <div class="card" style="padding: 20px;">
                            <h4 style="margin-bottom: 15px; border-bottom:1px solid var(--border); padding-bottom:10px;">Ranking de Atendentes</h4>
                            ${atendentesHtml}
                            ${verTodosBtn}
                        </div>
                        
                        <div class="card" style="padding: 20px;">
                            <h4 style="margin-bottom: 15px; border-bottom:1px solid var(--border); padding-bottom:10px;">Top 5 Imóveis</h4>
                            ${imoveisHtml}
                        </div>
                        
                    </div>
                `;

            window._allAtendentes = atendentesAll;
        } else {
            container.innerHTML = '<p style="text-align:center; color:red;">' + (data.error || 'Erro ao carregar') + '</p>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center; color:red;">Falha de comunicação.</p>';
    }
};

// Default view (called at the end to ensure all functions are defined)

// Carregar usuários globalmente para os dropdowns
if (typeof window.loadUsers === 'function') {
    window.loadUsers().then(() => {
        loadView('tarefas');
    });
} else {
    loadView('tarefas');
}
});

window.handleAvatarUpload = async function (e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            let userStr = localStorage.getItem('cobranca_user');
            let user = JSON.parse(userStr || '{}');
            if (user && user.id) formData.append('id', user.id);
            const res = await fetch('api/users.php?action=update_avatar', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                user.avatar = data.avatar;
                localStorage.setItem('cobranca_user', JSON.stringify(user));
                const userAvatarEl = document.getElementById('sidebarAvatar');
                if (userAvatarEl) {
                    userAvatarEl.innerHTML = '<img src=\"' + data.avatar + '\" style=\"width:100%; height:100%; border-radius:50%; object-fit:cover;\">';
                }
                const settingsPreview = document.getElementById('settingsAvatarPreview');
                if (settingsPreview) {
                    settingsPreview.innerHTML = '<img src=\"' + data.avatar + '\" style=\"width:100%; height:100%; border-radius:50%; object-fit:cover;\">';
                }
                showToast('Avatar atualizado com sucesso!');
            } else {
                showToast(data.message || 'Erro ao atualizar avatar.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Falha na comunicação ao atualizar avatar.', 'error');
        }
    };

window.handleSettingsAvatarUpload = async function (e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            let userStr = localStorage.getItem('cobranca_user');
            let user = JSON.parse(userStr || '{}');
            if (user && user.id) formData.append('id', user.id);
            const res = await fetch('api/users.php?action=update_avatar', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                user.avatar = data.avatar;
                localStorage.setItem('cobranca_user', JSON.stringify(user));
                const userAvatarEl = document.getElementById('sidebarAvatar');
                if (userAvatarEl) {
                    userAvatarEl.innerHTML = '<img src=\"' + data.avatar + '\" style=\"width:100%; height:100%; border-radius:50%; object-fit:cover;\">';
                }
                const settingsPreview = document.getElementById('settingsAvatarPreview');
                if (settingsPreview) {
                    settingsPreview.innerHTML = '<img src=\"' + data.avatar + '\" style=\"width:100%; height:100%; border-radius:50%; object-fit:cover;\">';
                }
                showToast('Avatar atualizado com sucesso!');
            } else {
                showToast(data.message || 'Erro ao atualizar avatar.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Falha na comunicação ao atualizar avatar.', 'error');
        }
    };

window.saveProfile = async function () {
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const messageEl = document.getElementById('profileMessage');

        if (!name || !email) {
            messageEl.innerHTML = '<span style="color: var(--danger);">Nome e email são obrigatórios.</span>';
            return;
        }

        let userStr = localStorage.getItem('cobranca_user');
        let user = JSON.parse(userStr || '{}');

        try {
            const formData = new FormData();
            formData.append('id', user.id);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('role', user.role);

            const res = await fetch('api/users.php?action=update', { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                user.name = name;
                user.email = email;
                localStorage.setItem('cobranca_user', JSON.stringify(user));

                const userNameEl = document.getElementById('sidebarUserName');
                if (userNameEl) userNameEl.textContent = name;

                messageEl.innerHTML = '<span style="color: var(--primary);">Perfil atualizado com sucesso!</span>';
            } else {
                messageEl.innerHTML = '<span style="color: var(--danger);">' + (data.message || 'Erro ao salvar.') + '</span>';
            }
        } catch (err) {
            console.error(err);
            messageEl.innerHTML = '<span style="color: var(--danger);">Falha na comunicação.</span>';
        }
    };

window.sendTicket = async function () {
        const subject = document.getElementById('ticketSubject').value.trim();
        const message = document.getElementById('ticketMessage').value.trim();
        const feedbackEl = document.getElementById('ticketFeedback');

        if (!subject || !message) {
            feedbackEl.innerHTML = '<span style="color: var(--danger);">Assunto e descrição são obrigatórios.</span>';
            return;
        }

        let userStr = localStorage.getItem('cobranca_user');
        let user = JSON.parse(userStr || '{}');

        try {
            const res = await fetch('api/tickets.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    user_name: user.name,
                    user_email: user.email,
                    subject: subject,
                    message: message
                })
            });
            const data = await res.json();

            if (data.success) {
                document.getElementById('ticketSubject').value = '';
                document.getElementById('ticketMessage').value = '';
                feedbackEl.innerHTML = '<span style="color: var(--primary);">Chamado #' + data.ticket_id + ' aberto com sucesso!</span>';
            } else {
                feedbackEl.innerHTML = '<span style="color: var(--danger);">' + (data.message || 'Erro ao enviar.') + '</span>';
            }
        } catch (err) {
            console.error(err);
            feedbackEl.innerHTML = '<span style="color: var(--danger);">Falha na comunicação.</span>';
        }
    };

window.loadTickets = async function () {
        const container = document.getElementById('ticketsContainer');
        if (!container) return;

        try {
            const res = await fetch('api/tickets.php?action=list');
            const data = await res.json();

            if (data.success && data.tickets.length > 0) {
                window._ticketsData = data.tickets;
                let html = '<table class="data-table"><thead><tr>';
                html += '<th>ID</th><th>Usuário</th><th>Assunto</th><th>Data</th><th>Status</th><th>Ações</th>';
                html += '</tr></thead><tbody>';

                data.tickets.forEach(ticket => {
                    const statusColors = {
                        'aberto': 'background: #FEF3C7; color: #92400E;',
                        'em_andamento': 'background: #DBEAFE; color: #1E40AF;',
                        'resolvido': 'background: #D1FAE5; color: #065F46;'
                    };
                    const statusLabels = {
                        'aberto': 'Aberto',
                        'em_andamento': 'Em Andamento',
                        'resolvido': 'Resolvido'
                    };
                    const date = new Date(ticket.created_at).toLocaleDateString('pt-BR');

                    html += '<tr>';
                    html += '<td>#' + ticket.id + '</td>';
                    html += '<td>' + ticket.user_name + '<br><small style="color: var(--text-muted);">' + ticket.user_email + '</small></td>';
                    html += '<td><strong>' + ticket.subject + '</strong></td>';
                    html += '<td>' + date + '</td>';
                    html += '<td><span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; ' + statusColors[ticket.status] + '">' + statusLabels[ticket.status] + '</span></td>';
                    html += '<td>';
                    html += '<button class="btn-secondary btn-sm" onclick="viewTicket(' + ticket.id + ')">Ver</button> ';
                    if (ticket.status !== 'resolvido') {
                        html += '<button class="btn-secondary btn-sm" onclick="updateTicketStatus(' + ticket.id + ', \'' + (ticket.status === 'aberto' ? 'em_andamento' : 'resolvido') + '\')">' + (ticket.status === 'aberto' ? 'Iniciar' : 'Resolver') + '</button>';
                    }
                    html += '</td>';
                    html += '</tr>';
                });

                html += '</tbody></table>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Nenhum chamado aberto.</p>';
            }
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p style="color: var(--danger);">Erro ao carregar chamados.</p>';
        }
    };

window.updateTicketStatus = async function (id, newStatus) {
        try {
            const res = await fetch('api/tickets.php?action=update_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                loadTickets();
                showToast('Status atualizado com sucesso!');
            } else {
                showToast(data.message || 'Erro ao atualizar status.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Falha na comunicação.', 'error');
        }
    };

window.viewTicket = function (id) {
        const ticket = window._ticketsData.find(t => t.id === id);
        if (!ticket) return;

        const statusColors = {
            'aberto': 'background: #FEF3C7; color: #92400E;',
            'em_andamento': 'background: #DBEAFE; color: #1E40AF;',
            'resolvido': 'background: #D1FAE5; color: #065F46;'
        };
        const statusLabels = {
            'aberto': 'Aberto',
            'em_andamento': 'Em Andamento',
            'resolvido': 'Resolvido'
        };

        const date = new Date(ticket.created_at).toLocaleDateString('pt-BR');
        const messageHtml = ticket.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

        const modalHTML = `
            <div class="modal-overlay" id="ticketModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000;" onclick="closeTicketModal(event)">
                <div class="modal" style="max-width:600px; width:90%; background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border); border-top:3px solid var(--accent); box-shadow:var(--shadow-lg);" onclick="event.stopPropagation()">
                    <div class="modal-header" style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0;">Chamado #${ticket.id}</h3>
                        <button class="icon-btn" onclick="closeTicketModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-muted);">&times;</button>
                    </div>
                    <div class="modal-body" style="padding:1.5rem;">
                        <div style="margin-bottom:1.5rem;">
                            <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
                                <div class="avatar-circle" style="width:40px; height:40px; font-size:1rem; flex-shrink:0;">${ticket.user_name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <strong>${ticket.user_name}</strong><br>
                                    <small style="color:var(--text-muted);">${ticket.user_email}</small>
                                </div>
                                <div style="margin-left:auto;">
                                    <span style="padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600; ${statusColors[ticket.status]}">${statusLabels[ticket.status]}</span>
                                </div>
                            </div>
                            <p style="font-size:0.85rem; color:var(--text-muted);">Aberto em: ${date}</p>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <h4 style="margin-bottom:0.5rem; color:var(--primary);">Assunto</h4>
                            <p style="font-size:1rem;">${ticket.subject}</p>
                        </div>
                        <div>
                            <h4 style="margin-bottom:0.5rem; color:var(--primary);">Descrição</h4>
                            <div style="background:var(--bg-body); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border); line-height:1.6;">${messageHtml}</div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding:1.5rem; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:1rem;">
                        <button class="btn-secondary" onclick="closeTicketModal()">Fechar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

window.closeTicketModal = function (event) {
        if (event && event.target.id !== 'ticketModalOverlay') return;
        const modal = document.getElementById('ticketModalOverlay');
        if (modal) modal.remove();
    };

window.showToast = function (message, type = 'success') {
        const colors = {
            success: 'background: #10B981;',
            error: 'background: #EF4444;',
            info: 'background: #3B82F6;'
        };
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; padding:1rem 1.5rem; color:#fff; border-radius:8px; z-index:9999; font-size:0.9rem; box-shadow:0 4px 12px rgba(0,0,0,0.3); animation:toastIn 0.3s ease; ' + (colors[type] || colors.success);
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
