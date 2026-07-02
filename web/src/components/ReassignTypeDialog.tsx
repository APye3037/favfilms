import { useState } from "react";
import type { FilmType } from "../types/domain";

interface ReassignTypeDialogProps {
  /** The type being deleted. */
  typeToDelete: FilmType;
  /** How many films currently reference typeToDelete. */
  filmCount: number;
  /** All existing types, including typeToDelete — this component filters it out. */
  allTypes: FilmType[];
  onConfirm: (targetTypeId: string) => Promise<void> | void;
  onCancel: () => void;
  serverError?: string | null;
}

export function ReassignTypeDialog({
  typeToDelete,
  filmCount,
  allTypes,
  onConfirm,
  onCancel,
  serverError,
}: ReassignTypeDialogProps) {
  const otherTypes = allTypes.filter((type) => type.id !== typeToDelete.id);
  const [targetTypeId, setTargetTypeId] = useState(otherTypes[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const hasNoAlternative = otherTypes.length === 0;

  async function handleConfirm() {
    if (!targetTypeId) return;
    setSubmitting(true);
    try {
      await onConfirm(targetTypeId);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reassign-dialog-title" className="dialog">
      <h2 id="reassign-dialog-title">Type in use</h2>

      {hasNoAlternative ? (
        <>
          <p role="alert">
            &ldquo;{typeToDelete.name}&rdquo; is used by {filmCount}{" "}
            {filmCount === 1 ? "film" : "films"} and there is no other type to
            reassign them to. Create another type first, then try deleting
            this one again.
          </p>
          <div className="form-actions">
            <button type="button" onClick={onCancel}>
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            &ldquo;{typeToDelete.name}&rdquo; is used by {filmCount}{" "}
            {filmCount === 1 ? "film" : "films"}. Choose a type to reassign{" "}
            {filmCount === 1 ? "it" : "them"} to before deleting &ldquo;
            {typeToDelete.name}&rdquo;.
          </p>

          <div className="form-field">
            <label htmlFor="reassign-target">Reassign to</label>
            <select
              id="reassign-target"
              value={targetTypeId}
              onChange={(event) => setTargetTypeId(event.target.value)}
            >
              {otherTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {serverError && (
            <p role="alert" className="field-error">
              {serverError}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !targetTypeId}
            >
              Reassign and delete
            </button>
            <button type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
