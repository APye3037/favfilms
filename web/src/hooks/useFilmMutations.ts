import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getErrorMessage,
  getPostgresErrorCode,
  POSTGRES_UNIQUE_VIOLATION,
  supabase,
} from "../lib/supabaseClient";
import { normalizeText } from "../lib/validation";

export interface AddFilmInput {
  title: string;
  type_id: string;
}

export interface EditFilmInput {
  id: string;
  title: string;
  type_id: string;
}

/** Maps a raw Supabase/Postgres error to a friendly, UI-ready message. */
export function friendlyFilmError(error: unknown): string {
  if (getPostgresErrorCode(error) === POSTGRES_UNIQUE_VIOLATION) {
    return "A film with that title already exists. Please use a different title.";
  }
  return getErrorMessage(error);
}

function invalidateFilmQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["films"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}

export function useAddFilm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddFilmInput) => {
      const { error } = await supabase.from("films").insert({
        title: normalizeText(input.title),
        type_id: input.type_id,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateFilmQueries(queryClient),
  });
}

export function useEditFilm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditFilmInput) => {
      const { error } = await supabase
        .from("films")
        .update({
          title: normalizeText(input.title),
          type_id: input.type_id,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFilmQueries(queryClient),
  });
}

export function useDeleteFilm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("films").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFilmQueries(queryClient),
  });
}
