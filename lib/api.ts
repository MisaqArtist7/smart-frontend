/**
 * API Integration Layer and TanStack Query Hooks for Smart Electric Admin
 * Supports real REST API with automatic graceful fallback to mock data when backend is offline.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Product {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku: string;
  description?: string | null;
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  title: string;
  slug: string;
  categoryId: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku: string;
  description?: string | null;
  isActive: boolean;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parentName?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string | null;
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
    id: "cat-1",
    name: "سیم و کابل",
    slug: "cables",
    parentId: null,
    parentName: null,
    sortOrder: 1,
    createdAt: "1403/08/01",
  },
  {
    id: "cat-2",
    name: "کلید و پریز",
    slug: "switches",
    parentId: null,
    parentName: null,
    sortOrder: 2,
    createdAt: "1403/08/02",
  },
  {
    id: "cat-3",
    name: "تجهیزات شبکه و برق صنعتی",
    slug: "network-industrial",
    parentId: null,
    parentName: null,
    sortOrder: 3,
    createdAt: "1403/08/03",
  },
  {
    id: "cat-4",
    name: "سوئیچ‌های صنعتی PoE",
    slug: "industrial-switches",
    parentId: "cat-3",
    parentName: "تجهیزات شبکه و برق صنعتی",
    sortOrder: 1,
    createdAt: "1403/08/04",
  },
  {
    id: "cat-5",
    name: "آداپتور و منابع تغذیه",
    slug: "adapters",
    parentId: "cat-3",
    parentName: "تجهیزات شبکه و برق صنعتی",
    sortOrder: 2,
    createdAt: "1403/08/05",
  },
  {
    id: "cat-6",
    name: "روشنایی",
    slug: "lighting",
    parentId: null,
    parentName: null,
    sortOrder: 4,
    createdAt: "1403/08/06",
  },
  {
    id: "cat-7",
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
    id: "prod-1",
    title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
    slug: "adapter-52240",
    categoryId: "cat-5",
    categoryName: "آداپتور و منابع تغذیه",
    price: 5250000,
    discountPrice: 4950000,
    stock: 18,
    sku: "HRUI-AD-52240",
    description: "آداپتور صنعتی با بازدهی بالا و محافظت در برابر نوسانات شدید جریان برق.",
    isActive: true,
    images: ["/images/products/adapter-52240.png"],
    createdAt: "1403/08/10",
  },
  {
    id: "prod-2",
    title: "آداپتور سوئیچ شبکه Industrial Adapter 52120 HRUI",
    slug: "adapter-52120",
    categoryId: "cat-5",
    categoryName: "آداپتور و منابع تغذیه",
    price: 2450000,
    discountPrice: null,
    stock: 4,
    sku: "HRUI-AD-52120",
    description: "منبع تغذیه استاندارد رومیزی و ریلی برای تجهیزات اکتیو و سوئیچ‌های شبکه.",
    isActive: true,
    images: ["/images/products/adapter-52120.png"],
    createdAt: "1403/08/09",
  },
  {
    id: "prod-3",
    title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
    slug: "switch-hr500-afg-82s",
    categoryId: "cat-4",
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 19600000,
    discountPrice: 18500000,
    stock: 12,
    sku: "HRUI-SW-82S",
    description: "دارای ۸ پورت گیگابیت PoE و ۲ پورت SFP آپلینک نوری با بدنه آلومینیومی مستحکم.",
    isActive: true,
    images: ["/images/products/switch-8port.png"],
    createdAt: "1403/08/08",
  },
  {
    id: "prod-4",
    title: "سوئیچ PoE صنعتی اچ ار یو ای HRUI HR500-AF-811GS",
    slug: "switch-hr500-af-811gs",
    categoryId: "cat-4",
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 8000000,
    discountPrice: null,
    stock: 2,
    sku: "HRUI-SW-811GS",
    description: "مقاوم در برابر شرایط محیطی خشن و دمای منفی ۴۰ تا ۸۵ درجه سانتی‌گراد.",
    isActive: true,
    images: ["/images/products/switch-hr500.png"],
    createdAt: "1403/08/07",
  },
  {
    id: "prod-5",
    title: "سوئیچ ۱۰ پورت POE اچ آر یو آی مدل HR901-AF-82N",
    slug: "switch-10port-poe",
    categoryId: "cat-4",
    categoryName: "سوئیچ‌های صنعتی PoE",
    price: 28900000,
    discountPrice: 27500000,
    stock: 9,
    sku: "HRUI-SW-10P",
    description: "پشتیبانی از پروتکل‌های استاندارد IEEE 802.3af/at با توان حداکثر ۲۵۰ وات.",
    isActive: true,
    images: ["/images/products/switch-10port.png"],
    createdAt: "1403/08/06",
  },
  {
    id: "prod-6",
    title: "کابل شبکه لگراند Cat6 SFTP تمام مس حلقه ۳۰۵ متری",
    slug: "cable-legrand-cat6-sftp",
    categoryId: "cat-1",
    categoryName: "سیم و کابل",
    price: 6800000,
    discountPrice: null,
    stock: 25,
    sku: "CBL-LEG-CAT6",
    description: "کابل شبکه اورجینال با روکش LSZH ضد اشتعال و فویل و شیلد ضد نویز.",
    isActive: true,
    images: ["/images/categories/cables.svg"],
    createdAt: "1403/08/05",
  },
  {
    id: "prod-7",
    title: "کلید لمسی هوشمند ۴ پل شیشه‌ای مشکی مدل زیگبی",
    slug: "smart-switch-4gang-touch",
    categoryId: "cat-2",
    categoryName: "کلید و پریز",
    price: 1850000,
    discountPrice: null,
    stock: 3,
    sku: "SW-TCH-4G",
    description: "قابلیت کنترل از طریق اپلیکیشن موبایل، تاچ خازنی حساس و دارای نور پس‌زمینه LED.",
    isActive: true,
    images: ["/images/categories/switches.svg"],
    createdAt: "1403/08/04",
  },
  {
    id: "prod-8",
    title: "لامپ ادیسونی فیلامنتی ۶۰ وات سرپیچ E27 طرح کلاسیک",
    slug: "edison-lamp-60w",
    categoryId: "cat-6",
    categoryName: "روشنایی",
    price: 290000,
    discountPrice: null,
    stock: 45,
    sku: "LGT-EDS-60W",
    description: "نور گرم و دکوراتیو با حباب شفاف برای کافه‌ها و محیط‌های مدرن.",
    isActive: false,
    images: ["/images/categories/lighting.svg"],
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
 * دریافت لیست محصولات
 */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await apiFetch<Product[]>("/products");
      } catch (err) {
        console.warn("استفاده از دیتای ماک محصولات به دلیل عدم دسترسی به سرور:", err);
        return [...mockProducts];
      }
    },
  });
}

/**
 * ایجاد محصول جدید
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      try {
        return await apiFetch<Product>("/products", {
          method: "POST",
          body: JSON.stringify(input),
        });
      } catch (err) {
        console.warn("ذخیره موقت محصول در ماک دیتای محلی:", err);
        const category = mockCategories.find((c) => c.id === input.categoryId);
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          title: input.title,
          slug: input.slug,
          categoryId: input.categoryId,
          categoryName: category?.name || "عمومی",
          price: Number(input.price),
          discountPrice: input.discountPrice ? Number(input.discountPrice) : null,
          stock: Number(input.stock),
          sku: input.sku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
          description: input.description,
          isActive: input.isActive ?? true,
          images: input.images && input.images.length > 0 ? input.images : ["/images/products/adapter-52240.png"],
          createdAt: new Date().toLocaleDateString("fa-IR"),
        };
        mockProducts = [newProduct, ...mockProducts];
        return newProduct;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
    mutationFn: async (id: string) => {
      try {
        return await apiFetch<{ success: boolean }>(`/products/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("حذف محصول از ماک دیتای محلی:", err);
        mockProducts = mockProducts.filter((p) => p.id !== id);
        return { success: true };
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
        return await apiFetch<Category[]>("/categories");
      } catch (err) {
        console.warn("استفاده از دیتای ماک دسته‌بندی‌ها:", err);
        return [...mockCategories];
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
        return await apiFetch<Category>("/categories", {
          method: "POST",
          body: JSON.stringify(input),
        });
      } catch (err) {
        console.warn("افزودن دسته‌بندی به ماک دیتای محلی:", err);
        const parent = mockCategories.find((c) => c.id === input.parentId);
        const newCat: Category = {
          id: `cat-${Date.now()}`,
          name: input.name,
          slug: input.slug,
          parentId: input.parentId || null,
          parentName: parent?.name || null,
          sortOrder: input.sortOrder || mockCategories.length + 1,
          createdAt: new Date().toLocaleDateString("fa-IR"),
        };
        mockCategories = [...mockCategories, newCat];
        return newCat;
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
          totalSales: 184500000, // ۱۸۴ میلیون و ۵۰۰ هزار تومان
          activeProductsCount: activeCount,
          lowStockCount: lowStockCount,
          totalOrders: 142,
        };
      }
    },
  });
}

