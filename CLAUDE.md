# Software factory — project conventions

This repo uses a chain of specialised subagents (see `.claude/agents/`). The rules
below apply to ALL development work, whether run via `/feature` or by hand.

## The pipeline (never skip a step)
1. **codebase-researcher** — runs first on every feature or bug, before design or code.
2. **story-writer** — defines the user story.  → **HUMAN GATE 1**: you approve the story.
3. **spec-writer** — writes the technical brief.  → **HUMAN GATE 2**: you approve the brief.
4. **backend-builder** — backend only.
5. **frontend-builder** — frontend only; consumes the backend's API contract.
6. **test-verifier** — acceptance tests against the story.
7. **implementation-validator** — independent, read-only review.

## Hard rules
- Never write or edit application code until BOTH gates are approved. If I haven't said
  "approved", stop and wait.
- The planning and review agents (researcher, story-writer, spec-writer, validator) are
  read-only by design. Do not give them edit power.
- Backend and frontend builders stay in their own folders and never touch each other's.
- Every build agent runs typecheck, lint, and tests before finishing.

## Project specifics
- Backend folders:   `/supabase` (SQL migrations + Postgres RPC functions only, no app server)
- Frontend folders:  `/web`
- Test command:      `npm --prefix web test`
- Typecheck command: `npm --prefix web run typecheck`
- Lint command:      `npm --prefix web run lint`
- Stack & key conventions: React + Vite + TypeScript SPA; Supabase (Postgres) as sole datastore, accessed directly from the browser via `@supabase/supabase-js` with the anon key (no backend server); TanStack Query for data fetching/cache invalidation; Recharts for charts; Vitest + React Testing Library for tests; ESLint + `tsc --noEmit`; multi-step/transactional mutations implemented as Postgres RPC functions rather than sequential client calls.
