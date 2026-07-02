import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getErrorMessage,
  getPostgresErrorCode,
  POSTGRES_FOREIGN_KEY_VIOLATION,
  POSTGRES_UNIQUE_VIOLATION,
  supabase,
} from "../lib/supabaseClient";
import { normalizeText } from "../lib/validation";

export interface AddTypeInput {
  name: string;
}

export interface EditTypeInput {
  id: string;
  name: string;
}

/** Maps a raw Supabase/Postgres error to a friendly, UI-ready message. */
export function friendlyTypeError(error: unknown): string {
  if (getPostgresErrorCode(error) === POSTGRES_UNIQUE_VIOLATION) {
    return "A type with that name already exists. Please use a different name.";
  }
  return getErrorMessage(error);
}

function invalidateTypeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["film_types"] });
  void queryClient.invalidateQueries({ queryKey: ["films"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}

export function useAddType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTypeInput) => {
      const { error } = await supabase
        .from("film_types")
        .insert({ name: normalizeText(input.name) });
      if (error) throw error;
    },
    onSuccess: () => invalidateTypeQueries(queryClient),
  });
}

export function useEditType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditTypeInput) => {
      const { error } = await supabase
        .from("film_types")
        .update({ name: normalizeText(input.name) })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTypeQueries(queryClient),
  });
}

/**
 * Counts how many films currently reference a given type. Used to decide
 * whether a delete can proceed immediately or needs the reassignment flow
 * (brief Section 2 "Delete Type" flow, step 1).
 */
export async function countFilmsUsingType(typeId: string): Promise<number> {
  const { count, error } = await supabase
    .from("films")
    .select("id", { count: "exact", head: true })
    .eq("type_id", typeId);

  if (error) throw error;
  return count ?? 0;
}

/** Deletes a type that is not in use (AC 21). */
export function useDeleteTypeIfUnused() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeId: string) => {
      const { error } = await supabase.rpc("delete_type_if_unused", {
        type_id: typeId,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateTypeQueries(queryClient),
  });
}

/**
 * Reassigns all films from one type to another, then deletes the source
 * type, atomically via RPC (AC 22-23).
 */
export function useReassignAndDeleteType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { fromTypeId: string; toTypeId: string }) => {
      const { error } = await supabase.rpc("reassign_and_delete_type", {
        from_type_id: input.fromTypeId,
        to_type_id: input.toTypeId,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateTypeQueries(queryClient),
  });
}

/** Friendly message for errors raised by the type-delete RPCs. */
export function friendlyDeleteTypeError(error: unknown): string {
  const code = getPostgresErrorCode(error);
  if (code === POSTGRES_FOREIGN_KEY_VIOLATION) {
    return "This type is still in use by one or more films and cannot be deleted.";
  }
  return getErrorMessage(error);
}
