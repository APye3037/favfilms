# Frontend Handoff — Favourite Films Log

**Stage:** 5. frontend-builder (+ orchestrator verification)
**Related:** [03-brief.md](03-brief.md), [04-backend-handoff.md](04-backend-handoff.md)

## Files created
Full Vite + React + TypeScript SPA under `web/`: scaffold config, `src/lib/{supabaseClient,validation}.ts`, `src/types/domain.ts`, hooks (`useFilms`, `useTypes`, `useDashboardStats`, `useFilmMutations`, `useTypeMutations`), components (`FilmForm`, `FilmTable`, `TypeForm`, `TypeList`, `ReassignTypeDialog`, `FilmsByTypeChart`, `StatCard`), pages (`Dashboard`, `Films`, `Types`), and matching test files.

## Environment blocker found and resolved
Node.js/npm were not installed on this machine at all — frontend-builder could scaffold files but couldn't run `npm install`, typecheck, lint, tests, or a build. The orchestrator installed Node.js LTS (via winget) and ran all verification steps directly:
- `npm install` — succeeded (356 packages).
- `npm run typecheck` — clean.
- `npm run lint` — found one real issue (unused `eslint-disable` directive in `supabaseClient.ts`) — fixed.
- `npm test` — found one real issue: `supabaseClient.ts` called `createClient` at module load with an empty string when env vars are missing, which throws synchronously and crashed any test importing hook modules before `.env.local` existed. Fixed by falling back to a syntactically valid placeholder URL/key so construction always succeeds; real requests simply fail until real credentials are set. After the fix: 28/28 tests pass.
- `npm run build` — succeeds (one non-blocking bundle-size warning, acceptable for this app's scale).

## Live end-to-end verification
The Supabase migrations were applied to the live project (see below), `.env.local` was populated with real credentials, and the app was driven with a headless Playwright browser through the full flow:
1. Dashboard empty state (0 films, "no films yet" message) — correct, no error.
2. Added a Type ("Sci-Fi"), added a Film ("Dune") with that type — both saved and appeared.
3. Clicked the Type link on the films table — correctly navigated to `/films?type=<id>` filtered to just that film.
4. Dashboard updated to show 1 total film and a bar chart with "Sci-Fi: 1".
5. Attempted to add a duplicate film title — correctly rejected with "A film with that title already exists."
6. Added a second type ("Drama"), attempted to delete "Sci-Fi" (in use) — reassignment dialog appeared listing only the other type ("Drama").
7. Cancelled the dialog — verified nothing changed (both types still present).
8. Re-attempted, chose "Drama", confirmed — "Sci-Fi" was deleted and "Dune" now shows "Drama" as its type (atomic reassign-then-delete confirmed working).
9. No console errors observed throughout (aside from the expected network-level 409 log on the duplicate-title attempt, which the app handled and displayed as a friendly message).

Test data was cleaned from the live database afterward so the app starts empty for the user.

## Migrations applied to live project
`supabase/migrations/0001_init.sql` and `0002_rpc_functions.sql` were applied to `https://ntnqjuyumbwugykhdbwa.supabase.co` via a direct Postgres connection (through the session pooler, since the direct `db.*.supabase.co` host doesn't resolve over IPv4 on this network). Verified live: both tables, both RPC functions, and both RLS policies exist.

## How to run locally
```
cd web
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm test
npm run build
```
`web/.env.local` already exists (gitignored) with real Supabase credentials — no setup needed to run against live data.

## Deviations from the brief
- The two fixes above (unused lint directive, Supabase client construction guard) were made by the orchestrator after frontend-builder's handoff, since only the orchestrator had a working Node.js environment to surface them.

## Outstanding
None — the app is fully wired to the live database and has been manually verified working end-to-end. Formal acceptance testing against the story is next (test-verifier).
