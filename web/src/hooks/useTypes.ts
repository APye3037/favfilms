import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { FilmType } from "../types/domain";

export const typesQueryKey = ["film_types"] as const;

async function fetchTypes(): Promise<FilmType[]> {
  const { data, error } = await supabase
    .from("film_types")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useTypes() {
  return useQuery({
    queryKey: typesQueryKey,
    queryFn: fetchTypes,
  });
}
