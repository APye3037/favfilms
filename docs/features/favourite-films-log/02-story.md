# User Story — Favourite Films Log

**Stage:** 2. story-writer
**Status:** Pending approval (Human Gate 1)
**Related:** [01-research.md](01-research.md)

## Clarifications gathered from the user

The initial story-writer draft raised open questions; these are the user's answers, folded into the story below:

1. There is no separate "Name" field — it was a duplicate of "Film". The table has only **Film** and **Type**.
2. Dashboard summary info should include a **chart broken down by Type**, in addition to total count.
3. Confirmed: **single-user, no login/auth** needed.
4. **Film values must be unique** (no duplicate film entries).
5. Field constraints: Film and Type are the only two fields, both required, max **200 characters** each (suggested default).
6. Deleting a Type in use: **offer to reassign** affected films to another existing Type (not blocked outright, not silently cascaded).
7. Clicking a Type link goes to a **filtered list of films with that type** (not directly to the type-edit screen).

Two further open questions were resolved with suggested defaults, pending final user approval:
- Deleting the only/last Type while it's in use → **blocked** (no Type to reassign to; user must create another Type first).
- Uniqueness checks for Film/Type → **case-insensitive, whitespace-trimmed**.

## User story

As a single user maintaining my personal film log, I want to record films with a type/genre, manage the list of types, and see a dashboard summary of my collection, so that I can track and understand my favourite films without needing an account or login.

## Acceptance criteria

**Dashboard (landing page)**
1. Displays total count of logged films.
2. Displays a chart breaking down film count by Type.
3. Empty/zero state for both when no films exist (no error).
4. Chart reflects current data on each load.

**Detail page — films table**
5. Table with exactly two columns: Film and Type.
6. Type value displayed as a link.
7. Clicking a Type link navigates to a filtered view showing only films with that Type.
8. Add a new film via Film value + selected Type.
9. Both fields required to save.
10. Film value must be unique across all films; duplicate rejected with a message.
11. Film values max 200 characters.
12. Edit an existing film's Film value and/or Type.
13. Editing to a duplicate Film value is rejected (uniqueness applies on edit too).
14. Delete a film entry.

**Type lookup management**
15. View list of all existing Types.
16. Add a new Type by name.
17. Type name required (cannot be blank).
18. Type name max 200 characters.
19. Type names must be unique.
20. Edit a Type's name; reflected everywhere it's referenced.
21. Delete a Type not in use — removed with no further prompts.
22. Deleting a Type in use offers reassignment of its films to another existing Type first.
23. Completing reassignment updates those films, then deletion proceeds.
24. Cancelling reassignment aborts the deletion; nothing changes.
25. No orphaned film→Type references and no silent cascade-delete of films ever occurs.

**General**
26. No login/authentication required.
27. All data persisted in Supabase, available across sessions.

## Edge cases
- Deleting the only/in-use Type with no alternative to reassign to → blocked (see default above).
- Whitespace-only Film/Type values treated as blank/invalid.
- Case/whitespace handling of uniqueness checks → case-insensitive, trimmed (see default above).
- Reassignment applying correctly regardless of how many films use the deleted Type.
- Large number of distinct Types on the chart (readability not specifically addressed).
- No concurrent-edit conflict handling (single-user, but multiple tabs/devices possible).

## Out of scope
- Auth/login/multi-user.
- Any "Name" field or fields beyond Film and Type (rating, notes, watch date, posters, etc.).
- Sorting/searching/pagination of the films table.
- Chart styling/library choice (technical detail, not a business rule).
- Import/export, sharing, notifications.
