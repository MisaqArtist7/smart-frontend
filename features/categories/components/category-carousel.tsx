"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useCategories } from "@/lib/api";
import { cn, normalizeImageUrl } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

/**
 * تایپ آیتم دسته‌بندی
 */
export interface CategoryItem {
  id: string | number;
  title: string;
  href: string;
  image: string;
}

/**
 * دیتای پیش‌فرض دسته‌بندی‌های محصولات (در صورت عدم وجود در دیتابیس)
 */
export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: "cables",
    title: "سیم و کابل",
    href: "/category/cables",
    image: "/images/categories/cables.svg",
  },
  {
    id: "switches",
    title: "کلید و پریز",
    href: "/category/switches",
    image: "/images/categories/switches.svg",
  },
  {
    id: "protectors",
    title: "محافظ و چندراهی",
    href: "/category/protectors",
    image: "/images/categories/protectors.svg",
  },
  {
    id: "lighting",
    title: "روشنایی",
    href: "/category/lighting",
    image: "/images/categories/lighting.svg",
  },
  {
    id: "security",
    title: "سیستم های امنیتی",
    href: "/category/security",
    image: "/images/categories/security.svg",
  },
  {
    id: "industrial",
    title: "تجهیزات صنعتی",
    href: "/category/industrial",
    image: "/images/categories/industrial.svg",
  },
  {
    id: "tools",
    title: "ابزار دقیق و تجهیزات",
    href: "/category/tools",
    image: "/images/categories/tools.svg",
  },
  {
    id: "smart-home",
    title: "خانه هوشمند و BMS",
    href: "/category/smart-home",
    image: "/images/categories/smart_home.svg",
  },
];

export interface CategoryCarouselProps {
  categories?: CategoryItem[];
  title?: string;
  className?: string;
}

/**
 * کامپوننت اسلایدر دسته‌بندی محصولات
 * دریافت داینامیک دسته‌بندی‌ها از دیتابیس با فال‌بک تمیز
 */
export function CategoryCarousel({
  categories: initialCategories,
  title = "دسته‌بندی محصولات",
  className,
}: CategoryCarouselProps) {
  const { data: serverCategories = [], isLoading } = useCategories();

  const displayCategories = useMemo<CategoryItem[]>(() => {
    if (serverCategories && serverCategories.length > 0) {
      return serverCategories
        .filter((c) => c.isActive !== false)
        .map((cat) => ({
          id: cat.id,
          title: cat.name,
          href: `/category/${cat.slug}`,
          image: normalizeImageUrl(cat.image, "/images/categories/cables.svg"),
        }));
    }
    return initialCategories ?? CATEGORIES_DATA;
  }, [serverCategories, initialCategories]);

  return (
    <section
      dir="rtl"
      aria-label={title}
      className={cn("w-full py-4 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان بولد دسته‌بندی محصولات */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>

      {/* اسلایدر کارت‌های دسته‌بندی */}
      {isLoading && serverCategories.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] sm:h-[200px] md:h-[220px] w-full rounded-2xl border border-border/70 bg-muted/40 shadow-xs animate-pulse"
            />
          ))}
        </div>
      ) : (
        <Carousel
          dir="rtl"
          opts={{
            direction: "rtl",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full relative group/carousel"
        >
          <CarouselContent className="-ms-3 sm:-ms-4">
            {displayCategories.map((cat) => (
              <CarouselItem
                key={cat.id}
                className="ps-3 sm:ps-4 basis-[44%] sm:basis-[30%] md:basis-[22%] lg:basis-[16.6%] xl:basis-[15%]"
              >
                <Link
                  href={cat.href}
                  className="group relative block h-[180px] sm:h-[200px] md:h-[220px] w-full rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-border overflow-hidden select-none"
                >
                  {/* تصویر تمام‌صفحه که کل کارت را پر می‌کند */}
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
                    className="size-full object-cover transition-all duration-500 ease-out group-hover:scale-110 group-hover:blur-[4px]"
                  />

                  {/* گرادیان تیره ملایم در پایین عکس در حالت عادی برای وضوح متن */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />

                  {/* اورلی تاریک و بلار کل کارت در حالت هاور */}
                  <div className="absolute inset-0 z-10 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* کانتینر متن: در حالت عادی پایین عکس است و در زمان هاور با انیمیشن روان به وسط کارت می‌آید */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 sm:p-4 pointer-events-none">
                    <div className="flex flex-col items-center justify-center text-center w-full translate-y-[52px] sm:translate-y-[60px] md:translate-y-[66px] group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      {/* نام دسته‌بندی با بردر سفید در پایین عکس و حالت هاور */}
                      <span className="text-white font-bold text-xs sm:text-sm md:text-base text-center tracking-tight drop-shadow-md px-3.5 py-1.5 rounded-xl border border-white bg-black/35 backdrop-blur-[2px] transition-all duration-500 group-hover:bg-primary/95 group-hover:shadow-lg group-hover:border-white group-hover:font-black max-w-[92%] line-clamp-1">
                        {cat.title}
                      </span>

                      {/* دکمه / نشانگر مشاهده محصولات که در زمان هاور در مرکز ظاهر می‌شود */}
                      <div className="opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-8 transition-all duration-500 ease-out mt-0 group-hover:mt-2">
                        <span className="text-white/95 text-[10px] sm:text-xs font-semibold flex items-center gap-1 drop-shadow-sm">
                          <span>مشاهده محصولات</span>
                          <ArrowLeft className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* دکمه‌های ناوبری چپ و راست با هاور نرم */}
          <CarouselPrevious
            aria-label="دسته‌بندی قبلی"
            className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity start-2 end-auto top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md"
          />
          <CarouselNext
            aria-label="دسته‌بندی بعدی"
            className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity end-2 start-auto top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md"
          />
        </Carousel>
      )}
    </section>
  );
}

export default CategoryCarousel;
