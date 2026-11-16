import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { City, Province } from "../types";

const LOCATION_STALE_TIME = 1000 * 60 * 60; // 1 hour
const LOCATION_GC_TIME = 1000 * 60 * 60 * 24; // 24 hours

export function useProvinces() {
  return useQuery<Province[]>({
    queryKey: ["locations", "provinces"],
    queryFn: async () => {
      const data = await apiFetch<Province[]>("/locations/provinces");
      return Array.isArray(data) ? data : [];
    },
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
  });
}

export function useCities(provinceId?: number) {
  return useQuery<City[]>({
    queryKey: ["locations", "cities", provinceId],
    queryFn: async () => {
      const data = await apiFetch<City[]>(
        `/locations/provinces/${provinceId}/cities`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(provinceId && provinceId > 0),
    staleTime: LOCATION_STALE_TIME,
    gcTime: LOCATION_GC_TIME,
  });
}
