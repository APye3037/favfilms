import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Film } from "../types/domain";

export interface TypeBreakdownEntry {
  typeId: string;
  typeName: string;
  count: number;
}

export interface DashboardStats {
  totalFilms: number;
  breakdown: TypeBreakdownEntry[];
}

export const dashboardStatsQueryKey = ["dashboard-stats"] as const;

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Client-side aggregation over all films (brief Section 3 / Risk 4 — a
  // conscious simplicity choice, not an oversight, at this scale).
  const { data, error } = await supabase
    .from("films")
    .select("id, title, type_id, type:film_types(id, name)");

  if (error) throw error;

  const films = (data as unknown as Film[]) ?? [];

  const countsByType = new Map<string, TypeBreakdownEntry>();
  for (const film of films) {
    const typeId = film.type?.id ?? film.type_id;
    const typeName = film.type?.name ?? "Unknown";
    const existing = countsByType.get(typeId);
    if (existing) {
      existing.count += 1;
    } else {
      countsByType.set(typeId, { typeId, typeName, count: 1 });
    }
  }

  const breakdown = Array.from(countsByType.values()).sort((a, b) =>
    a.typeName.localeCompare(b.typeName),
  );

  return {
    totalFilms: films.length,
    breakdown,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardStatsQueryKey,
    queryFn: fetchDashboardStats,
  });
}
