import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy web/.env.example to web/.env.local and fill in real values.",
  );
}

// createClient throws synchronously on an invalid URL, which would crash any
// module (including tests) that imports this file before .env.local exists.
// Fall back to a syntactically valid placeholder so construction always
// succeeds; real requests will simply fail until real credentials are set.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);

/** Postgres error code for a unique-constraint violation (duplicate). */
export const POSTGRES_UNIQUE_VIOLATION = "23505";

/** Postgres error code for a foreign-key violation (defensive fallback). */
export const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

/**
 * Supabase-js surfaces Postgres errors with a `code` property. This narrows
 * an unknown thrown value down to that shape so callers can branch on it.
 */
export function getPostgresErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
