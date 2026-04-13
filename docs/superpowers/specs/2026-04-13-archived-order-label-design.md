# Design: Archived Order Label

**Date:** 2026-04-13
**Status:** Approved

## Summary

Add a visual "Arquivado" badge to order cards displayed on the `/archived` page, so operators can immediately identify that those orders are archived without relying on page context alone.

## Problem

The `OrderCard` component renders identically on both `/home` and `/archived`. On the archived page, there is no visual cue on the card itself indicating it is archived.

## Solution

Add an optional `isArchived?: boolean` prop to `OrderCard`. When `true`, a second `<Badge>` renders inside `CardAction` alongside the existing status badge. The badge shows an `Archive` icon (from lucide-react) and the text `"Arquivado"`, styled with a neutral color (`bg-slate-500 text-white`) to avoid visual conflict with the status colors (green, yellow, red).

`ArchivedOrders.tsx` passes `isArchived={true}` to each `<OrderCard>`. `Home.tsx` does not pass the prop — behavior there is unchanged.

## Architecture

### Component change — `src/components/OrderCard.tsx`

- Add `isArchived?: boolean` to the `OrderCardProps` interface.
- In the `Order` interface (the component's props), expose `isArchived` as a passthrough from `OrderCardProps`.
- Inside `OrderCard`, render a second `<Badge>` in `CardAction` conditionally:

```tsx
{isArchived && (
  <Badge variant="secondary" className="bg-slate-500 text-white">
    <Archive className="mr-1 h-3 w-3" />
    Arquivado
  </Badge>
)}
```

The two badges stack vertically inside `CardAction` (existing layout handles this).

### Caller change — `src/Pages/ArchivedOrders.tsx`

- In `ArchivedOrderGrid`, pass `isArchived={true}` to every `<OrderCard>`.

### No changes

- `src/Pages/Home.tsx` — prop is optional; omitting it means no badge.
- `src/routes.tsx`, `src/components/Sidebar.tsx` — untouched.

## Data

No new data required. The `isArchived` prop is a display flag, not derived from API data.

## Error Handling

No error handling changes. The badge is a pure render concern.

## Testing

- Update `src/components/OrderCard.test.tsx` to assert the badge renders when `isArchived={true}` and does not render when the prop is absent.
- Update `src/Pages/ArchivedOrders.test.tsx` to assert `isArchived={true}` is passed to `OrderCard`.
