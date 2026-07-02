import { expect, test } from "@playwright/test";
import {
  acceptNextDialog,
  countRows,
  createFilm,
  createType,
  resetDatabase,
  testSupabase,
} from "./helpers";

// Acceptance tests for docs/features/favourite-films-log/02-story.md.
// Each `test` block is annotated with the AC number(s) it proves.
// Runs against the LIVE Supabase project via the real dev server — this is
// black-box, from-the-outside verification, not a re-run of the builders'
// unit tests.
//
// SAFETY: resetDatabase() (see ./helpers.ts) wipes films/film_types before
// every test and once more after the suite. Because there is no separate
// test Supabase project, this is destructive against real data. It will
// refuse to run unless ALLOW_ACCEPTANCE_DB_RESET=true is set, and it will
// additionally refuse to run if the tables were non-empty before this suite
// touched them, unless ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY=true is
// also set. See helpers.ts for the full explanation and invocation example.
// Run with:
//   ALLOW_ACCEPTANCE_DB_RESET=true npx playwright test

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await resetDatabase();
});

// ---------------------------------------------------------------------------
// Dashboard (AC 1-4)
// ---------------------------------------------------------------------------

test.describe("Dashboard", () => {
  test("AC 3: empty/zero state for both total and chart, no error", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator(".stat-card__value")).toHaveText("0");
    await expect(page.getByText(/no films yet/i)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("AC 1, 2, 4: total count and per-type breakdown chart reflect current data", async ({ page }) => {
    const sciFi = await createType("Sci-Fi");
    const drama = await createType("Drama");
    await createFilm("Dune", sciFi);
    await createFilm("Arrival", sciFi);
    await createFilm("Casablanca", drama);

    await page.goto("/");

    await expect(page.locator(".stat-card__value")).toHaveText("3");

    // Recharts renders bars as SVG <path>/<rect> with accessible text via
    // axis tick labels; assert the type names appear in the chart area.
    const chartSection = page.locator("section");
    await expect(chartSection.getByText("Sci-Fi")).toBeVisible();
    await expect(chartSection.getByText("Drama")).toBeVisible();

    // AC 4: reload reflects newly added data (add one more film, then reload).
    await createFilm("Amelie", drama);
    await page.reload();
    await expect(page.locator(".stat-card__value")).toHaveText("4");
  });
});

// ---------------------------------------------------------------------------
// Films table (AC 5-14)
// ---------------------------------------------------------------------------

test.describe("Films table", () => {
  test("AC 5: table has exactly two data columns, Film and Type", async ({ page }) => {
    const type = await createType("Comedy");
    await createFilm("Airplane!", type);

    await page.goto("/films");
    const headers = page.locator(".film-table thead th");
    await expect(headers).toHaveCount(3); // Film, Type, Actions(aria-only)
    await expect(headers.nth(0)).toHaveText("Film");
    await expect(headers.nth(1)).toHaveText("Type");
  });

  test("AC 6, 7: Type is a link that navigates to a filtered films view", async ({ page }) => {
    const comedy = await createType("Comedy");
    const drama = await createType("Drama");
    await createFilm("Airplane!", comedy);
    await createFilm("Casablanca", drama);

    await page.goto("/films");
    const typeLink = page.getByRole("link", { name: "Comedy" });
    await expect(typeLink).toBeVisible();
    await typeLink.click();

    await expect(page).toHaveURL(/\/films\?type=/);
    await expect(page.getByText("Filtered by type:")).toBeVisible();
    await expect(page.getByText("Airplane!")).toBeVisible();
    await expect(page.getByText("Casablanca")).toHaveCount(0);
  });

  test("AC 8, 9: add a new film requires both Film and Type", async ({ page }) => {
    await createType("Horror");
    await page.goto("/films");

    await page.getByRole("button", { name: "Add film" }).click();
    // Submit with nothing filled in.
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(page.getByText("Film is required.")).toBeVisible();
    await expect(page.getByText("Type is required.")).toHaveCount(0); // a type is pre-selected by default when types exist

    await page.getByLabel("Film").fill("The Shining");
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(page.getByRole("cell", { name: "The Shining" })).toBeVisible();
  });

  test("AC 9 (type required when no types exist yet): both fields required to save", async ({ page }) => {
    // No types in DB at all -> type select has no options, forcing the
    // "Type is required" validation path.
    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();
    await page.getByLabel("Film").fill("Untyped Film");
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(page.getByText("Type is required.")).toBeVisible();
    expect(await countRows("films")).toBe(0);
  });

  test("AC 10: duplicate Film title is rejected with a message", async ({ page }) => {
    const type = await createType("Action");
    await createFilm("Die Hard", type);

    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();
    await page.getByLabel("Film").fill("Die Hard");
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(
      page.getByText(/A film with that title already exists/i),
    ).toBeVisible();
    expect(await countRows("films")).toBe(1);
  });

  test("AC 11: Film value max 200 characters is enforced", async ({ page }) => {
    await createType("Action");
    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();

    const tooLong = "A".repeat(201);
    await page.getByLabel("Film").fill(tooLong);
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(
      page.getByText("Film must be 200 characters or fewer."),
    ).toBeVisible();
    expect(await countRows("films")).toBe(0);
  });

  test("Boundary: exactly 200 characters is accepted", async ({ page }) => {
    await createType("Action");
    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();

    const exactly200 = "B".repeat(200);
    await page.getByLabel("Film").fill(exactly200);
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(page.getByRole("cell", { name: exactly200 })).toBeVisible();
    expect(await countRows("films")).toBe(1);
  });

  test("AC 12: edit an existing film's title and/or type", async ({ page }) => {
    const action = await createType("Action");
    await createType("Drama");
    await createFilm("Die Hard", action);

    await page.goto("/films");
    await page.getByRole("row", { name: /Die Hard/ }).getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Film").fill("Die Hard 2");
    await page.getByLabel("Type").selectOption({ label: "Drama" });
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("cell", { name: "Die Hard 2" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Drama" })).toBeVisible();
  });

  test("AC 13: editing to a duplicate Film value is rejected", async ({ page }) => {
    const type = await createType("Action");
    await createFilm("Die Hard", type);
    await createFilm("Speed", type);

    await page.goto("/films");
    await page.getByRole("row", { name: /Speed/ }).getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Film").fill("Die Hard");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByText(/A film with that title already exists/i),
    ).toBeVisible();
    // Original title unchanged.
    await expect(page.getByRole("cell", { name: "Speed", exact: true })).toBeVisible();
  });

  test("AC 14: delete a film entry", async ({ page }) => {
    const type = await createType("Action");
    await createFilm("Die Hard", type);

    await page.goto("/films");
    acceptNextDialog(page);
    await page.getByRole("row", { name: /Die Hard/ }).getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("No films to show yet.")).toBeVisible();
    expect(await countRows("films")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Type lookup management (AC 15-25)
// ---------------------------------------------------------------------------

test.describe("Type management", () => {
  test("AC 15: view list of all existing Types", async ({ page }) => {
    await createType("Comedy");
    await createType("Drama");

    await page.goto("/types");
    await expect(page.getByText("Comedy")).toBeVisible();
    await expect(page.getByText("Drama")).toBeVisible();
  });

  test("AC 16, 17: add a new Type; blank name rejected", async ({ page }) => {
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(page.getByText("Type name is required.")).toBeVisible();
    expect(await countRows("film_types")).toBe(0);

    await page.getByLabel("Type name").fill("Thriller");
    await page.getByRole("button", { name: "Add type", exact: true }).click();
    await expect(page.getByText("Thriller")).toBeVisible();
  });

  test("Edge case: whitespace-only Type name treated as blank/invalid", async ({ page }) => {
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    await page.getByLabel("Type name").fill("   ");
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(page.getByText("Type name is required.")).toBeVisible();
    expect(await countRows("film_types")).toBe(0);
  });

  test("Edge case: whitespace-only Film title treated as blank/invalid", async ({ page }) => {
    await createType("Action");
    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();
    await page.getByLabel("Film").fill("    ");
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(page.getByText("Film is required.")).toBeVisible();
    expect(await countRows("films")).toBe(0);
  });

  test("AC 18: Type name max 200 characters enforced", async ({ page }) => {
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    const tooLong = "T".repeat(201);
    await page.getByLabel("Type name").fill(tooLong);
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(
      page.getByText("Type name must be 200 characters or fewer."),
    ).toBeVisible();
    expect(await countRows("film_types")).toBe(0);
  });

  test("Boundary: Type name of exactly 200 characters accepted", async ({ page }) => {
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    const exactly200 = "U".repeat(200);
    await page.getByLabel("Type name").fill(exactly200);
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(page.getByText(exactly200)).toBeVisible();
    expect(await countRows("film_types")).toBe(1);
  });

  test("AC 19: Type names must be unique", async ({ page }) => {
    await createType("Comedy");
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    await page.getByLabel("Type name").fill("Comedy");
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(
      page.getByText(/A type with that name already exists/i),
    ).toBeVisible();
    expect(await countRows("film_types")).toBe(1);
  });

  test("Edge case: Type uniqueness is case-insensitive and whitespace-trimmed", async ({ page }) => {
    await createType("Comedy");
    await page.goto("/types");
    await page.getByRole("button", { name: "Add type" }).click();
    await page.getByLabel("Type name").fill("  COMEDY  ");
    await page.getByRole("button", { name: "Add type", exact: true }).click();

    await expect(
      page.getByText(/A type with that name already exists/i),
    ).toBeVisible();
    expect(await countRows("film_types")).toBe(1);
  });

  test("Edge case: Film uniqueness is case-insensitive and whitespace-trimmed", async ({ page }) => {
    const type = await createType("Action");
    await createFilm("Die Hard", type);

    await page.goto("/films");
    await page.getByRole("button", { name: "Add film" }).click();
    await page.getByLabel("Film").fill("  die hard  ");
    await page.getByRole("button", { name: "Add film", exact: true }).click();

    await expect(
      page.getByText(/A film with that title already exists/i),
    ).toBeVisible();
    expect(await countRows("films")).toBe(1);
  });

  test("AC 20: editing a Type's name is reflected everywhere it's referenced", async ({ page }) => {
    const comedy = await createType("Comedy");
    await createFilm("Airplane!", comedy);

    await page.goto("/types");
    await page.getByRole("listitem").filter({ hasText: "Comedy" }).getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Type name").fill("Comedy Classics");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Comedy Classics")).toBeVisible();

    await page.goto("/films");
    await expect(page.getByRole("link", { name: "Comedy Classics" })).toBeVisible();
  });

  test("AC 21: delete a Type not in use — removed with no further prompts", async ({ page }) => {
    await createType("Unused Genre");
    await page.goto("/types");

    acceptNextDialog(page); // the plain "Delete type X? not used by any films" confirm
    await page.getByRole("listitem").filter({ hasText: "Unused Genre" }).getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Unused Genre")).toHaveCount(0);
    // No reassignment dialog should ever have appeared.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await countRows("film_types")).toBe(0);
  });

  test("AC 22, 23: deleting an in-use Type offers reassignment; completing it updates films then deletes", async ({ page }) => {
    const sciFi = await createType("Sci-Fi");
    await createType("Drama");
    await createFilm("Dune", sciFi);
    await createFilm("Arrival", sciFi);

    await page.goto("/types");
    await page.getByRole("listitem").filter({ hasText: "Sci-Fi" }).getByRole("button", { name: "Delete" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/used by 2 films/i)).toBeVisible();
    await dialog.getByLabel("Reassign to").selectOption({ label: "Drama" });
    await dialog.getByRole("button", { name: "Reassign and delete" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Sci-Fi")).toHaveCount(0);
    expect(await countRows("film_types")).toBe(1);

    // Films now point at Drama, not orphaned, not deleted (AC 23 + AC 25).
    await page.goto("/films");
    expect(await countRows("films")).toBe(2);
    await expect(page.getByRole("link", { name: "Drama" })).toHaveCount(2);
    await expect(page.getByText("Dune")).toBeVisible();
    await expect(page.getByText("Arrival")).toBeVisible();
  });

  test("AC 24: cancelling reassignment aborts the deletion; nothing changes", async ({ page }) => {
    const sciFi = await createType("Sci-Fi");
    await createType("Drama");
    await createFilm("Dune", sciFi);

    await page.goto("/types");
    await page.getByRole("listitem").filter({ hasText: "Sci-Fi" }).getByRole("button", { name: "Delete" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);

    // Nothing changed: both types still present, film still Sci-Fi.
    await expect(page.getByText("Sci-Fi")).toBeVisible();
    await expect(page.getByText("Drama")).toBeVisible();
    expect(await countRows("film_types")).toBe(2);

    await page.goto("/films");
    await expect(page.getByRole("link", { name: "Sci-Fi" })).toBeVisible();
    expect(await countRows("films")).toBe(1);
  });

  test("Edge case / default: deleting the only in-use Type with no alternative is blocked", async ({ page }) => {
    const onlyType = await createType("Sci-Fi");
    await createFilm("Dune", onlyType);

    await page.goto("/types");
    await page.getByRole("listitem").filter({ hasText: "Sci-Fi" }).getByRole("button", { name: "Delete" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/no other type to\s*reassign/i)).toBeVisible();
    // No select control offered, no "Reassign and delete" action available.
    await expect(dialog.getByLabel("Reassign to")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Reassign and delete" })).toHaveCount(0);

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);

    // Blocked: type and film both still exist, untouched.
    expect(await countRows("film_types")).toBe(1);
    expect(await countRows("films")).toBe(1);
  });

  test("Edge case: reassignment applies correctly regardless of number of films using the deleted Type (3 films)", async ({ page }) => {
    const from = await createType("Sci-Fi");
    const to = await createType("Drama");
    await createFilm("Dune", from);
    await createFilm("Arrival", from);
    await createFilm("Interstellar", from);

    await page.goto("/types");
    await page.getByRole("listitem").filter({ hasText: "Sci-Fi" }).getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/used by 3 films/i)).toBeVisible();
    await dialog.getByLabel("Reassign to").selectOption({ label: "Drama" });
    await dialog.getByRole("button", { name: "Reassign and delete" }).click();
    await expect(dialog).toHaveCount(0);

    const { data, error } = await testSupabase
      .from("films")
      .select("id, type_id")
      .eq("type_id", to);
    expect(error).toBeNull();
    expect(data?.length).toBe(3);
  });

  test("AC 25: no orphaned film->Type references possible via direct DB deletion attempt (FK RESTRICT backstop)", async () => {
    const type = await createType("Sci-Fi");
    await createFilm("Dune", type);

    // Attempt a raw delete of the in-use type directly against the DB,
    // bypassing the UI entirely, to prove the FK constraint itself (not
    // just app logic) prevents orphaning/cascade (AC 25's "no silent
    // cascade ever occurs" is a DB-level guarantee per the brief).
    const { error } = await testSupabase.from("film_types").delete().eq("id", type);

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23503"); // foreign_key_violation

    // Confirm nothing was cascaded/orphaned.
    expect(await countRows("film_types")).toBe(1);
    expect(await countRows("films")).toBe(1);
    const { data } = await testSupabase
      .from("films")
      .select("type_id")
      .eq("title", "Dune")
      .single();
    expect(data?.type_id).toBe(type);
  });
});

// ---------------------------------------------------------------------------
// General (AC 26-27)
// ---------------------------------------------------------------------------

test.describe("General", () => {
  test("AC 26: no login/authentication required to use any page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toHaveCount(0);
    await expect(page.getByLabel(/email/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /log ?in|sign ?in/i })).toHaveCount(0);

    await page.goto("/films");
    await expect(page.getByRole("heading", { name: "Films" })).toBeVisible();

    await page.goto("/types");
    await expect(page.getByRole("heading", { name: "Types" })).toBeVisible();
  });

  test("AC 27: data persisted in Supabase, available across sessions (fresh browser context)", async ({ context }) => {
    const type = await createType("Sci-Fi");
    await createFilm("Dune", type);

    // Simulate a new session: fresh browser context (no localStorage/cookies
    // carried over), reload the app, confirm data is still there because it
    // lives in Supabase, not client state.
    const newContext = await context.browser()!.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto("/films");
    await expect(newPage.getByText("Dune")).toBeVisible();
    await expect(newPage.getByRole("link", { name: "Sci-Fi" })).toBeVisible();
    await newContext.close();
  });
});
