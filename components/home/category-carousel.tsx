"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/**
 * تایپ آیتم دسته‌بندی
 */
export interface CategoryItem {
  id: string;
  title: string;
  href: string;
  image: string;
}

/**
 * دیتای دسته‌بندی‌های محصولات مطابق طراحی
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
 * طراحی شده دقیقاً منطبق بر عکس، با کارت‌های گرد، دات نشانگر شاخص و سازگار با RTL
 */
export function CategoryCarousel({
  categories = CATEGORIES_DATA,
  title = "دسته‌بندی محصولات",
  className,
}: CategoryCarouselProps) {
  return (
    <section
      dir="rtl"
      aria-label={title}
      className={cn("w-full py-6 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان بولد دسته‌بندی محصولات */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>

      {/* اسلایدر کارت‌های دسته‌بندی */}
      <Carousel
        opts={{
          direction: "rtl",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full relative group/carousel"
      >
        <CarouselContent className="-mr-3 sm:-mr-4 ml-0">
          {categories.map((cat) => (
            <CarouselItem
              key={cat.id}
              className="pr-3 sm:pr-4 pl-0 basis-[44%] sm:basis-[30%] md:basis-[22%] lg:basis-[16.6%] xl:basis-[15%]"
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
          className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity right-1 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md rotate-180"
        />
        <CarouselNext
          aria-label="دسته‌بندی بعدی"
          className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity left-1 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md rotate-180"
        />
      </Carousel>
    </section>
  );
}

export default CategoryCarousel;

