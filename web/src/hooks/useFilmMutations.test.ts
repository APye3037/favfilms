import { describe, expect, it } from "vitest";
import { friendlyFilmError } from "./useFilmMutations";
import { POSTGRES_UNIQUE_VIOLATION } from "../lib/supabaseClient";

describe("friendlyFilmError", () => {
  it("maps a unique-violation (23505) to a friendly duplicate-title message", () => {
    const error = { code: POSTGRES_UNIQUE_VIOLATION, message: "duplicate key value" };
    expect(friendlyFilmError(error)).toMatch(/already exists/i);
  });

  it("falls back to the raw message for other errors", () => {
    const error = { code: "42P01", message: "relation does not exist" };
    expect(friendlyFilmError(error)).toBe("relation does not exist");
  });

  it("handles a plain Error instance", () => {
    expect(friendlyFilmError(new Error("network down"))).toBe("network down");
  });

  it("falls back to a generic message for unrecognisable errors", () => {
    expect(friendlyFilmError("boom")).toBe("Something went wrong.");
  });
});
