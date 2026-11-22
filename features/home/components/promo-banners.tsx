"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PromoBannerItem {
  id: string;
  image: string;
  alt: string;
  href?: string;
  aspectRatio?: string;
}

const DEFAULT_PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: "banner-smart-electric",
    image: "/images/banners/بنر تبلیغاتی هوشمند الکتریک.png",
    alt: "بنر تبلیغاتی هوشمند الکتریک",
    href: "/offers",
    aspectRatio: "aspect-[2000/800]",
  },
  {
    id: "banner-network-solutions",
    image: "/images/banners/راهکارهای هوشمند شبکه و تجهیزات حرفه_ای.png",
    alt: "راهکارهای هوشمند شبکه و تجهیزات حرفه‌ای",
    href: "/category/industrial",
    aspectRatio: "aspect-[2000/800]",
  },
];

export interface PromoBannersProps {
  banners?: PromoBannerItem[];
  className?: string;
}

/**
 * بنرهای تبلیغاتی دوقلو (کنار هم) بالای بخش برندها
 * با طراحی ۱۰۰٪ ریسپانسیو، حاشیه ظریف، گوشه‌های گرد و هاور نرم
 */
export function PromoBanners({
  banners = DEFAULT_PROMO_BANNERS,
  className,
}: PromoBannersProps) {
  return (
    <section
      dir="rtl"
      aria-label="بنرهای تبلیغاتی و فروش ویژه"
      className={cn("w-full py-2", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {banners.map((banner, index) => (
          <Link
            key={banner.id || index}
            href={banner.href || "#"}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-2xl bg-muted/20",
                banner.aspectRatio || "aspect-[2000/800]"
              )}
            >
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PromoBanners;
