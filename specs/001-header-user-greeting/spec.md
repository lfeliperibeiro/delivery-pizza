# Feature Specification: Saudacao com Nome no Header

**Feature Branch**: `001-header-user-greeting`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "incluir o nome do usuario no header com a mensagem Ol'a {nome do usuario}"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver saudacao personalizada apos login (Priority: P1)

Como operador autenticado, quero ver meu nome no header com a mensagem de
boas-vindas para confirmar rapidamente qual conta esta ativa ao usar a
aplicacao.

**Why this priority**: O header aparece em todas as rotas protegidas, entao a
identificacao da sessao ativa entrega valor imediato com baixo impacto visual.

**Independent Test**: Pode ser testado fazendo login com um usuario valido e
acessando qualquer rota protegida para verificar se o header exibe "Ola,
{nome do usuario}" sem afetar a navegacao.

**Acceptance Scenarios**:

1. **Given** que o operador autenticou com sucesso, **When** ele acessa uma
   rota protegida, **Then** o header mostra a saudacao "Ola, {nome do usuario}"
   usando o nome associado ao usuario autenticado.
2. **Given** que o operador navega entre rotas protegidas, **When** o layout
   compartilhado e reutilizado, **Then** a mesma saudacao continua visivel sem
   exigir novo login.

---

### User Story 2 - Manter um estado coerente quando o nome nao estiver disponivel (Priority: P2)

Como operador autenticado, quero que o header continue claro mesmo se o nome do
usuario nao puder ser resolvido imediatamente para evitar confusao ou layout
quebrado.

**Why this priority**: A aplicacao depende de token e integracoes com backend;
o header nao pode falhar silenciosamente nem comprometer o uso da interface.

**Independent Test**: Pode ser testado simulando um payload sem nome ou um
estado inicial de carregamento e verificando se o header continua legivel e a
sessao autenticada permanece funcional.

**Acceptance Scenarios**:

1. **Given** que a sessao autenticada ainda nao resolveu o nome do usuario,
   **When** o layout protegido e renderizado, **Then** o header mostra um
   estado temporario ou fallback legivel sem ocultar o restante da interface.
2. **Given** que nao existe nome disponivel para a sessao atual, **When** o
   header e exibido, **Then** a aplicacao usa um texto de fallback definido em
   vez de mostrar valores vazios, `undefined` ou quebrar o layout.

---

### User Story 3 - Limpar a identificacao ao encerrar a sessao (Priority: P3)

Como operador, quero que a saudacao desapareca ao sair da conta para garantir
que dados do usuario anterior nao permaneçam visiveis.

**Why this priority**: A limpeza correta da sessao preserva a confianca no
fluxo de autenticacao e evita confusao em ambientes compartilhados.

**Independent Test**: Pode ser testado realizando logout apos visualizar a
saudacao e confirmando o redirecionamento para a rota publica sem manter o nome
anterior.

**Acceptance Scenarios**:

1. **Given** que o header mostra o nome do usuario autenticado, **When** o
   operador faz logout ou o token e invalidado, **Then** a sessao e encerrada e
   a saudacao deixa de ficar acessivel nas rotas protegidas.

### Edge Cases

- O login autentica o usuario, mas o dado disponivel inicialmente contem apenas
  o token e o nome precisa ser derivado de outra fonte suportada pelo backend.
- O nome retornado pelo backend vem vazio, nulo ou com espacamento extra e o
  header precisa exibir um fallback consistente.
- A pagina e recarregada com sessao valida em `localStorage`, entao o nome do
  usuario precisa reaparecer sem exigir um novo login manual.
- O token expira durante a exibicao do nome e o fluxo centralizado de
  `auth:invalid-token` deve continuar encerrando a sessao.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir uma saudacao personalizada no header das
  rotas protegidas no formato "Ola, {nome do usuario}".
- **FR-002**: O sistema MUST obter o nome do usuario autenticado a partir de
  uma fonte compativel com o contrato atual de autenticacao, sem exigir um novo
  login manual apos o sucesso inicial.
- **FR-003**: O sistema MUST manter a saudacao consistente ao navegar entre
  rotas protegidas que reutilizam o layout compartilhado.
- **FR-004**: O sistema MUST definir um estado de carregamento ou fallback
  legivel quando o nome do usuario ainda nao estiver disponivel.
- **FR-005**: O sistema MUST limpar o nome exibido ao executar `logout()` ou ao
  receber um erro centralizado de token invalido.
- **FR-006**: O sistema MUST preservar o comportamento atual de autenticacao,
  protecao de rotas e uso do `Authorization: Bearer {token}` nas requisicoes.
- **FR-007**: O sistema MUST manter a data ja exibida no header e acomodar a
  saudacao sem degradar a legibilidade em desktop e mobile.

### Key Entities *(include if feature involves data)*

- **Authenticated Session**: Estado global que representa a sessao atual e
  armazena o token valido, o status autenticado e os dados minimos necessarios
  para identificar o usuario no layout.
- **Authenticated User Profile**: Representacao simplificada do usuario logado
  contendo pelo menos o nome a ser exibido no header.
- **Protected Header View**: Area compartilhada do layout protegido que combina
  identidade do usuario, data atual e controles de navegacao.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Apos login bem-sucedido, o header das rotas protegidas exibe a
  saudacao com o nome do usuario em ate uma navegacao para `/home`.
- **SC-002**: Em validacao manual, navegar entre `/home`, `/orders`, `/users`
  e `/analytics` preserva a mesma saudacao sem recarregar a pagina.
- **SC-003**: Em cenarios sem nome disponivel, o header mostra um fallback
  legivel e nao apresenta texto vazio, `null` ou `undefined`.
- **SC-004**: `pnpm lint`, `pnpm typecheck` e `pnpm build` passam apos a
  implementacao da feature.

## Assumptions

- O escopo da feature esta restrito ao frontend existente e ao header das rotas
  protegidas.
- O backend ja expoe o nome do usuario autenticado direta ou indiretamente por
  meio do fluxo atual de autenticacao ou de um endpoint autenticado ja
  disponivel.
- O `AuthContext` continua sendo a fonte de verdade da sessao e pode ser
- estendido para armazenar dados derivados do usuario autenticado.
- O texto da saudacao sera apresentado em portugues sem alterar a estrutura
  geral do layout compartilhado.
