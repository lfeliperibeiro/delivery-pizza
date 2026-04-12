<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template principle 1 -> I. Authentication And Protected Navigation
  - Template principle 2 -> II. Backend Contract Fidelity
  - Template principle 3 -> III. Operational UX Is Mandatory
  - Template principle 4 -> IV. Brazil-Localized Order Semantics
  - Template principle 5 -> V. Stack Consistency Over Abstraction
- Added sections:
  - Product Truth And Technical Constraints
  - Delivery Workflow And Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated .specify/templates/plan-template.md
  - ✅ updated .specify/templates/spec-template.md
  - ✅ updated .specify/templates/tasks-template.md
- Follow-up TODOs:
  - None
-->
# Delivery Pizza Constitution

## Core Principles

### I. Authentication And Protected Navigation
All business routes MUST remain inaccessible without a valid `access_token`.
Authentication state MUST continue to be owned by `AuthContext`, persisted in
`localStorage`, and enforced by the protected `Layout`. Any API response that
signals an invalid token MUST trigger centralized logout through the
`auth:invalid-token` flow instead of page-level ad hoc handling. Rationale: this
application is an operations SPA; leaking protected screens or leaving stale
sessions active is a functional and security defect.

### II. Backend Contract Fidelity
The frontend MUST treat the FastAPI backend contract as the system boundary and
must not invent client-only business rules that diverge from it. Every new
integration MUST use the shared `api` client, include bearer authentication when
required, and handle non-ideal payloads defensively when the backend already
shows schema variance, as in user and order payload normalization. If the
backend contract is ambiguous, the feature spec MUST document the assumed
request/response shape before implementation. Rationale: this product already
depends on multiple endpoint shapes and token-driven behavior; defensive
compatibility is required for stability.

### III. Operational UX Is Mandatory
Every operator-facing workflow MUST provide visible loading, success, and error
states. Data fetches SHOULD follow the existing React 19 pattern used in this
codebase: start async work from component state, render through `Suspense`, and
show domain-appropriate fallback UI. Mutations such as login, signup, order
creation, status changes, and user updates MUST surface outcomes through clear
feedback such as Sonner toasts and MUST leave the screen in a coherent state
after success or failure. Rationale: the primary users are managing live orders,
so silent failure or ambiguous state is unacceptable.

### IV. Brazil-Localized Order Semantics
Customer and operator-facing order information MUST be presented in Brazilian
conventions. Currency MUST render in `pt-BR`/BRL, date and time handling MUST
respect `America/Sao_Paulo`, and order statuses exposed to users MUST preserve
the established localized vocabulary (`Pendente`, `Concluido`/`Concluído`,
`Cancelado`) even when backend values are English enums. Order urgency and SLA
indicators MUST remain driven by `created_at` and pending-state timing.
Rationale: this application is explicitly localized for Brazil and manages
time-sensitive delivery operations.

### V. Stack Consistency Over Abstraction
Changes MUST preserve the current single-page frontend architecture: React 19,
TypeScript, Vite, React Router, Tailwind CSS, and the shared UI primitives in
`src/components/ui`. New state management libraries, parallel HTTP clients, or
competing styling systems MUST NOT be introduced without an explicit
constitution amendment. Reusable behavior belongs in existing layers
(`contexts`, `lib`, `components`, `Pages`) instead of bespoke patterns per
screen. Rationale: the repository is small, cohesive, and already organized
around a pragmatic stack; consistency is cheaper than abstraction churn.

## Product Truth And Technical Constraints

This repository is the frontend source of truth for the Delivery Pizza
operations console. The application is a React SPA that depends on a FastAPI
backend configured through `VITE_API`.

The current product scope includes:

- Public authentication routes at `/` and `/register`
- Protected routes for `/home`, `/orders`, `/users`, `/analytics`,
  `/orders/edit`, and `/users/edit/:id`
- Core entities: authenticated user, order, order item, product, analytics
  aggregates, and user administration records
- Business actions: login, signup, list and edit users, list products, create
  orders, edit orders, finalize orders, cancel orders, and monitor analytics

Implementation constraints derived from the codebase:

- API communication MUST go through `src/api/index.tsx`
- Route protection MUST flow through `src/layout.tsx` and
  `src/contexts/AuthContext.tsx`
- Date parsing and formatting MUST reuse `src/lib/datetime.ts`
- UI primitives MUST prefer the existing `src/components/ui` and business
  components before adding new foundational abstractions
- Any feature touching orders MUST preserve pending/finished/cancelled behavior
  and the live refresh patterns already used in `Home`, `OrderCard`, and
  related screens

## Delivery Workflow And Quality Gates

Every feature spec and implementation plan MUST demonstrate how the change
preserves the five core principles above.

Minimum delivery gates for any production-bound change:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Manual validation of every affected route, including authenticated and
  unauthenticated behavior when auth or navigation is changed
- Manual API-path validation for changed backend integrations, including success
  and failure states

Feature planning and tasking MUST explicitly capture:

- Which routes, entities, and endpoints are affected
- Whether payload normalization or fallback endpoint support is required
- What loading, empty, success, and error states are expected
- Whether localization, date/time, currency, or status translation behavior is
  affected

## Governance

This constitution supersedes conflicting local conventions for this repository.
Amendments MUST be made by updating this file together with any impacted
templates in `.specify/templates/` when planning behavior changes. Versioning
follows semantic rules: MAJOR for incompatible governance changes, MINOR for
new principles or materially expanded requirements, PATCH for clarifications
that do not change expected behavior.

Every implementation review MUST verify compliance with the core principles,
document any justified exception in the implementation plan, and reject work
that adds undocumented architectural divergence. The canonical runtime guidance
for repository structure and endpoint inventory remains `AGENTS.md`, while this
constitution defines the non-negotiable engineering rules that specs, plans, and
tasks must follow.

**Version**: 1.0.0 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-12
