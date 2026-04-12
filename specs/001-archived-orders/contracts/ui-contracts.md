# UI Contracts: Archived Orders

**Feature**: `001-archived-orders` | **Date**: 2026-04-12

## New Route: `/arquivados`

### Route Registration

```
Path:      /arquivados
Parent:    Layout (protected — redirects unauthenticated users to /)
Component: src/Pages/ArchivedOrders.tsx
```

### Page States

| State    | Trigger | Rendered UI |
|----------|---------|-------------|
| Loading  | While the orders Promise is pending | `<Loading />` centered in `<Suspense>` fallback |
| Success (with data) | Orders resolved and at least one is archived | Grid of `<OrderCard>` for each archived order |
| Success (empty) | Orders resolved, none older than 7 days | Centered message: "Nenhum pedido arquivado encontrado." |
| Error    | Fetch throws (network failure, non-2xx, invalid token) | Error message + "Tentar novamente" button that re-triggers the fetch |

### Order Card Behavior on `/arquivados`

`<OrderCard>` is reused without modification. Archived orders may have any status (`Pending`, `Finished`, `Cancelled`). The "Finalizar ou Cancelar" and "Editar Pedido" buttons remain functional — an archived order can still be acted upon. The SLA urgency badges (red/orange border for pending orders) continue to apply.

### Sort Order

Orders on `/arquivados` are sorted by `created_at` descending (most recent first among archived orders). This mirrors the intent of the home page sort but uses date rather than status as the primary key.

---

## Modified Route: `/home`

### Changed Behavior

| Before | After |
|--------|-------|
| Displays all orders returned by the endpoint | Displays only orders where `isOlderThanDays(created_at, 7) === false` |

All other behavior (loading state via Suspense, sort by Pending-first, OrderCard rendering, refetch on mutation) is unchanged.

---

## Modified Component: `Sidebar`

### New Navigation Entry

| Property    | Value |
|-------------|-------|
| Label       | "Arquivados" |
| Icon        | `Archive` (lucide-react, orange-400 fill) |
| Link target | `/arquivados` |
| Active rule | `location.pathname === "/arquivados"` |
| Position    | After "Analytics" (`/analytics`), before "Usuários" (`/users`) |

---

## Backend Contract (unchanged)

### Endpoint Used

```
GET /orders/list_order/order_user
Authorization: Bearer <access_token>
```

### Response Shape (existing, no changes)

```json
[
  {
    "order_id": 1,
    "status": "Pending",
    "total_price": 45.90,
    "products": [{ "product_id": 2, "quantity": 1 }],
    "created_at": "2026-03-01T14:30:00",
    "notes": null,
    "payment_method": "Dinheiro"
  }
]
```

Non-array responses are treated as an empty list. `products` missing defaults to `[]`.
