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
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
