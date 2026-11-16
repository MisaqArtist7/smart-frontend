import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { AdminCity, AdminProvince, City, Province } from "../types";

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

// ----------------------------------------------------
// Admin Locations Hooks (/admin/locations)
// ----------------------------------------------------

export function useAdminProvinces() {
  return useQuery<AdminProvince[]>({
    queryKey: ["admin-locations", "provinces"],
    queryFn: async () => {
      const data = await apiFetch<AdminProvince[]>("/admin/locations/provinces");
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useAdminCities(provinceId?: number | null) {
  return useQuery<AdminCity[]>({
    queryKey: ["admin-locations", "cities", provinceId],
    queryFn: async () => {
      const data = await apiFetch<AdminCity[]>(
        `/admin/locations/provinces/${provinceId}/cities`
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(provinceId && provinceId > 0),
  });
}

export function useToggleProvinceActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiFetch<AdminProvince>(`/admin/locations/provinces/${id}`, {
        method: "PATCH",
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useToggleCityActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiFetch<AdminCity>(`/admin/locations/cities/${id}`, {
        method: "PATCH",
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}
