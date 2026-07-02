# Acceptance Test Report — Favourite Films Log

**Stage:** 6. test-verifier
**Related:** [02-story.md](02-story.md), [05-frontend-handoff.md](05-frontend-handoff.md)

**Scope:** Black-box acceptance testing against the live Supabase project, driven through a real browser (Playwright/Chromium) hitting the actual Vite dev server — not the builders' mocked unit tests.

**Test artifacts:** `web/acceptance/favourite-films-log.pw.ts` (30 tests), `web/acceptance/helpers.ts` (DB setup/teardown), `web/playwright.config.ts`. `@playwright/test` added as a devDependency. To re-run: `cd web && npx playwright test`.

## Result: 30/30 tests pass. All 27 acceptance criteria PASS.

| AC | Description | Result |
|----|---|---|
| 1 | Total film count on dashboard | PASS |
| 2 | Chart broken down by Type | PASS |
| 3 | Empty/zero state, no error | PASS |
| 4 | Chart reflects current data on each load | PASS |
| 5 | Table with exactly Film + Type columns | PASS |
| 6 | Type shown as a link | PASS |
| 7 | Clicking Type link filters films by that type | PASS |
| 8 | Add film via Film value + selected Type | PASS |
| 9 | Both fields required | PASS |
| 10 | Duplicate Film title rejected with message | PASS |
| 11 | Film max 200 chars | PASS |
| 12 | Edit film title/type | PASS |
| 13 | Edit-to-duplicate rejected | PASS |
| 14 | Delete a film | PASS |
| 15 | View list of Types | PASS |
| 16 | Add a new Type | PASS |
| 17 | Type name required | PASS |
| 18 | Type name max 200 chars | PASS |
| 19 | Type names unique | PASS |
| 20 | Editing Type name reflected everywhere | PASS |
| 21 | Delete unused Type, no further prompts | PASS |
| 22 | Deleting in-use Type offers reassignment | PASS |
| 23 | Completing reassignment updates films, then deletes | PASS |
| 24 | Cancelling reassignment aborts, nothing changes | PASS |
| 25 | No orphaned refs / no silent cascade (verified at DB level directly) | PASS |
| 26 | No login/auth on any route | PASS |
| 27 | Data persists in Supabase across sessions | PASS |

**Edge cases covered, all PASS:** empty lookup table when adding a film; deleting the only/in-use Type with no alternative (blocked with explanatory message); case-insensitive/whitespace-trimmed uniqueness for Film and Type; whitespace-only input rejected; 200-char boundary (200 accepted, 201 rejected); reassignment correctness with multiple films.

**Cannot-cover:** none.

**Sanity check:** a deliberately-wrong assertion was inserted and confirmed to fail loudly, then reverted — the suite is not vacuously green.

**Regression check:** typecheck, lint, and the existing 28 unit tests all still pass.

**Cleanup:** `films` and `film_types` tables confirmed empty in the live database after the run.

**Outcome:** No bugs found. Nothing routed back to backend-builder or frontend-builder.
