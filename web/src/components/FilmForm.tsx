import { useState, type FormEvent } from "react";
import { validateRequiredText } from "../lib/validation";
import type { Film, FilmType } from "../types/domain";

export interface FilmFormValues {
  title: string;
  type_id: string;
}

interface FilmFormProps {
  types: FilmType[];
  initialFilm?: Film;
  submitLabel: string;
  onSubmit: (values: FilmFormValues) => Promise<void> | void;
  onCancel?: () => void;
  serverError?: string | null;
}

export function FilmForm({
  types,
  initialFilm,
  submitLabel,
  onSubmit,
  onCancel,
  serverError,
}: FilmFormProps) {
  const [title, setTitle] = useState(initialFilm?.title ?? "");
  const [typeId, setTypeId] = useState(
    initialFilm?.type_id ?? types[0]?.id ?? "",
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const titleResult = validateRequiredText(title, "Film");
    const typeIsSelected = typeId.trim().length > 0;

    setTitleError(titleResult.valid ? null : titleResult.error ?? null);
    setTypeError(typeIsSelected ? null : "Type is required.");

    if (!titleResult.valid || !typeIsSelected) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), type_id: typeId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="film-form" noValidate>
      <div className="form-field">
        <label htmlFor="film-title">Film</label>
        <input
          id="film-title"
          type="text"
          value={title}
          maxLength={400}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "film-title-error" : undefined}
        />
        {titleError && (
          <p id="film-title-error" role="alert" className="field-error">
            {titleError}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="film-type">Type</label>
        <select
          id="film-type"
          value={typeId}
          onChange={(event) => setTypeId(event.target.value)}
          aria-invalid={typeError ? true : undefined}
          aria-describedby={typeError ? "film-type-error" : undefined}
        >
          <option value="">Select a type</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {typeError && (
          <p id="film-type-error" role="alert" className="field-error">
            {typeError}
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
