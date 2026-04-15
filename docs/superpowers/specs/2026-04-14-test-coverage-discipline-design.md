# Test Coverage Discipline — Design

**Date**: 2026-04-14
**Status**: Approved (brainstorming)
**Workflow**: speckit (constitution → spec → plan → tasks → implement)

## Goal

Establish test coverage as a non-negotiable engineering discipline in the Delivery Pizza repository. Add a constitutional principle, configure Vitest thresholds, enforce via pre-commit hook, and write missing tests to bring the codebase into compliance.

## Background

Current coverage (baseline `pnpm test:coverage`):
- Statements: **92.17%** (719/780)
- Branches: **79.42%** (390/491)
- Functions: **94.55%** (243/257)
- Lines: **93.63%** (677/723)

All `src/**` files already have at least one test file. Pure logic modules (`src/lib`, `src/hooks`) are already at 100%. The gap is concentrated in UI branches and a few specific lines in `src/api/index.tsx` and `src/contexts/AuthContext.tsx`.

## Principle (constitutional)

A new principle **VI. Test Coverage Discipline** will be added to `.specify/memory/constitution.md` via the `speckit-constitution` skill. Version bump: **1.0.0 → 1.1.0** (MINOR — new principle).

### Principle text (draft)

> ### VI. Test Coverage Discipline
> Pure-logic modules — `src/lib/`, `src/contexts/`, `src/api/` — MUST maintain
> 100% coverage in statements, branches, functions, and lines. UI modules —
> `src/Pages/`, `src/components/` (excluding `ui/`), `src/hooks/` — MUST maintain
> at least 80% statements, 75% branches, 80% functions, and 80% lines.
> Generated UI primitives (`src/components/ui/*`), entrypoints (`main.tsx`,
> `App.tsx`, `routes.tsx`), test setup (`src/test/**`), and test files
> themselves are excluded. Every commit MUST pass `pnpm test:coverage`,
> enforced by a pre-commit hook. Rationale: the operations console is
> business-critical and untested branches in pure logic produce silent
> regressions; pragmatic UI thresholds keep the bar achievable without
> rewarding scaffolding tests.

### Sync impact (anticipated)

| Artifact | Update |
|---|---|
| `.specify/templates/plan-template.md` | Add coverage check to Constitution Check section if present |
| `.specify/templates/tasks-template.md` | Add "testing discipline" task category if applicable |
| `AGENTS.md` | Add `pnpm test:coverage` to "Gates mínimos de entrega"; document lefthook behavior |

## Vitest configuration

Edit `vitest.config.ts` to declare per-directory thresholds and exclusions:

```ts
test: {
  // ...existing config
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/components/ui/**',
      'src/main.tsx',
      'src/App.tsx',
      'src/routes.tsx',
      'src/test/**',
      '**/*.test.{ts,tsx}',
      '**/*.d.ts',
    ],
    thresholds: {
      'src/lib/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
      'src/contexts/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
      'src/api/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
      'src/Pages/**': { statements: 80, branches: 75, functions: 80, lines: 80 },
      'src/components/**': { statements: 80, branches: 75, functions: 80, lines: 80 },
      'src/hooks/**': { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
}
```

Per-glob thresholds are supported in Vitest 4. The build of `pnpm test:coverage` fails if any glob falls below its threshold.

## Pre-commit enforcement (lefthook)

1. `pnpm add -D lefthook`
2. Create `lefthook.yml` at the repository root:

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

3. Add `prepare` script to `package.json`: `"prepare": "lefthook install"`. This wires lefthook on `pnpm install` for any contributor.

4. Document in `AGENTS.md` that lefthook is automatic and how to bypass in emergencies (`git commit --no-verify` is discouraged, never used in normal workflow).

## Test work to reach thresholds

### Frente 1 — Pure logic (target 100%)

| File | Gap | Likely cause |
|---|---|---|
| `src/api/index.tsx` | line 34 | uncovered branch in error interceptor (success path or non-string error) |
| `src/contexts/AuthContext.tsx` | lines 109, 128, 161, 202 + ~18% branches | edge cases in JWT parsing, fallback display name resolution, logout side effects |

### Frente 2 — UI (target 80%+ branches)

| File | Branches now | Uncovered lines | Approach |
|---|---|---|---|
| `Home.tsx` | 56% | 75-76 | error-state and empty-state rendering paths in fetch |
| `EditUser.tsx` | 63% | 89, 106 | form-validation/error branches in update mutation |
| `Analytics.tsx` | 67% | 88, 212-245 | empty/error states; chart rendering branches |
| `Users.tsx` | 73% | 22, 40 | payload normalization (`extractUsersArray`, `normalizeUser`) edge cases |
| `EditOrder.tsx` | 72% | 107, 135-136, 183 | save-error path, status transitions, missing product handling |
| `ArchivedOrders.tsx` | 71% | 24, 45-58 | empty-state, error rendering, archive filter |
| `OrderCard.tsx` | 85% | 77-79, 88, 92-93 | SLA color thresholds (yellow/red), cancel/finish edge cases |
| `theme-provider.tsx` | 89% | 55, 67, 77, 157 | system-theme resolution, storage event sync, keyboard `d` toggle |

For each file: read the source around the uncovered lines, identify the trigger (input data shape, error condition, transition), and add the corresponding test case to the existing `*.test.tsx` file. No new test files are expected.

## Constraints

- Use existing Vitest + Testing Library + happy-dom stack — no new test runners or mocking libraries.
- Follow patterns established in current tests (e.g., `SignIn.test.tsx` for pages, `AuthContext.test.ts` for pure logic).
- Do not test against the real backend; mock `axios` calls or use the `auth:invalid-token` event pattern already in place.
- Preserve all existing tests; only add new cases or extend existing `describe` blocks.
- Do not introduce `c8` or `nyc` configuration; use Vitest's built-in v8 provider.

## Workflow (speckit)

1. **constitution** (this design): use `speckit-constitution` skill to bump version 1.0.0 → 1.1.0 with principle VI; produce sync impact report.
2. **specify**: create feature spec under `specs/NNN-test-coverage-discipline/spec.md` describing requirements (thresholds, hook, exclusions, target files).
3. **plan**: produce `plan.md` with implementation phases (config → hook → frente 1 → frente 2).
4. **tasks**: break plan into discrete tasks (one per file, plus config/hook tasks).
5. **implement**: execute tasks one-by-one; each task ends with `pnpm test:coverage` passing.

## Acceptance criteria

- `.specify/memory/constitution.md` at version 1.1.0 with principle VI documented and sync impact report.
- `vitest.config.ts` declares thresholds and exclusions as specified.
- `lefthook.yml` exists; `pnpm install` triggers `lefthook install`.
- `AGENTS.md` updated with new gate and hook documentation.
- `pnpm test:coverage` passes with all thresholds met (100% pure logic, ≥80% UI).
- All preexisting tests continue to pass.

## Out of scope

- Mutation testing.
- E2E / browser tests (`@vitest/browser` is installed but unused).
- Coverage on `src/components/ui/*`, entrypoints, or backend.
- Performance budgets, accessibility checks, or other quality gates.
