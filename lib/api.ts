/**
 * Centralized API Client and Data Layer for Smart Electric
 * Provides typed apiFetch with 401 refresh-and-retry logic, ApiError,
 * and TanStack Query hooks strictly synchronized with NestJS backend (Prisma PostgreSQL).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  User,
  Product,
  Category,
  Address,
  CreateAddressInput,
  UpdateAddressInput,
  Order,
  CreateOrderInput,
  ApiErrorResponse,
  PaymentInfoResponse,
  PaginatedOrdersResponse,
  AdminOrderListItem,
  AdminOrdersQueryOptions,
  AdminOrdersResponse,
  ReviewReceiptInput,
  UpdateOrderStatusInput,
  AdminCancelOrderInput,
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
  brandId?: number | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku?: string;
  description?: string | null;
  specs?: Record<string, unknown> | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive: boolean;
  images?: Array<{ url: string; alt?: string | null; sortOrder?: number }>;
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
      const rawSlug = String(slugOrId).trim();
      let cleanSlug = rawSlug;
      try {
        cleanSlug = decodeURIComponent(rawSlug);
      } catch {
        cleanSlug = rawSlug;
      }

      try {
        return await apiFetch<Product>(`/product/slug/${encodeURIComponent(cleanSlug)}`);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          const allProducts = await apiFetch<Product[]>("/product");
          const found = allProducts.find((p) => p.slug === rawSlug || p.slug === cleanSlug);
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
      if (input.brandId !== undefined) {
        payload.brandId = input.brandId ? Number(input.brandId) : null;
      }
      if (Array.isArray(input.images)) {
        payload.images = input.images;
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
      if (input.brandId !== undefined) payload.brandId = input.brandId ? Number(input.brandId) : null;
      if (input.images !== undefined) payload.images = input.images;

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
        const data = await apiFetch<unknown>("/categories");
        if (Array.isArray(data)) return data as Category[];
        if (data && typeof data === "object") {
          if ("categories" in data && Array.isArray((data as { categories: unknown }).categories)) {
            return (data as { categories: Category[] }).categories;
          }
          if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
            return (data as { items: Category[] }).items;
          }
        }
        return [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<unknown>("/category");
          if (Array.isArray(fallback)) return fallback as Category[];
          if (fallback && typeof fallback === "object") {
            if ("categories" in fallback && Array.isArray((fallback as { categories: unknown }).categories)) {
              return (fallback as { categories: Category[] }).categories;
            }
            if ("items" in fallback && Array.isArray((fallback as { items: unknown }).items)) {
              return (fallback as { items: Category[] }).items;
            }
          }
          return [];
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت یک دسته‌بندی با شناسه عددی یا اسلاگ متنی
 */
export function useCategory(idOrSlug: number | string | undefined | null) {
  return useQuery<Category | null>({
    queryKey: ["category", idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      const numId = Number(idOrSlug);
      const isNumeric = !isNaN(numId) && String(numId) === String(idOrSlug).trim();

      if (isNumeric) {
        try {
          return await apiFetch<Category>(`/categories/${numId}`);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            return await apiFetch<Category>(`/category/${numId}`);
          }
          throw err;
        }
      }

      // جستجو با اسلاگ متنی
      const slug = String(idOrSlug).trim();
      let cleanSlug = slug;
      try {
        cleanSlug = decodeURIComponent(slug);
      } catch {
        cleanSlug = slug;
      }

      try {
        return await apiFetch<Category>(`/categories/slug/${encodeURIComponent(cleanSlug)}`);
      } catch {
        // فال‌بک: جستجو در میان تمام دسته‌بندی‌ها
        try {
          const list = await apiFetch<unknown>("/categories");
          let items: Category[] = [];
          if (Array.isArray(list)) items = list as Category[];
          else if (list && typeof list === "object" && "items" in list && Array.isArray((list as { items: unknown }).items)) {
            items = (list as { items: Category[] }).items;
          }
          return items.find((c) => c.slug === slug || c.slug === cleanSlug) || null;
        } catch {
          return null;
        }
      }
    },
    enabled: Boolean(idOrSlug),
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
 * دریافت مشخصات کارت بانکی جهت پرداخت کارت‌به‌کارت
 */
export function usePaymentInfo() {
  return useQuery<PaymentInfoResponse>({
    queryKey: ["payment-info"],
    queryFn: async () => {
      try {
        return await apiFetch<PaymentInfoResponse>("/payment-info");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            cardNumber: "۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸",
            cardHolder: "فروشگاه اسمارت الکتریک",
            bankName: "بانک ملی ایران",
          };
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15,
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

export interface MyOrdersOptions {
  page?: number;
  limit?: number;
}

export type MyOrdersResponse = Order[] & {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * دریافت تاریخچه سفارش‌های کاربر جاری (صفحه‌بندی‌شده همراه با سازگاری کامل آرایه‌ای)
 */
export function useMyOrders(options: MyOrdersOptions = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;

  return useQuery<MyOrdersResponse>({
    queryKey: ["my-orders", { page, limit }],
    queryFn: async () => {
      try {
        const data = await apiFetch<PaginatedOrdersResponse | Order[]>(
          `/orders/my?page=${page}&limit=${limit}`
        );

        let items: Order[] = [];
        let total = 0;
        let currentPage = page;
        let currentLimit = limit;

        if (Array.isArray(data)) {
          items = data;
          total = data.length;
          currentPage = 1;
          currentLimit = data.length || limit;
        } else if (data && typeof data === "object") {
          items = Array.isArray(data.items) ? data.items : [];
          total = typeof data.total === "number" ? data.total : items.length;
          currentPage = typeof data.page === "number" ? data.page : page;
          currentLimit = typeof data.limit === "number" ? data.limit : limit;
        }

        const totalPages = Math.max(1, Math.ceil(total / (currentLimit || 10)));
        const resArray = [...items] as MyOrdersResponse;
        resArray.items = items;
        resArray.total = total;
        resArray.page = currentPage;
        resArray.limit = currentLimit;
        resArray.totalPages = totalPages;

        return resArray;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          try {
            const fallback = await apiFetch<Order[]>("/orders");
            const items = Array.isArray(fallback) ? fallback : [];
            const resArray = [...items] as MyOrdersResponse;
            resArray.items = items;
            resArray.total = items.length;
            resArray.page = 1;
            resArray.limit = items.length || limit;
            resArray.totalPages = 1;
            return resArray;
          } catch {
            const emptyArray = [] as unknown as MyOrdersResponse;
            emptyArray.items = [];
            emptyArray.total = 0;
            emptyArray.page = page;
            emptyArray.limit = limit;
            emptyArray.totalPages = 1;
            return emptyArray;
          }
        }
        throw err;
      }
    },
  });
}

/**
 * بارگذاری فیش واریزی کارت‌به‌کارت
 * توجه: با استفاده از FormData با فیلد "receipt" و عدم ست کردن هدر دستی Content-Type
 */
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      receipt,
    }: {
      orderId: number | string;
      receipt: File | string;
    }) => {
      let body: FormData | { receiptUrl: string };
      if (receipt instanceof File) {
        const formData = new FormData();
        formData.append("receipt", receipt);
        body = formData;
      } else {
        body = { receiptUrl: receipt };
      }

      try {
        return await apiFetch<Order>(`/orders/${orderId}/receipt`, {
          method: "POST",
          body,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          throw new ApiError(
            409,
            "وضعیت این سفارش تغییر کرده است یا رسید پرداختی قبلاً برای آن ثبت شده است."
          );
        }
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

/**
 * لغو سفارش در انتظار پرداخت توسط کاربر (آزادسازی کالاهای رزرو شده)
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number | string) => {
      return await apiFetch<Order>(`/orders/${orderId}/cancel`, {
        method: "POST",
      });
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/**
 * دریافت تصویر رسید واریزی مشتری با کوکی احراز هویت و تبدیل به blob URL
 */
export async function fetchReceiptBlob(orderId: number | string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/receipt`, {
    credentials: "include",
    headers: {
      Accept: "image/*, application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`خطا در بارگذاری تصویر فیش (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (data?.url || data?.receiptUrl) {
      return data.url || data.receiptUrl;
    }
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export type AdminOrdersResult = AdminOrderListItem[] & {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * دریافت لیست سفارش‌ها برای پنل ادمین با قابلیت صفحه‌بندی، فیلتر وضعیت و جستجو
 */
export function useAdminOrders(options: AdminOrdersQueryOptions = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const status = options.status || undefined;
  const paymentStatus = options.paymentStatus || undefined;
  const search = options.search?.trim() || undefined;
  const dateFrom = options.dateFrom || undefined;
  const dateTo = options.dateTo || undefined;

  return useQuery<AdminOrdersResult>({
    queryKey: [
      "admin-orders",
      { page, limit, status, paymentStatus, search, dateFrom, dateTo },
    ],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (page) q.set("page", String(page));
      if (limit) q.set("limit", String(limit));
      if (status) q.set("status", status);
      if (paymentStatus) q.set("paymentStatus", paymentStatus);
      if (search) q.set("search", search);
      if (dateFrom) q.set("dateFrom", dateFrom);
      if (dateTo) q.set("dateTo", dateTo);

      const qs = q.toString();
      const endpoint = `/admin/orders${qs ? `?${qs}` : ""}`;

      try {
        const data = await apiFetch<AdminOrdersResponse | AdminOrderListItem[]>(endpoint);
        let items: AdminOrderListItem[] = [];
        let total = 0;
        let currentPage = page;
        let currentLimit = limit;

        if (Array.isArray(data)) {
          items = data;
          total = data.length;
          currentPage = 1;
          currentLimit = data.length || limit;
        } else if (data && typeof data === "object") {
          items = Array.isArray(data.items) ? data.items : [];
          total = typeof data.total === "number" ? data.total : items.length;
          currentPage = typeof data.page === "number" ? data.page : page;
          currentLimit = typeof data.limit === "number" ? data.limit : limit;
        }

        const totalPages = Math.max(1, Math.ceil(total / (currentLimit || 10)));
        const resArray = [...items] as AdminOrdersResult;
        resArray.items = items;
        resArray.total = total;
        resArray.page = currentPage;
        resArray.limit = currentLimit;
        resArray.totalPages = totalPages;
        return resArray;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          try {
            const fallback = await apiFetch<AdminOrderListItem[]>("/orders");
            const items = Array.isArray(fallback) ? fallback : [];
            const resArray = [...items] as AdminOrdersResult;
            resArray.items = items;
            resArray.total = items.length;
            resArray.page = 1;
            resArray.limit = items.length || limit;
            resArray.totalPages = 1;
            return resArray;
          } catch {
            const emptyArray = [] as unknown as AdminOrdersResult;
            emptyArray.items = [];
            emptyArray.total = 0;
            emptyArray.page = page;
            emptyArray.limit = limit;
            emptyArray.totalPages = 1;
            return emptyArray;
          }
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت جزئیات یک سفارش در پنل ادمین
 */
export function useAdminOrder(id: number | string | undefined | null) {
  return useQuery<AdminOrderListItem | null>({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      if (!id) return null;
      return await apiFetch<AdminOrderListItem>(`/admin/orders/${id}`);
    },
    enabled: Boolean(id),
  });
}

/**
 * دریافت تصویر فیش واریزی در پنل ادمین با اعتبارسنجی کوکی
 */
export async function fetchAdminReceiptBlob(orderId: number | string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/receipt`, {
    credentials: "include",
    headers: {
      Accept: "image/*, application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return fetchReceiptBlob(orderId);
    }
    throw new Error(`خطا در دریافت تصویر فیش توسط ادمین (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (data?.url || data?.receiptUrl) {
      return data.url || data.receiptUrl;
    }
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * تایید یا رد فیش واریزی توسط ادمین
 * PATCH /admin/orders/:id/payment { action: "approve" | "reject", adminNote?: string }
 */
export function useReviewReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewReceiptInput) => {
      const payload: Record<string, unknown> = {
        action: input.action,
      };
      if (input.adminNote && input.adminNote.trim()) {
        payload.adminNote = input.adminNote.trim().slice(0, 500);
      }

      return await apiFetch<Order>(`/admin/orders/${input.orderId}/payment`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
}

/**
 * تغییر وضعیت پردازش سفارش توسط ادمین (CONFIRMED -> SHIPPED -> DELIVERED)
 * PATCH /admin/orders/:id/status { status, trackingCode?, adminNote? }
 */
export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrderStatusInput) => {
      const payload: Record<string, unknown> = {
        status: input.status,
      };
      if (input.trackingCode && input.trackingCode.trim()) {
        payload.trackingCode = input.trackingCode.trim().slice(0, 50);
      }
      if (input.adminNote && input.adminNote.trim()) {
        payload.adminNote = input.adminNote.trim().slice(0, 500);
      }

      return await apiFetch<Order>(`/admin/orders/${input.orderId}/status`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
}

/**
 * لغو سفارش توسط ادمین و بازگرداندن اتمیک موجودی اقلام به انبار
 * POST /admin/orders/:id/cancel { adminNote? }
 */
export function useAdminCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminCancelOrderInput) => {
      const payload: Record<string, unknown> = {};
      if (input.adminNote && input.adminNote.trim()) {
        payload.adminNote = input.adminNote.trim().slice(0, 500);
      }

      return await apiFetch<Order>(`/admin/orders/${input.orderId}/cancel`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
}

/**
 * دریافت لیست تمام دسته‌بندی‌ها (فعال و غیرفعال) برای پنل ادمین
 * GET /admin/categories
 */
export function useAdminCategories() {
  return useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Category[]>("/admin/categories");
        return Array.isArray(data) ? data : [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const fallback = await apiFetch<Category[]>("/categories");
          return Array.isArray(fallback) ? fallback : [];
        }
        throw err;
      }
    },
  });
}

/**
 * دریافت لیست کاربران برای پنل ادمین
 */
export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const data = await apiFetch<User[]>("/admin/users");
        return Array.isArray(data) ? data : [];
      } catch {
        try {
          const fallback = await apiFetch<User[]>("/users");
          return Array.isArray(fallback) ? fallback : [];
        } catch {
          return [];
        }
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

// ----------------------------------------------------
// آپلود امن تصاویر در پنل مدیریت (Uploads)
// ----------------------------------------------------

export async function uploadAdminImage(
  file: File,
  type: "product" | "category" | "brand"
): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  return await apiFetch<{ path: string }>("/admin/uploads", {
    method: "POST",
    body: formData,
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: "product" | "category" | "brand";
    }) => {
      return await uploadAdminImage(file, type);
    },
  });
}

// ----------------------------------------------------
// 5. ماژول تماس با ما (Contact Us)
// ----------------------------------------------------
export * from "./api/contact";
export * from "./api/reviews";
export * from "./api/coupons";
export * from "./api/brands";
