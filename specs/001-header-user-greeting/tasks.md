# Tasks: Saudacao com Nome no Header

**Input**: Design documents from `/specs/001-header-user-greeting/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Testes automatizados nao foram solicitados nesta especificacao. Este
plano inclui `pnpm lint`, `pnpm typecheck`, `pnpm build` e validacao manual dos
fluxos afetados.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Consolidar o escopo tecnico e preparar o workspace para a feature
do header autenticado

- [X] T001 Revisar e alinhar os artefatos da feature em `specs/001-header-user-greeting/spec.md`, `specs/001-header-user-greeting/plan.md` e `specs/001-header-user-greeting/contracts/header-user-greeting.md`
- [X] T002 Mapear os pontos de mudanca do shell autenticado em `src/layout.tsx`, `src/contexts/AuthContext.tsx` e `src/Pages/SignIn.tsx`
- [X] T003 [P] Confirmar as chaves e formatos de persistencia planejados em `src/contexts/AuthContext.tsx` e `specs/001-header-user-greeting/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar a infraestrutura comum de sessao autenticada que bloqueia
todas as historias

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Atualizar o contrato de sessao em `src/contexts/AuthContext.tsx` para incluir `displayName`, `identityStatus` e limpeza da chave `auth_user`
- [X] T005 [P] Implementar a leitura e persistencia do snapshot autenticado em `src/contexts/AuthContext.tsx` usando `localStorage`
- [X] T006 [P] Criar utilitarios de normalizacao e fallback do nome do usuario em `src/contexts/AuthContext.tsx`
- [X] T007 Validar o impacto do fluxo `auth:invalid-token` entre `src/App.tsx` e `src/contexts/AuthContext.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ver saudacao personalizada apos login (Priority: P1) 🎯 MVP

**Goal**: Exibir `Ola, {nome do usuario}` no header protegido logo apos o login
e mantê-lo visivel durante a navegacao entre rotas autenticadas

**Independent Test**: Fazer login com um usuario valido, acessar `/home`,
depois navegar para `/orders`, `/users` e `/analytics`, confirmando que o
header mostra a mesma saudacao sem exigir novo login

### Implementation for User Story 1

- [X] T008 [US1] Adaptar o fluxo de login em `src/Pages/SignIn.tsx` para extrair `access_token` e resolver o nome do usuario a partir da resposta autenticada
- [X] T009 [US1] Integrar a nova assinatura de `login()` em `src/Pages/SignIn.tsx` e `src/contexts/AuthContext.tsx`
- [X] T010 [P] [US1] Atualizar a renderizacao do header em `src/layout.tsx` para exibir `Ola, {displayName}` junto da data atual
- [ ] T011 [US1] Validar manualmente o fluxo principal descrito em `specs/001-header-user-greeting/quickstart.md` nas rotas `/home`, `/orders`, `/users` e `/analytics`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Manter um estado coerente quando o nome nao estiver disponivel (Priority: P2)

**Goal**: Garantir fallback legivel quando o backend nao fornecer nome amigavel
ou quando a sessao for restaurada sem nome completo

**Independent Test**: Simular resposta de login sem `user.name` nem `name` e
confirmar que o header exibe `Ola, Usuario` ou o fallback definido, sem mostrar
`undefined`, `null` ou quebrar o layout

### Implementation for User Story 2

- [X] T012 [US2] Implementar as regras de prioridade do contrato em `src/contexts/AuthContext.tsx` para usar `user.name`, `name`, claims do JWT ou fallback
- [X] T013 [P] [US2] Ajustar a apresentacao do header em `src/layout.tsx` para lidar com estados `resolved`, `fallback` e `anonymous` sem degradar responsividade
- [ ] T014 [US2] Validar restauracao de sessao com refresh em `src/contexts/AuthContext.tsx` e confirmar o comportamento manual em uma rota protegida

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Limpar a identificacao ao encerrar a sessao (Priority: P3)

**Goal**: Remover a saudacao e o snapshot do usuario quando houver logout
manual ou token invalido

**Independent Test**: Com a saudacao visivel no header, executar logout pela
sidebar e depois simular token invalido, confirmando retorno para `/` sem
manter o nome anterior persistido

### Implementation for User Story 3

- [X] T015 [US3] Garantir que `logout()` remova `access_token` e `auth_user` em `src/contexts/AuthContext.tsx`
- [X] T016 [P] [US3] Verificar a integracao do listener de token invalido entre `src/App.tsx`, `src/api/index.tsx` e `src/contexts/AuthContext.tsx`
- [ ] T017 [US3] Validar manualmente o encerramento da sessao pela sidebar em `src/components/Sidebar.tsx` e o redirecionamento protegido em `src/layout.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Fechar a feature com verificacoes finais e registro do comportamento validado

- [ ] T018 [P] Atualizar a documentacao de execucao e validacao em `specs/001-header-user-greeting/quickstart.md` se o fluxo final implementado diferir do plano
- [ ] T019 Rodar `pnpm lint`, `pnpm typecheck` e `pnpm build` na raiz do projeto `/Users/feliperibeiro/www/delivery-pizza`
- [X] T020 Consolidar os checks manuais finais em `specs/001-header-user-greeting/tasks.md` cobrindo login, navegacao protegida, refresh, fallback e logout

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on the selected user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2 and defines the MVP
- **User Story 2 (P2)**: Depends on the session normalization groundwork from Phase 2 and extends US1 behavior
- **User Story 3 (P3)**: Depends on the shared auth session updates from Phase 2 and validates cleanup paths after US1

### Within Each User Story

- Session model changes come before header rendering
- Login integration comes before route-by-route validation
- Fallback behavior comes before refresh validation
- Logout cleanup comes before final regression pass

### Parallel Opportunities

- `T003` can run in parallel with `T001` and `T002`
- `T005` and `T006` can run in parallel after `T004`
- `T010` can run in parallel with `T008` after the `login()` contract is defined
- `T013` can run in parallel with `T012`
- `T016` can run in parallel with `T015`
- `T018` can run in parallel with `T019` near the end

---

## Parallel Example: User Story 1

```bash
Task: "Adaptar o fluxo de login em src/Pages/SignIn.tsx para extrair access_token e resolver o nome do usuario"
Task: "Atualizar a renderizacao do header em src/layout.tsx para exibir Ola, {displayName} junto da data atual"
```

---

## Parallel Example: User Story 2

```bash
Task: "Implementar as regras de prioridade do contrato em src/contexts/AuthContext.tsx para usar user.name, name, claims do JWT ou fallback"
Task: "Ajustar a apresentacao do header em src/layout.tsx para lidar com estados resolved, fallback e anonymous"
```

---

## Parallel Example: User Story 3

```bash
Task: "Garantir que logout() remova access_token e auth_user em src/contexts/AuthContext.tsx"
Task: "Verificar a integracao do listener de token invalido entre src/App.tsx, src/api/index.tsx e src/contexts/AuthContext.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate login and protected-route greeting behavior

### Incremental Delivery

1. Deliver US1 to establish the personalized greeting
2. Add US2 to harden fallback and refresh behavior
3. Add US3 to confirm cleanup on logout and invalid token
4. Finish with Phase 6 validation and quality gates

### Parallel Team Strategy

1. One person finaliza Phase 1 e coordena Phase 2
2. Depois da fundacao:
   - Pessoa A implementa US1 no login e no header
   - Pessoa B valida fallback e refresh de US2
   - Pessoa C revisa limpeza de sessao e invalid token em US3

---

## Notes

- Todas as tasks seguem o formato `- [ ] T### ...` exigido pelo Spec Kit
- Tasks com `[P]` evitam conflito direto de arquivo ou dependem apenas da fundacao ja pronta
- O escopo do MVP sugerido e a **User Story 1**
- A validacao independente por historia esta descrita antes de cada bloco de implementacao

## Implementation Status

- `T011`, `T014` e `T017` permanecem pendentes por dependerem de validacao manual
  com o app e o backend em execucao
- `T019` foi executada parcialmente: `pnpm run typecheck` e `pnpm run build`
  passaram; `pnpm run lint` falhou por erros pre-existentes em
  `src/components/ui/badge.tsx`, `src/components/ui/button.tsx`,
  `src/components/ui/sidebar.tsx` e `src/components/ui/tabs.tsx`
- Os arquivos alterados nesta feature passaram em `pnpm exec eslint src/contexts/AuthContext.tsx src/Pages/SignIn.tsx src/layout.tsx`
- Checklist manual final a executar:
  - Login valido redirecionando para `/home` com header `Ola, {nome}`
  - Navegacao entre `/home`, `/orders`, `/users` e `/analytics` preservando a saudacao
  - Refresh em rota protegida preservando o nome armazenado
  - Fallback `Ola, Usuario` quando o nome nao vier no payload
  - Logout manual e invalido por token removendo `access_token` e `auth_user`
