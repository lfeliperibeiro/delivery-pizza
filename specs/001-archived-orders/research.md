# Research: Archived Orders

**Feature**: `001-archived-orders` | **Date**: 2026-04-12

## Summary

All NEEDS CLARIFICATION items from the spec were resolved via codebase inspection. No external research was required. Decisions are documented below.

## Resolved Decisions

### 1. Backend endpoint for archived orders

**Finding**: The endpoint `GET /orders/list_order/order_user` (via `src/api/index.tsx` using `VITE_API`) returns all orders for the authenticated user, including `created_at` timestamps. No dedicated archived endpoint exists.

**Decision**: Use the existing endpoint with client-side date filtering. No backend change is needed.

### 2. Date comparison utility

**Finding**: `src/lib/datetime.ts` already exports `parseBackendDateTime` (handles ISO-like strings without timezone suffix) and `formatDateTime`. The function `isOlderThanDays` does not yet exist.

**Decision**: Add `isOlderThanDays(created_at: string | null, days: number): boolean` to `src/lib/datetime.ts`. Reuse `parseBackendDateTime` internally.

### 3. 7-day threshold

**Finding**: The backend returns `created_at` as a naive ISO-like string (no `Z`, no offset in practice based on existing handling in `OrderCard.tsx`). `parseBackendDateTime` appends `Z` to treat these as UTC, which is the existing convention.

**Decision**: Threshold is `Date.now() - parseBackendDateTime(created_at).getTime() > 7 * 24 * 60 * 60 * 1000`. `null` created_at → not archived.

### 4. React 19 pattern for new page

**Finding**: `Home.tsx` uses the React 19 `use()` hook with a state-held Promise, wrapped in `<Suspense>`. This is the established pattern in the project.

**Decision**: `ArchivedOrders.tsx` follows the same pattern exactly.

### 5. Error state

**Finding**: `Home.tsx` silently returns `[]` on fetch failure (no error UI). The spec requires an explicit error state for the archived page (FR-007).

**Decision**: `ArchivedOrders.tsx` tracks error state separately. On fetch failure, a message and retry button are shown. The home page is not changed in this regard (not in scope).

### 6. Lucide icon for Archived

**Finding**: Sidebar already uses lucide-react icons (`House`, `ShoppingCart`, `LogOut`, `ChartLine`). The `Archive` icon is available in lucide-react.

**Decision**: Use `Archive` from lucide-react for the sidebar navigation entry.
