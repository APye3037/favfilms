import { describe, expect, it } from "vitest";
import { MAX_TEXT_LENGTH, normalizeText, validateRequiredText } from "./validation";

describe("validateRequiredText", () => {
  it("rejects an empty string", () => {
    const result = validateRequiredText("", "Film");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("rejects a whitespace-only string", () => {
    const result = validateRequiredText("   \t  ", "Type name");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("accepts a normal value", () => {
    const result = validateRequiredText("The Matrix", "Film");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts a value that is exactly MAX_TEXT_LENGTH characters", () => {
    const value = "a".repeat(MAX_TEXT_LENGTH);
    const result = validateRequiredText(value, "Film");
    expect(result.valid).toBe(true);
  });

  it("rejects a value longer than MAX_TEXT_LENGTH characters", () => {
    const value = "a".repeat(MAX_TEXT_LENGTH + 1);
    const result = validateRequiredText(value, "Film");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/200/);
  });

  it("measures length after trimming surrounding whitespace", () => {
    const value = `  ${"a".repeat(MAX_TEXT_LENGTH)}  `;
    const result = validateRequiredText(value, "Film");
    expect(result.valid).toBe(true);
  });

  it("includes the field label in the error message", () => {
    const result = validateRequiredText("", "Type name");
    expect(result.error).toContain("Type name");
  });
});

describe("normalizeText", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeText("  Inception  ")).toBe("Inception");
  });

  it("does not alter internal whitespace", () => {
    expect(normalizeText("  The   Matrix  ")).toBe("The   Matrix");
  });
});
