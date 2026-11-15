export { cn } from "cn";

/**
 * نرمال‌سازی آدرس تصویر برای کامپوننت next/image
 * اگر آدرس نسبی باشد و با اسلش شروع نشده باشد، یک اسلش به ابتدای آن اضافه می‌کند تا خطای next/image رخ ندهد.
 */
export function normalizeImageUrl(
  src?: string | null,
  fallback: string = "/images/placeholder.png"
): string {
  if (!src || !src.trim()) return fallback;
  const trimmed = src.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }
  if (
    trimmed.startsWith("products/") ||
    trimmed.startsWith("categories/") ||
    trimmed.startsWith("brands/") ||
    trimmed.startsWith("receipts/")
  ) {
    return `/uploads/${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * تولید خودکار اسلاگ استاندارد از روی عنوان یا نام (پشتیبانی از فارسی، انگلیسی و اعداد)
 * فاصله‌ها و نیم‌فاصله‌ها به خط تیره (-) تبدیل می‌شوند.
 */
export function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\u200C\-_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
