import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PromoBannerItem {
  id: string;
  image: string;
  alt: string;
  href?: string;
}

const DEFAULT_PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: "banner-7",
    image: "/images/banners/7.png",
    alt: "تخفیف‌ها و پیشنهادهای ویژه تجهیزات برق و شبکه",
    href: "/offers",
  },
  {
    id: "banner-8",
    image: "/images/banners/8.png",
    alt: "جشنواره فروش انواع سوئیچ و تجهیزات هوشمند سازی",
    href: "/offers",
  },
];

export interface PromoBannersProps {
  banners?: PromoBannerItem[];
  className?: string;
}

/**
 * کامپوننت بنرهای تبلیغاتی دوقلو (کنار هم) زیر بخش محصولات
 * با طراحی ۱۰۰٪ ریسپانسیو، کادر ظریف، لبه‌های گرد و افکت هاور مدرن
 */
export function PromoBanners({
  banners = DEFAULT_PROMO_BANNERS,
  className,
}: PromoBannersProps) {
  return (
    <section
      dir="rtl"
      aria-label="بنرهای تبلیغاتی و فروش ویژه"
      className={cn("w-full py-2 select-none", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {banners.slice(0, 2).map((banner, index) => (
          <Link
            key={banner.id || index}
            href={banner.href || "#"}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="relative w-full aspect-[2048/378] overflow-hidden rounded-2xl bg-muted/20">
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

