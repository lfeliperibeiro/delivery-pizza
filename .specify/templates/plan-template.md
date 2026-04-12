# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Summarize the user-visible change, the affected routes/entities/endpoints, and
the implementation approach that preserves the project constitution.]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9 + React 19  
**Primary Dependencies**: React Router v7, Axios, Tailwind CSS 4, shadcn/ui, Sonner, Recharts (if analytics is affected)  
**Storage**: Browser `localStorage` for `access_token`; backend-managed persistence outside this repo  
**Testing/Validation**: `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus manual route and API-flow validation  
**Target Platform**: Browser-based SPA for internal delivery operations  
**Project Type**: Single-project frontend web application  
**Performance Goals**: Preserve responsive operator workflows; avoid regressions in route load and live order management  
**Constraints**: Must honor `VITE_API`, protected routing, Brazilian localization, and current shared frontend stack  
**Scale/Scope**: Routes under `src/Pages`, shared components under `src/components`, auth/navigation in `src/layout.tsx` and `src/contexts/AuthContext.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Authentication and protected navigation are preserved, or the plan explicitly
  documents how auth behavior changes.
- Backend endpoints, payload shapes, and fallback/normalization rules are
  identified for every affected integration.
- Loading, empty, success, and error states are defined for each affected user
  workflow.
- `pt-BR` currency/date/status semantics remain correct where orders or
  analytics are touched.
- The change stays within the current React 19 + TypeScript + Vite + Tailwind +
  shared-UI architecture, or the deviation is justified in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── Pages/             # Route-level screens
├── components/
│   ├── ui/            # Shared UI primitives
│   └── *.tsx          # Business components
├── contexts/          # Global app state such as authentication
├── hooks/             # Shared hooks
├── lib/               # Utilities such as datetime and class merging
├── api/               # Shared Axios client and interceptors
├── assets/            # Static assets
├── App.tsx            # App root and invalid-token handling
├── layout.tsx         # Protected shell
└── routes.tsx         # Router definitions
```

**Structure Decision**: Use the existing single-project frontend structure.
Place route behavior in `src/Pages`, shared business UI in `src/components`,
and cross-cutting behavior in `src/contexts`, `src/lib`, and `src/api`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
