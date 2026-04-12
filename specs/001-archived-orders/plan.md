# Implementation Plan: Archived Orders

**Branch**: `002-archived-orders` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-archived-orders/spec.md`

## Summary

Add a protected `/arquivados` route that displays order cards for all orders whose `created_at` is more than 7 days in the past. The existing `/home` route is updated to show only orders created within the last 7 days. The `OrderCard` component is reused unchanged on the archived page. A shared date utility is added to `src/lib/datetime.ts`. A navigation entry is added to the `Sidebar`. No new backend endpoints are required — the existing order list endpoint is sufficient; filtering is applied client-side at load time.

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19
**Primary Dependencies**: React Router v7, Axios, Tailwind CSS 4, shadcn/ui, Sonner
**Storage**: Browser `localStorage` for `access_token`; backend-managed persistence outside this repo
**Testing/Validation**: `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus manual route and API-flow validation
**Target Platform**: Browser-based SPA for internal delivery operations
**Project Type**: Single-project frontend web application
**Performance Goals**: Preserve responsive operator workflows; avoid regressions in route load and live order management
**Constraints**: Must honor `VITE_API`, protected routing, Brazilian localization, and current shared frontend stack
**Scale/Scope**: Routes under `src/Pages`, shared components under `src/components`, auth/navigation in `src/layout.tsx` and `src/contexts/AuthContext.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Authentication and protected navigation are preserved**: `/arquivados` is added as a child of the existing protected `Layout` wrapper, consistent with all other business routes.
- ✅ **Backend endpoints identified**: A single endpoint (`GET /orders/list_order/order_user`) is used. No payload shape changes are required. The existing normalization in `Home.tsx` is replicated in the new page. The `api` client (with bearer token and `auth:invalid-token` interceptor) is used throughout.
- ✅ **Loading, empty, success, and error states defined**: The new page follows the React 19 `Suspense` + `use()` pattern established in `Home.tsx`. Loading uses `<Loading />` fallback; empty uses an explicit message; error uses a caught rejection with a retry affordance.
- ✅ **pt-BR localization preserved**: `OrderCard` is reused unchanged, which already renders currency in `pt-BR/BRL`, dates via `formatDateTime` (using `America/Sao_Paulo`), and translated status labels.
- ✅ **Stack consistency**: New page follows the existing `src/Pages` pattern. New utility is added to the existing `src/lib/datetime.ts`. No new libraries or patterns are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-archived-orders/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (affected files)

```text
src/
├── Pages/
│   ├── Home.tsx                  # MODIFIED: filter out orders older than 7 days
│   └── ArchivedOrders.tsx        # NEW: page for orders older than 7 days
├── components/
│   └── Sidebar.tsx               # MODIFIED: add "Arquivados" navigation entry
├── lib/
│   └── datetime.ts               # MODIFIED: add isOlderThanDays() utility
└── routes.tsx                    # MODIFIED: register /arquivados protected route
```

---

## Phase 0: Research

### Decision Log

**Decision 1: Client-side vs. backend filtering**
- **Decision**: Filter orders by age client-side at page load time.
- **Rationale**: The existing endpoint (`/orders/list_order/order_user`) already returns all orders with `created_at` timestamps. The codebase already demonstrates client-side sorting in `Home.tsx`. Adding a filtering step in the same layer is consistent and requires no backend change.
- **Alternatives considered**: A dedicated backend endpoint for archived orders (e.g., `GET /orders/list_order/archived`). Rejected because no such endpoint exists, and the spec assumption confirms client-side filtering is sufficient given current data volumes.

**Decision 2: Shared date utility vs. inline threshold**
- **Decision**: Add an `isOlderThanDays(created_at: string | null, days: number): boolean` function to `src/lib/datetime.ts`.
- **Rationale**: Both `Home.tsx` and `ArchivedOrders.tsx` need the same threshold logic. The constitution directs date handling to `src/lib/datetime.ts`. Centralizing avoids duplication and prevents drift in the 7-day boundary definition.
- **Alternatives considered**: Inline the comparison in each page. Rejected because it duplicates the threshold constant and the `parseBackendDateTime` call.

**Decision 3: Threshold boundary (inclusive vs. exclusive of exactly 7 days)**
- **Decision**: Orders are archived if `Date.now() - parseBackendDateTime(created_at).getTime() > 7 * 24 * 60 * 60 * 1000` (strictly greater than 7 × 24 hours = exclusive of the 7-day mark itself).
- **Rationale**: Consistent with spec FR-002 ("strictly more than 7 days"). A null `created_at` is treated as **not** older than 7 days (order stays on the home page), to avoid silently hiding orders with missing timestamps.
- **Alternatives considered**: `>= 7 days` (inclusive of exactly 7 days). No strong business preference; "older than" language in the spec implies exclusive.

**Decision 4: Error state strategy for archived page**
- **Decision**: Wrap the async fetch in a try/catch; on failure, set an error flag in component state and render a message with a retry button. This mirrors the safe fallback already in `Home.tsx` (`catch { return [] }`), but adds a visible error indicator instead of silently returning an empty list.
- **Rationale**: The spec (FR-007) explicitly requires an error state with a retry affordance. The constitution requires every operator workflow to surface errors visibly.
- **Alternatives considered**: Silent empty-list fallback (as in current `Home.tsx`). Rejected for this feature because the spec is explicit about the error state requirement.

---

## Phase 1: Design & Contracts

### Data Model

#### Existing entity reused: `Order`

The `Order` interface defined in `Home.tsx` is replicated in `ArchivedOrders.tsx` (or extracted to a shared location if desired, though that is out of scope for this feature).

```
Order {
  id:             number       — unique order identifier
  status:         string       — "Pending" | "Finished" | "Cancelled"
  price:          number       — total order value in BRL
  items:          OrderItem[]  — list of products in the order
  created_at:     string|null  — ISO-like datetime string from backend (may lack timezone suffix)
  notes:          string|null  — optional operator notes
  payment_method: string|null  — e.g., "Dinheiro", "Cartão"
}

OrderItem {
  product_id: number
  quantity:   number
}
```

**Archiving rule derived field** (computed at runtime, not stored):
```
isArchived: created_at !== null
            && (Date.now() - parseBackendDateTime(created_at).getTime()) > 7 * 24 * 60 * 60 * 1000
```

Orders where `created_at` is `null` are treated as **not archived** (remain on `/home`).

#### New utility in `src/lib/datetime.ts`

```
isOlderThanDays(created_at: string | null, days: number): boolean
  — Returns true iff the parsed datetime is more than `days` × 24 h before now.
  — Returns false for null or unparseable created_at values.
```

### UI Contracts

#### Route: `/arquivados`

| Property             | Value |
|----------------------|-------|
| Route path           | `/arquivados` |
| Protection           | Wrapped in existing `Layout` (authenticated only) |
| Page component       | `src/Pages/ArchivedOrders.tsx` |
| Data source          | `GET /orders/list_order/order_user` (same endpoint as `/home`) |
| Filter applied       | `isOlderThanDays(order.created_at, 7) === true` |
| Sort order           | Most recent `created_at` first (descending) |
| Loading state        | `<Loading />` inside `<Suspense>` fallback (same pattern as `Home`) |
| Empty state          | Centered message: "Nenhum pedido arquivado encontrado." |
| Error state          | Error message + "Tentar novamente" retry button |
| Card component       | `<OrderCard>` — reused without modification |

#### Route: `/home` (modified)

| Property             | Value |
|----------------------|-------|
| Filter applied       | `isOlderThanDays(order.created_at, 7) === false` (only recent orders) |
| All other behavior   | Unchanged |

#### Sidebar entry (new)

| Property   | Value |
|------------|-------|
| Label      | "Arquivados" |
| Icon       | `Archive` (lucide-react) |
| Link path  | `/arquivados` |
| Active     | `location.pathname === "/arquivados"` |
| Position   | After "Analytics", before "Usuários" |

### Agent Context Update

After writing this plan, the agent context file will be updated to reflect the new `/arquivados` route and `isOlderThanDays` utility.
