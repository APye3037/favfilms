import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Direct Supabase client for test setup/teardown (bypasses the UI so we can
// arrange state and clean up independently of the app under test). Reads
// the same env vars the app itself uses, from web/.env.local (Playwright's
// own process doesn't auto-load Vite's .env.local, so we parse it here).
function loadEnvLocal(): { url: string; key: string } {
  const envPath = path.resolve(__dirname, "../.env.local");
  const contents = fs.readFileSync(envPath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
  }
  const url = vars.VITE_SUPABASE_URL;
  const key = vars.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from web/.env.local");
  }
  return { url, key };
}

const { url, key } = loadEnvLocal();
export const testSupabase = createClient(url, key);

// ---------------------------------------------------------------------------
// SAFETY GUARD — read this before touching resetDatabase().
//
// This suite runs against the SAME live Supabase project the real app uses
// (there is no separate test project). resetDatabase() is destructive: it
// deletes every row in `films` and `film_types`. Without a guard, re-running
// `npx playwright test` after real film data has been logged would silently
// wipe that data.
//
// Two independent checks must BOTH pass before any delete is allowed to run:
//
//   1. Explicit opt-in: the ALLOW_ACCEPTANCE_DB_RESET=true environment
//      variable must be set for the process running Playwright. This is a
//      deliberate, human-typed acknowledgement that this run targets a
//      database that is safe to wipe.
//
//   2. Pre-existing-data check: the FIRST time resetDatabase() is called in
//      a given test process, we check whether the tables already contain
//      rows. If they do, we refuse to proceed — even with the env var set —
//      because that data was not created by this suite and wiping it could
//      destroy real user data. To override this specific check (e.g. you
//      have manually verified the rows are disposable fixtures), also set
//      ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY=true.
//
// How to run the suite safely:
//   1. Point web/.env.local at a project you are OK wiping (ideally a
//      dedicated test/staging Supabase project, never production).
//   2. Confirm films/film_types are empty (or you accept the second flag).
//   3. Run:  ALLOW_ACCEPTANCE_DB_RESET=true npx playwright test
//      (PowerShell: $env:ALLOW_ACCEPTANCE_DB_RESET="true"; npx playwright test)
//
// If neither condition is satisfied, resetDatabase() throws immediately and
// no delete is issued.
// ---------------------------------------------------------------------------

let preExistingDataCheckDone = false;

function assertResetIsAllowed(): void {
  if (process.env.ALLOW_ACCEPTANCE_DB_RESET !== "true") {
    throw new Error(
      "\n\nACCEPTANCE SUITE BLOCKED: destructive DB reset was not authorised.\n" +
        "This suite wipes the films/film_types tables in the live Supabase project\n" +
        "configured in web/.env.local. To run it, opt in explicitly:\n\n" +
        "  ALLOW_ACCEPTANCE_DB_RESET=true npx playwright test\n" +
        "  (PowerShell: $env:ALLOW_ACCEPTANCE_DB_RESET=\"true\"; npx playwright test)\n\n" +
        "Only do this against a database you are certain is safe to wipe —\n" +
        "ideally a dedicated test/staging Supabase project, never production.\n",
    );
  }
}

async function assertNoPreExistingData(): Promise<void> {
  if (preExistingDataCheckDone) return; // only check once per test process
  preExistingDataCheckDone = true;

  const [filmsCount, typesCount] = await Promise.all([
    countRows("films"),
    countRows("film_types"),
  ]);

  if ((filmsCount > 0 || typesCount > 0) && process.env.ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY !== "true") {
    throw new Error(
      "\n\nACCEPTANCE SUITE BLOCKED: the target database is not empty.\n" +
        `Found ${filmsCount} row(s) in films and ${typesCount} row(s) in film_types\n` +
        "BEFORE this suite inserted anything. This looks like real user data, not\n" +
        "test fixtures, so the destructive reset has been aborted.\n\n" +
        "To proceed anyway:\n" +
        "  - Preferred: point web/.env.local at a separate Supabase project\n" +
        "    dedicated to acceptance testing, or\n" +
        "  - Manually clear the films/film_types tables yourself first, or\n" +
        "  - If you are certain this data is disposable, set BOTH:\n" +
        "      ALLOW_ACCEPTANCE_DB_RESET=true\n" +
        "      ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY=true\n",
    );
  }
}

/**
 * Deletes ALL rows from films then film_types — full reset for test isolation.
 *
 * DESTRUCTIVE and runs against the live Supabase project (see the SAFETY
 * GUARD comment above). Requires ALLOW_ACCEPTANCE_DB_RESET=true, and refuses
 * to run at all if the tables already contained data before this suite ran,
 * unless ALLOW_ACCEPTANCE_DB_RESET_CONFIRM_NONEMPTY=true is also set.
 */
export async function resetDatabase(): Promise<void> {
  assertResetIsAllowed();
  await assertNoPreExistingData();

  // films first (FK restrict prevents deleting types while films reference them)
  const { error: filmsError } = await testSupabase
    .from("films")
    .delete()
    .not("id", "is", null);
  if (filmsError) throw filmsError;

  const { error: typesError } = await testSupabase
    .from("film_types")
    .delete()
    .not("id", "is", null);
  if (typesError) throw typesError;
}

export async function createType(name: string): Promise<string> {
  const { data, error } = await testSupabase
    .from("film_types")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createFilm(title: string, typeId: string): Promise<string> {
  const { data, error } = await testSupabase
    .from("films")
    .insert({ title, type_id: typeId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function countRows(table: "films" | "film_types"): Promise<number> {
  const { count, error } = await testSupabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Accepts the next window.confirm() dialog (used for delete confirmations). */
export function acceptNextDialog(page: Page): void {
  page.once("dialog", (dialog) => {
    void dialog.accept();
  });
}

export function dismissNextDialog(page: Page): void {
  page.once("dialog", (dialog) => {
    void dialog.dismiss();
  });
}
