import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Film } from "../types/domain";

export const filmsQueryKey = (typeId?: string | null) =>
  ["films", { typeId: typeId ?? null }] as const;

async function fetchFilms(typeId?: string | null): Promise<Film[]> {
  let query = supabase
    .from("films")
    .select("id, title, type_id, type:film_types(id, name)")
    .order("title", { ascending: true });

  if (typeId) {
    query = query.eq("type_id", typeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as Film[]) ?? [];
}

/**
 * Fetches films, optionally filtered to a single Type (AC 7: filtered view
 * driven by /films?type=<id>). Pass `undefined`/`null` for the unfiltered list.
 */
export function useFilms(typeId?: string | null) {
  return useQuery({
    queryKey: filmsQueryKey(typeId),
    queryFn: () => fetchFilms(typeId),
  });
}
