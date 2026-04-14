# Design: OrderCard Product Names

**Date:** 2026-04-13
**Status:** Approved

## Summary

Update the order list pages so `OrderCard` receives product names instead of rendering generic labels like `Produto #1`.

## Problem

`OrderCard` currently renders each item as:

```tsx
{item.quantity}x Produto #{item.product_id}
```

The component only receives `product_id` and `quantity`, so even valid orders display fallback text instead of real product names.

## Solution

Keep `OrderCard` as a presentational component and enrich the order items before they reach it.

`Home` and `ArchivedOrders` will fetch product metadata from `/orders/list`, build a `product_id -> name` lookup, and map each order item from:

```ts
{ product_id, quantity }
```

to:

```ts
{ product_id, quantity, name }
```

`OrderCard` will render `name` when available and only fall back to `Produto #<id>` when no matching product name exists.

## Architecture

### `src/components/OrderCard.tsx`

- Extend `OrderItem` to support `name?: string`.
- Render:

```tsx
{item.quantity}x {item.name ?? `Produto #${item.product_id}`}
```

- Keep the fallback behavior for safety when a name is missing.

### `src/Pages/Home.tsx`

- Fetch:
  - `/orders/list_order/order_user`
  - `/orders/list`
- Build a `Record<number, string>` map of product names from `/orders/list`.
- Enrich each `products` item before passing it to `OrderCard`.
- Preserve the existing filtering and sort behavior for non-archived orders.

### `src/Pages/ArchivedOrders.tsx`

- Fetch:
  - `/orders/list_order/order_user`
  - `/orders/list`
- Build the same product-name map.
- Enrich each archived order item before passing it to `OrderCard`.
- Preserve the existing archived filter and date sort behavior.

## Data Flow

1. `Home` and `ArchivedOrders` fetch orders from `/orders/list_order/order_user`.
2. They fetch products from `/orders/list`.
3. They map products into a `product_id -> name` dictionary.
4. They enrich each order item with `name`.
5. `OrderCard` renders the enriched item names.
6. If a product name is missing, `OrderCard` still shows `Produto #<id>`.

## Error Handling

- If `/orders/list` fails or returns an unexpected format, the pages should continue rendering orders.
- In that case, item names stay undefined and `OrderCard` falls back to `Produto #<id>`.
- This must not block order rendering.

## Testing

The implementation should verify:

- `OrderCard` renders the product name when `name` exists.
- `OrderCard` still falls back to `Produto #<id>` when `name` is missing.
- `Home` fetches `/orders/list` and passes enriched item names to `OrderCard`.
- `ArchivedOrders` fetches `/orders/list` and passes enriched item names to `OrderCard`.

## Out of Scope

- Changing the backend response format
- Adding product images or other product metadata to the card
- Refactoring all order-fetching pages into a shared data loader
