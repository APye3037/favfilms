# Backend Handoff — Favourite Films Log

**Stage:** 4. backend-builder
**Related:** [03-brief.md](03-brief.md)

## Files created
- `supabase/migrations/0001_init.sql` — `film_types`, `films` tables, constraints, unique indexes (`lower(trim(...))`), `updated_at` triggers, RLS enabled with permissive `anon` policy.
- `supabase/migrations/0002_rpc_functions.sql` — `delete_type_if_unused(type_id uuid)`, `reassign_and_delete_type(from_type_id uuid, to_type_id uuid)`, both `security definer`, execute granted to `anon`.
- `supabase/config.toml` — minimal Supabase CLI project config.
- `.gitignore` (repo root, newly created) — ignores `.env`, `.env.local`, `.env.*.local`, `node_modules/`, build output, `.supabase/`, OS/editor cruft.
- `.env.example` (repo root) — placeholder `VITE_SUPABASE_URL=` / `VITE_SUPABASE_ANON_KEY=` only, no real values.
- `CLAUDE.md` updated — Project specifics section filled in (backend folder `/supabase`, frontend folder `/web`, test/typecheck/lint commands, stack description).

## Data-access contract for frontend-builder

**Tables** (RLS: `anon` has full read/write via permissive policy):
- `film_types(id uuid, name text, created_at timestamptz, updated_at timestamptz)` — unique on `lower(trim(name))`, non-blank, ≤200 chars.
- `films(id uuid, title text, type_id uuid FK→film_types.id ON DELETE RESTRICT, created_at, updated_at)` — unique on `lower(trim(title))`, non-blank, ≤200 chars. Join: `select('*, type:film_types(id, name)')`.
- Uniqueness violations surface as Postgres error code `23505`.

**RPCs** (`supabase.rpc(...)`):
- `delete_type_if_unused(type_id uuid) returns void` — plain delete; if actually in use, FK raises `23503` (defensive fallback, not expected in normal flow).
- `reassign_and_delete_type(from_type_id uuid, to_type_id uuid) returns void` — atomic reassign+delete; raises a plain exception (check `error.message`) if either id is null, equal, or `to_type_id` doesn't exist.

## Manual steps still required (not automatable by an agent without credentials)
1. **Apply the migrations to the live Supabase project** (`https://ntnqjuyumbwugykhdbwa.supabase.co`) — run `0001_init.sql` then `0002_rpc_functions.sql` via the Supabase SQL editor, or `supabase link --project-ref ntnqjuyumbwugykhdbwa && supabase db push` once an access token is available. **The app will not work until this is done.**
2. Create `.env.local` (gitignored) in `/web` once it exists, with the real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

## Deviations from brief
None.
