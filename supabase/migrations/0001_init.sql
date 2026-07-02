-- Favourite Films Log — initial schema
-- Tables: film_types, films
-- See docs/features/favourite-films-log/03-brief.md Section 1 for the source spec.

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- film_types
-- ---------------------------------------------------------------------------
create table if not exists public.film_types (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint film_types_name_not_blank check (length(trim(name)) > 0),
    constraint film_types_name_max_length check (char_length(name) <= 200)
);

-- Case-insensitive, whitespace-trimmed uniqueness on type name.
create unique index if not exists film_types_name_unique_idx
    on public.film_types (lower(trim(name)));

-- ---------------------------------------------------------------------------
-- films
-- ---------------------------------------------------------------------------
create table if not exists public.films (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    type_id uuid not null references public.film_types (id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint films_title_not_blank check (length(trim(title)) > 0),
    constraint films_title_max_length check (char_length(title) <= 200)
);

-- Case-insensitive, whitespace-trimmed uniqueness on film title.
create unique index if not exists films_title_unique_idx
    on public.films (lower(trim(title)));

create index if not exists films_type_id_idx
    on public.films (type_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_updated_at on public.film_types;
create trigger set_updated_at
    before update on public.film_types
    for each row
    execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.films;
create trigger set_updated_at
    before update on public.films
    for each row
    execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Single-user personal tool, no auth. RLS is enabled (rather than disabled
-- outright) for auditability, with a permissive policy granting the `anon`
-- role full access. This is a conscious security posture decision recorded
-- in brief Section 1 / Risk 2: the anon key ships in the client bundle and
-- will have full read/write access to both tables from anywhere.

alter table public.film_types enable row level security;
alter table public.films enable row level security;

drop policy if exists film_types_anon_all on public.film_types;
create policy film_types_anon_all
    on public.film_types
    for all
    to anon
    using (true)
    with check (true);

drop policy if exists films_anon_all on public.films;
create policy films_anon_all
    on public.films
    for all
    to anon
    using (true)
    with check (true);
