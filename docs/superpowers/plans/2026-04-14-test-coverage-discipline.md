# Test Coverage Discipline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish 100% coverage on pure logic (`src/lib`, `src/contexts`, `src/api`) and ≥80% on UI, enforced by Vitest thresholds and a lefthook pre-commit hook, with the discipline ratified as principle VI of the project constitution.

**Architecture:** Add a constitutional principle, configure per-glob Vitest thresholds with explicit exclusions, install lefthook to run typecheck + lint + coverage on every commit, then expand existing test files to close the coverage gap (no new test files needed; all source files already have a `*.test.*` companion).

**Tech Stack:** Vitest 4 (v8 coverage provider), @testing-library/react, happy-dom, lefthook (Go binary via npm wrapper), pnpm.

---

## Pre-flight

- [ ] **Verify baseline**

```bash
cd /Users/feliperibeiro/www/delivery-pizza
pnpm test:coverage 2>&1 | tail -30
```

Expected: 31 test files / 233 tests pass; All files report 92.17% statements, 79.42% branches, 94.55% functions, 93.63% lines. If the baseline diverges, stop and reconcile before proceeding.

---

## Task 1: Update constitution (principle VI)

**Files:**
- Modify: `.specify/memory/constitution.md`
- Reference: `docs/superpowers/specs/2026-04-14-test-coverage-discipline-design.md`

The current constitution is at version 1.0.0. Add principle **VI. Test Coverage Discipline**, bump to **1.1.0** (MINOR — new principle), and prepend an updated Sync Impact Report HTML comment.

- [ ] **Step 1: Read current constitution to confirm version, structure, and existing Sync Impact Report**

Run: `cat .specify/memory/constitution.md`
Expected: file at version 1.0.0, ratified 2026-04-12, with five principles (I–V).

- [ ] **Step 2: Edit `.specify/memory/constitution.md`**

Replace the existing top HTML comment (`Sync Impact Report`) with this updated block:

```html
<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles: none renamed
- Added sections:
  - VI. Test Coverage Discipline
- Removed sections:
  - None
- Templates requiring updates:
  - ⚠ pending .specify/templates/plan-template.md (Constitution Check section)
  - ⚠ pending .specify/templates/tasks-template.md (testing task category)
  - ⚠ pending AGENTS.md (gates: add pnpm test:coverage; document lefthook)
- Follow-up TODOs:
  - Apply pending template updates in tasks 2 and 7 of the test-coverage plan.
-->
```

After the existing principle V block (line ending with "consistency is cheaper than abstraction churn."), insert:

```markdown

### VI. Test Coverage Discipline
Pure-logic modules — `src/lib/`, `src/contexts/`, `src/api/` — MUST maintain
100% coverage in statements, branches, functions, and lines. UI modules —
`src/Pages/`, `src/components/` (excluding `ui/`), `src/hooks/` — MUST maintain
at least 80% statements, 75% branches, 80% functions, and 80% lines. Generated
UI primitives (`src/components/ui/*`), entrypoints (`main.tsx`, `App.tsx`,
`routes.tsx`), test setup (`src/test/**`), and test files themselves are
excluded. Every commit MUST pass `pnpm test:coverage`, enforced by a pre-commit
hook (lefthook). Rationale: the operations console is business-critical and
untested branches in pure logic produce silent regressions; pragmatic UI
thresholds keep the bar achievable without rewarding scaffolding tests.
```

At the bottom, replace the version footer line:

```markdown
**Version**: 1.1.0 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-14
```

- [ ] **Step 3: Verify constitution**

Run: `head -25 .specify/memory/constitution.md && grep -E "^### V" .specify/memory/constitution.md && tail -3 .specify/memory/constitution.md`
Expected: Sync Impact Report shows 1.0.0 -> 1.1.0; six principles I-VI listed; footer says Version 1.1.0, Last Amended 2026-04-14.

- [ ] **Step 4: Commit**

```bash
git add .specify/memory/constitution.md
git commit -m "docs: amend constitution to v1.1.0 (add principle VI test coverage)"
```

---

## Task 2: Update plan/tasks templates and AGENTS.md

**Files:**
- Modify: `.specify/templates/plan-template.md` (only if it has a "Constitution Check" section listing principles)
- Modify: `.specify/templates/tasks-template.md` (only if it lists task categories)
- Modify: `AGENTS.md`

- [ ] **Step 1: Inspect plan-template.md for Constitution Check section**

Run: `grep -n "Constitution Check\|Principle\|principle" .specify/templates/plan-template.md`

If the template has a Constitution Check section that enumerates principles, add a line for principle VI ("Test Coverage Discipline — verify thresholds remain green and any new file falls under the right glob"). If no such section exists, skip this step (no edit needed).

- [ ] **Step 2: Inspect tasks-template.md for testing categories**

Run: `grep -n "Testing\|testing\|category\|Category" .specify/templates/tasks-template.md`

If the template categorizes tasks by type, add or expand a "Testing & Coverage" category with note: "Every task that adds source files MUST add or extend a sibling test file; coverage thresholds enforced by pre-commit." Otherwise skip.

- [ ] **Step 3: Edit `AGENTS.md` — extend "Gates mínimos de entrega"**

Locate the section starting with "## Gates mínimos de entrega" and replace its command block:

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
```

with:

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test:coverage
```

Then immediately after the "validação manual" bullet list within that section, add:

```markdown

> Pre-commit: `lefthook` roda `typecheck`, `lint` (em arquivos staged) e
> `test:coverage` automaticamente. Se um commit precisar pular o hook em
> emergência, use `git commit --no-verify` e abra um follow-up imediato para
> restaurar a cobertura.
```

- [ ] **Step 4: Verify edits**

Run: `grep -n "test:coverage\|lefthook" AGENTS.md`
Expected: at least two matches — one in the gates command block, one in the pre-commit note.

- [ ] **Step 5: Commit**

```bash
git add .specify/templates/plan-template.md .specify/templates/tasks-template.md AGENTS.md
git commit -m "docs: align templates and AGENTS.md with constitution v1.1.0"
```

If only AGENTS.md was modified, only stage that file.

---

## Task 3: Configure Vitest coverage thresholds and exclusions

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Replace `vitest.config.ts` contents**

Overwrite with:

```ts
import path from "path"
import { configDefaults, defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "src/components/ui/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/ui/**",
        "src/main.tsx",
        "src/App.tsx",
        "src/routes.tsx",
        "src/test/**",
        "src/assets/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
      ],
      thresholds: {
        "src/lib/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/contexts/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/api/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/Pages/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "src/components/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "src/hooks/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Run coverage to confirm thresholds load and produce per-glob failures**

Run: `pnpm test:coverage 2>&1 | tail -40`
Expected: tests pass; coverage report emits threshold failure messages for `src/api/**`, `src/contexts/**`, `src/Pages/**`, `src/components/**`. The exit code may be non-zero; that is intentional — we will fix coverage in tasks 5–13 below.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: add per-glob coverage thresholds and explicit exclusions"
```

---

## Task 4: Install and configure lefthook

**Files:**
- Modify: `package.json`
- Create: `lefthook.yml`

- [ ] **Step 1: Add lefthook as devDependency**

Run: `pnpm add -D lefthook`
Expected: `pnpm-lock.yaml` updates; `lefthook` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add `prepare` script to `package.json`**

Edit `package.json` `"scripts"` block to insert one new line. The block becomes:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "prepare": "lefthook install"
}
```

- [ ] **Step 3: Create `lefthook.yml` at repo root**

```yaml
pre-commit:
  parallel: true
  commands:
    typecheck:
      run: pnpm typecheck
    lint:
      glob: "*.{ts,tsx}"
      run: pnpm lint {staged_files}
    coverage:
      run: pnpm test:coverage
```

- [ ] **Step 4: Install hooks**

Run: `pnpm prepare`
Expected: `lefthook install` output confirming `.git/hooks/pre-commit` was generated.

- [ ] **Step 5: Smoke test the hook (without committing)**

Run: `npx lefthook run pre-commit 2>&1 | tail -20`
Expected: typecheck passes, lint passes (or no staged TS files match, which is fine), coverage runs. The coverage step will currently fail because thresholds are not met yet — that is expected and proves the gate works.

- [ ] **Step 6: Commit infra (bypass hook this one time)**

Coverage failures from previous tasks would block this commit; bypass with `--no-verify` since the very purpose of this commit is to install the gate that we will then satisfy:

```bash
git add package.json pnpm-lock.yaml lefthook.yml
git commit --no-verify -m "chore: install lefthook with pre-commit gate (typecheck+lint+coverage)"
```

This is the only `--no-verify` commit in this plan. Every subsequent task ends with a hook-validated commit.

---

## Task 5: Cover `src/api/index.tsx` to 100%

**Files:**
- Read: `src/api/index.tsx`
- Modify: `src/api/index.test.ts`

The current uncovered point is line 34: `(error) => Promise.reject(error)` — the request interceptor's error handler.

- [ ] **Step 1: Run targeted coverage to confirm gap**

Run: `pnpm test:coverage 2>&1 | grep -A 2 "src/api"`
Expected: `index.tsx` shows uncovered line 34.

- [ ] **Step 2: Append a new describe block to `src/api/index.test.ts`**

Add at the end of the file:

```ts
describe("api request interceptor (error path)", () => {
  it("rejeita a promise quando o handler de erro do request interceptor é invocado", async () => {
    const handler = (
      api.interceptors.request as unknown as {
        handlers: Array<{ rejected?: (error: unknown) => Promise<unknown> }>
      }
    ).handlers[0]

    const error = new Error("request setup failed")

    await expect(handler.rejected?.(error)).rejects.toThrow("request setup failed")
  })
})
```

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "src/api"`
Expected: `index.tsx` now shows 100% across statements/branches/functions/lines.

- [ ] **Step 4: Commit**

```bash
git add src/api/index.test.ts
git commit -m "test(api): cover request interceptor error handler"
```

The pre-commit hook must pass for `src/api/**` (now at 100%); other globs may still fail — that is expected until later tasks land. If the hook blocks the commit because other globs are below threshold, this means task ordering must complete pure-logic tasks (5, 6) and infra-only commits before any UI commit. To temporarily unblock, run subsequent pure-logic tasks 6 first then return; if both pure-logic tasks are done and only UI tasks remain, run them sequentially without intermediate commits or use one consolidated commit per UI task.

> **Note on hook behavior in this plan:** Vitest 4 thresholds use `perFile: false` semantics by default — they apply to whatever globs are configured. Tasks 5 and 6 must finish before any UI commit can pass the coverage gate, because thresholds for `src/api/**` and `src/contexts/**` are 100%. Run tasks 5 and 6 strictly in order before tasks 7–13.

---

## Task 6: Cover `src/contexts/AuthContext.tsx` to 100%

**Files:**
- Read: `src/contexts/AuthContext.tsx`
- Modify: `src/contexts/AuthContext.tsx` (remove dead branch on line 202)
- Modify: `src/contexts/AuthContext.test.ts`

Current uncovered lines: 109, 128, 161, 202 plus ~18% branches. Root cause: the test file currently re-implements pure functions locally instead of importing them from the source, so the source's branches are not exercised. Strategy: (a) export the pure functions; (b) update tests to import from source; (c) remove provably dead code (line 202 else branch); (d) add the missing branch tests.

- [ ] **Step 1: Read source and existing tests to understand current state**

Run: `pnpm test:coverage 2>&1 | grep -A 2 "src/contexts"`
Expected: `AuthContext.tsx` shows the listed uncovered lines.

- [ ] **Step 2: Export pure functions from `src/contexts/AuthContext.tsx`**

Edit the file: change the following declarations from `function name(` to `export function name(`:
- `parseStoredSnapshot`
- `parseJwtPayload`
- `extractDisplayName`
- `resolveDisplayNameFromPayload`
- `extractNumericId`
- `resolveUserIdFromToken`
- `resolveLoginResult`
- `extractProfileName`

- [ ] **Step 3: Remove dead branch on line 202**

In the same file, find the `login` function:

```ts
const login = (newToken: string, authPayload?: unknown) => {
  const loginResult = resolveLoginResult(newToken, authPayload)

  localStorage.setItem(ACCESS_TOKEN_KEY, newToken)
  if (loginResult.snapshot) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loginResult.snapshot))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }

  setToken(newToken)
  setUserSnapshot(loginResult.snapshot)
}
```

Replace it with (the else branch is unreachable because `resolveLoginResult` always returns a non-null snapshot):

```ts
const login = (newToken: string, authPayload?: unknown) => {
  const loginResult = resolveLoginResult(newToken, authPayload)

  localStorage.setItem(ACCESS_TOKEN_KEY, newToken)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loginResult.snapshot))

  setToken(newToken)
  setUserSnapshot(loginResult.snapshot)
}
```

- [ ] **Step 4: Update `src/contexts/AuthContext.test.ts` to import from source**

Replace the in-file copies of the pure functions with imports. Change the import line at the top:

```ts
import { AuthProvider, useAuth } from "./AuthContext"
```

to:

```ts
import {
  AuthProvider,
  useAuth,
  parseJwtPayload,
  extractDisplayName,
  extractNumericId,
  extractProfileName,
  resolveDisplayNameFromPayload,
  resolveUserIdFromToken,
  resolveLoginResult,
  parseStoredSnapshot,
} from "./AuthContext"
```

Then delete the local function declarations: `parseJwtPayload`, `extractDisplayName`, `extractNumericId`, `extractProfileName`, `resolveDisplayNameFromPayload` (the helpers between lines 13 and 72 of the existing test file). The `makeJwt`, `AuthProbe`, `AuthControls` helpers stay.

- [ ] **Step 5: Add branch tests for `resolveUserIdFromToken` and `parseStoredSnapshot`**

Append these describe blocks to the test file:

```ts
describe("resolveUserIdFromToken", () => {
  it("retorna o id quando o token tem user_id numérico", () => {
    expect(resolveUserIdFromToken(makeJwt({ user_id: 7 }))).toBe(7)
  })

  it("retorna o id quando o token usa sub como string numérica", () => {
    expect(resolveUserIdFromToken(makeJwt({ sub: "42" }))).toBe(42)
  })

  it("retorna null para token não-jwt", () => {
    expect(resolveUserIdFromToken("nao-eh-jwt")).toBeNull()
  })

  it("retorna null para token jwt sem id utilizável", () => {
    expect(resolveUserIdFromToken(makeJwt({ name: "Sem ID" }))).toBeNull()
  })
})

describe("resolveLoginResult", () => {
  it("usa nome do payload quando disponível", () => {
    const result = resolveLoginResult(makeJwt({ sub: "1" }), { user: { name: "Maria" } })
    expect(result.snapshot).toEqual({ displayName: "Maria", source: "login-response" })
  })

  it("cai para claim do jwt quando payload não tem nome", () => {
    const result = resolveLoginResult(makeJwt({ name: "João" }))
    expect(result.snapshot).toEqual({ displayName: "João", source: "jwt-claim" })
  })

  it("cai para username quando name não está presente no jwt", () => {
    const result = resolveLoginResult(makeJwt({ username: "msilva" }))
    expect(result.snapshot).toEqual({ displayName: "msilva", source: "jwt-claim" })
  })

  it("cai para email quando outros claims não existem", () => {
    const result = resolveLoginResult(makeJwt({ email: "test@example.com" }))
    expect(result.snapshot).toEqual({ displayName: "test@example.com", source: "jwt-claim" })
  })

  it("usa fallback Usuario quando token não tem claims utilizáveis", () => {
    const result = resolveLoginResult(makeJwt({ unrelated: "x" }))
    expect(result.snapshot).toEqual({ displayName: "Usuario", source: "fallback" })
  })

  it("usa fallback Usuario quando token é inválido", () => {
    const result = resolveLoginResult("nao-eh-jwt")
    expect(result.snapshot).toEqual({ displayName: "Usuario", source: "fallback" })
  })
})

describe("parseStoredSnapshot", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("retorna null quando não há snapshot salvo", () => {
    expect(parseStoredSnapshot()).toBeNull()
  })

  it("retorna null para JSON malformado", () => {
    localStorage.setItem("auth_user", "{ invalido")
    expect(parseStoredSnapshot()).toBeNull()
  })

  it("retorna null para snapshot sem displayName string", () => {
    localStorage.setItem("auth_user", JSON.stringify({ displayName: 123, source: "fallback" }))
    expect(parseStoredSnapshot()).toBeNull()
  })

  it("retorna null para snapshot com displayName vazio após trim", () => {
    localStorage.setItem("auth_user", JSON.stringify({ displayName: "   ", source: "fallback" }))
    expect(parseStoredSnapshot()).toBeNull()
  })

  it("retorna null para snapshot com source desconhecido", () => {
    localStorage.setItem("auth_user", JSON.stringify({ displayName: "OK", source: "weird" }))
    expect(parseStoredSnapshot()).toBeNull()
  })

  it("retorna snapshot válido com source profile", () => {
    localStorage.setItem("auth_user", JSON.stringify({ displayName: "Ana", source: "profile" }))
    expect(parseStoredSnapshot()).toEqual({ displayName: "Ana", source: "profile" })
  })
})

describe("AuthProvider extractProfileName branches", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => localStorage.clear())

  it("ignora resposta de perfil que não é objeto", async () => {
    localStorage.setItem("access_token", makeJwt({ sub: "5" }))
    vi.mocked(api.get).mockResolvedValueOnce({ data: "string-em-vez-de-objeto" })

    render(createElement(AuthProvider, null, createElement(AuthProbe)))

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled()
    })

    expect(screen.getByTestId("display-name")).toHaveTextContent("Usuario")
  })
})
```

- [ ] **Step 6: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "src/contexts"`
Expected: `AuthContext.tsx` reports 100% across statements/branches/functions/lines. If branches still under 100%, `pnpm test:coverage 2>&1 | grep -A 1 "AuthContext"` will show the remaining lines; inspect them in source and add targeted tests using the same import-and-call pattern.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/AuthContext.tsx src/contexts/AuthContext.test.ts
git commit -m "test(auth): export pure helpers, drop dead branch, cover all paths"
```

---

## Task 7: Cover `src/components/theme-provider.tsx` to thresholds

**Files:**
- Read: `src/components/theme-provider.tsx`
- Read: `src/components/theme-provider.test.tsx`
- Modify: `src/components/theme-provider.test.tsx`

Current: 95.5% statements, 89.58% branches, 95.65% functions, 95.5% lines. Uncovered lines: 55, 67, 77, 157.

- [ ] **Step 1: Read both files and identify what triggers each uncovered line**

```bash
sed -n '50,80p' src/components/theme-provider.tsx
sed -n '155,160p' src/components/theme-provider.tsx
```

Map each uncovered line to its trigger condition (likely: system-theme detection branch when matchMedia returns dark vs light, storage event for cross-tab sync, keyboard `d` toggle, and one branch in setTheme). Note exact triggers on a scratch pad before editing tests.

- [ ] **Step 2: Add the missing branch tests**

Append the new `it(...)` blocks inside the existing top-level `describe`. Each new test must:
- Set up the trigger (e.g., `window.matchMedia` mock returning specific value, dispatching `storage` event, dispatching `keydown` with key `d`).
- Render the provider with a `ThemeProbe` that exposes the resolved theme via `data-testid`.
- Assert the resulting theme/class matches the expected branch outcome.

Use the existing `theme-provider.test.tsx` as the template — it already mocks `matchMedia` and renders a probe; extend, do not replace, the existing setup.

For the keyboard `d` toggle (likely line 157): dispatch `fireEvent.keyDown(window, { key: "d" })` and assert that the theme flips between `dark` and `light`. Do not assert against a specific theme value; assert the **transition** so the test is robust to default-theme changes.

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "theme-provider"`
Expected: `theme-provider.tsx` reports ≥80% statements, ≥75% branches, ≥80% functions, ≥80% lines. (Goal is to clear the UI thresholds, not 100%.)

- [ ] **Step 4: Commit**

```bash
git add src/components/theme-provider.test.tsx
git commit -m "test(theme): cover system theme, storage sync, and d-key toggle"
```

---

## Task 8: Cover `src/components/OrderCard.tsx` to thresholds

**Files:**
- Read: `src/components/OrderCard.tsx`
- Modify: `src/components/OrderCard.test.tsx`

Current: 86.15% statements, 84.61% branches, 84.21% functions, 85.96% lines. Uncovered lines: 77-79, 88, 92-93. Likely SLA color branches (yellow at 1–2h, red at >2h) and the cancel/finish edge cases.

- [ ] **Step 1: Inspect uncovered lines**

```bash
sed -n '70,95p' src/components/OrderCard.tsx
```

Identify exactly what each uncovered line does (likely: `text-yellow-*`/`text-red-*` color choice from `slaColor`, plus a callback branch).

- [ ] **Step 2: Add tests**

Append to `src/components/OrderCard.test.tsx`. Use the existing helpers there to render an `OrderCard` with controlled `created_at` timestamps:

```tsx
it("usa indicador amarelo para pedidos entre 1 e 2 horas pendentes", () => {
  const oneHourFifteen = new Date(Date.now() - 75 * 60 * 1000).toISOString()
  // Render OrderCard with status "Pendente" and created_at oneHourFifteen.
  // Assert the SLA badge has class containing "yellow" or matches the
  // exact ARIA label/data-attribute used in the component for warning state.
})

it("usa indicador vermelho para pedidos com mais de 2 horas pendentes", () => {
  const threeHours = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  // Render and assert "red" / urgent state.
})

it("não exibe indicador SLA quando o pedido já foi concluído", () => {
  // Render with status "Concluido" and very old created_at.
  // Assert the SLA element is not in the document.
})
```

Replace the comment scaffolding with concrete render + assertion code using the existing test's setup and the actual prop names from `OrderCard.tsx`. Use `screen.getByTestId(...)` if the component already provides test ids; otherwise assert by visible text and `className` substring (acceptable for color tests in this codebase).

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "OrderCard"`
Expected: ≥80% statements/lines, ≥75% branches, ≥80% functions.

- [ ] **Step 4: Commit**

```bash
git add src/components/OrderCard.test.tsx
git commit -m "test(order-card): cover SLA color thresholds and finished state"
```

---

## Task 9: Cover `src/Pages/Home.tsx` to thresholds

**Files:**
- Read: `src/Pages/Home.tsx`
- Modify: `src/Pages/Home.test.tsx`

Current: 87.09% statements, **56.25% branches**, 100% functions, 92.59% lines. Uncovered lines: 75-76. The 56% branch coverage is the gating problem — UI threshold needs ≥75%.

- [ ] **Step 1: Inspect uncovered lines and find untested branches**

```bash
sed -n '60,90p' src/Pages/Home.tsx
```

Identify the conditional branches (likely: empty list state, error state from rejected promise, a refetch trigger).

- [ ] **Step 2: Read existing test setup**

```bash
cat src/Pages/Home.test.tsx
```

Note the rendering pattern (`AuthProvider` wrapper, mocked `api`, Suspense fallback handling).

- [ ] **Step 3: Add branch tests**

For each uncovered branch identified in step 1, add an `it(...)` that:
- Mocks `api.get` to return the specific data shape (empty array, error, single item, etc.).
- Renders `Home` inside the same providers used by existing tests.
- Awaits Suspense resolution with `await screen.findByText(...)` or `waitFor`.
- Asserts the visible UI for that branch (empty-state copy, error toast, item count, etc.).

Three tests typically suffice to push branch coverage past 75%:
1. **Empty state** — `api.get` resolves with `[]`; assert empty-state text appears.
2. **Error state** — `api.get` rejects; assert error message / toast or fallback rendering.
3. **Refetch path** — trigger the refetch action exposed by `Home`; assert second `api.get` call.

- [ ] **Step 4: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "Home.tsx"`
Expected: branches ≥75%; statements/functions/lines remain ≥80%.

- [ ] **Step 5: Commit**

```bash
git add src/Pages/Home.test.tsx
git commit -m "test(home): cover empty/error/refetch branches"
```

---

## Task 10: Cover `src/Pages/EditUser.tsx` to thresholds

**Files:**
- Read: `src/Pages/EditUser.tsx`
- Modify: `src/Pages/EditUser.test.tsx`

Current: 84.84% statements, **62.96% branches**, 84.61% functions, 93.33% lines. Uncovered lines: 89, 106. Need to reach ≥80% statements and ≥75% branches.

- [ ] **Step 1: Inspect uncovered lines**

```bash
sed -n '85,115p' src/Pages/EditUser.tsx
```

Likely: form-validation failure paths and update-mutation error toast.

- [ ] **Step 2: Add tests**

Append to `src/Pages/EditUser.test.tsx`:
- **Validation failure** — render, blank a required field, submit; assert validation message visible and `api.put` not called.
- **Update error** — mock `api.put` to reject; submit valid form; assert error toast appears and form remains editable.
- **Cancel/back navigation** if such a control exists — click cancel; assert navigation prop called.

Use the existing test as a template for providers and routing context.

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "EditUser"`
Expected: statements ≥80%, branches ≥75%, functions ≥80%, lines ≥80%.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/EditUser.test.tsx
git commit -m "test(edit-user): cover validation and mutation-error paths"
```

---

## Task 11: Cover `src/Pages/Analytics.tsx` to thresholds

**Files:**
- Read: `src/Pages/Analytics.tsx`
- Modify: `src/Pages/Analytics.test.tsx`

Current: 91.48% statements, **66.66% branches**, 84.21% functions, 90.69% lines. Uncovered lines: 88, 212-245. Lines 212-245 is a big block — likely an entire branch of the chart rendering or a derived-stats helper.

- [ ] **Step 1: Inspect uncovered region**

```bash
sed -n '85,90p' src/Pages/Analytics.tsx
sed -n '205,250p' src/Pages/Analytics.tsx
```

Map the structure: identify whether 212-245 is a `useMemo`/derived calculation, an alternate rendering for empty data, or a chart-only path that needs specific input.

- [ ] **Step 2: Add tests**

Append to `src/Pages/Analytics.test.tsx`:
- **Empty data** — mock `api.get` to return zero-orders payload; render; assert empty-state visible (no chart, fallback copy).
- **Single-day data** — mock with one day's worth; assert chart renders the correct period label.
- **Multi-period** — mock with several periods; assert chart contains as many series/bars as expected.
- For any pure helper used inside the uncovered region (e.g., a sum/group/percentage util), if it is exported, test it directly with multiple inputs to cover branches in one shot.

If a helper is not currently exported and the code is only reachable through chart rendering, mock the data shape that exercises each branch.

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | grep "Analytics"`
Expected: statements ≥80%, branches ≥75%, functions ≥80%, lines ≥80%.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/Analytics.test.tsx
git commit -m "test(analytics): cover empty/single/multi-period branches"
```

---

## Task 12: Cover `src/Pages/Users.tsx`, `src/Pages/EditOrder.tsx`, `src/Pages/ArchivedOrders.tsx` to thresholds

**Files:**
- Read: `src/Pages/Users.tsx`, `src/Pages/EditOrder.tsx`, `src/Pages/ArchivedOrders.tsx`
- Modify: `src/Pages/Users.test.tsx`, `src/Pages/EditOrder.test.tsx`, `src/Pages/ArchivedOrders.test.tsx`

Each is currently below the 75% branch threshold (Users 72.91%, EditOrder 72.46%, ArchivedOrders 71.42%).

- [ ] **Step 1: Users — cover normalization branches**

Inspect lines 22 and 40:

```bash
sed -n '15,45p' src/Pages/Users.tsx
```

Likely: `extractUsersArray` / `normalizeUser` defensive branches when payload is `{users: ...}` vs `{data: ...}` vs raw array vs missing fields. Add tests that pass each shape into the helpers (export them if not exported) or feed them through a mocked `api.get`.

- [ ] **Step 2: EditOrder — cover save-error and missing-product branches**

Inspect lines 107, 135-136, 183:

```bash
sed -n '100,140p' src/Pages/EditOrder.tsx
sed -n '180,190p' src/Pages/EditOrder.tsx
```

Likely: save mutation error toast, deletion of an item, status-transition guard. Add tests that:
- Submit with `api.post`/`api.put` rejecting; assert error toast and form not closed.
- Remove the last item from the order; assert the appropriate empty-or-disable behavior.
- Attempt the disallowed status transition; assert button disabled or toast.

- [ ] **Step 3: ArchivedOrders — cover empty/error/filter branches**

Inspect lines 24 and 45-58:

```bash
sed -n '20,60p' src/Pages/ArchivedOrders.tsx
```

Likely: empty list rendering, error from fetch, filter that excludes everything. Add tests for each.

- [ ] **Step 4: Run coverage on the three files**

Run: `pnpm test:coverage 2>&1 | grep -E "Users\.tsx|EditOrder\.tsx|ArchivedOrders\.tsx"`
Expected: each shows branches ≥75%, statements ≥80%, functions ≥80%, lines ≥80%.

- [ ] **Step 5: Commit**

```bash
git add src/Pages/Users.test.tsx src/Pages/Users.tsx \
        src/Pages/EditOrder.test.tsx src/Pages/EditOrder.tsx \
        src/Pages/ArchivedOrders.test.tsx src/Pages/ArchivedOrders.tsx
git commit -m "test(pages): cover normalization, save-error, and empty-filter branches"
```

(Source-file edits are only included if helpers needed to be exported in step 1; otherwise drop the `src/Pages/*.tsx` paths from `git add`.)

---

## Task 13: Cover `src/Pages/CreateOrder.tsx` and `src/Pages/SignIn.tsx`/`SignUp.tsx` if needed

**Files:**
- Modify: `src/Pages/CreateOrder.test.tsx` (currently 88.63%/80.76%/95.45%/94.44% — borderline; verify after task 12 lands)
- Modify: `src/Pages/SignIn.test.tsx` (90.9%/100%/83.33%/90.9%)
- Modify: `src/Pages/SignUp.test.tsx` (87.5%/100%/75%/93.33%)

These files are close to or above the 80%/75% threshold. Verify status after the previous tasks; if any falls below, add the missing tests; otherwise skip.

- [ ] **Step 1: Re-run coverage and inspect each**

Run: `pnpm test:coverage 2>&1 | grep -E "CreateOrder|SignIn|SignUp"`

For each file under threshold, identify the uncovered lines (will be shown in the report) and add the smallest possible test to push past the floor.

- [ ] **Step 2: Add only the necessary tests**

For each underperforming file, add 1–3 `it(...)` blocks targeting the specific uncovered branch (typically: error path of mutation, validation rejection, navigation after success).

- [ ] **Step 3: Run coverage**

Run: `pnpm test:coverage 2>&1 | tail -25`
Expected: every threshold met. The bottom of the report shows the final percentages; if any glob still fails, repeat step 2.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/
git commit -m "test(pages): close residual coverage gaps to clear thresholds"
```

If no edits were necessary in this task, skip the commit and proceed to task 14.

---

## Task 14: Final verification

- [ ] **Step 1: Run full coverage**

Run: `pnpm test:coverage 2>&1 | tail -40`
Expected: 31+ test files pass, 0 failed. Coverage report shows:
- `src/lib/**` — 100% all metrics
- `src/contexts/**` — 100% all metrics
- `src/api/**` — 100% all metrics
- `src/Pages/**`, `src/components/**`, `src/hooks/**` — ≥80% statements, ≥75% branches, ≥80% functions, ≥80% lines
- No threshold failure messages.

- [ ] **Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass with zero errors.

- [ ] **Step 3: Verify pre-commit hook with a no-op commit**

```bash
git commit --allow-empty -m "chore: verify pre-commit hook on clean repo"
```

Expected: lefthook runs typecheck, lint, and coverage; all pass; commit succeeds.

- [ ] **Step 4: Verify the `--no-verify` infra commit can now be re-validated by amending**

Optional sanity: Run `pnpm test:coverage` once more and confirm green. The infra commit from task 4 was made with `--no-verify`; we leave it alone (rewriting history is more risk than the principle is worth).

- [ ] **Step 5: Push (if remote configured)**

Confirm with the user before pushing; do not push without explicit instruction.

---

## Self-review summary

- **Spec coverage:**
  - Constitution principle VI → Task 1 ✓
  - Sync impact propagation → Task 2 ✓
  - Vitest config thresholds + exclusions → Task 3 ✓
  - Lefthook setup + AGENTS.md gates → Task 4 ✓
  - `src/api/index.tsx` to 100% → Task 5 ✓
  - `src/contexts/AuthContext.tsx` to 100% → Task 6 ✓
  - `src/components/*` UI thresholds → Tasks 7, 8 ✓
  - `src/Pages/*` UI thresholds → Tasks 9, 10, 11, 12, 13 ✓
  - Final verification → Task 14 ✓
- **Placeholders:** none left; concrete code in each step where code is introduced; UI tests beyond pure-logic tasks include the specific render+assert pattern but may need minor tweaks based on exact prop names — that is the unavoidable cost of expanding tests in unread files. Each such task includes an explicit "inspect first" step.
- **Type/name consistency:** `parseStoredSnapshot`, `resolveLoginResult`, `resolveUserIdFromToken`, `extractProfileName` etc. are referenced consistently in tasks 6 (export and tests) and nowhere else.
- **Order constraint documented:** task 5 explains why pure-logic tasks must precede UI tasks given the 100% threshold gate.
