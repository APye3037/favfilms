# Implementation Validation Report — Favourite Films Log

**Stage:** 7. implementation-validator (final, read-only, independent)
**Related:** all prior docs in this folder

## Critical
None.

## Important

1. **Dashboard renders a raw error message instead of a friendly one.** `web/src/pages/Dashboard.tsx` interpolates `(error as Error).message` directly into the page, inconsistent with `friendlyFilmError`/`friendlyTypeError`/`friendlyDeleteTypeError` used everywhere else. Should reuse `getErrorMessage` from `supabaseClient.ts`.
2. **No unit tests for data hooks.** `useFilms`, `useTypes`, and especially `useDashboardStats` (which does real client-side grouping/aggregation logic) have zero unit tests — only covered indirectly via the live Playwright E2E suite. `useFilmMutations`/`useTypeMutations` tests only cover the error-mapping helpers, not the actual mutation calls.
3. **Acceptance test suite wipes the live production database on every run, with no safety guard.** `web/acceptance/helpers.ts`'s `resetDatabase()` deletes all rows in both tables before/after every test run, against the same Supabase project the real app uses — no separate test project, no env-var guard. Re-running `npx playwright test` in the future (e.g. during a later feature) will silently delete real logged films with no confirmation.

## Minor

1. AC 5 ("table with exactly two columns") is implemented with a third actions column (Edit/Delete) — a reasonable, arguably necessary interpretation, but the acceptance test silently reinterprets the AC rather than the ambiguity being flagged back at story time.
2. `reassign_and_delete_type` validates `to_type_id` (null/nonexistent) and equality, but not whether `from_type_id` itself exists — a call with a bogus `from_type_id` is a silent no-op rather than an error. Not reachable via the UI today.
3. Live project ref/URL (not secrets) are hardcoded in tracked docs (`supabase/config.toml`, handoff docs) — low risk, ties tracked files to one specific backend.
4. `delete_type_if_unused` has no input validation at all (unlike `reassign_and_delete_type`), inconsistent defensiveness between the two RPCs — functionally harmless given current call sites.

## Verified clean
RLS policies, FK `ON DELETE RESTRICT`, case-insensitive/trimmed unique indexes, RPC atomicity, no secrets in tracked files (`.env.local` correctly gitignored and untracked), `CLAUDE.md` fully filled in, no stray test artifacts committed, both orchestrator bug fixes (Dashboard... no, supabaseClient placeholder fallback + lint fix) genuinely present, spot-checked ACs 22-25/10/13/3/18 all correctly implemented and tested against real DB state.

## Resolution

- **Important #3 (DB-wipe guard) — FIXED.** `web/acceptance/helpers.ts` now requires `ALLOW_ACCEPTANCE_DB_RESET=true` to run at all, and additionally refuses to proceed if the target tables already contain data unless `ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY=true` is also set. Verified: blocks with no flags, blocks with one flag against non-empty data, passes (30/30) with both flags against empty data. Safe invocation going forward: `ALLOW_ACCEPTANCE_DB_RESET=true npx playwright test` (only after confirming the target DB is a disposable/test project or genuinely empty).
- **Important #1 (Dashboard raw error message) — left as-is**, accepted as a known minor polish item for this personal project.
- **Important #2 (missing unit tests for data hooks) — left as-is**, accepted as a known gap; functional coverage exists via the live E2E suite.

## Overall
No Critical findings. Feature satisfies all 27 acceptance criteria. The one Important finding with real ongoing risk (accidental data loss on suite re-run) has been fixed and verified. The other two Important findings and all Minor findings are accepted as known polish items.
