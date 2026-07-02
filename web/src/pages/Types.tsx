import { useState } from "react";
import { useTypes } from "../hooks/useTypes";
import {
  countFilmsUsingType,
  friendlyDeleteTypeError,
  friendlyTypeError,
  useAddType,
  useDeleteTypeIfUnused,
  useEditType,
  useReassignAndDeleteType,
} from "../hooks/useTypeMutations";
import { TypeForm, type TypeFormValues } from "../components/TypeForm";
import { TypeList } from "../components/TypeList";
import { ReassignTypeDialog } from "../components/ReassignTypeDialog";
import type { FilmType } from "../types/domain";

export function Types() {
  const typesQuery = useTypes();

  const addType = useAddType();
  const editType = useEditType();
  const deleteTypeIfUnused = useDeleteTypeIfUnused();
  const reassignAndDeleteType = useReassignAndDeleteType();

  const [editingType, setEditingType] = useState<FilmType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{
    type: FilmType;
    filmCount: number;
  } | null>(null);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [checkingDelete, setCheckingDelete] = useState<string | null>(null);
  const [deleteCheckError, setDeleteCheckError] = useState<string | null>(
    null,
  );

  async function handleAdd(values: TypeFormValues) {
    setFormError(null);
    try {
      await addType.mutateAsync(values);
      setShowAddForm(false);
    } catch (error) {
      setFormError(friendlyTypeError(error));
    }
  }

  async function handleEdit(values: TypeFormValues) {
    if (!editingType) return;
    setFormError(null);
    try {
      await editType.mutateAsync({ id: editingType.id, ...values });
      setEditingType(null);
    } catch (error) {
      setFormError(friendlyTypeError(error));
    }
  }

  async function handleDeleteClick(type: FilmType) {
    setDeleteCheckError(null);
    setCheckingDelete(type.id);
    try {
      const filmCount = await countFilmsUsingType(type.id);

      if (filmCount === 0) {
        const confirmed = window.confirm(
          `Delete type "${type.name}"? It is not used by any films.`,
        );
        if (confirmed) {
          await deleteTypeIfUnused.mutateAsync(type.id);
        }
        return;
      }

      // In use: open the reassignment dialog (AC 22). The dialog itself
      // handles the "no other type exists" block (AC 24-equivalent guard).
      setReassignError(null);
      setPendingDelete({ type, filmCount });
    } catch (error) {
      setDeleteCheckError(friendlyDeleteTypeError(error));
    } finally {
      setCheckingDelete(null);
    }
  }

  async function handleReassignConfirm(targetTypeId: string) {
    if (!pendingDelete) return;
    setReassignError(null);
    try {
      await reassignAndDeleteType.mutateAsync({
        fromTypeId: pendingDelete.type.id,
        toTypeId: targetTypeId,
      });
      setPendingDelete(null);
    } catch (error) {
      setReassignError(friendlyDeleteTypeError(error));
    }
  }

  function handleReassignCancel() {
    // No network call is made — nothing changes (AC 24).
    setPendingDelete(null);
    setReassignError(null);
  }

  return (
    <section>
      <h1>Types</h1>

      {typesQuery.isLoading && <p role="status">Loading types...</p>}

      {typesQuery.isError && (
        <p role="alert">Could not load types. Please try again.</p>
      )}

      {deleteCheckError && <p role="alert">{deleteCheckError}</p>}

      {!typesQuery.isLoading && !typesQuery.isError && (
        <>
          <TypeList
            types={typesQuery.data ?? []}
            onEdit={(type) => {
              setFormError(null);
              setEditingType(type);
              setShowAddForm(false);
            }}
            onDelete={handleDeleteClick}
          />

          {checkingDelete && <p role="status">Checking type usage...</p>}

          {pendingDelete && (
            <ReassignTypeDialog
              typeToDelete={pendingDelete.type}
              filmCount={pendingDelete.filmCount}
              allTypes={typesQuery.data ?? []}
              onConfirm={handleReassignConfirm}
              onCancel={handleReassignCancel}
              serverError={reassignError}
            />
          )}

          {editingType && (
            <div className="panel">
              <h2>Edit type</h2>
              <TypeForm
                initialType={editingType}
                submitLabel="Save changes"
                onSubmit={handleEdit}
                onCancel={() => {
                  setEditingType(null);
                  setFormError(null);
                }}
                serverError={formError}
              />
            </div>
          )}

          {!editingType && (
            <div className="panel">
              {showAddForm ? (
                <>
                  <h2>Add type</h2>
                  <TypeForm
                    submitLabel="Add type"
                    onSubmit={handleAdd}
                    onCancel={() => {
                      setShowAddForm(false);
                      setFormError(null);
                    }}
                    serverError={formError}
                  />
                </>
              ) : (
                <button type="button" onClick={() => setShowAddForm(true)}>
                  Add type
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
