# HTTP-only Cookie Token Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate JWT token storage from `localStorage` to HTTP-only cookies managed by the browser, making the token inaccessible to JavaScript.

**Architecture:** The backend already sets `Set-Cookie: access_token=<jwt>; HttpOnly; Path=/; SameSite=Lax` on login and clears it on logout. The frontend stops reading/writing the token entirely — axios sends cookies automatically via `withCredentials: true`, and `AuthContext` tracks authentication state in React memory only.

**Tech Stack:** React 19, TypeScript, axios, Vitest, @testing-library/react

---

### Task 1: Update `src/api/index.tsx` — add `withCredentials`, remove localStorage interceptor

**Files:**
- Modify: `src/api/index.tsx`
- Modify: `src/api/index.test.ts`

- [ ] **Step 1: Write the failing test for `withCredentials`**

In `src/api/index.test.ts`, add this test to the `"api instance"` describe block (after the `"mantém o baseURL..."` test):

```ts
it("configura withCredentials como true", () => {
  expect(api.defaults.withCredentials).toBe(true)
})
```

- [ ] **Step 2: Remove the localStorage request interceptor tests**

In `src/api/index.test.ts`, delete the entire `"api request interceptor"` describe block (lines 51–100):

```ts
// DELETE this entire block:
describe("api request interceptor", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })
  it("injeta Authorization header quando token existe no localStorage", () => { ... })
  it("não injeta Authorization header quando não há token", () => { ... })
  it("retorna o config em ambos os casos", () => { ... })
})
```

- [ ] **Step 3: Run tests to verify the new test fails**

```bash
pnpm vitest run src/api/index.test.ts
```

Expected: FAIL — `AssertionError: expected undefined to be true`

- [ ] **Step 4: Implement the changes in `src/api/index.tsx`**

Replace the full file content with:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail

    if (detail === "Invalid token") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:invalid-token"))
      }
    }

    return Promise.reject(error)
  },
)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm vitest run src/api/index.test.ts
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/api/index.tsx src/api/index.test.ts
git commit -m "feat: add withCredentials to axios and remove localStorage token interceptor"
```

---

### Task 2: Rewrite `src/contexts/AuthContext.tsx` — remove token and localStorage

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/contexts/AuthContext.test.ts`

- [ ] **Step 1: Replace `AuthContext.test.ts` with updated tests**

Replace the full file content with:

```ts
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createElement, Fragment } from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { api } from "@/api"
import { AuthProvider, useAuth } from "./AuthContext"

vi.mock("@/api", () => ({
  api: {
    post: vi.fn(),
  },
}))

function AuthProbe() {
  const { displayName, identityStatus, isAuthenticated } = useAuth()
  return createElement(
    Fragment,
    null,
    createElement("span", { "data-testid": "display-name" }, displayName ?? "null"),
    createElement("span", { "data-testid": "identity-status" }, identityStatus),
    createElement("span", { "data-testid": "is-authenticated" }, String(isAuthenticated)),
  )
}

function AuthControls() {
  const { displayName, identityStatus, isAuthenticated, login, logout } = useAuth()
  return createElement(
    Fragment,
    null,
    createElement("span", { "data-testid": "control-display-name" }, displayName ?? "null"),
    createElement("span", { "data-testid": "control-identity-status" }, identityStatus),
    createElement("span", { "data-testid": "control-authenticated" }, String(isAuthenticated)),
    createElement(
      "button",
      { onClick: () => login({ user: { name: "Maria Oliveira" } }) },
      "login-with-payload",
    ),
    createElement(
      "button",
      { onClick: () => login() },
      "login-no-payload",
    ),
    createElement("button", { onClick: logout }, "logout"),
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("inicia como não autenticado", () => {
    render(createElement(AuthProvider, null, createElement(AuthProbe)))
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false")
    expect(screen.getByTestId("identity-status")).toHaveTextContent("anonymous")
    expect(screen.getByTestId("display-name")).toHaveTextContent("null")
  })

  it("faz login com payload e atualiza estado", () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))
    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("Maria Oliveira")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("resolved")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")
  })

  it("faz login sem payload e usa nome padrão", () => {
    render(createElement(AuthProvider, null, createElement(AuthControls)))
    fireEvent.click(screen.getByRole("button", { name: "login-no-payload" }))
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("Usuario")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("fallback")
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")
  })

  it("faz logout chamando api.post e limpando estado", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    expect(screen.getByTestId("control-authenticated")).toHaveTextContent("true")

    fireEvent.click(screen.getByRole("button", { name: "logout" }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/logout")
    })

    await waitFor(() => {
      expect(screen.getByTestId("control-authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("null")
    expect(screen.getByTestId("control-identity-status")).toHaveTextContent("anonymous")
  })

  it("limpa estado no logout mesmo quando api.post falha", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Network error"))
    render(createElement(AuthProvider, null, createElement(AuthControls)))

    fireEvent.click(screen.getByRole("button", { name: "login-with-payload" }))
    fireEvent.click(screen.getByRole("button", { name: "logout" }))

    await waitFor(() => {
      expect(screen.getByTestId("control-authenticated")).toHaveTextContent("false")
    })
    expect(screen.getByTestId("control-display-name")).toHaveTextContent("null")
  })
})

describe("useAuth", () => {
  it("lança erro quando usado fora do provider", () => {
    expect(() => render(createElement(AuthProbe))).toThrow(
      "useAuth must be used within an AuthProvider",
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/contexts/AuthContext.test.ts
```

Expected: several FAILs because `AuthContextType` still has `token`, `login` still requires a token argument, and `logout` doesn't call `api.post`.

- [ ] **Step 3: Replace `src/contexts/AuthContext.tsx` with new implementation**

Replace the full file content with:

```tsx
/* eslint-disable react-refresh/only-export-components */
import { api } from "@/api"
import { createContext, useContext, useState, type ReactNode } from "react"

type IdentityStatus = "resolved" | "fallback" | "anonymous"
type AuthSnapshotSource = "login-response" | "fallback"

interface AuthUserSnapshot {
  displayName: string
  source: AuthSnapshotSource
}

interface AuthContextType {
  displayName: string | null
  identityStatus: IdentityStatus
  login: (authPayload?: unknown) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_DISPLAY_NAME = "Usuario"

function extractDisplayName(input: unknown): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  return trimmed || null
}

function resolveDisplayNameFromPayload(authPayload: unknown): string | null {
  if (!authPayload || typeof authPayload !== "object") return null
  const payload = authPayload as Record<string, unknown>
  const nestedUser = payload.user
  if (nestedUser && typeof nestedUser === "object") {
    const nestedName = extractDisplayName((nestedUser as Record<string, unknown>).name)
    if (nestedName) return nestedName
  }
  return extractDisplayName(payload.name)
}

function resolveLoginSnapshot(authPayload?: unknown): AuthUserSnapshot {
  const payloadDisplayName = resolveDisplayNameFromPayload(authPayload)
  if (payloadDisplayName) {
    return { displayName: payloadDisplayName, source: "login-response" }
  }
  return { displayName: DEFAULT_DISPLAY_NAME, source: "fallback" }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userSnapshot, setUserSnapshot] = useState<AuthUserSnapshot | null>(null)

  const login = (authPayload?: unknown) => {
    const snapshot = resolveLoginSnapshot(authPayload)
    setIsAuthenticated(true)
    setUserSnapshot(snapshot)
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // clear local state regardless of API failure
    }
    setIsAuthenticated(false)
    setUserSnapshot(null)
  }

  const displayName = userSnapshot?.displayName ?? null
  const identityStatus: IdentityStatus = isAuthenticated
    ? userSnapshot?.source === "login-response"
      ? "resolved"
      : "fallback"
    : "anonymous"

  return (
    <AuthContext.Provider
      value={{ displayName, identityStatus, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/contexts/AuthContext.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/contexts/AuthContext.test.ts
git commit -m "feat: replace localStorage token storage with HTTP-only cookie session state"
```

---

### Task 3: Update `src/Pages/SignIn.tsx` — remove token argument from `login()`

**Files:**
- Modify: `src/Pages/SignIn.tsx`
- Modify: `src/Pages/SignIn.test.tsx`

- [ ] **Step 1: Update the test that verifies the `login()` call**

In `src/Pages/SignIn.test.tsx`:

1. Remove `token: null` from `authContextValue` (line 28):

```ts
// Before:
const authContextValue = {
  token: null,
  displayName: null,
  identityStatus: "anonymous" as const,
  login: mockLogin,
  logout: vi.fn(),
  isAuthenticated: false,
}

// After:
const authContextValue = {
  displayName: null,
  identityStatus: "anonymous" as const,
  login: mockLogin,
  logout: vi.fn(),
  isAuthenticated: false,
}
```

2. Update the `"chama login do contexto com token após sucesso"` test expectation:

```ts
// Before:
await waitFor(() => {
  expect(mockLogin).toHaveBeenCalledWith("meu-token", {
    access_token: "meu-token",
    name: "João",
  })
})

// After:
await waitFor(() => {
  expect(mockLogin).toHaveBeenCalledWith({
    access_token: "meu-token",
    name: "João",
  })
})
```

- [ ] **Step 2: Run SignIn tests to verify the updated test fails**

```bash
pnpm vitest run src/Pages/SignIn.test.tsx
```

Expected: FAIL — `mockLogin` called with two arguments but test expects one

- [ ] **Step 3: Update `src/Pages/SignIn.tsx` to call `login(data)` without the token**

```tsx
import { Button } from "@/components/ui/button"
import { FieldInputSignIn } from "@/components/FieldInputSignIn"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/api"
import  { toast, Toaster } from "sonner"

export function SignIn(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  function handleSignIn(){
    api.post('/auth/login', {
      email: email,
      password: password,
    })
    .then((response) => {
      return response.data;
    })
    .then((data) => {
      login(data)
      navigate('/home')
    })
    .catch(() => {
         toast.error("Usuário não encontrado ou senha inválida", {
          action: {
            label: "Voltar",
            onClick: () => console.log("Voltar"),
          },
      })
    })
  }

  return (
    <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <h1 className="text-2xl font-bold">Login</h1>
            <FieldInputSignIn username={email} setUsername={setEmail} password={password} setPassword={setPassword} />
            <Button onClick={handleSignIn} disabled={!email || !password}>Login</Button>
            <p className="text-center text-sm">você ainda não tem uma conta? <a href="/register" className="text-orange-500">Clique aqui</a></p>
        </div>
        <Toaster />
    </div>
  )
}
```

- [ ] **Step 4: Run SignIn tests to verify they pass**

```bash
pnpm vitest run src/Pages/SignIn.test.tsx
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/Pages/SignIn.tsx src/Pages/SignIn.test.tsx
git commit -m "feat: update SignIn to pass response payload instead of token to login()"
```

---

### Task 4: Full test suite verification

- [ ] **Step 1: Run the full test suite**

```bash
pnpm vitest run
```

Expected: all tests PASS. Any failures in other files are likely due to consuming `token` from `AuthContext` — fix them by removing references to `token` in the failing test's mock context value.

- [ ] **Step 2: Fix any remaining type errors**

```bash
pnpm tsc --noEmit
```

If TypeScript reports errors about `token` being referenced from `AuthContext`, find and fix each callsite:

```bash
# Find any remaining token references from AuthContext
grep -r "\.token" src/ --include="*.tsx" --include="*.ts"
```

Remove or replace any `context.token` or `{ token }` destructuring from `useAuth()` calls.

- [ ] **Step 3: Commit final fixes if any**

```bash
git add -p
git commit -m "fix: remove remaining token references from AuthContext consumers"
```
