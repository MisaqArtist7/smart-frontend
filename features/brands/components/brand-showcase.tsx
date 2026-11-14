"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useBrands } from "@/lib/api/brands";
import { cn, normalizeImageUrl } from "@/lib/utils";

interface BrandItem {
  id: string | number;
  name: string;
  latinName?: string;
  logo?: string | null;
  href: string;
}

const FALLBACK_BRANDS: BrandItem[] = [
  {
    id: "dahua",
    name: "داهوا",
    latinName: "Dahua",
    logo: "/images/brand/dahua.png",
    href: "/search?q=%D8%AF%D8%A7%D9%87%D9%88%D8%A7",
  },
  {
    id: "hikvision",
    name: "هایک‌ویژن",
    latinName: "Hikvision",
    logo: "/images/brand/hikvision.avif",
    href: "/search?q=%D9%87%D8%A7%DB%8C%DA%A9%E2%80%8C%D9%88%DB%8C%DA%98%D9%86",
  },
  {
    id: "khayam",
    name: "کابل خیام",
    latinName: "Khayam",
    logo: "/images/brand/khayam.png",
    href: "/search?q=%DA%A9%D8%A7%D8%A8%D9%84%20%D8%AE%DB%8C%D8%A7%D9%85",
  },
  {
    id: "legrand",
    name: "لگراند فرانسه",
    latinName: "Legrand",
    logo: "/images/brand/1.webp",
    href: "/search?q=%D9%84%DA%AF%D8%B1%D8%A7%D9%86%D8%AF",
  },
  {
    id: "schneider",
    name: "اشنایدر الکتریک",
    latinName: "Schneider",
    logo: "/images/brand/2.webp",
    href: "/search?q=%D8%A7%D8%B4%D9%86%D8%A7%DB%8C%D8%AF%D8%B1",
  },
  {
    id: "siemens",
    name: "زیمنس آلمان",
    latinName: "Siemens",
    logo: "/images/brand/3.webp",
    href: "/search?q=%D8%B2%DB%8C%D9%85%D9%86%D8%B3",
  },
];

export interface BrandShowcaseProps {
  className?: string;
}

/**
 * بخش برندهای معتبر و همکاران تجاری در صفحه اصلی
 * نمایش کارت‌های مینیمال برند با تمرکز کامل روی تصویر لوگو
 */
export function BrandShowcase({ className }: BrandShowcaseProps) {
  const { data: dbBrands = [] } = useBrands();

  // در صورت وجود برندهای دیتابیس از آن‌ها استفاده می‌کنیم؛ در غیر اینصورت از فال‌بک
  const displayBrands: BrandItem[] =
    dbBrands && dbBrands.length > 0
      ? dbBrands
          .filter((b) => b.isActive !== false)
          .map((b, idx) => ({
            id: b.id,
            name: b.name,
            latinName: b.slug?.toUpperCase() || "",
            logo: b.logo || FALLBACK_BRANDS[idx % FALLBACK_BRANDS.length]?.logo || null,
            href: `/search?q=${encodeURIComponent(b.name)}`,
          }))
      : FALLBACK_BRANDS;

  return (
    <section
      dir="rtl"
      aria-label="برندهای معتبر"
      className={cn("w-full py-4 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            برندهای معتبر و همکاران تجاری
          </h2>
        </div>
      </div>

      {/* گرید کارت‌های برند: تمرکز کامل بر نمایش تصویر/لوگوی برند بدون متن‌های اضافی */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayBrands.map((brand) => (
          <Link
            key={brand.id}
            href={brand.href}
            title={brand.name}
            className="group relative flex items-center justify-center h-28 sm:h-32 md:h-36 w-full p-4 rounded-2xl border border-border/80 bg-card hover:bg-card/90 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/20 overflow-hidden"
          >
            {brand.logo ? (
              <div className="relative size-full flex items-center justify-center">
                <Image
                  src={normalizeImageUrl(brand.logo)}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                  className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
                />
              </div>
            ) : (
              <span className="font-black text-sm sm:text-base tracking-tight text-foreground/80 group-hover:text-primary transition-colors text-center font-mono">
                {brand.latinName || brand.name}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default BrandShowcase;
