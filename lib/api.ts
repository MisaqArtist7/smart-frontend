/**
 * Centralized API Client and Data Layer for Smart Electric
 * Provides typed apiFetch with 401 refresh-and-retry logic, ApiError,
 * and TanStack Query hooks strictly synchronized with NestJS backend (Prisma PostgreSQL).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Product,
  Category,
  Address,
  CreateAddressInput,
  UpdateAddressInput,
  Order,
  CreateOrderInput,
  ApiErrorResponse,
} from "./types";

export * from "./types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

// ----------------------------------------------------
// Typed ApiError
// ----------------------------------------------------

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ----------------------------------------------------
// 401 Session Refresh Deduplication
// ----------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;
let unauthorizedListeners: Array<() => void> = [];

export function onUnauthorized(callback: () => void): () => void {
  unauthorizedListeners.push(callback);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((cb) => cb !== callback);
  };
}

export function triggerUnauthorized() {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in unauthorized listener:", e);
    }
  });
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/login") && pathname !== "/") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
  }
}

/**
 * Deduplicated POST /auth/refresh
 * Concurrent 401 requests share a single refresh call.
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ----------------------------------------------------
// Centralized Fetch Wrapper: apiFetch
// ----------------------------------------------------

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  _isRetry?: boolean;
}

/**
 * Universal JSON API fetch wrapper:
 * - Credentials: "include" for httpOnly cookies
 * - JSON in / JSON out
 * - Error message extraction (joins string arrays with "، ")
 * - Deduplicated 401 refresh & single retry on non-auth endpoints
 * - Typed ApiError throwing
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let body = options?.body;
  if (body !== undefined && !(body instanceof FormData) && typeof body !== "string") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
  });

  // Handle 401 retry on non-auth endpoints
  const isAuthEndpoint =
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/request-otp") ||
    endpoint.includes("/auth/verify-otp");

  if (response.status === 401 && !isAuthEndpoint && !options?._isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(endpoint, {
        ...options,
        _isRetry: true,
      });
    } else {
      triggerUnauthorized();
    }
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      // not JSON
    }

    let message = `خطای سرور: ${response.status}`;
    if (errorData?.message) {
      if (Array.isArray(errorData.message)) {
        message = errorData.message.join("، ");
      } else if (typeof errorData.message === "string") {
        message = errorData.message;
      }
    } else if (response.status === 401) {
      message = "نشست کاربری شما منقضی شده است یا احراز هویت انجام نشده است";
    } else if (response.status === 403) {
      message = "شما اجازه دسترسی به این بخش را ندارید (دسترسی غیرمجاز ۴۰۳)";
    } else if (response.status === 404) {
      message = "اطلاعات یا منبع مورد نظر یافت نشد (خطای ۴۰۴)";
    } else if (response.status === 409) {
      message = "تداخل در درخواست یا اتمام سقف مجاز (خطای ۴۰۹)";
    } else if (response.status === 429) {
      message = "کمی صبر کنید. تعداد درخواست‌های ارسالی بیش از حد مجاز است";
    }

    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ----------------------------------------------------
// DTOs & Inputs
// ----------------------------------------------------

export interface ProductCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface CreateProductInput {
  title: string;
  slug: string;
  categoryId: number;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku?: string;
  description?: string | null;
  specs?: Record<string, unknown> | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: number | null;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: number;
}

export interface AdminMetrics {
  totalSales: number;
  activeProductsCount: number;
  lowStockCount: number;
  totalOrders: number;
}

// ----------------------------------------------------
// 1. هوک‌های محصولات (Products)
// ----------------------------------------------------

/**
 * دریافت لیست محصولات عمومی فعال
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const data = await apiFetch<Product[]>("/product");
      return Array.isArray(data) ? data : [];
    },
  });
}

/**
 * دریافت لیست محصولات پنل مدیریت (شامل فعال و غیرفعال)
 */
export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Product[]>("/admin/product");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Product[]>("/product");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت جزئیات تک‌محصول با شناسه عددی یا اسلاگ
 */
export function useProduct(slugOrId: string | number) {
  return useQuery<Product | null>({
    queryKey: ["product", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;

      const numId = Number(slugOrId);
      if (!isNaN(numId) && numId > 0 && String(numId) === String(slugOrId)) {
        return await apiFetch<Product>(`/product/${numId}`);
      }

      // جستجو با اسلاگ
      try {
        return await apiFetch<Product>(`/product/by-slug/${slugOrId}`);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          const allProducts = await apiFetch<Product[]>("/product");
          const found = allProducts.find((p) => p.slug === slugOrId);
          if (found) return found;
        }
        throw err;
      }
    },
    enabled: Boolean(slugOrId),
  });
}

/**
 * ایجاد محصول جدید
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const payload: Record<string, unknown> = {
        title: input.title.trim(),
        slug: input.slug.trim(),
        categoryId: Number(input.categoryId),
        price: Number(input.price),
        stock: Number(input.stock),
        isActive: Boolean(input.isActive),
      };

      if (input.discountPrice !== undefined && input.discountPrice !== null) {
        payload.discountPrice = Number(input.discountPrice);
      }
      if (input.sku && input.sku.trim()) {
        payload.sku = input.sku.trim();
      }
      if (input.description && input.description.trim()) {
        payload.description = input.description.trim();
      }
      if (input.specs && typeof input.specs === "object") {
        payload.specs = input.specs;
      }
      if (input.metaTitle && input.metaTitle.trim()) {
        payload.metaTitle = input.metaTitle.trim();
      }
      if (input.metaDescription && input.metaDescription.trim()) {
        payload.metaDescription = input.metaDescription.trim();
      }

      return await apiFetch<Product>("/product", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

/**
 * ویرایش محصول
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProductInput) => {
      const payload: Record<string, unknown> = {};

      if (input.title !== undefined) payload.title = input.title.trim();
      if (input.slug !== undefined) payload.slug = input.slug.trim();
      if (input.categoryId !== undefined) payload.categoryId = Number(input.categoryId);
      if (input.price !== undefined) payload.price = Number(input.price);
      if (input.discountPrice !== undefined) {
        payload.discountPrice = input.discountPrice !== null ? Number(input.discountPrice) : null;
      }
      if (input.stock !== undefined) payload.stock = Number(input.stock);
      if (input.isActive !== undefined) payload.isActive = Boolean(input.isActive);
      if (input.sku !== undefined) payload.sku = input.sku ? input.sku.trim() : null;
      if (input.description !== undefined) payload.description = input.description ? input.description.trim() : null;
      if (input.specs !== undefined) payload.specs = input.specs;
      if (input.metaTitle !== undefined) payload.metaTitle = input.metaTitle ? input.metaTitle.trim() : null;
      if (input.metaDescription !== undefined) payload.metaDescription = input.metaDescription ? input.metaDescription.trim() : null;

      return await apiFetch<Product>(`/product/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

/**
 * حذف محصول
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiFetch<{ success?: boolean; message?: string }>(`/product/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

// ----------------------------------------------------
// 2. هوک‌های دسته‌بندی‌ها (Categories)
// ----------------------------------------------------

/**
 * دریافت لیست دسته‌بندی‌ها
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Category[]>("/categories");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Category[]>("/category");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت یک دسته‌بندی با شناسه
 */
export function useCategory(id: number | string) {
  return useQuery<Category | null>({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await apiFetch<Category>(`/categories/${id}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Category>(`/category/${id}`);
        }
        throw err;
      }
    },
    enabled: Boolean(id),
  });
}

/**
 * ایجاد دسته‌بندی جدید
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const payload: Record<string, unknown> = {
        name: input.name.trim(),
        slug: input.slug.trim(),
      };

      if (input.parentId !== undefined && input.parentId !== null) {
        payload.parentId = Number(input.parentId);
      }
      if (input.description && input.description.trim()) {
        payload.description = input.description.trim();
      }
      if (input.image && input.image.trim()) {
        payload.image = input.image.trim();
      }
      if (input.imageAlt && input.imageAlt.trim()) {
        payload.imageAlt = input.imageAlt.trim();
      }
      if (input.metaTitle && input.metaTitle.trim()) {
        payload.metaTitle = input.metaTitle.trim();
      }
      if (input.metaDescription && input.metaDescription.trim()) {
        payload.metaDescription = input.metaDescription.trim();
      }
      if (input.sortOrder !== undefined) {
        payload.sortOrder = Number(input.sortOrder);
      }
      if (input.isActive !== undefined) {
        payload.isActive = Boolean(input.isActive);
      }

      try {
        return await apiFetch<Category>("/categories", {
          method: "POST",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Category>("/category", {
            method: "POST",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/**
 * ویرایش دسته‌بندی
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCategoryInput) => {
      const payload: Record<string, unknown> = {};

      if (input.name !== undefined) payload.name = input.name.trim();
      if (input.slug !== undefined) payload.slug = input.slug.trim();
      if (input.parentId !== undefined) {
        payload.parentId = input.parentId !== null ? Number(input.parentId) : null;
      }
      if (input.description !== undefined) payload.description = input.description ? input.description.trim() : null;
      if (input.image !== undefined) payload.image = input.image ? input.image.trim() : null;
      if (input.imageAlt !== undefined) payload.imageAlt = input.imageAlt ? input.imageAlt.trim() : null;
      if (input.metaTitle !== undefined) payload.metaTitle = input.metaTitle ? input.metaTitle.trim() : null;
      if (input.metaDescription !== undefined) payload.metaDescription = input.metaDescription ? input.metaDescription.trim() : null;
      if (input.sortOrder !== undefined) payload.sortOrder = Number(input.sortOrder);
      if (input.isActive !== undefined) payload.isActive = Boolean(input.isActive);

      try {
        return await apiFetch<Category>(`/categories/${id}`, {
          method: "PATCH",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Category>(`/category/${id}`, {
            method: "PATCH",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/**
 * حذف دسته‌بندی
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch<{ success?: boolean; message?: string }>(`/categories/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<{ success?: boolean; message?: string }>(`/category/${id}`, {
            method: "DELETE",
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ----------------------------------------------------
// 3. هوک‌های آدرس‌ها (Addresses)
// ----------------------------------------------------

/**
 * دریافت آدرس‌های کاربر فعلی
 */
export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Address[]>("/addresses");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Address[]>("/address");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

/**
 * افزودن آدرس جدید
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      const payload: Record<string, unknown> = {
        title: input.title.trim(),
        receiverName: input.receiverName.trim(),
        receiverPhone: input.receiverPhone.trim(),
        province: input.province.trim(),
        city: input.city.trim(),
        addressLine: input.addressLine.trim(),
        postalCode: input.postalCode.trim(),
      };
      if (input.isDefault !== undefined) {
        payload.isDefault = Boolean(input.isDefault);
      }

      try {
        return await apiFetch<Address>("/addresses", {
          method: "POST",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Address>("/address", {
            method: "POST",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

/**
 * ویرایش آدرس
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAddressInput) => {
      const payload: Record<string, unknown> = {};

      if (input.title !== undefined) payload.title = input.title.trim();
      if (input.receiverName !== undefined) payload.receiverName = input.receiverName.trim();
      if (input.receiverPhone !== undefined) payload.receiverPhone = input.receiverPhone.trim();
      if (input.province !== undefined) payload.province = input.province.trim();
      if (input.city !== undefined) payload.city = input.city.trim();
      if (input.addressLine !== undefined) payload.addressLine = input.addressLine.trim();
      if (input.postalCode !== undefined) payload.postalCode = input.postalCode.trim();
      if (input.isDefault !== undefined) payload.isDefault = Boolean(input.isDefault);

      try {
        return await apiFetch<Address>(`/addresses/${id}`, {
          method: "PATCH",
          body: payload,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<Address>(`/address/${id}`, {
            method: "PATCH",
            body: payload,
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

/**
 * حذف آدرس
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch<{ message?: string }>(`/addresses/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return await apiFetch<{ message?: string }>(`/address/${id}`, {
            method: "DELETE",
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

/**
 * تنظیم آدرس پیش‌فرض
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch<Address>(`/addresses/${id}/default`, {
          method: "PATCH",
        });
      } catch {
        return await apiFetch<Address>(`/addresses/${id}`, {
          method: "PATCH",
          body: { isDefault: true },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

// ----------------------------------------------------
// 4. هوک‌های سفارش‌ها (Orders)
// ----------------------------------------------------

/**
 * ثبت سفارش جدید با روش پرداخت کارت‌به‌کارت
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const payload: Record<string, unknown> = {
        addressId: Number(input.addressId),
        paymentMethod: "CARD_TO_CARD",
        items: input.items.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
        })),
      };

      if (input.note && input.note.trim()) {
        payload.note = input.note.trim().slice(0, 500);
      }

      return await apiFetch<Order>("/orders", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

/**
 * دریافت جزئیات یک سفارش با شناسه
 */
export function useOrder(id: number | string | undefined | null) {
  return useQuery<Order | null>({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) return null;
      return await apiFetch<Order>(`/orders/${id}`);
    },
    enabled: Boolean(id),
  });
}

/**
 * دریافت تاریخچه سفارش‌های کاربر جاری
 */
export function useMyOrders() {
  return useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Order[]>("/orders/my");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Order[]>("/orders");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

/**
 * بارگذاری تصویر یا مشخصات فیش واریزی کارت‌به‌کارت
 */
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, receipt }: { orderId: number | string; receipt: File | string }) => {
      if (receipt instanceof File) {
        const formData = new FormData();
        formData.append("file", receipt);
        return await apiFetch<Order>(`/orders/${orderId}/receipt`, {
          method: "POST",
          body: formData,
        });
      } else {
        return await apiFetch<Order>(`/orders/${orderId}/receipt`, {
          method: "POST",
          body: { receiptUrl: receipt },
        });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

/**
 * دریافت تمام سفارش‌ها برای پنل ادمین
 */
export function useAdminOrders() {
  return useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Order[]>("/admin/orders");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Order[]>("/orders");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

// ----------------------------------------------------
// 5. شاخص‌های آماری پیشخوان مدیریت (Admin Metrics)
// ----------------------------------------------------

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      try {
        return await apiFetch<AdminMetrics>("/admin/metrics");
      } catch {
        try {
          const prods = await apiFetch<Product[]>("/product");
          const activeCount = prods.filter((p) => p.isActive).length;
          const lowStockCount = prods.filter((p) => p.stock <= 5).length;
          return {
            totalSales: 0,
            activeProductsCount: activeCount,
            lowStockCount: lowStockCount,
            totalOrders: 0,
          };
        } catch {
          return {
            totalSales: 0,
            activeProductsCount: 0,
            lowStockCount: 0,
            totalOrders: 0,
          };
        }
      }
    },
  });
}
