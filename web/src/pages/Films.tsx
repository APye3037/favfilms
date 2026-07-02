import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFilms } from "../hooks/useFilms";
import { useTypes } from "../hooks/useTypes";
import {
  friendlyFilmError,
  useAddFilm,
  useDeleteFilm,
  useEditFilm,
} from "../hooks/useFilmMutations";
import { FilmForm, type FilmFormValues } from "../components/FilmForm";
import { FilmTable } from "../components/FilmTable";
import type { Film } from "../types/domain";

export function Films() {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");

  const filmsQuery = useFilms(typeFilter);
  const typesQuery = useTypes();

  const addFilm = useAddFilm();
  const editFilm = useEditFilm();
  const deleteFilm = useDeleteFilm();

  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeTypeName = useMemo(() => {
    if (!typeFilter) return null;
    return (
      typesQuery.data?.find((type) => type.id === typeFilter)?.name ?? null
    );
  }, [typeFilter, typesQuery.data]);

  async function handleAdd(values: FilmFormValues) {
    setFormError(null);
    try {
      await addFilm.mutateAsync(values);
      setShowAddForm(false);
    } catch (error) {
      setFormError(friendlyFilmError(error));
    }
  }

  async function handleEdit(values: FilmFormValues) {
    if (!editingFilm) return;
    setFormError(null);
    try {
      await editFilm.mutateAsync({ id: editingFilm.id, ...values });
      setEditingFilm(null);
    } catch (error) {
      setFormError(friendlyFilmError(error));
    }
  }

  async function handleDelete(film: Film) {
    const confirmed = window.confirm(`Delete "${film.title}"?`);
    if (!confirmed) return;
    await deleteFilm.mutateAsync(film.id);
  }

  const isLoading = filmsQuery.isLoading || typesQuery.isLoading;
  const isError = filmsQuery.isError || typesQuery.isError;

  return (
    <section>
      <h1>Films</h1>

      {typeFilter && (
        <p>
          Filtered by type: <strong>{activeTypeName ?? typeFilter}</strong>{" "}
          <Link to="/films">Clear filter</Link>
        </p>
      )}

      {isLoading && <p role="status">Loading films...</p>}

      {isError && (
        <p role="alert">
          Could not load films. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <FilmTable
            films={filmsQuery.data ?? []}
            onEdit={(film) => {
              setFormError(null);
              setEditingFilm(film);
              setShowAddForm(false);
            }}
            onDelete={handleDelete}
          />

          {editingFilm && (
            <div className="panel">
              <h2>Edit film</h2>
              <FilmForm
                types={typesQuery.data ?? []}
                initialFilm={editingFilm}
                submitLabel="Save changes"
                onSubmit={handleEdit}
                onCancel={() => {
                  setEditingFilm(null);
                  setFormError(null);
                }}
                serverError={formError}
              />
            </div>
          )}

          {!editingFilm && (
            <div className="panel">
              {showAddForm ? (
                <>
                  <h2>Add film</h2>
                  <FilmForm
                    types={typesQuery.data ?? []}
                    submitLabel="Add film"
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
                  Add film
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
