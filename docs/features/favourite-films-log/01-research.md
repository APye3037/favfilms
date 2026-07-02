# Codebase Research — Favourite Films Log

**Stage:** 1. codebase-researcher
**Feature request:**
> I want a simple app where I can log my favourite films. A dashboard landing page with summary info about the films, and a detailed page with a table (Film, Type, Name) where Type links to a lookup table I can manage. Data stored in Supabase.

## Summary

This is a **greenfield project**. No framework, application code, or Supabase configuration exists yet — only the agent-pipeline scaffolding (`CLAUDE.md`, `.claude/agents/`).

## Findings

### 1. Existing scaffolding
No `package.json` or any other manifest, no application folders (`src/`, `app/`, `pages/`, `components/`, `server/`, `api/`, `web/`), no `supabase/` directory, no `.env`, no lockfiles, no test/lint/CI config anywhere in the repo. Confirmed via full-tree glob.

`CLAUDE.md`'s "Project specifics" section (backend/frontend folders, test/typecheck/lint commands, stack) is still unfilled placeholder text (`<e.g. ...>`).

### 2. Existing patterns
None — no prior pages, components, data access, or Supabase integration to reuse.

### 3. Existing films/dashboard/lookup code
None found.

### 4. Conventions to follow
Only process conventions exist so far (from `CLAUDE.md`): the pipeline order and human-approval gates, backend/frontend builder folder isolation, and the requirement that every build agent runs typecheck/lint/tests before finishing. None of the actual commands are defined yet — this must come out of the technical brief.

### 5. Risks / open questions raised for story-writer and spec-writer
- No framework or language chosen yet.
- No Supabase project/credentials exist — provisioning is new infrastructure.
- `CLAUDE.md` placeholders block builders until filled in (expected to be resolved by the brief).
- Ambiguity in the original request: meaning of "Name" column, definition of "summary info," and what "manage" means for the Type lookup table — all resolved in the user story (see [02-story.md](02-story.md)).
- Single-user vs multi-user or auth was unstated in the request.

## Tests / prior art
None — no test suite or similar feature exists in this repository.
