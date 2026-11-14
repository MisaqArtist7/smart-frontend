import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import type { Brand, CreateBrandInput, UpdateBrandInput } from "@/lib/types";

/**
 * دریافت لیست برندهای فعال (ویترین عمومی فروشگاه)
 */
export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      try {
        const res = await apiFetch<Brand[] | { items: Brand[] } | { brands: Brand[] }>("/brands");
        if (Array.isArray(res)) return res;
        if (res && "items" in res && Array.isArray(res.items)) return res.items;
        if (res && "brands" in res && Array.isArray(res.brands)) return res.brands;
        return [];
      } catch {
        // در صورت عدم وجود اندپوینت عمومی، فال‌بک به برندهای ادمین یا آرایه خالی
        try {
          const adminRes = await apiFetch<Brand[] | { items: Brand[] }>("/admin/brands");
          const list: Brand[] = Array.isArray(adminRes) ? adminRes : adminRes?.items || [];
          return list.filter((b) => b.isActive !== false);
        } catch {
          return [];
        }
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * دریافت اطلاعات یک برند خاص بر اساس شناسه یا اسلاگ
 */
export function useBrand(idOrSlug: string | number | undefined | null) {
  return useQuery<Brand | null>({
    queryKey: ["brand", idOrSlug],
    enabled: Boolean(idOrSlug),
    queryFn: async () => {
      try {
        const numId = Number(idOrSlug);
        if (!isNaN(numId) && numId > 0 && String(numId) === String(idOrSlug)) {
          return await apiFetch<Brand>(`/brands/${numId}`);
        }
        return await apiFetch<Brand>(`/brands/slug/${idOrSlug}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت لیست تمام برندها در پنل مدیریت (شامل فعال و غیرفعال)
 */
export function useAdminBrands() {
  return useQuery<Brand[]>({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      try {
        const res = await apiFetch<Brand[] | { items: Brand[] } | { brands: Brand[] }>(
          "/admin/brands"
        );
        if (Array.isArray(res)) return res;
        if (res && "items" in res && Array.isArray(res.items)) return res.items;
        if (res && "brands" in res && Array.isArray(res.brands)) return res.brands;
        return [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const publicRes = await apiFetch<Brand[] | { items: Brand[] }>("/brands");
          return Array.isArray(publicRes) ? publicRes : publicRes?.items || [];
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

/**
 * ثبت برند جدید در پنل مدیریت
 */
export function useCreateAdminBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBrandInput): Promise<Brand> => {
      const payload = {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        logo: input.logo ? input.logo.trim() : null,
        description: input.description ? input.description.trim() : null,
        metaTitle: input.metaTitle ? input.metaTitle.trim() : null,
        metaDescription: input.metaDescription ? input.metaDescription.trim() : null,
        isActive: input.isActive ?? true,
      };

      try {
        return await apiFetch<Brand>("/admin/brands", {
          method: "POST",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Brand>("/brands", {
            method: "POST",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

/**
 * ویرایش برند در پنل مدیریت
 */
export function useUpdateAdminBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBrandInput): Promise<Brand> => {
      const payload: Record<string, unknown> = {};
      if (input.name !== undefined) payload.name = input.name.trim();
      if (input.slug !== undefined) payload.slug = input.slug.trim().toLowerCase();
      if (input.logo !== undefined) payload.logo = input.logo ? input.logo.trim() : null;
      if (input.description !== undefined) {
        payload.description = input.description ? input.description.trim() : null;
      }
      if (input.metaTitle !== undefined) {
        payload.metaTitle = input.metaTitle ? input.metaTitle.trim() : null;
      }
      if (input.metaDescription !== undefined) {
        payload.metaDescription = input.metaDescription ? input.metaDescription.trim() : null;
      }
      if (input.isActive !== undefined) payload.isActive = input.isActive;

      try {
        return await apiFetch<Brand>(`/admin/brands/${id}`, {
          method: "PATCH",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Brand>(`/brands/${id}`, {
            method: "PATCH",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand", variables.id] });
    },
  });
}

/**
 * حذف برند در پنل مدیریت
 */
export function useDeleteAdminBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ success: boolean; message?: string }> => {
      try {
        return await apiFetch<{ success: boolean; message?: string }>(`/admin/brands/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<{ success: boolean; message?: string }>(`/brands/${id}`, {
            method: "DELETE",
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}
