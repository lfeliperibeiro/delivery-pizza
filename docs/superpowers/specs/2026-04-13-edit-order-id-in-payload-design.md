# Design: Edit Order ID In Payload

**Date:** 2026-04-13
**Status:** Approved

## Summary

Update the order editing request so the order `id` is sent automatically inside the request body, without requiring any manual input from the user.

## Problem

The `EditOrder` page already reads the order `id` from the URL and uses it in the `PUT /orders/order/edit/{id}` endpoint. However, the request body does not include this `id`.

The desired backend contract is to send the same order `id` in the payload as `id`, while keeping it automatic and invisible to the user.

## Solution

Keep the current URL-based `id` lookup in `src/Pages/EditOrder.tsx` and include `id` in the body passed to `api.put(...)`.

The request will continue using the existing endpoint path:

```ts
`/orders/order/edit/${orderData.id}`
```

The payload will become:

```ts
{
  id: orderData.id,
  user_id: orderData.user_id,
  products: orderData.product_ids.map((productId) => ({
    product_id: productId,
    quantity: orderData.quantity!,
  })),
}
```

This keeps the current navigation and validation behavior unchanged while satisfying the new backend requirement.

## Architecture

### `src/Pages/EditOrder.tsx`

- Keep reading the order `id` from the URL through the current search param flow.
- Keep the existing validation that blocks submission when the `id` is missing or invalid.
- Update the `api.put(...)` body to include `id: orderData.id`.
- Do not add any visible `id` input to the form.

### `src/Pages/EditOrder.test.tsx`

- Update the success test to expect `id` in the request body.
- Update the API failure test to expect `id` in the request body.
- Keep the invalid `id` validation test to confirm the request is still blocked when the URL does not provide a valid order id.

## Data Flow

1. The page reads `id` from the URL on mount.
2. The user fills `user_id`, selected products, and quantity.
3. On submit, the page validates all required fields.
4. If valid, the page sends a `PUT` request to `/orders/order/edit/{id}`.
5. The request body includes `id`, `user_id`, and `products`.
6. On success, the page shows a success toast and navigates to `/home`.
7. On failure, the page shows an error toast.

## Error Handling

No new error states are introduced.

Existing validation remains responsible for preventing submission when:
- no product is selected;
- `user_id` is invalid;
- `quantity` is invalid;
- the order `id` from the URL is missing or invalid.

## Testing

The implementation should verify:

- successful submission sends `id` in the payload;
- failed submission still sends `id` in the payload before surfacing the API error;
- invalid URL `id` prevents the request from being sent.

## Out of Scope

- Changing the route shape from query string to route params
- Refactoring `EditOrder` state structure beyond what is needed for this request
- Loading existing order data automatically into the form
