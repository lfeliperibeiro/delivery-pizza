# Implementation Plan: Saudacao com Nome no Header

**Branch**: `001-header-user-greeting` | **Date**: 2026-04-12 | **Spec**: [spec.md](/Users/feliperibeiro/www/delivery-pizza/specs/001-header-user-greeting/spec.md)
**Input**: Feature specification from `/specs/001-header-user-greeting/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Exibir uma saudacao personalizada no header compartilhado das rotas protegidas
com o formato "Ola, {nome do usuario}", preservando o fluxo atual de login por
token, o redirecionamento protegido do `Layout` e o logout centralizado por
`auth:invalid-token`. A feature afeta principalmente `src/layout.tsx`,
`src/contexts/AuthContext.tsx` e o fluxo de login em `src/Pages/SignIn.tsx`,
com um contrato frontend definido para manter um snapshot minimo do usuario
autenticado disponivel durante navegacao, refresh e logout.

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19  
**Primary Dependencies**: React Router v7, Axios 1.13, Tailwind CSS 4, shadcn/ui sidebar primitives, Sonner  
**Storage**: Browser `localStorage` for `access_token` plus minimal cached authenticated-user snapshot dedicated to header identity  
**Testing/Validation**: `pnpm lint`, `pnpm typecheck`, `pnpm build`, manual login/logout validation, manual refresh validation on protected routes  
**Target Platform**: Browser-based SPA for internal delivery operations  
**Project Type**: Single-project frontend web application  
**Performance Goals**: Preserve immediate header rendering on protected routes and avoid adding blocking requests to route transitions  
**Constraints**: Must honor `VITE_API`, protected routing, invalid-token logout flow, current login endpoint contract, responsive header layout, and Portuguese copy  
**Scale/Scope**: Shared auth state in `src/contexts/AuthContext.tsx`, login capture in `src/Pages/SignIn.tsx`, protected shell in `src/layout.tsx`; no route additions and no backend code changes in this repository

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Authentication and protected navigation are preserved, or the plan explicitly
  documents how auth behavior changes.
- Backend endpoints, payload shapes, and fallback/normalization rules are
  identified for every affected integration.
- Loading, empty, success, and error states are defined for each affected user
  workflow.
- `pt-BR` currency/date/status semantics remain correct where orders or
  analytics are touched.
- The change stays within the current React 19 + TypeScript + Vite + Tailwind +
  shared-UI architecture, or the deviation is justified in Complexity Tracking.

**Pre-Phase-0 Assessment**: PASS

- O plano mantem `AuthContext` como fonte de verdade da sessao e nao altera a
  guarda de autenticacao em `src/layout.tsx`.
- O contrato tocado e o de autenticacao no frontend, documentado em
  `contracts/header-user-greeting.md` com normalizacao defensiva para o nome.
- O header definira estados de saudacao resolvida e fallback legivel.
- A localizacao existente de data em `pt-BR` permanece intacta.
- Nenhuma nova biblioteca, gerenciador de estado ou cliente HTTP sera
  introduzido.

## Project Structure

### Documentation (this feature)

```text
specs/001-header-user-greeting/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── header-user-greeting.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── Pages/
│   └── SignIn.tsx
├── components/
│   ├── Sidebar.tsx
│   └── ui/
├── contexts/
│   └── AuthContext.tsx
├── api/
│   └── index.tsx
├── App.tsx
├── layout.tsx
└── routes.tsx
```

**Structure Decision**: Use the existing single-project frontend structure.
Place auth-session changes in `src/contexts/AuthContext.tsx`, adapt login data
capture in `src/Pages/SignIn.tsx`, and render the greeting from the shared
protected shell in `src/layout.tsx`.

## Phase 0 Research Summary

- Confirmar a fonte do nome do usuario sem depender de um endpoint novo no
  carregamento do layout.
- Definir uma estrategia de persistencia minima para o nome exibido em refresh
  e navegacao entre rotas protegidas.
- Garantir que logout manual e invalido por interceptor removam o nome
  armazenado junto com o token.

## Phase 1 Design Summary

- Estender o modelo de sessao autenticada para incluir `displayName` e metadados
  minimos de resolucao.
- Adaptar o fluxo de login para normalizar dados de usuario vindos do backend e
  registrar fallback quando apenas o token estiver disponivel.
- Atualizar o header do `Layout` para renderizar a saudacao e manter a data
  atual sem regressao visual.

## Post-Design Constitution Check

**Status**: PASS

- A autenticacao segue protegida por `isAuthenticated` e `Navigate`.
- O contrato do frontend para identidade do usuario foi documentado com
  fallback sem criar divergencia com a API existente.
- O header tera comportamento definido para sucesso, refresh e ausencia de
  nome.
- A localizacao da data continua em `pt-BR` e a feature nao altera semantica de
  pedidos.
- A mudanca permanece dentro da arquitetura React 19 + TypeScript + Vite atual.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
