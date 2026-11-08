/**
 * Centralized API Client and Data Layer for Smart Electric
 * Provides typed apiFetch with 401 refresh-and-retry logic, ApiError,
 * and TanStack Query hooks.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Product,
  ProductImage,
  Category,
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
// Client Mock Types & Fallbacks (used during transition)
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
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive: boolean;
  images?: ProductImage[];
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
// داده‌های پیش‌فرض و ماک (Mock Data) در حافظه کلاینت
// ----------------------------------------------------
let mockCategories: Category[] = [
  {
    id: 1,
    name: "سیم و کابل",
    slug: "cables",
    parentId: null,
    description: "انواع سیم و کابل استاندارد ساختمانی و صنعتی، شبکه و مخابرات",
    image: "/images/categories/cables.svg",
    imageAlt: "سیم و کابل",
    metaTitle: "خرید سیم و کابل ساختمانی و صنعتی",
    metaDescription: "فروش آنلاین انواع سیم و کابل با بهترین کیفیت و قیمت مناسب در اسمارت الکتریک",
    sortOrder: 1,
    isActive: true,
    createdAt: "1403/08/01",
  },
  {
    id: 2,
    name: "کلید و پریز",
    slug: "switches",
    parentId: null,
    description: "کلید و پریزهای مکانیکی، لمسی خازنی و هوشمند",
    image: "/images/categories/switches.svg",
    imageAlt: "کلید و پریز",
    metaTitle: "خرید کلید و پریز مدرن و هوشمند",
    metaDescription: "مجموعه متنوع کلید و پریز با طراحی لوکس و استانداردهای روز",
    sortOrder: 2,
    isActive: true,
    createdAt: "1403/08/02",
  },
  {
    id: 3,
    name: "تجهیزات شبکه و برق صنعتی",
    slug: "network-industrial",
    parentId: null,
    description: "تجهیزات اکتیو و پسیو شبکه، منابع تغذیه صنعتی و تابلو برق",
    image: "/images/categories/industrial.svg",
    imageAlt: "تجهیزات شبکه و برق صنعتی",
    metaTitle: "تجهیزات شبکه و اتوماسیون صنعتی",
    metaDescription: "سوئیچ‌ها و آداپتورهای قدرتمند صنعتی مقاوم در شرایط سخت",
    sortOrder: 3,
    isActive: true,
    createdAt: "1403/08/03",
  },
  {
    id: 4,
    name: "سوئیچ‌های صنعتی PoE",
    slug: "industrial-switches",
    parentId: 3,
    description: "سوئیچ‌های رکمونت و ریل‌مونت مجهز به درگاه PoE با پهنای باند گیگابیت",
    image: "/images/products/switch-8port.png",
    imageAlt: "سوئیچ‌های صنعتی PoE",
    metaTitle: "سوئیچ شبکه صنعتی PoE",
    metaDescription: "سوئیچ‌های اترنت و PoE مقاوم سازمانی و کارخانه‌ای",
    sortOrder: 1,
    isActive: true,
    createdAt: "1403/08/04",
  },
  {
    id: 5,
    name: "آداپتور و منابع تغذیه",
    slug: "adapters",
    parentId: 3,
    description: "منابع تغذیه ریلی و رومیزی با خروجی ولتاژ پایدار و ضد نوسان",
    image: "/images/products/adapter-52240.png",
    imageAlt: "آداپتور و منابع تغذیه",
    metaTitle: "منبع تغذیه و آداپتور سوئیچ شبکه",
    metaDescription: "آداپتورهای استاندارد و پرقدرت صنعتی با خروجی پایدار",
    sortOrder: 2,
    isActive: true,
    createdAt: "1403/08/05",
  },
  {
    id: 6,
    name: "روشنایی",
    slug: "lighting",
    parentId: null,
    description: "انواع لامپ‌های ال‌ای‌دی، ادیسونی فیلامنتی، پنل‌های توکار و روکار",
    image: "/images/categories/lighting.svg",
    imageAlt: "محصولات روشنایی",
    metaTitle: "خرید لامپ و ادوات روشنایی",
    metaDescription: "بهترین تجهیزات نورپردازی دکوراتیو و اداری با ضمانت",
    sortOrder: 4,
    isActive: true,
    createdAt: "1403/08/06",
  },
  {
    id: 7,
    name: "خانه هوشمند و BMS",
    slug: "smart-home",
    parentId: null,
    description: "سیستم‌های کنترل هوشمند روشنایی، دما، امنیت و پرده برقی",
    image: "/images/categories/security.svg",
    imageAlt: "خانه هوشمند و اینترنت اشیا",
    metaTitle: "تجهیزات خانه هوشمند و BMS",
    metaDescription: "راهکارهای نوین ساختمانی برای اتوماسیون و کاهش مصرف انرژی",
    sortOrder: 5,
    isActive: true,
    createdAt: "1403/08/07",
  },
];

let mockProducts: Product[] = [
  {
    id: 1,
    title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
    slug: "adapter-52240",
    categoryId: 5,
    category: { id: 5, name: "آداپتور و منابع تغذیه" },
    price: 5250000,
    discountPrice: 4950000,
    stock: 18,
    sku: "HRUI-AD-52240",
    description: "آداپتور صنعتی با بازدهی بالا و محافظت در برابر نوسانات شدید جریان برق.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 1, productId: 1, url: "/images/products/adapter-52240.png", alt: "آداپتور 52240", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/10",
    updatedAt: "1403/08/10",
  },
  {
    id: 2,
    title: "آداپتور سوئیچ شبکه Industrial Adapter 52120 HRUI",
    slug: "adapter-52120",
    categoryId: 5,
    category: { id: 5, name: "آداپتور و منابع تغذیه" },
    price: 2450000,
    discountPrice: null,
    stock: 4,
    sku: "HRUI-AD-52120",
    description: "منبع تغذیه استاندارد رومیزی و ریلی برای تجهیزات اکتیو و سوئیچ‌های شبکه.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 2, productId: 2, url: "/images/products/adapter-52120.png", alt: "آداپتور 52120", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/09",
    updatedAt: "1403/08/09",
  },
  {
    id: 3,
    title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
    slug: "switch-hr500-afg-82s",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE" },
    price: 19600000,
    discountPrice: 18500000,
    stock: 12,
    sku: "HRUI-SW-82S",
    description: "دارای ۸ پورت گیگابیت PoE و ۲ پورت SFP آپلینک نوری با بدنه آلومینیومی مستحکم.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 3, productId: 3, url: "/images/products/switch-8port.png", alt: "سوئیچ ۸ پورت", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/08",
    updatedAt: "1403/08/08",
  },
  {
    id: 4,
    title: "سوئیچ PoE صنعتی اچ ار یو ای HRUI HR500-AF-811GS",
    slug: "switch-hr500-af-811gs",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE" },
    price: 8000000,
    discountPrice: null,
    stock: 2,
    sku: "HRUI-SW-811GS",
    description: "مقاوم در برابر شرایط محیطی خشن و دمای منفی ۴۰ تا ۸۵ درجه سانتی‌گراد.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 4, productId: 4, url: "/images/products/switch-hr500.png", alt: "سوئیچ صنعتی", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/07",
    updatedAt: "1403/08/07",
  },
  {
    id: 5,
    title: "سوئیچ ۱۰ پورت POE اچ آر یو آی مدل HR901-AF-82N",
    slug: "switch-10port-poe",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE" },
    price: 28900000,
    discountPrice: 27500000,
    stock: 9,
    sku: "HRUI-SW-10P",
    description: "پشتیبانی از پروتکل‌های استاندارد IEEE 802.3af/at با توان حداکثر ۲۵۰ وات.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 5, productId: 5, url: "/images/products/switch-10port.png", alt: "سوئیچ ۱۰ پورت", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/06",
    updatedAt: "1403/08/06",
  },
  {
    id: 6,
    title: "کابل شبکه لگراند Cat6 SFTP تمام مس حلقه ۳۰۵ متری",
    slug: "cable-legrand-cat6-sftp",
    categoryId: 1,
    category: { id: 1, name: "سیم و کابل" },
    price: 6800000,
    discountPrice: null,
    stock: 25,
    sku: "CBL-LEG-CAT6",
    description: "کابل شبکه اورجینال با روکش LSZH ضد اشتعال و فویل و شیلد ضد نویز.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 6, productId: 6, url: "/images/categories/cables.svg", alt: "کابل شبکه", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/05",
    updatedAt: "1403/08/05",
  },
  {
    id: 7,
    title: "کلید لمسی هوشمند ۴ پل شیشه‌ای مشکی مدل زیگبی",
    slug: "smart-switch-4gang-touch",
    categoryId: 2,
    category: { id: 2, name: "کلید و پریز" },
    price: 1850000,
    discountPrice: null,
    stock: 3,
    sku: "SW-TCH-4G",
    description: "قابلیت کنترل از طریق اپلیکیشن موبایل، تاچ خازنی حساس و دارای نور پس‌زمینه LED.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: true,
    images: [{ id: 7, productId: 7, url: "/images/categories/switches.svg", alt: "کلید لمسی", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/04",
    updatedAt: "1403/08/04",
  },
  {
    id: 8,
    title: "لامپ ادیسونی فیلامنتی ۶۰ وات سرپیچ E27 طرح کلاسیک",
    slug: "edison-lamp-60w",
    categoryId: 6,
    category: { id: 6, name: "روشنایی" },
    price: 290000,
    discountPrice: null,
    stock: 45,
    sku: "LGT-EDS-60W",
    description: "نور گرم و دکوراتیو با حباب شفاف برای کافه‌ها و محیط‌های مدرن.",
    specs: null,
    metaTitle: null,
    metaDescription: null,
    isActive: false,
    images: [{ id: 8, productId: 8, url: "/images/categories/lighting.svg", alt: "لامپ ادیسونی", sortOrder: 0, createdAt: "" }],
    createdAt: "1403/08/03",
    updatedAt: "1403/08/03",
  },
];

// ----------------------------------------------------
// هوک‌های TanStack Query برای محصولات (Products)
// ----------------------------------------------------

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await apiFetch<Product[]>("/product");
      } catch (err) {
        try {
          return await apiFetch<Product[]>("/products");
        } catch {
          console.warn("استفاده از دیتای ماک محصولات به دلیل عدم دسترسی به سرور:", err);
          return [...mockProducts];
        }
      }
    },
  });
}

export function useProduct(slugOrId: string | number) {
  return useQuery<Product | null>({
    queryKey: ["product", slugOrId],
    queryFn: async () => {
      try {
        return await apiFetch<Product>(`/product/${slugOrId}`);
      } catch {
        try {
          const list = await apiFetch<Product[]>("/product");
          const found = list.find(
            (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId
          );
          if (found) return found;
        } catch {
          // fallback to mock data
        }
        const mockItem = mockProducts.find(
          (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId
        );
        return mockItem || null;
      }
    },
    enabled: Boolean(slugOrId),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      try {
        return await apiFetch<Product>("/product", {
          method: "POST",
          body: input,
        });
      } catch (err: unknown) {
        const error = err as Error;
        const isNetworkError =
          error?.name === "TypeError" ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("NetworkError") ||
          error?.message?.includes("network");

        if (isNetworkError) {
          console.warn("سرور بک‌اند در دسترس نیست. ذخیره در دیتای محلی (Mock):", error);
          const category = mockCategories.find((c) => c.id === input.categoryId);
          const newProduct: Product = {
            id: Date.now(),
            title: input.title,
            slug: input.slug,
            categoryId: Number(input.categoryId),
            category: category
              ? { id: category.id, name: category.name }
              : undefined,
            price: Number(input.price),
            discountPrice: input.discountPrice ? Number(input.discountPrice) : null,
            stock: Number(input.stock),
            sku: input.sku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
            description: input.description ?? null,
            specs: null,
            metaTitle: input.metaTitle ?? null,
            metaDescription: input.metaDescription ?? null,
            isActive: input.isActive ?? true,
            images:
              input.images && input.images.length > 0
                ? input.images.map((img, i) => ({
                    id: img.id ?? Date.now() + i,
                    productId: Date.now(),
                    url: img.url,
                    alt: img.alt ?? null,
                    sortOrder: img.sortOrder ?? i,
                    createdAt: new Date().toISOString(),
                  }))
                : [{ id: 1, productId: 1, url: "/images/products/adapter-52240.png", alt: null, sortOrder: 0, createdAt: "" }],
            createdAt: new Date().toLocaleDateString("fa-IR"),
            updatedAt: new Date().toLocaleDateString("fa-IR"),
          };
          mockProducts = [newProduct, ...mockProducts];
          return newProduct;
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      try {
        return await apiFetch<{ message?: string }>(`/product/${id}`, {
          method: "DELETE",
        });
      } catch (err: unknown) {
        try {
          return await apiFetch<{ message?: string }>(`/products/${id}`, {
            method: "DELETE",
          });
        } catch {
          console.warn("حذف محصول از ماک دیتای محلی:", err);
          mockProducts = mockProducts.filter((p) => p.id !== id && p.id !== Number(id));
          return { message: "Product deleted" };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

// ----------------------------------------------------
// هوک‌های TanStack Query برای دسته‌بندی‌ها (Categories)
// ----------------------------------------------------

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        return await apiFetch<Category[]>("/categories");
      } catch (err) {
        try {
          return await apiFetch<Category[]>("/category");
        } catch {
          console.warn("استفاده از دیتای ماک دسته‌بندی‌ها به دلیل عدم دسترسی به سرور:", err);
          return [...mockCategories];
        }
      }
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      try {
        return await apiFetch<Category>("/categories", {
          method: "POST",
          body: input,
        });
      } catch (err: unknown) {
        const error = err as Error;
        const isNetworkError =
          error?.name === "TypeError" ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("NetworkError") ||
          error?.message?.includes("network");

        if (isNetworkError) {
          console.warn("سرور بک‌اند در دسترس نیست. افزودن دسته‌بندی به ماک دیتای محلی:", error);
          const parent = input.parentId
            ? mockCategories.find((c) => c.id === input.parentId)
            : null;

          const newCat: Category = {
            id: Date.now(),
            parentId: input.parentId ?? null,
            parent: parent ?? null,
            name: input.name,
            slug: input.slug,
            description: input.description ?? null,
            image: input.image ?? null,
            imageAlt: input.imageAlt ?? null,
            metaTitle: input.metaTitle ?? null,
            metaDescription: input.metaDescription ?? null,
            sortOrder: input.sortOrder ?? 0,
            isActive: input.isActive ?? true,
            createdAt: new Date().toLocaleDateString("fa-IR"),
          };
          mockCategories = [...mockCategories, newCat];
          return newCat;
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCategoryInput) => {
      try {
        return await apiFetch<Category>(`/categories/${id}`, {
          method: "PUT",
          body: payload,
        });
      } catch (err: unknown) {
        const error = err as Error;
        const isNetworkError =
          error?.name === "TypeError" ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("NetworkError") ||
          error?.message?.includes("network");

        if (isNetworkError) {
          console.warn("سرور بک‌اند در دسترس نیست. ویرایش دسته‌بندی در ماک دیتای محلی:", error);
          const parent = payload.parentId
            ? mockCategories.find((c) => c.id === payload.parentId)
            : null;

          let updatedCat: Category | null = null;
          mockCategories = mockCategories.map((c) => {
            if (c.id === id) {
              updatedCat = {
                ...c,
                ...payload,
                parentId: payload.parentId !== undefined ? payload.parentId : c.parentId,
                parent: parent ?? (payload.parentId === null ? null : c.parent),
                updatedAt: new Date().toLocaleDateString("fa-IR"),
              };
              return updatedCat;
            }
            return c;
          });

          if (updatedCat) return updatedCat;
          throw new Error("دسته‌بندی مورد نظر یافت نشد.");
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiFetch<{ success: boolean }>(`/categories/${id}`, {
          method: "DELETE",
        });
      } catch (err: unknown) {
        const error = err as Error;
        const isNetworkError =
          error?.name === "TypeError" ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("NetworkError") ||
          error?.message?.includes("network");

        if (isNetworkError) {
          console.warn("سرور بک‌اند در دسترس نیست. حذف دسته‌بندی از ماک دیتای محلی:", error);
          mockCategories = mockCategories.filter((c) => c.id !== id);
          return { success: true };
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      try {
        return await apiFetch<AdminMetrics>("/admin/metrics");
      } catch (err) {
        console.warn("محاسبه شاخص‌های آماری از ماک دیتای محلی:", err);
        const activeCount = mockProducts.filter((p) => p.isActive).length;
        const lowStockCount = mockProducts.filter((p) => p.stock <= 5).length;
        return {
          totalSales: 184500000,
          activeProductsCount: activeCount,
          lowStockCount: lowStockCount,
          totalOrders: 142,
        };
      }
    },
  });
}
