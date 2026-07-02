-- Favourite Films Log — RPC functions for Type deletion flows
-- See docs/features/favourite-films-log/03-brief.md Section 2 for the source spec.

-- ---------------------------------------------------------------------------
-- delete_type_if_unused
-- ---------------------------------------------------------------------------
-- Deletes a film_types row outright. Intended for the "Type not in use"
-- path (AC 21). No pre-check for usage is performed here beyond the
-- database constraint itself: if the type is actually in use, the
-- films.type_id FK (ON DELETE RESTRICT) will raise a foreign_key_violation
-- (23503), which the caller should treat as "type is in use after all"
-- (brief Risk 5 — stale pre-check race, not expected in single-user use).
create or replace function public.delete_type_if_unused(type_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.film_types
    where id = delete_type_if_unused.type_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- reassign_and_delete_type
-- ---------------------------------------------------------------------------
-- Reassigns every film currently pointing at from_type_id to point at
-- to_type_id, then deletes from_type_id — atomically, in a single
-- transaction (a function body runs in an implicit transaction; if the
-- delete fails, e.g. because to_type_id doesn't exist or from_type_id no
-- longer exists, the reassignment is rolled back too).
create or replace function public.reassign_and_delete_type(
    from_type_id uuid,
    to_type_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if from_type_id is null or to_type_id is null then
        raise exception 'from_type_id and to_type_id must both be provided';
    end if;

    if from_type_id = to_type_id then
        raise exception 'from_type_id and to_type_id must be different';
    end if;

    if not exists (select 1 from public.film_types where id = to_type_id) then
        raise exception 'target type % does not exist', to_type_id;
    end if;

    update public.films
    set type_id = reassign_and_delete_type.to_type_id
    where type_id = reassign_and_delete_type.from_type_id;

    delete from public.film_types
    where id = reassign_and_delete_type.from_type_id;
end;
$$;

-- Grant execute to the anon role (matches the table-level RLS posture:
-- single-user personal tool, no auth — see 0001_init.sql).
grant execute on function public.delete_type_if_unused(uuid) to anon;
grant execute on function public.reassign_and_delete_type(uuid, uuid) to anon;
