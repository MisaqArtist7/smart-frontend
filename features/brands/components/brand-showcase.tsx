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

export interface BrandShowcaseProps {
  className?: string;
}

/**
 * بخش برندهای معتبر و همکاران تجاری در صفحه اصلی
 * نمایش کارت‌های مینیمال برند با تمرکز کامل روی تصویر لوگو
 */
export function BrandShowcase({ className }: BrandShowcaseProps) {
  const { data: dbBrands = [], isLoading } = useBrands();

  const displayBrands: BrandItem[] = dbBrands
    .filter((b) => b.isActive !== false)
    .map((b) => ({
      id: b.id,
      name: b.name,
      latinName: b.slug?.toUpperCase() || "",
      logo: b.logo || null,
      href: `/search?q=${encodeURIComponent(b.name)}`,
    }));

  if (!isLoading && displayBrands.length === 0) {
    return null;
  }

  return (
    <section
      dir="rtl"
      aria-label="برندهای معتبر"
      className={cn("w-full py-4", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
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
