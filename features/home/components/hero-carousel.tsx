"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/**
 * اینترفیس تایپ‌شده آیتم‌های اسلایدر بنر
 */
export interface BannerItem {
  id: string;
  image: string;
  link: string;
  alt: string;
  title?: string;
}

/**
 * بنرهای تصویری اصلی فروشگاه اسمارت الکتریک
 */
export const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: "banner-electric",
    image: "/images/carousel/بنر تبلیغاتی هوشمند الکتریک.png",
    link: "/offers",
    alt: "جشنواره فروش اسمارت الکتریک",
    title: "جشنواره فروش اسمارت الکتریک",
  },
  {
    id: "banner-lighting",
    image: "/images/carousel/روشنایی هوشمند در دکوراسیون مدرن.png",
    link: "/category/lighting",
    alt: "روشنایی هوشمند در دکوراسیون مدرن",
    title: "روشنایی هوشمند در دکوراسیون مدرن",
  },
  {
    id: "banner-network",
    image: "/images/carousel/راهکارهای هوشمند شبکه و تجهیزات حرفه_ای.png",
    link: "/category/industrial",
    alt: "راهکارهای هوشمند شبکه و تجهیزات حرفه‌ای",
    title: "راهکارهای هوشمند شبکه و تجهیزات حرفه‌ای",
  },
  {
    id: "banner-security",
    image: "/images/carousel/امنیت هوشمند برای آرامش بیشتر.png",
    link: "/category/security",
    alt: "امنیت هوشمند برای آرامش بیشتر",
    title: "امنیت هوشمند برای آرامش بیشتر",
  },
  {
    id: "banner-intercom",
    image: "/images/carousel/آیفون تصویری هوشمند اسمارت الکتریک.png",
    link: "/category/smart-home",
    alt: "آیفون تصویری هوشمند اسمارت الکتریک",
    title: "آیفون تصویری هوشمند اسمارت الکتریک",
  },
];

export interface HeroCarouselProps {
  banners?: BannerItem[];
  className?: string;
  autoplayDelay?: number;
}

/**
 * کامپوننت اسلایدر بنر اصلی (Hero Carousel)
 * نمایش خالص تصاویر بنر بدون متن‌های اضافی، سازگار با RTL و دارای Autoplay
 */
export function HeroCarousel({
  banners = DEFAULT_BANNERS,
  className,
  autoplayDelay = 4000,
}: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // پلاگین اسکرول خودکار با تاخیر ۴ ثانیه و توقف هنگام هاور ماوس
  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: autoplayDelay,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [autoplayDelay]
  );

  // مانیتورینگ ایندکس اسلاید فعال جهت به‌روزرسانی نشانگرهای زیر اسلایدر
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    queueMicrotask(() => {
      setCurrent(api.selectedScrollSnap());
    });

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <section
      dir="rtl"
      aria-label="بنرهای تبلیغاتی اصلی"
      className={cn("w-full relative select-none", className)}
    >
      <Carousel
        dir="rtl"
        setApi={setApi}
        plugins={[autoplayPlugin]}
        opts={{
          direction: "rtl",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ms-0">
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id} className="ps-0">
              <Link
                href={banner.link}
                className="group relative block w-full max-h-[600px] rounded-2xl overflow-hidden border border-border/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {/* تصویر خالص بنر بدون پوشش متنی */}
                <Image
                  src={banner.image}
                  alt={banner.alt || banner.title || `بنر ${index + 1}`}
                  width={2089}
                  height={753}
                  priority={index === 0}
                  className="w-full h-auto max-h-[600px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* دکمه‌های ناوبری دسکتاپ */}
        <CarouselPrevious
          aria-label="اسلاید قبلی"
          className="hidden sm:flex start-4 end-auto top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border shadow-md transition-all hover:scale-105"
        />
        <CarouselNext
          aria-label="اسلاید بعدی"
          className="hidden sm:flex end-4 start-auto top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border shadow-md transition-all hover:scale-105"
        />

        {/* نشانگرهای زیر اسلایدر (Pagination Dots) */}
        <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/40 shadow-xs pointer-events-auto">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`رفتن به اسلاید ${index + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
                  current === index
                    ? "w-6 bg-primary shadow-xs"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                )}
              />
            ))}
          </div>
        </div>
      </Carousel>
    </section>
  );
}

export default HeroCarousel;
