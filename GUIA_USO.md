# Guia de Uso - Cobrança Task

**Versão:** 1.1.0

---

## Bem-vindo!

O **Cobrança Task** é um sistema para gerenciar tarefas de cobrança de condomínios. Com ele, você pode:

- Criar tarefas a partir de dados de clientes
- Organizar tarefas em um quadro Kanban (arrastar cards)
- Acompanhar o progresso dos atendimentos
- Gerar relatórios e rankings
- Abrir chamados de suporte

---

## Primeiro Acesso

### Como entrar no sistema

1. Abra o navegador (Chrome, Firefox, Edge)
2. Digite o endereço do sistema na barra de endereços
3. Você verá a tela de login
4. Digite seu **e-mail** e **senha**
5. Clique em **Entrar**

> Se esquecer sua senha, entre em contato com o administrador do sistema.

### Sua primeira tela

Após o login, você verá a **sidebar** (menu lateral) à esquerda com as opções disponíveis para você.

---

## Para Todos os Usuários

### Minhas Tarefas

A tela de **Tarefas** é onde você vê todas as tarefas atribuídas a você.

#### Ver a lista de tarefas

- Ao abrir o sistema, a lista de tarefas aparece automaticamente
- Cada linha mostra: nome do cliente, data, responsável e status
- Se tiver muitas tarefas, clique em **Carregar Mais** para ver mais

#### Buscar uma tarefa

- Use o campo de busca no topo da lista
- Digite o nome do cliente ou condomínio
- A lista filtra automaticamente

#### Abrir detalhes de uma tarefa

1. Clique no botão **Abrir** ao lado da tarefa
2. Um painel lateral aparece com todas as informações
3. Você verá: cliente, endereço, valores, contatos e boletos

#### Adicionar uma observação

1. Abra os detalhes da tarefa
2. Na aba **Observações**, digite sua anotação
3. Clique em **Salvar Detalhes**

#### Adicionar um atendimento (registro de ligação)

1. Abra os detalhes da tarefa
2. Na seção **Atendimentos**, digite o que foi feito
   - Exemplo: "Ligado para o cliente. Confirmou que vai pagar na segunda."
3. Clique em **Salvar Atendimento**
4. O status da tarefa muda automaticamente para "Atendendo"

---

### Kanban (Quadro de Tarefas)

O Kanban é uma forma visual de organizar suas tarefas por status.

#### Ver o quadro

- Clique em **Kanban** no menu lateral
- Cada coluna mostra os primeiros cards; use **Carregar mais** no rodape da coluna para ver mais (o quadro nao carrega tudo de uma vez)
- Você verá 3 colunas:
  - **A Fazer** — tarefas novas
  - **Atendendo** — tarefas em andamento
  - **Finalizado** — tarefas concluídas

#### Mover um card

1. Clique e segure em um card
2. Arraste para a coluna desejada
3. Solte o mouse

> Exemplo: Arraste um card de "A Fazer" para "Atendendo" quando começar a atender.

#### Buscar um card

- Use o campo de busca no topo do quadro
- Digite o nome do cliente

---

### Configurações

Acesse **Configurações** no menu lateral para gerenciar seu perfil.

#### Alterar nome ou e-mail

1. Vá em **Configurações**
2. Altere o nome ou e-mail no formulário
3. Clique em **Salvar Perfil**

#### Alterar senha

1. Vá em **Configurações**
2. Na seção **Alterar Senha**, digite:
   - Senha atual
   - Nova senha (mínimo 6 caracteres)
   - Confirmar nova senha
3. Clique em **Atualizar Senha**

#### Alterar sua foto (avatar)

1. Clique na sua foto no canto inferior da sidebar (ou na tela de Configurações)
2. Escolha uma imagem do seu computador
3. A foto será atualizada automaticamente

---

### Ajuda (Chamados)

Se tiver algum problema ou dúvida, abra um chamado.

#### Abrir um chamado

1. Clique em **Ajuda** no menu lateral
2. Digite o **Assunto** (resumo do problema)
3. Digite a **Descrição detalhada** (explique o que aconteceu)
4. Clique em **Enviar Chamado**

> Você receberá um número de identificação do chamado.

---

## Para Administradores

Administradores têm acesso a funcionalidades extras para gerenciar o sistema.

### Criar Tarefas

1. Clique em **Criar Tarefas** no topo da tela de Tarefas
2. Uma janela abre com a lista de clientes do Condado
3. **Busque** o cliente desejado (por nome, código ou condomínio)
4. **Marque** os clientes que deseja criar tarefas
5. Clique em **Distribuir Selecionados**
6. **Escolha o usuário** que receberá as tarefas
7. Clique em **Confirmar Distribuição**

> As tarefas aparecerão na lista do usuário selecionado.

---

### Importar Planilha

Se tiver dados em uma planilha Excel, pode importar em lote.

#### Formato da planilha

| Coluna | Conteúdo |
|--------|----------|
| A | Código do documento |
| B | Nome do morador |
| C | Bloco/Apartamento |
| D | Data de vencimento |
| E | Encargos |
| F | Total da dívida |
| G | Nome do condomínio |
| H | Nome do responsável |

#### Como importar

1. Clique em **Importar Planilha** na tela de Tarefas
2. Selecione o arquivo `.xls` ou `.xlsx`
3. Confirme a importação
4. Aguarde o processamento

> As tarefas serão criadas automaticamente e atribuídas aos usuários correspondentes.

---

### Gerenciar Usuários

Acesse **Usuários** no menu lateral.

#### Criar um usuário

1. Clique em **+ Novo Usuário**
2. Preencha: Nome, E-mail, Senha
3. Escolha o perfil: **Usuário Padrão** ou **Administrador**
4. Clique em **Cadastrar**

#### Editar um usuário

1. Clique em **Editar** ao lado do usuário
2. Altere os dados desejados
3. Clique em **Cadastrar** (o botão funciona como "Salvar")

#### Excluir um usuário

1. Clique em **Excluir** ao lado do usuário
2. Confirme a exclusão

> O usuário principal (admin@cobrancatask.com) não pode ser excluído.

---

### Permissões

Controle o que cada usuário padrão pode ver e fazer.

1. Vá em **Configurações** → **Gerenciar Permissões**
2. Marque ou desmarque as permissões:

| Permissão | O que controla |
|-----------|----------------|
| Tela: Tarefas | Acesso à lista de tarefas |
| Função: Criar Tarefas | Pode criar novas tarefas |
| Função: Distribuir Tarefas | Pode atribuir tarefas a outros |
| Tela: Kanban | Acesso ao quadro Kanban |
| Tela: Relatórios | Acesso aos relatórios |
| Tela: Lixeira | Acesso à lixeira |
| Tela: Configurações | Acesso às configurações |

3. Clique em **Salvar Alterações**

> As mudanças têm efeito imediato. O usuário verá ou não as telas na sidebar.

---

### Relatórios

Acesse **Relatórios** no menu lateral para ver estatísticas.

- **Total de Atendimentos** — quantidade total de tarefas
- **Ranking de Atendentes** — top 5 usuários com mais tarefas
- **Top 5 Imóveis** — condomínios com mais tarefas

Para ver o ranking completo:
1. Clique em **Ver todos** abaixo do ranking
2. Uma janela abre com a lista completa
3. Clique em **X** para fechar

Para atualizar os numeros, clique em **Atualizar Dados**: os cards mantem os dados anteriores visiveis com um efeito suave enquanto os novos carregam.

---

### Lixeira

Quando você exclui uma tarefa, ela vai para a lixeira (não é excluída de vez).

#### Restaurar uma tarefa

1. Vá em **Lixeira (Admin)** no menu lateral
2. Clique em **Restaurar** ao lado da tarefa
3. A tarefa volta para a lista normal

#### Excluir permanentemente

1. Vá em **Lixeira (Admin)**
2. Clique em **Excluir Permanente**
3. Confirme a ação

> **Atenção:** Exclusão permanente não pode ser desfeita!

---

### Chamados (Gerenciamento)

Os chamados abertos pelos usuários aparecem em **Configurações**.

- **Ver** — visualiza os detalhes do chamado
- **Iniciar** — muda o status para "Em Andamento"
- **Resolver** — muda o status para "Resolvido"

---

## Dicas Úteis

### Atalhos e funcionalidades

- **Busca nas listas:** Digite no campo de filtro para encontrar rapidamente
- **Kanban:** Arraste os cards para organizar seu trabalho
- **Atendimento:** Sempre registre o que foi feito nos detalhes da tarefa

### Boas práticas

1. **Registre todos os contatos:** Adicione um atendimento para cada ligação ou ação
2. **Use o Kanban:** Mantenha as tarefas organizadas por status
3. **Atualize o status:** Mova os cards conforme vai atendendo
4. **Abra chamados:** Se tiver problemas, registre um chamado para o suporte

### O que fazer quando...

| Situação | O que fazer |
|----------|-------------|
| Não consigo entrar | Verifique e-mail e senha. Se persistir, entre em contato com o admin |
| Não vejo uma tarefa | Verifique se ela foi atribuída a você |
| Não vejo uma tela | Sua permissão pode estar desativada. Peça ao admin |
| Preciso de ajuda | Abra um chamado em Ajuda |
| Quero alterar meus dados | Vá em Configurações |

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Tarefa** | Um atendimento de cobrança a ser realizado |
| **Kanban** | Quadro visual para organizar tarefas por status |
| **Card** | Cada tarefa dentro do quadro Kanban |
| **Atendimento** | Registro de uma ação realizada em uma tarefa |
| **Chamado** | Pedido de suporte ou ajuda |
| **Lixeira** | Local onde tarefas excluídas ficam antes de serem apagadas permanentemente |
| **Condado** | Sistema externo de dados de clientes e condomínios |
