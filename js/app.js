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
            if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';
            if (userAvatarEl && user.name) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
            
            if (user.role === 'admin') {
                const adminSubmenu = document.getElementById('adminSubmenu');
                if (adminSubmenu) adminSubmenu.classList.remove('hidden');
                const navUsuarios = document.getElementById('navUsuarios');
                if (navUsuarios) navUsuarios.style.display = 'flex';
            }
        }
    } catch (err) {
        console.error('Erro ao ler a sessão:', err);
    }
    
    // Carregar usuários no início para popular os dropdowns de distribuição/atribuição
    if (typeof loadUsers === 'function') {
        loadUsers();
    }

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
                    <button class="btn-primary" id="btnShowCreateTask" style="display: ${user && (user.role === 'admin' || safeGetPermissions().create_task) ? 'block' : 'none'}">Criar tarefas</button>
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
                    <button class="btn-primary btn-sm" onclick="promptAddColumn()">+ Adicionar Coluna</button>
                </div>
                <div class="kanban-board" id="kanbanBoard">
                    <!-- Columns will be injected dynamically here by loadKanbanCards() / loadColumns() -->
                </div>
            </div>
        `,
        relatorios: `<div class="view-section active"><h3>Relatórios (Em breve)</h3></div>`,
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
                        <div class="avatar-circle" style="width: 80px; height: 80px; font-size: 2.5rem;" id="settingsAvatarPreview">${user ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                        <div>
                            <button class="btn-secondary btn-sm">Definir Avatar</button>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">JPG, GIF ou PNG. Max 1MB.</p>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Nome Completo</label>
                        <input type="text" class="form-control" value="${user ? user.name : ''}">
                    </div>
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" class="form-control" value="${user ? user.email : ''}" readonly>
                    </div>
                    <button class="btn-primary" onclick="alert('Perfil salvo!')">Salvar Perfil</button>
                </div>
                
                <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Trocar Senha</h4>
                    <div class="input-group">
                        <label>Senha Atual</label>
                        <input type="password" class="form-control">
                    </div>
                    <div class="input-group">
                        <label>Nova Senha</label>
                        <input type="password" class="form-control">
                    </div>
                    <div class="input-group">
                        <label>Confirmar Nova Senha</label>
                        <input type="password" class="form-control">
                    </div>
                    <button class="btn-primary" onclick="alert('Senha atualizada!')">Atualizar Senha</button>
                </div>
            </div>
            
            ${user && user.role === 'admin' ? `
            <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-top: 2rem;">
                <h4 style="margin-bottom: 1.5rem; color: var(--primary);">Submenu Administrativo</h4>
                <p style="margin-bottom: 1rem; color: var(--text-muted);">Definir e ajustar permissões de acesso dos usuários no sistema.</p>
                <button class="btn-secondary" onclick="document.querySelector('[data-view=permissoes]').click()">Gerenciar Permissões</button>
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
                                <td style="text-align:center;"><input type="checkbox" checked></td>
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
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Seu usuário e o horário da abertura serão registrados e anexados automaticamente ao enviar.</p>
                    
                    <div class="input-group">
                        <label>Assunto</label>
                        <input type="text" id="ticketSubject" class="form-control" placeholder="Descreva o problema brevemente">
                    </div>
                    <div class="input-group">
                        <label>Descrição detalhada</label>
                        <textarea id="ticketMessage" class="form-control" rows="5" placeholder="Forneça os detalhes e passos para reproduzir o problema..."></textarea>
                    </div>
                    <button class="btn-primary" style="width: 100%;" onclick="alert('Chamado aberto com sucesso! Enviando ticket em nome de: ${user ? user.name : 'Desconhecido'} às ' + new Date().toLocaleString())">Enviar Chamado</button>
                </div>
            </div>
        </div>`
    };

    function loadView(viewName) {
        viewContainer.innerHTML = views[viewName] || '<div>Não encontrado</div>';
        
        // Setup view specific events
        if (viewName === 'tarefas') {
            loadTarefas();
        } else if (viewName === 'kanban') {
            loadKanbanCards();
        } else if (viewName === 'lixeira') {
            loadLixeira();
        } else if (viewName === 'usuarios') {
            loadUsers();
        } else if (viewName === 'permissoes') {
            loadPermissions();
        }
    }

    // Event Delegation para o botão "Criar Tarefas" que é injetado dinamicamente
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnShowCreateTask')) {
            openCreateTaskModal();
        }
    });

    // --- Permissoes Logic ---
    window.loadPermissions = function() {
        const perms = safeGetPermissions();
        
        const c_task = document.getElementById('perm_create_task_user');
        if(c_task) c_task.checked = perms.create_task;
        
        const d_task = document.getElementById('perm_distribute_task_user');
        if(d_task) d_task.checked = perms.distribute_task;
        
        const v_kanban = document.getElementById('perm_view_kanban_user');
        if(v_kanban) v_kanban.checked = perms.view_kanban;
        
        const v_reports = document.getElementById('perm_view_reports_user');
        if(v_reports) v_reports.checked = perms.view_reports;
        
        const v_trash = document.getElementById('perm_view_trash_user');
        if(v_trash) v_trash.checked = perms.view_trash;
        
        const v_config = document.getElementById('perm_view_config_user');
        if(v_config) v_config.checked = perms.view_config;
    };

    window.savePermissions = function() {
        const perms = {
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
                alert("Permissões de acesso para Usuário Padrão foram salvas com sucesso para todos os usuários!");
            }
        })
        .catch(e => {
            alert("Erro ao salvar permissões no servidor.");
        });
    };


    // Variável global para armazenar os usuários e poder editá-los sem chamar API de novo
    window.currentLoadedUsers = [];

    // --- Users Logic ---
    window.loadUsers = async function() {
        const tbody = document.getElementById('usuariosList');
        if (!tbody) return;

        try {
            const res = await fetch('api/users.php?action=list');
            const data = await res.json();

            if (data && data.success && data.users.length > 0) {
                window.currentLoadedUsers = data.users;
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
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum usuário encontrado.</td></tr>';
            }
        } catch (e) {
            console.error("Falha ao carregar usuários", e);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao conectar com o banco de dados.</td></tr>';
        }
    };

    window.currentEditingUserId = null;

    window.saveUser = async function() {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        if (!name || !email || (!password && !window.currentEditingUserId)) {
            alert("Preencha nome e e-mail (a senha é obrigatória para novos usuários).");
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
                alert(`Usuário ${window.currentEditingUserId ? 'atualizado' : 'cadastrado'} com sucesso!`);
                document.getElementById('createUserModal').classList.add('hidden');
                document.getElementById('modalOverlay').classList.add('hidden');
                document.getElementById('formCreateUser').reset();
                window.currentEditingUserId = null;
                loadUsers(); 
            } else {
                alert("Erro ao cadastrar/atualizar: " + (data.message || 'Desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert("Falha ao comunicar com o servidor.");
        }
    };

    window.editUser = function(id) {
        let userToEdit = window.currentLoadedUsers.find(u => u.id == id);
        if(!userToEdit) return;

        window.currentEditingUserId = id;
        document.getElementById('newUserName').value = userToEdit.name;
        document.getElementById('newUserEmail').value = userToEdit.email;
        document.getElementById('newUserPassword').value = ''; // Deixa em branco, preenche só se for trocar
        document.getElementById('newUserRole').value = userToEdit.role;
        
        document.querySelector('#createUserModal h3').innerText = "Editar Usuário";
        document.getElementById('modalOverlay').classList.remove('hidden');
        document.getElementById('createUserModal').classList.remove('hidden');
    };

    window.deleteUser = async function(id) {
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
                alert("Usuário excluído com sucesso!");
                loadUsers();
            } else {
                alert(data.message || 'Erro ao excluir usuário.');
            }
        } catch(e) {
            console.error(e);
            alert("Falha ao comunicar com o servidor.");
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

    window.loadLixeira = async function() {
        const tbody = document.getElementById('lixeiraList');
        if (!tbody) return;
        
        try {
            // Em produção: fetch('api/tasks.php?action=list_trash')
            if (trashItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Lixeira vazia.</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            trashItems.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="label" style="background-color: ${item.type === 'Coluna' ? '#EC4899' : '#3B82F6'}; cursor:default;">${item.type}</span></td>
                    <td>${item.title}</td>
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
        }
    }

    window.restoreTrash = function(id) {
        trashItems = trashItems.filter(i => i.id !== id);
        alert('Item restaurado com sucesso!');
        loadLixeira();
        loadKanbanCards();
    }

    window.forceDeleteTrash = function(id) {
        if(confirm('Tem certeza que deseja excluir PERMANENTEMENTE? Esta ação não pode ser desfeita.')) {
            trashItems = trashItems.filter(i => i.id !== id);
            alert('Item excluído para sempre.');
            loadLixeira();
        }
    }

    window.emptyTrash = function() {
        if(confirm('Tem certeza que deseja ESVAZIAR a lixeira?')) {
            trashItems = [];
            loadLixeira();
        }
    }

    // --- Delete Column ---
    window.deleteColumn = function(status_key) {
        if(confirm('Deseja excluir esta coluna inteira? Ela será movida para a Lixeira.')) {
            const col = localColumns.find(c => c.status_key === status_key);
            if(col) {
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
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // e.preventDefault();
            const viewName = item.getAttribute('data-view');
            
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
        } catch(e) {
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
        
        if(data.length === 0) {
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
                alert('Selecione pelo menos uma tarefa para distribuir.');
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
                alert('Selecione um usuário.');
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
                    alert(`Sucesso! ${tasksToSave.length} tarefa(s) distribuída(s) com sucesso.`);
                    document.getElementById('distributeTasksModal').classList.add('hidden');
                    const modalOverlay = document.getElementById('modalOverlay');
                    if(modalOverlay) modalOverlay.classList.add('hidden');
                    if (typeof loadTarefas === 'function') loadTarefas();
                    if (typeof loadKanbanCards === 'function') loadKanbanCards();
                } else {
                    alert("Erro ao distribuir: " + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(e => {
                console.error(e);
                alert("Falha ao se comunicar com a API de distribuição.");
            });
            
            document.getElementById('distributeTasksModal').classList.add('hidden');
            const modalOverlay = document.getElementById('modalOverlay');
            if(modalOverlay) modalOverlay.classList.add('hidden');
        };
    }

    // --- Kanban Logic (Mock) ---
    window.updateKanbanCounters = function() {
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

    window.dragCard = function(ev) {
        ev.dataTransfer.setData("card_id", ev.target.id);
    }
    
    window.dropCard = async function(ev) {
        ev.preventDefault();
        const data = ev.dataTransfer.getData("card_id");
        const card = document.getElementById(data);
        
        let dropzone = ev.target;
        // Ensure drop is on the column-cards container
        while(dropzone && !dropzone.classList.contains('column-cards')) {
            dropzone = dropzone.parentElement;
        }
        
        if(dropzone && card) {
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
            } catch(e) {
                console.error('Falha ao atualizar status na API', e);
            }
        }
    }

    window.currentLoadedTasks = [];

    window.loadTarefas = async function() {
        const tbody = document.getElementById('tarefasList');
        if(!tbody) return;
        
        try {
            const res = await fetch('api/tasks.php?action=list&_t=' + new Date().getTime());
            const text = await res.text();
            
            try {
                const data = JSON.parse(text);
                if (data && data.success) {
                    window.currentLoadedTasks = data.tasks;
                } else {
                    console.error("API falhou ou não retornou success", data);
                    window.currentLoadedTasks = [];
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

        tbody.innerHTML = '';
        
        window.currentLoadedTasks.forEach((t) => {
            let sharedArray = t.shared_with || [];
            
            const isAdmin = user && user.role === 'admin';
            const isAssigned = user && t.assigned_to == user.id;
            const isShared = user && sharedArray.includes(String(user.id));
            
            if (!isAdmin && !isAssigned && !isShared) return;

            let assignedUser = window.currentLoadedUsers ? window.currentLoadedUsers.find(u => u.id == t.assigned_to) : null;
            let userName = assignedUser ? assignedUser.name : 'Não atribuído';
            
            if (sharedArray.length > 0) {
                userName += ` (+${sharedArray.length})`;
            }

            let clientText = t.client ? `${t.client} <br><small style="color:var(--text-muted)">Atendente: ${userName}</small>` : userName;

            let actionButtons = `<button class="btn-secondary" onclick="openTaskDetails('${t.id}')">Abrir</button>`;
            
            if (user && user.role === 'admin') {
                actionButtons += ` <button class="btn-secondary danger-text" style="margin-left: 0.5rem;" onclick="deleteServerTask('${t.id}')">Excluir</button>`;
            }

            let colDef = typeof localColumns !== 'undefined' ? localColumns.find(c => c.status_key === t.status) : null;
            let statusLabel = 'A Fazer';
            let bgClass = 'background: #64748B;'; 
            
            if (t.status === 'todo') {
                statusLabel = colDef ? colDef.title : 'A Fazer';
                bgClass = 'background: #64748B;'; 
            } else if (t.status === 'doing' || t.status === 'in_progress') {
                statusLabel = colDef ? colDef.title : 'Atendendo';
                bgClass = 'background: #3B82F6;'; 
            } else if (t.status === 'done') {
                statusLabel = colDef ? colDef.title : 'Finalizado';
                bgClass = 'background: #10B981;'; 
            } else if (t.status) {
                statusLabel = colDef ? colDef.title : (t.status.charAt(0).toUpperCase() + t.status.slice(1));
                bgClass = 'background: var(--primary);';
            }

            tbody.innerHTML += `
                <tr>
                    <td>${t.name}</td>
                    <td>${clientText}</td>
                    <td>${t.created_at}</td>
                    <td><span class="label" style="${bgClass}">${statusLabel}</span></td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        });
    }

    window.deleteServerTask = async function(id) {
        if(confirm("Tem certeza que deseja excluir esta tarefa?")) {
            try {
                const formData = new FormData();
                formData.append('task_id', id);
                await fetch('api/tasks.php?action=force_delete', { method: 'POST', body: formData });
                loadTarefas();
                if (typeof loadKanbanCards === 'function') loadKanbanCards();
            } catch(e) { console.error(e); }
        }
    }

    var localColumns = [
        { title: 'A Fazer', status_key: 'todo' },
        { title: 'Atendendo', status_key: 'in_progress' },
        { title: 'Finalizado', status_key: 'done' }
    ];

    window.loadKanbanCards = async function() {
        const board = document.getElementById('kanbanBoard');
        if(!board) return;
        
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
        
        // Populate cards from API
        try {
            const res = await fetch('api/tasks.php?action=list&_t=' + new Date().getTime());
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data && data.success) {
                    window.currentLoadedTasks = data.tasks;
                }
            } catch(e) {
                console.error("Erro ao fazer parse do JSON no Kanban. Resposta bruta:", text);
            }
        } catch(e) {
            console.error("Erro no fetch de Kanban", e);
        }

        let savedTasks = window.currentLoadedTasks || [];
        
        savedTasks.forEach((t) => {
            let sharedArray = t.shared_with || [];
            
            const isAdmin = user && user.role === 'admin';
            const isAssigned = user && t.assigned_to == user.id;
            const isShared = user && sharedArray.includes(String(user.id));
            
            // Admin vê todos os cards. Usuário comum vê só os atribuídos a ele ou compartilhados com ele.
            if (!isAdmin && !isAssigned && !isShared) return;
            
            let assignedUser = window.currentLoadedUsers ? window.currentLoadedUsers.find(u => u.id == t.assigned_to) : null;
            let userName = assignedUser ? assignedUser.name : 'Não atribuído';
            
            if (sharedArray.length > 0) {
                userName += ` (+${sharedArray.length})`;
            }
            
            let status = t.status || 'todo';
            let col = document.querySelector(`#col-${status} .column-cards`);
            if (!col) col = document.querySelector('#col-todo .column-cards');
            
            if (col) {
                let deleteBtn = '';
                if (user && user.role === 'admin') {
                    deleteBtn = `<button class="icon-btn danger-text" style="position: absolute; top: 10px; right: 10px; padding: 2px; font-size: 0.75rem;" onclick="event.stopPropagation(); deleteServerTask('${t.id}')">Excluir</button>`;
                }
                
                col.innerHTML += `
                    <div class="kanban-card" id="card-${t.id}" style="position: relative;" draggable="true" ondragstart="dragCard(event)" onclick="openTaskDetails('${t.id}')">
                        ${deleteBtn}
                        <div class="card-labels">
                            <span class="label" style="background: var(--primary)">${t.type}</span>
                        </div>
                        <div class="card-title" style="margin-top: 5px;">${t.name}</div>
                        <div class="card-client">${t.client || 'Sem cliente'}</div>
                        <div class="card-footer" style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                            <span>Atrib: ${userName}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        updateKanbanCounters();
    }

    window.promptAddColumn = function() {
        const title = prompt('Digite o nome da nova coluna:');
        if(!title) return;
        
        const status_key = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Add to local array
        localColumns.push({ title: title, status_key: status_key });
        
        // Reload board
        loadKanbanCards();
    }

    window.openTaskDetails = function(taskId) {
        let savedTasks = window.currentLoadedTasks || [];
        let t = savedTasks.find(task => task.id == taskId);
        if(!t) return;
        
        let localUsers = window.currentLoadedUsers || [];
        let assignedUser = localUsers.find(u => u.id == t.assigned_to);
        let userName = assignedUser ? assignedUser.name : 'Não atribuído';

        modalOverlay.classList.remove('hidden');
        document.getElementById('taskDetailsModal').classList.remove('hidden');
        
        let statusOptionsHtml = '';
        if (typeof localColumns !== 'undefined') {
            let adjustedStatus = (t.status === 'doing') ? 'in_progress' : t.status;
            
            localColumns.forEach(c => {
                statusOptionsHtml += `<option value="${c.status_key}" ${adjustedStatus === c.status_key ? 'selected' : ''}>${c.title}</option>`;
            });
        } else {
            statusOptionsHtml = `<option value="todo" ${t.status === 'todo'?'selected':''}>A Fazer</option>
                                 <option value="in_progress" ${(t.status === 'doing' || t.status === 'in_progress')?'selected':''}>Atendendo</option>
                                 <option value="done" ${t.status === 'done'?'selected':''}>Finalizado</option>`;
        }

        document.getElementById('taskModalTitle').innerText = t.name || 'Detalhes da Tarefa';
        let blocoApto = [t.bloco, t.apto].filter(Boolean).join(' / ');
        let extraInfo = '';
        if (blocoApto) extraInfo += `<p><strong>Bloco/Apto:</strong> ${blocoApto}</p>`;
        if (t.situacao) extraInfo += `<p><strong>Situação:</strong> <span class="label" style="background:var(--bg-body); color:var(--text-main); border:1px solid var(--border)">${t.situacao}</span></p>`;

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
            <p><strong>Criada em:</strong> ${t.created_at || 'N/A'}</p>
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
                
                if(t.assigned_to != u.id && !(t.shared_with && t.shared_with.includes(String(u.id)))) {
                    shareOptionsHtml += `<option value="${u.id}">${u.name}</option>`;
                }
            });

            let sharedBadges = '';
            if (t.shared_with && t.shared_with.length > 0) {
                t.shared_with.forEach(sid => {
                    let su = localUsers.find(x => x.id == sid);
                    if(su) {
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
    }

    // Helper to reload UI after changes
    window.reloadUIAndModal = async function(taskId) {
        if(window.location.pathname.includes('dashboard.html')) {
            let viewTitle = document.getElementById('currentViewTitle');
            if (viewTitle && viewTitle.innerText === 'Tarefas' && typeof loadTarefas === 'function') {
                await loadTarefas();
            } else if (viewTitle && viewTitle.innerText === 'Quadro Kanban' && typeof loadKanbanCards === 'function') {
                await loadKanbanCards();
            }
        }
        if(taskId) openTaskDetails(taskId);
    }

    window.reassignTaskToUser = async function(taskId, newUserId) {
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
        } catch(e) { console.error(e); }
    }

    window.shareTaskWithUser = async function(taskId, userId) {
        if(!userId) return;
        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('user_id', userId);
            await fetch('api/tasks.php?action=share_task', { method: 'POST', body: formData });
            
            let localUsers = window.currentLoadedUsers || [];
            let sUser = localUsers.find(u => u.id == userId);
            logActivity(`Tarefa compartilhada com: ${sUser ? sUser.name : 'Desconhecido'}`);
            
            await reloadUIAndModal(taskId);
        } catch(e) { console.error(e); }
    }

    window.unshareTaskWithUser = async function(taskId, userId) {
        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('user_id', userId);
            await fetch('api/tasks.php?action=unshare_task', { method: 'POST', body: formData });
            
            let localUsers = window.currentLoadedUsers || [];
            let sUser = localUsers.find(u => u.id == userId);
            logActivity(`Compartilhamento removido de: ${sUser ? sUser.name : 'Desconhecido'}`);
            
            await reloadUIAndModal(taskId);
        } catch(e) { console.error(e); }
    }

    window.changeTaskStatus = async function(taskId, newStatus) {
        if (!newStatus) return;
        try {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('status', newStatus);
            await fetch('api/tasks.php?action=update_status', { method: 'POST', body: formData });
            
            let colDef = typeof localColumns !== 'undefined' ? localColumns.find(c => c.status_key === newStatus) : null;
            let statusTitle = colDef ? colDef.title : newStatus;
            
            if(typeof logActivity === 'function') {
                logActivity(`Status alterado para: ${statusTitle}`);
            }
            
            await reloadUIAndModal(taskId);
        } catch(e) { console.error(e); }
    }
    
    // --- Kanban Modal Interactions ---
    
    // Global helper for Activity Log
    window.logActivity = function(message) {
        const logList = document.getElementById('activityLog');
        if(!logList) return;
        const li = document.createElement('li');
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        li.innerHTML = `<strong>Você:</strong> ${message} <span style="font-size: 0.7rem; color: var(--text-muted)">(${time})</span>`;
        logList.prepend(li); // put at top
    }

    // 1. Checklist Progress
    window.updateChecklistProgress = function(checkboxEl = null) {
        const checkboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
        if(checkboxes.length === 0) return;
        const checked = document.querySelectorAll('#checklistContainer input[type="checkbox"]:checked');
        const percent = (checked.length / checkboxes.length) * 100;
        document.getElementById('checklistProgress').style.width = percent + '%';
        
        if(checkboxEl) {
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
            if(text) {
                const container = document.getElementById('checklistContainer');
                const label = document.createElement('label');
                label.className = 'checklist-item';
                label.innerHTML = `<input type="checkbox" onchange="updateChecklistProgress(this)"> ${text}`;
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
            if(text) {
                const colors = ['#8B5CF6', '#10B981', '#EC4899', '#F97316'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const container = document.getElementById('labelsContainer');
                const span = document.createElement('span');
                span.className = 'label';
                span.style.backgroundColor = color;
                span.innerHTML = `${text} &times;`;
                span.onclick = function() {
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
            if(!content) return;
            
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
                formData.append('task_id', 1);
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
    const btnDeleteTask = document.getElementById('btnDeleteTask');
    if (btnDeleteTask) {
        btnDeleteTask.onclick = async () => {
            if(confirm('Tem certeza que deseja excluir esta tarefa? Ela será enviada para a Lixeira.')) {
                const title = document.getElementById('taskModalTitle').innerText;
                
                // Em produção, isso bateria na API tasks.php?action=soft_delete
                trashItems.push({
                    id: Math.random(),
                    type: 'Tarefa',
                    title: title,
                    deleted_at: new Date().toLocaleString()
                });
                
                // Fechar modal
                document.getElementById('taskDetailsModal').classList.add('hidden');
                document.getElementById('modalOverlay').classList.add('hidden');
                
                alert('Tarefa movida para a Lixeira.');
            }
        };
    }

    // Default view (called at the end to ensure all functions are defined)
    loadView('tarefas');
});
