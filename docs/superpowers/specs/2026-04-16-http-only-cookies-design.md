# HTTP-only Cookie Token Storage

**Date:** 2026-04-16
**Status:** Approved

## Problem

The JWT access token is currently stored in `localStorage`, making it accessible via JavaScript and vulnerable to XSS attacks.

## Goal

Move token storage to HTTP-only cookies managed by the browser, so the token is never accessible to JavaScript.

## Scope

Frontend only — the FastAPI backend already emits `Set-Cookie: access_token=<jwt>; HttpOnly; Path=/; SameSite=Lax` on login and has a `/auth/logout` endpoint that clears the cookie.

## Design

### `src/api/index.tsx`

- Add `withCredentials: true` to the axios instance so the browser automatically sends the cookie on every request.
- Remove the request interceptor that reads `access_token` from `localStorage` and injects it as `Authorization: Bearer <token>`.
- Keep the response interceptor that handles `"Invalid token"` errors.

### `src/contexts/AuthContext.tsx`

- Remove `token` state and all `localStorage` reads/writes for `access_token` and `auth_user`.
- Remove `token` from the `AuthContextType` interface.
- `isAuthenticated` is set to `true` after a successful login call and `false` after logout; it is initialized to `false` (no persistence needed — the cookie is the source of truth).
- `login(authPayload)` — no longer receives a token argument; stores display name from `authPayload` in React state only (not localStorage).
- `logout()` — calls `api.post('/auth/logout')` to instruct the backend to clear the cookie, then resets local state.
- The profile hydration `useEffect` that reads `token` and calls `/users/user/:id` is removed (requires token access which is no longer available).
- `displayName` is resolved from the login response payload only.

### `src/Pages/SignIn.tsx`

- Change `login(data.access_token, data)` to `login(data)`.

## Local Development Notes

Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`. Both share the `localhost` registrable domain, so `SameSite=Lax` cookies are sent cross-port without HTTPS.

CORS must be configured on the backend with `allow_credentials=True` and `allow_origins=["http://localhost:5173"]`.

## Out of Scope

- Backend changes (already implemented).
- CSRF protection (relevant only for production with `SameSite=None`).
- Refresh token / silent re-auth flow.
