import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { API_BASE_URL } from "@/lib/api";
import type { Product, Category } from "@/lib/types";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://smart-electric.ir"
).replace(/\/+$/, "");

type SitemapChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

interface StaticRouteConfig {
  path: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}

/**
 * لیست صفحات ثابت و عمومی سایت.
 * در انتهای پروژه هر مسیر عمومی جدیدی که ساخته شد، کافی است به این لیست اضافه شود.
 */
const STATIC_ROUTES: StaticRouteConfig[] = [
  {
    path: "/",
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    path: "/products",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/offers",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/contact-us",
    changeFrequency: "monthly",
    priority: 0.7,
  },
];

async function fetchPublicProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/product`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as Product[]) : [];
  } catch {
    return [];
  }
}

async function fetchPublicCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data as Category[];
    if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown }).items)) {
      return (data as { items: Category[] }).items;
    }
    return [];
  } catch {
    return [];
  }
}

async function getCachedSitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [products, categories] = await Promise.all([
    fetchPublicProducts(),
    fetchPublicCategories(),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((cat) => cat.isActive !== false && cat.slug)
    .map((cat) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(cat.slug)}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((product) => product.isActive !== false && (product.slug || product.id))
    .map((product) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(String(product.slug || product.id))}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getCachedSitemap();
}
