import { describe, expect, it } from "vitest";
import { friendlyDeleteTypeError, friendlyTypeError } from "./useTypeMutations";
import {
  POSTGRES_FOREIGN_KEY_VIOLATION,
  POSTGRES_UNIQUE_VIOLATION,
} from "../lib/supabaseClient";

describe("friendlyTypeError", () => {
  it("maps a unique-violation (23505) to a friendly duplicate-name message", () => {
    const error = { code: POSTGRES_UNIQUE_VIOLATION, message: "duplicate key value" };
    expect(friendlyTypeError(error)).toMatch(/already exists/i);
  });

  it("falls back to the raw message for other errors", () => {
    const error = { code: "22001", message: "value too long" };
    expect(friendlyTypeError(error)).toBe("value too long");
  });
});

describe("friendlyDeleteTypeError", () => {
  it("maps a foreign-key violation (23503) to an in-use message", () => {
    const error = {
      code: POSTGRES_FOREIGN_KEY_VIOLATION,
      message: "violates foreign key constraint",
    };
    expect(friendlyDeleteTypeError(error)).toMatch(/still in use/i);
  });

  it("surfaces a plain RPC exception message for anything else", () => {
    const error = { message: "target type ... does not exist" };
    expect(friendlyDeleteTypeError(error)).toBe(
      "target type ... does not exist",
    );
  });
});
