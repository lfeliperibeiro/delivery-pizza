# Design: Edit Order With Current Products And ID In Payload

**Date:** 2026-04-13
**Status:** Approved

## Summary

Update `EditOrder` so it loads the current order data automatically, uses the same product-selection pattern as `CreateOrder`, preserves each selected product's quantity, and sends the order `id` inside the edit payload.

## Problem

The current `EditOrder` form differs from `CreateOrder` in two important ways:

- it stores selected products as `product_ids` plus one shared `quantity`;
- it does not preload the current order's products and quantities.

That structure prevents the edit screen from behaving like the create screen, and it also means the request body does not include the order `id` required by the backend contract.

## Solution

Keep reading the order `id` from the URL query string, but change the edit form state to match `CreateOrder`:

```ts
interface ProductEntry {
  product_id: number
  quantity: number
}
```

The page will load:

1. available products from `/orders/list` for the select options;
2. current order data from `/orders/list_order/order_user`, locating the edited order by `order_id`.

After the order is found, the page will keep internally:

- `user_id`
- selected `products`
- each product's current `quantity`

`user_id` will not be editable in the UI. It is loaded from the current order and sent automatically in the edit request body.

The submit request will continue using:

```ts
`/orders/order/edit/${orderId}`
```

The payload will become:

```ts
{
  id: orderId,
  user_id: orderData.user_id,
  products: orderData.products,
}
```

## Architecture

### `src/Pages/EditOrder.tsx`

- Keep reading `id` from `useSearchParams()`.
- Replace the current edit state shape:
  - remove `product_ids`
  - remove shared `quantity`
  - add `products: Array<{ product_id: number; quantity: number }>`
- Reuse the same select behavior already implemented in `CreateOrder`:
  - selecting products builds the `products` array
  - already selected products keep their previous quantity
  - newly selected products start with quantity `1`
- Do not render a visible `user_id` input in the form.
- Render a "Quantidade por produto" section below the select, just like `CreateOrder`.
- Load the order being edited from `/orders/list_order/order_user` and prefill the form using the matching `order_id`.
- Include `id` and the preloaded `user_id` in the `api.put(...)` body.

### Data loading strategy

- `GET /orders/list` remains responsible only for available product options.
- `GET /orders/list_order/order_user` provides the current order collection.
- `EditOrder` finds the current order by comparing the URL `id` with `order_id`.
- The matched order must provide:
  - `order_id`
  - `user_id`
  - `products`

### `src/Pages/EditOrder.test.tsx`

Tests should cover:

- loading available products for the select;
- preloading the selected products and quantities from the current order;
- not rendering a visible `ID do usuário` input;
- updating quantity for a selected product;
- submitting `id`, `user_id`, and `products` in the correct shape;
- showing an error when the edit request fails;
- blocking submission when the URL `id` is invalid;
- blocking submission when any selected product has invalid quantity.

## Data Flow

1. The page reads `id` from the URL.
2. The page loads product options from `/orders/list`.
3. The page loads orders from `/orders/list_order/order_user`.
4. The page finds the current order by `order_id === id`.
5. The form state is initialized with the current order's `user_id` and `products`.
6. The user changes only product selection and per-product quantities.
7. On submit, the page validates:
   - valid `id`
   - loaded `user_id` from the current order
   - at least one product selected
   - valid quantity for every selected product
8. If valid, the page sends:

```ts
{
  id,
  user_id,
  products,
}
```

9. On success, the page shows a success toast and navigates to `/home`.
10. On failure, the page shows an error toast.

## Error Handling

No backend contract changes are required beyond adding `id` to the request body.

Validation remains on the client for:

- invalid or missing order `id`;
- missing current order or missing preloaded `user_id`;
- no selected products;
- any product with invalid quantity.

If the current order is not found in `/orders/list_order/order_user`, the screen should not silently invent data. The edit form should remain uninitialized for that order and submission should still be blocked by invalid state.

## Testing

The implementation should verify:

- `/orders/list` still populates the select;
- `/orders/list_order/order_user` preloads the current order into the edit state;
- the form no longer renders the `ID do usuário` input;
- changing a per-product quantity updates the submitted payload;
- successful submission sends `id` in the body together with `products`;
- failed submission still uses the same payload shape before surfacing the API error;
- invalid URL `id` prevents the request;
- invalid product quantities prevent the request.

## Out of Scope

- Changing the route from query string to route params
- Refactoring `CreateOrder` and `EditOrder` into a shared reusable component
- Editing `notes` or `payment_method` on this screen
