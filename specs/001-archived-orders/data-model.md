# Data Model: Archived Orders

**Feature**: `001-archived-orders` | **Date**: 2026-04-12

## Existing Entities (reused unchanged)

### Order

Source: `src/Pages/Home.tsx` (interface definition), backend endpoint `/orders/list_order/order_user`

| Field            | Type           | Notes |
|------------------|----------------|-------|
| `id`             | `number`       | Mapped from `order_id` in backend response |
| `status`         | `string`       | `"Pending"` \| `"Finished"` \| `"Cancelled"` (backend enum) |
| `price`          | `number`       | Mapped from `total_price`; rendered as BRL via `pt-BR` locale |
| `items`          | `OrderItem[]`  | Mapped from `products ?? []` |
| `created_at`     | `string\|null` | ISO-like string from backend (naive, no timezone suffix) |
| `notes`          | `string\|null` | Optional operator notes |
| `payment_method` | `string\|null` | Optional payment label |

### OrderItem

| Field        | Type     | Notes |
|--------------|----------|-------|
| `product_id` | `number` | References a product |
| `quantity`   | `number` | Number of units ordered |

## Archiving Rule (derived, computed at runtime)

An order is considered **archived** if and only if:

```
created_at !== null
  && isOlderThanDays(created_at, 7) === true
```

Where `isOlderThanDays` is:

```
(Date.now() - parseBackendDateTime(created_at).getTime()) > 7 * 24 * 60 * 60 * 1000
```

**Null handling**: Orders with `created_at === null` are **not** archived — they remain on the home page.
**Boundary**: Strictly greater than 7 × 24 hours (exclusive of the exact 7-day mark).

## New Utility: `isOlderThanDays`

**File**: `src/lib/datetime.ts` (addition to existing module)

```
isOlderThanDays(created_at: string | null, days: number): boolean
```

| Parameter   | Type            | Description |
|-------------|-----------------|-------------|
| `created_at`| `string\|null`  | Raw datetime string from backend |
| `days`      | `number`        | Threshold in days |
| **Returns** | `boolean`       | `true` if the datetime is strictly more than `days × 24h` ago |

- Returns `false` for `null` or unparseable `created_at`.
- Internally uses `parseBackendDateTime` (already exported from the same module).
