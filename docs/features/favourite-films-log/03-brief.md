# Technical Brief — Favourite Films Log

**Stage:** 3. spec-writer
**Status:** Pending approval (Human Gate 2)
**Related:** [01-research.md](01-research.md), [02-story.md](02-story.md)

## 0. Stack decision

Proposed: **frontend-only SPA calling Supabase directly** — no custom backend server.

Rationale: single user, no auth, simple CRUD over two small tables. Supabase's JS client (PostgREST) covers this without a bespoke API layer. The two multi-step/transactional operations (delete-with-reassignment) are implemented as Postgres RPC functions for atomicity rather than sequential client calls.

Consequence: **no backend-builder application code** for this feature — "backend" work is Supabase SQL migrations + RPC functions only.

Proposed stack:
- React 18 + TypeScript + Vite (SPA)
- `@supabase/supabase-js` v2, browser-side, anon key
- TanStack Query for data fetching/cache invalidation
- Recharts for the dashboard chart
- React Router (Dashboard `/`, Films `/films` + `/films?type=<id>`, Types `/types`)
- Vitest + React Testing Library; ESLint + `tsc --noEmit`

### Proposed folder layout
```
/supabase/migrations   -- SQL: schema, constraints, RPC functions
/web/src
  /pages        Dashboard.tsx, Films.tsx, Types.tsx
  /components   FilmForm, FilmTable, TypeForm, TypeList, ReassignTypeDialog, FilmsByTypeChart, StatCard
  /hooks        useFilms, useTypes, useDashboardStats (+ mutation hooks)
  /lib          supabaseClient.ts, validation.ts
  /types        domain.ts
```

### Proposed CLAUDE.md fills
- Backend folders: `/supabase` (SQL + RPC only, no app server)
- Frontend folders: `/web`
- Test command: `npm --prefix web test`
- Typecheck command: `npm --prefix web run typecheck`
- Lint command: `npm --prefix web run lint`
- Stack: React + Vite + TS SPA; Supabase (Postgres) as sole datastore; no backend server; TanStack Query; Recharts; Vitest + RTL; multi-step mutations via Postgres RPC.

## 1. Data model (Supabase / Postgres)

**`film_types`**: `id uuid PK`, `name text NOT NULL`, `created_at`/`updated_at timestamptz`.
- Unique index on `lower(trim(name))` (case-insensitive, whitespace-trimmed uniqueness)
- `check (length(trim(name)) > 0)`, `check (char_length(name) <= 200)`

**`films`**: `id uuid PK`, `title text NOT NULL`, `type_id uuid NOT NULL FK -> film_types(id) ON DELETE RESTRICT`, `created_at`/`updated_at timestamptz`.
- Unique index on `lower(trim(title))`
- `check (length(trim(title)) > 0)`, `check (char_length(title) <= 200)`
- `ON DELETE RESTRICT` on the FK is the DB-level backstop against orphaned references / silent cascade (AC 25).

No timezone-sensitive UI in this feature; `timestamptz` used as correct default regardless.

**RLS**: proposed enabled with a permissive `using (true)` policy for `anon` (rather than disabling RLS outright) — functionally open either way given no auth, but more auditable. **Flagged as a security posture decision requiring explicit sign-off**: the anon key (unavoidably shipped in the client bundle) will have full read/write access to both tables from anywhere.

## 2. Key flows

**Add/Edit film**: client validates trim/length/type-selected, calls Supabase insert/update, Postgres unique-violation (`23505`) is the authoritative duplicate check mapped to a friendly message, cache invalidated on success.

**Delete Type**:
1. Check usage count.
2. Unused → RPC `delete_type_if_unused(type_id)`.
3. In use, no other type exists → blocked, no call made.
4. In use, user cancels → no call made, nothing changes.
5. In use, user picks a target → RPC `reassign_and_delete_type(from_type_id, to_type_id)` does the reassignment + delete in one transaction.

## 3. Data-access contract (frontend-builder codes against this)

Tables via `supabase-js .from(...)`: `film_types` (select/insert/update/delete), `films` (select with `type:film_types(id, name)` embed, insert/update/delete).

RPCs (in `/supabase/migrations`):
```sql
reassign_and_delete_type(from_type_id uuid, to_type_id uuid) returns void
delete_type_if_unused(type_id uuid) returns void
```

Types (`/web/src/types/domain.ts`):
```ts
export interface FilmType { id: string; name: string; }
export interface Film { id: string; title: string; type_id: string; type?: FilmType; }
```

Dashboard stats: client-side aggregation over all films (simplest option; no pagination/scale requirement in scope — flagged as a decision, not an oversight).

## 4. Frontend changes
See folder layout above — pages, components, and hooks as listed. Shared trim/length validation used identically for Film title and Type name.

## 5. Tests required
Full list of data-layer (constraint/RPC) and frontend (per-AC) test cases specified in the brief — see acceptance criteria 1–27 in [02-story.md](02-story.md); every AC has at least one corresponding test case (uniqueness, blank/length validation, reassignment flow incl. cancel and no-alternative-blocked, dashboard empty state, Type-link filtering, chart data correctness).

## 6. Files that will change (all net-new)
- `supabase/migrations/0001_init.sql`, `0002_rpc_functions.sql`, `supabase/config.toml`
- `web/package.json`, `vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`, `.env.example`
- `web/src/lib/supabaseClient.ts`, `validation.ts`
- `web/src/types/domain.ts`
- `web/src/hooks/useFilms.ts`, `useTypes.ts`, `useDashboardStats.ts`
- `web/src/pages/Dashboard.tsx`, `Films.tsx`, `Types.tsx`
- `web/src/components/FilmForm.tsx`, `FilmTable.tsx`, `TypeForm.tsx`, `TypeList.tsx`, `ReassignTypeDialog.tsx`, `FilmsByTypeChart.tsx`, `StatCard.tsx`
- Matching `*.test.tsx` files
- `CLAUDE.md` updated with the Section 0 values (only after approval)

## 7. Risks and open questions

1. **No Supabase project exists yet.** Blocked until a project is provisioned and `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are supplied. Who provisions this, and when?
2. **RLS proposed wide-open** (anon = full access) — acceptable for a personal, non-publicly-exposed tool; revisit if ever deployed publicly.
3. **Backend-builder owns `/supabase/migrations`** even though it's SQL, not an app server — proposed so frontend-builder doesn't touch schema/RPC.
4. **Client-side dashboard aggregation** fetches all films every load — fine at this scale, flagged as a conscious choice.
5. **`delete_type_if_unused` race semantics** — proposed to just attempt the delete and let the FK constraint raise if the pre-check was stale (won't happen in a single-user tool, but documented rather than assumed).
6. Chart type/styling is an implementation detail, not covered by this brief.
7. **No test/typecheck/lint tooling exists yet** — must be scaffolded from scratch as the first build step.
8. Timezone handling: not applicable, confirmed explicitly.
9. Tenant isolation: not applicable, single-user confirmed explicitly.
