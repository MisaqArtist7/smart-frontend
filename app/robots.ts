import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://smart-electric.ir"
).replace(/\/+$/, "");

/**
 * مسیرهایی که نباید توسط موتورهای جستجو (گوگل و...) ایندکس شوند.
 * در انتهای پروژه اگر مسیر خصوصی، پنل جدید یا صفحه موقت اضافه شد، به این آرایه اضافه کنید.
 */
const DISALLOWED_PATHS: string[] = [
  "/admin",
  "/admin/",
  "/profile",
  "/profile/",
  "/orders",
  "/orders/",
  "/checkout",
  "/checkout/",
  "/cart",
  "/login",
  "/register",
  "/request-otp",
  "/verify-otp",
  "/test-api",
  "/search",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
