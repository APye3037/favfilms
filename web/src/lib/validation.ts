// Shared validation for free-text fields that must behave identically for
// both Film title and Type name (brief Section 4 / story AC 9-11, 17-19).

export const MAX_TEXT_LENGTH = 200;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a required text field (Film title or Type name):
 * - must not be blank after trimming (whitespace-only counts as blank)
 * - must not exceed MAX_TEXT_LENGTH characters (measured on the trimmed value)
 *
 * `fieldLabel` is used to produce a friendly, field-specific message.
 */
export function validateRequiredText(
  value: string,
  fieldLabel: string,
): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `${fieldLabel} must be ${MAX_TEXT_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true };
}

/** Trims a value the same way the DB's uniqueness index does (for submission). */
export function normalizeText(value: string): string {
  return value.trim();
}
