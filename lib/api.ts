/**
 * API Integration Layer and TanStack Query Hooks for Smart Electric Admin
 * Supports real REST API with automatic graceful fallback to mock data when backend is offline.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ProductImage {
  id?: number;
  url: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  categoryId: number;
  category?: ProductCategory;
  categoryName?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku?: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt?: string;
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

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  parentName?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: number | string | null;
  sortOrder?: number;
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
    parentName: null,
    sortOrder: 1,
    createdAt: "1403/08/01",
  },
  {
    id: 2,
    name: "کلید و پریز",
    slug: "switches",
    parentId: null,
    parentName: null,
    sortOrder: 2,
    createdAt: "1403/08/02",
  },
  {
    id: 3,
    name: "تجهیزات شبکه و برق صنعتی",
    slug: "network-industrial",
    parentId: null,
    parentName: null,
    sortOrder: 3,
    createdAt: "1403/08/03",
  },
  {
    id: 4,
    name: "سوئیچ‌های صنعتی PoE",
    slug: "industrial-switches",
    parentId: 3,
    parentName: "تجهیزات شبکه و برق صنعتی",
    sortOrder: 1,
    createdAt: "1403/08/04",
  },
  {
    id: 5,
    name: "آداپتور و منابع تغذیه",
    slug: "adapters",
    parentId: 3,
    parentName: "تجهیزات شبکه و برق صنعتی",
    sortOrder: 2,
    createdAt: "1403/08/05",
  },
  {
    id: 6,
    name: "روشنایی",
    slug: "lighting",
    parentId: null,
    parentName: null,
    sortOrder: 4,
    createdAt: "1403/08/06",
  },
  {
    id: 7,
    name: "خانه هوشمند و BMS",
    slug: "smart-home",
    parentId: null,
    parentName: null,
    sortOrder: 5,
    createdAt: "1403/08/07",
  },
];

let mockProducts: Product[] = [
  {
    id: 1,
    title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
    slug: "adapter-52240",
    categoryId: 5,
    category: { id: 5, name: "آداپتور و منابع تغذیه", slug: "adapters" },
    categoryName: "آداپتور و منابع تغذیه",
    price: 5250000,
    discountPrice: 4950000,
    stock: 18,
    sku: "HRUI-AD-52240",
    description: "آداپتور صنعتی با بازدهی بالا و محافظت در برابر نوسانات شدید جریان برق.",
    isActive: true,
    images: [{ id: 1, url: "/images/products/adapter-52240.png" }],
    createdAt: "1403/08/10",
  },
  {
    id: 2,
    title: "آداپتور سوئیچ شبکه Industrial Adapter 52120 HRUI",
    slug: "adapter-52120",
    categoryId: 5,
    category: { id: 5, name: "آداپتور و منابع تغذیه", slug: "adapters" },
    categoryName: "آداپتور و منابع تغذیه",
    price: 2450000,
    discountPrice: null,
    stock: 4,
    sku: "HRUI-AD-52120",
    description: "منبع تغذیه استاندارد رومیزی و ریلی برای تجهیزات اکتیو و سوئیچ‌های شبکه.",
    isActive: true,
    images: [{ id: 2, url: "/images/products/adapter-52120.png" }],
    createdAt: "1403/08/09",
  },
  {
    id: 3,
    title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
    slug: "switch-hr500-afg-82s",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE", slug: "industrial-switches" },
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 19600000,
    discountPrice: 18500000,
    stock: 12,
    sku: "HRUI-SW-82S",
    description: "دارای ۸ پورت گیگابیت PoE و ۲ پورت SFP آپلینک نوری با بدنه آلومینیومی مستحکم.",
    isActive: true,
    images: [{ id: 3, url: "/images/products/switch-8port.png" }],
    createdAt: "1403/08/08",
  },
  {
    id: 4,
    title: "سوئیچ PoE صنعتی اچ ار یو ای HRUI HR500-AF-811GS",
    slug: "switch-hr500-af-811gs",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE", slug: "industrial-switches" },
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 8000000,
    discountPrice: null,
    stock: 2,
    sku: "HRUI-SW-811GS",
    description: "مقاوم در برابر شرایط محیطی خشن و دمای منفی ۴۰ تا ۸۵ درجه سانتی‌گراد.",
    isActive: true,
    images: [{ id: 4, url: "/images/products/switch-hr500.png" }],
    createdAt: "1403/08/07",
  },
  {
    id: 5,
    title: "سوئیچ ۱۰ پورت POE اچ آر یو آی مدل HR901-AF-82N",
    slug: "switch-10port-poe",
    categoryId: 4,
    category: { id: 4, name: "سوئیچ‌های صنعتی PoE", slug: "industrial-switches" },
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 28900000,
    discountPrice: 27500000,
    stock: 9,
    sku: "HRUI-SW-10P",
    description: "پشتیبانی از پروتکل‌های استاندارد IEEE 802.3af/at با توان حداکثر ۲۵۰ وات.",
    isActive: true,
    images: [{ id: 5, url: "/images/products/switch-10port.png" }],
    createdAt: "1403/08/06",
  },
  {
    id: 6,
    title: "کابل شبکه لگراند Cat6 SFTP تمام مس حلقه ۳۰۵ متری",
    slug: "cable-legrand-cat6-sftp",
    categoryId: 1,
    category: { id: 1, name: "سیم و کابل", slug: "cables" },
    categoryName: "سیم و کابل",
    price: 6800000,
    discountPrice: null,
    stock: 25,
    sku: "CBL-LEG-CAT6",
    description: "کابل شبکه اورجینال با روکش LSZH ضد اشتعال و فویل و شیلد ضد نویز.",
    isActive: true,
    images: [{ id: 6, url: "/images/categories/cables.svg" }],
    createdAt: "1403/08/05",
  },
  {
    id: 7,
    title: "کلید لمسی هوشمند ۴ پل شیشه‌ای مشکی مدل زیگبی",
    slug: "smart-switch-4gang-touch",
    categoryId: 2,
    category: { id: 2, name: "کلید و پریز", slug: "switches" },
    categoryName: "کلید و پریز",
    price: 1850000,
    discountPrice: null,
    stock: 3,
    sku: "SW-TCH-4G",
    description: "قابلیت کنترل از طریق اپلیکیشن موبایل، تاچ خازنی حساس و دارای نور پس‌زمینه LED.",
    isActive: true,
    images: [{ id: 7, url: "/images/categories/switches.svg" }],
    createdAt: "1403/08/04",
  },
  {
    id: 8,
    title: "لامپ ادیسونی فیلامنتی ۶۰ وات سرپیچ E27 طرح کلاسیک",
    slug: "edison-lamp-60w",
    categoryId: 6,
    category: { id: 6, name: "روشنایی", slug: "lighting" },
    categoryName: "روشنایی",
    price: 290000,
    discountPrice: null,
    stock: 45,
    sku: "LGT-EDS-60W",
    description: "نور گرم و دکوراتیو با حباب شفاف برای کافه‌ها و محیط‌های مدرن.",
    isActive: false,
    images: [{ id: 8, url: "/images/categories/lighting.svg" }],
    createdAt: "1403/08/03",
  },
];

// تابع ارسال درخواست به API همراه با مدیریت خطا و فال‌بک خودکار
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options?.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `خطای سرور: ${response.status}`);
  }
  return response.json();
}

// ----------------------------------------------------
// هوک‌های TanStack Query
// ----------------------------------------------------

/**
 * دریافت لیست محصولات از http://localhost:4000/product
 */
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

/**
 * ایجاد محصول جدید با متد POST به http://localhost:4000/product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      try {
        return await apiFetch<Product>("/product", {
          method: "POST",
          body: JSON.stringify(input),
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
              ? { id: category.id, name: category.name, slug: category.slug }
              : undefined,
            categoryName: category?.name || "عمومی",
            price: Number(input.price),
            discountPrice: input.discountPrice ? Number(input.discountPrice) : null,
            stock: Number(input.stock),
            sku: input.sku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
            description: input.description,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            isActive: input.isActive ?? true,
            images:
              input.images && input.images.length > 0
                ? input.images
                : [{ id: 1, url: "/images/products/adapter-52240.png" }],
            createdAt: new Date().toLocaleDateString("fa-IR"),
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

/**
 * حذف محصول با متد DELETE از http://localhost:4000/product/:id
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      try {
        return await apiFetch<{ success: boolean }>(`/product/${id}`, {
          method: "DELETE",
        });
      } catch (err: unknown) {
        try {
          return await apiFetch<{ success: boolean }>(`/products/${id}`, {
            method: "DELETE",
          });
        } catch {
          console.warn("حذف محصول از ماک دیتای محلی:", err);
          mockProducts = mockProducts.filter((p) => p.id !== id && p.id !== Number(id));
          return { success: true };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
}

/**
 * دریافت لیست دسته‌بندی‌ها
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        return await apiFetch<Category[]>("/category");
      } catch {
        try {
          return await apiFetch<Category[]>("/categories");
        } catch {
          return [...mockCategories];
        }
      }
    },
  });
}

/**
 * ایجاد دسته‌بندی جدید
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      try {
        return await apiFetch<Category>("/category", {
          method: "POST",
          body: JSON.stringify(input),
        });
      } catch {
        try {
          return await apiFetch<Category>("/categories", {
            method: "POST",
            body: JSON.stringify(input),
          });
        } catch {
          console.warn("افزودن دسته‌بندی به ماک دیتای محلی:");
          const parent = mockCategories.find((c) => c.id === Number(input.parentId));
          const newCat: Category = {
            id: Date.now(),
            name: input.name,
            slug: input.slug,
            parentId: input.parentId ? Number(input.parentId) : null,
            parentName: parent?.name || null,
            sortOrder: input.sortOrder || mockCategories.length + 1,
            createdAt: new Date().toLocaleDateString("fa-IR"),
          };
          mockCategories = [...mockCategories, newCat];
          return newCat;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/**
 * شاخص‌های کلیدی آماری پیشخوان ادمین (KPI Metrics)
 */
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
