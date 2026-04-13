# Tasks: Archived Orders

**Input**: Design documents from `specs/001-archived-orders/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contracts.md ✅

**Tests**: No automated tests requested. Every phase includes `pnpm lint`, `pnpm typecheck`, `pnpm build`, and manual validation gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm scope and affected surfaces before writing any code.

- [x] T001 Read `src/Pages/Home.tsx`, `src/lib/datetime.ts`, `src/components/Sidebar.tsx`, and `src/routes.tsx` to confirm current state matches the plan
- [x] T002 Confirm `parseBackendDateTime` is exported from `src/lib/datetime.ts` and handles `null` inputs correctly
- [x] T003 Confirm `OrderCard` component in `src/components/OrderCard.tsx` requires no changes for display on the archived page

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared date utility used by both US1 and US2. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: US1 (`ArchivedOrders.tsx`) and US2 (`Home.tsx` filter) both depend on this utility. Nothing else is shared.

- [x] T004 Add `isOlderThanDays(created_at: string | null, days: number): boolean` to `src/lib/datetime.ts` — returns `true` iff the parsed datetime is strictly more than `days × 24 h` before now; returns `false` for `null` or unparseable values; reuses existing `parseBackendDateTime` internally

**Checkpoint**: Run `pnpm typecheck` to verify the new export is valid before proceeding.

---

## Phase 3: User Story 1 — View Archived Orders (Priority: P1) 🎯 MVP

**Goal**: A new protected `/archived` page fetches orders from the existing endpoint, filters to only those older than 7 days, and renders them as `OrderCard` components with full loading, empty, and error states.

**Independent Test**: Navigate to `/archived` with an authenticated session where at least one order is older than 7 days. Verify: (1) order cards appear; (2) navigating while unauthenticated redirects to `/`; (3) when no orders are archived, the empty-state message is shown.

### Implementation

- [x] T005 [US1] Create `src/Pages/ArchivedOrders.tsx` — define the `Order` interface (same shape as `Home.tsx`), implement `fetchArchivedOrders()` that calls `GET /orders/list_order/order_user` with the bearer token, normalizes the response using the same field mapping as `Home.tsx`, and filters the result to only orders where `isOlderThanDays(created_at, 7) === true`; sort results by `created_at` descending

- [x] T006 [US1] Add the `ArchivedOrderGrid` component inside `src/Pages/ArchivedOrders.tsx` — uses `use(ordersPromise)` (React 19 pattern identical to `Home.tsx`), renders a `<div className="grid ...">` of `<OrderCard>` components, shows "Nenhum pedido arquivado encontrado." centered when the list is empty; `onRefetch` prop re-triggers `fetchArchivedOrders`

- [x] T007 [US1] Add error state handling in `src/Pages/ArchivedOrders.tsx` — because `fetchArchivedOrders` must surface errors (unlike `Home.tsx` which silently returns `[]`), implement a wrapper that catches fetch failures and stores an error flag; when error is set, render an error message and a "Tentar novamente" button that calls `refetch`

- [x] T008 [US1] Add the `ArchivedOrders` page export to `src/Pages/ArchivedOrders.tsx` — wire `<Suspense fallback={<Loading />}>` around `<ArchivedOrderGrid>`, include `<Toaster />` for mutation feedback from `OrderCard` actions, and expose `refetchArchivedOrders` via `useCallback`

- [x] T009 [US1] Register `/archived` route in `src/routes.tsx` — import `ArchivedOrders` from `./Pages/ArchivedOrders` and add `{ path: "/archived", element: <ArchivedOrders /> }` as a child of the existing `Layout` route, alongside the other protected routes

- [x] T010 [US1] Manual validation — run `pnpm lint && pnpm typecheck && pnpm build`, then manually: (a) authenticate and navigate to `/archived`; (b) verify cards appear for orders older than 7 days; (c) verify the empty state when none qualify; (d) log out and confirm redirect to `/`; (e) verify `OrderCard` "Finalizar ou Cancelar" and "Editar Pedido" buttons still work from the archived page

**Checkpoint**: US1 is fully functional and independently testable at this point.

---

## Phase 4: User Story 2 — Recent Orders Exclude Archived (Priority: P2)

**Goal**: The `/home` route is updated so that orders older than 7 days no longer appear. Only orders created within the last 7 days are shown.

**Independent Test**: With an authenticated session that has both recent and old orders, navigate to `/home` and verify no order card older than 7 days is displayed. Navigate to `/archived` to confirm those orders still appear there.

### Implementation

- [x] T011 [US2] Modify `src/Pages/Home.tsx` — in the `OrderGrid` component (or in `fetchOrders`, whichever is cleaner), apply `isOlderThanDays(order.created_at, 7) === false` to filter out archived orders before rendering; import `isOlderThanDays` from `@/lib/datetime`

- [x] T012 [US2] Manual validation — run `pnpm lint && pnpm typecheck && pnpm build`, then manually: (a) confirm only orders ≤ 7 days old appear on `/home`; (b) confirm `/archived` shows the orders that disappeared from `/home`; (c) confirm the existing sort (Pending-first) is preserved; (d) confirm the empty state on `/home` when all orders are older than 7 days

**Checkpoint**: US1 and US2 are both independently functional. The two pages together provide a complete archived/active split.

---

## Phase 5: User Story 3 — Navigate to Archived Orders (Priority: P3)

**Goal**: A clearly labeled navigation entry in the sidebar allows operators to reach `/archived` without typing the URL manually.

**Independent Test**: From any authenticated page, locate the "archived" entry in the sidebar and click it. Verify navigation to `/archived` and that the sidebar entry shows the active state while on that route.

### Implementation

- [x] T013 [US3] Modify `src/components/Sidebar.tsx` — import `Archive` from `lucide-react`, add a new `<SidebarMenuItem>` with a `<SidebarMenuButton isActive={location.pathname === "/archived"}>` wrapping a `<Link to="/archived">` with the `Archive` icon (className `text-orange-400`) and label text `"archived"`; insert this item after the "Analytics" entry and before the "Usuários" entry

- [x] T014 [US3] Manual validation — run `pnpm lint && pnpm typecheck && pnpm build`, then manually: (a) confirm the "archived" entry appears in the sidebar on all protected pages; (b) confirm the orange Archive icon is visible; (c) confirm active highlighting when on `/archived`; (d) confirm clicking navigates correctly; (e) confirm no regression in other sidebar links

**Checkpoint**: All three user stories are independently functional. Feature is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all changes.

- [x] T015 [P] Run full quality gate: `pnpm lint && pnpm typecheck && pnpm build` — confirm zero errors and zero warnings
- [ ] T016 [P] Cross-route regression check — manually navigate through `/home`, `/archived`, `/orders`, `/users`, `/analytics` to confirm no regressions in layout, auth, or localization
- [ ] T017 Verify Brazilian localization is preserved on `OrderCard` in the archived view — confirm `created_at` renders via `formatDateTime` (pt-BR, America/Sao_Paulo), currency shows `R$` format, and status labels translate correctly (`Pendente`, `Concluído`, `Cancelado`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks US1 and US2**
- **US1 (Phase 3)**: Depends on Foundational (T004 must be complete)
- **US2 (Phase 4)**: Depends on Foundational (T004 must be complete); independent of US1
- **US3 (Phase 5)**: Depends only on `routes.tsx` having `/archived` registered (T009); can begin in parallel with Phase 4
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Requires T004 (`isOlderThanDays`). No dependency on US2 or US3.
- **US2 (P2)**: Requires T004 (`isOlderThanDays`). No dependency on US1 or US3.
- **US3 (P3)**: Requires T009 (route registration). No dependency on US2.

### Parallel Opportunities

After T004 is done, the following can proceed simultaneously:
- US1 tasks (T005–T010) and US2 tasks (T011–T012) touch different files
- US3 (T013) touches only `Sidebar.tsx` — entirely independent of US1/US2 implementation files

---

## Parallel Example: After Foundational Phase

```
# Once T004 is merged:
Task A: US1 — Create src/Pages/ArchivedOrders.tsx (T005–T008)
Task B: US2 — Modify src/Pages/Home.tsx (T011)
Task C: US3 — Modify src/components/Sidebar.tsx (T013) [also needs T009 done]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004)
3. Complete Phase 3: User Story 1 (T005–T010)
4. **STOP and VALIDATE**: `/archived` works end-to-end
5. Deploy/demo if ready — operators can already access the archived page via URL

### Incremental Delivery

1. Setup + Foundational → `isOlderThanDays` utility available
2. US1 → `/archived` page fully functional (MVP)
3. US2 → `/home` now hides old orders (completes the active/archived split)
4. US3 → Sidebar navigation entry added (discoverability complete)
5. Polish → Full quality gate passed

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- No automated tests requested; validation is manual per checkpoint
- `OrderCard` is reused without modification — do not change `src/components/OrderCard.tsx`
- Error handling in `ArchivedOrders.tsx` is more explicit than in `Home.tsx` by design (spec FR-007)
- The `null` created_at case must be handled consistently: treat as "not archived" everywhere
- Commit after each phase checkpoint