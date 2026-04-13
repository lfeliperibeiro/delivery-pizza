# Design: Axios Auth Request Interceptor

**Date:** 2026-04-13  
**Status:** Approved

## Problem

The `access_token` is being read directly from `localStorage` in 9 page components and 1 UI component (16 occurrences total). This bypasses the `AuthContext` that was designed to own auth state and forces every component to know about the storage key and header format.

## Goal

Eliminate all manual `localStorage.getItem("access_token")` calls from pages and components by centralizing token injection in the axios instance.

## Approach

Add a request interceptor to the existing `api` axios instance in `src/api/index.tsx`. The interceptor reads the token from `localStorage` and attaches the `Authorization: Bearer <token>` header to every outgoing request automatically.

This is consistent with the existing response interceptor already present in the same file (which handles the `auth:invalid-token` event).

## Implementation

### `src/api/index.tsx`

Add after the existing response interceptor:

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Pages and components — pattern to remove

In each affected file, delete:
- `const token = localStorage.getItem("access_token")`
- `headers: { Authorization: \`Bearer ${token}\` }` from `api.get()`/`api.post()` calls

The API calls themselves remain unchanged.

## Files Affected

| File | Occurrences |
|------|-------------|
| `src/api/index.tsx` | +1 (interceptor added) |
| `src/Pages/Home.tsx` | 1 removed |
| `src/Pages/Analytics.tsx` | 1 removed |
| `src/Pages/CreateOrder.tsx` | 2 removed |
| `src/Pages/EditOrder.tsx` | 2 removed |
| `src/Pages/EditUser.tsx` | 2 removed |
| `src/Pages/Products.tsx` | 1 removed |
| `src/Pages/ArchivedOrders.tsx` | 1 removed |
| `src/Pages/RemoveProduct.tsx` | 1 removed |
| `src/Pages/AddProduct.tsx` | 1 removed |
| `src/Pages/Users.tsx` | 1 removed |
| `src/components/OrderCard.tsx` | 1 removed |

`src/contexts/AuthContext.test.ts` — not changed (tests the context directly, not axios).

## Out of Scope

- Migrating token storage away from `localStorage`
- Refactoring pages to use `useAuth()` for the token
- Any other architectural improvements (data fetching layer, shared types, etc.)
