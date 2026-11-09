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
import { cn } from "@/lib/utils";

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
          image: cat.image || "/images/categories/cables.svg",
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-between h-[180px] sm:h-[200px] w-full rounded-2xl border border-border/70 bg-card p-4 shadow-xs animate-pulse"
            >
              <div className="size-20 rounded-xl bg-muted/60 my-auto" />
              <div className="h-4 bg-muted/50 rounded w-3/4 mx-auto mt-2" />
            </div>
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
                  className="group relative flex flex-col items-center justify-between h-[180px] sm:h-[200px] w-full rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {/* بخش تصویر محصول در مرکز */}
                  <div className="relative flex-1 w-full flex items-center justify-center p-2">
                    <div className="relative size-24 sm:size-28 flex items-center justify-center">
                      <Image
                        src={cat.image}
                        alt={cat.title}
                        width={112}
                        height={112}
                        className="size-full object-contain transition-transform duration-300 ease-out group-hover:scale-108 drop-shadow-xs"
                      />
                    </div>
                  </div>

                  {/* عنوان دسته‌بندی در پایین کارت */}
                  <span className="text-xs sm:text-sm font-bold text-foreground text-center tracking-tight transition-colors group-hover:text-primary line-clamp-1 mt-2">
                    {cat.title}
                  </span>
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
