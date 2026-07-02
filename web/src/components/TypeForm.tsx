import { useState, type FormEvent } from "react";
import { validateRequiredText } from "../lib/validation";
import type { FilmType } from "../types/domain";

export interface TypeFormValues {
  name: string;
}

interface TypeFormProps {
  initialType?: FilmType;
  submitLabel: string;
  onSubmit: (values: TypeFormValues) => Promise<void> | void;
  onCancel?: () => void;
  serverError?: string | null;
}

export function TypeForm({
  initialType,
  submitLabel,
  onSubmit,
  onCancel,
  serverError,
}: TypeFormProps) {
  const [name, setName] = useState(initialType?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = validateRequiredText(name, "Type name");
    setNameError(result.valid ? null : result.error ?? null);

    if (!result.valid) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="type-form" noValidate>
      <div className="form-field">
        <label htmlFor="type-name">Type name</label>
        <input
          id="type-name"
          type="text"
          value={name}
          maxLength={400}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "type-name-error" : undefined}
        />
        {nameError && (
          <p id="type-name-error" role="alert" className="field-error">
            {nameError}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="field-error">
          {serverError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
