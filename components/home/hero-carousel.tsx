"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft } from "lucide-react";

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
  title: string;
  subtitle?: string;
  badge?: string;
  image: string;
  link: string;
  alt: string;
  buttonText?: string;
}

/**
 * داده‌های ماک بنرهای تبلیغاتی صفحه اصلی فروشگاه اسمارت الکتریک
 */
export const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: "banner-1",
    title: "جشنواره هوشمندسازی ساختمان و اتوماسیون BMS",
    subtitle: "تا ۳۰٪ تخفیف ویژه روی تمامی رله‌ها، گیت‌وی‌ها و کلیدهای لمسی هوشمند",
    badge: "پیشنهاد ویژه",
    image: "/images/banners/banner-1.png",
    link: "/category/smart-home",
    alt: "تجهیزات مدرن خانه هوشمند اسمارت الکتریک",
    buttonText: "مشاهده محصولات هوشمند",
  },
  {
    id: "banner-2",
    title: "کلید و پریزهای مدرن و تجهیزات دکوراتیو روشنایی",
    subtitle: "تنوع بی‌نظیر قاب‌های لوکس و استانداردهای اروپایی با ۵ سال گارانتی تعویض",
    badge: "پرفروش‌ترین کالاها",
    image: "/images/banners/banner-2.png",
    link: "/category/switches",
    alt: "کلید و پریزهای مدرن و قاب‌های لوکس",
    buttonText: "خرید کلید و پریز",
  },
  {
    id: "banner-3",
    title: "سیم و کابل استاندارد و تجهیزات تخصصی تابلو برق",
    subtitle: "فروش مستقیم بدون واسطه با تاییدیه نظام مهندسی و شرکت توانیر",
    badge: "ویژه پروژه‌ها و همکاران",
    image: "/images/banners/banner-3.png",
    link: "/category/cables",
    alt: "سیم و کابل استاندارد و کلیدهای مینیاتوری",
    buttonText: "استعلام قیمت عمده",
  },
];

export interface HeroCarouselProps {
  banners?: BannerItem[];
  className?: string;
  autoplayDelay?: number;
}

/**
 * کامپوننت اسلایدر بنر اصلی (Hero Carousel)
 * سازگار با RTL، کامپوننت کلاینتی، دارای Autoplay و ناوبری ریسپانسیو
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
        setApi={setApi}
        plugins={[autoplayPlugin]}
        opts={{
          direction: "rtl",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-0">
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id} className="pl-0">
              <Link
                href={banner.link}
                className="group relative block w-full h-[220px] sm:h-[340px] md:h-[420px] rounded-2xl overflow-hidden border border-border shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {/* لایه تصویر پس‌زمینه با کامپوننت بهینه‌شده Image در Next.js */}
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* لایه گرادینت شیک تستی روی بنر جهت خوانایی بالا */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent sm:bg-gradient-to-r sm:from-background/95 sm:via-background/70 sm:to-transparent transition-opacity" />

                {/* عنوان، توضیحات و دکمه فراخوان (CTA) روی بنر */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end sm:justify-center p-5 sm:p-10 md:p-14 text-right max-w-2xl">
                  {banner.badge && (
                    <span className="inline-flex items-center w-fit rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] sm:text-xs font-bold text-primary mb-2 sm:mb-3">
                      {banner.badge}
                    </span>
                  )}
                  <h3 className="text-base sm:text-2xl md:text-3xl font-black text-foreground tracking-tight leading-snug drop-shadow-xs">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-2 md:mt-3 leading-relaxed max-w-lg">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.buttonText && (
                    <div className="mt-4 sm:mt-5 hidden sm:block">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-semibold shadow-md transition-all group-hover:bg-primary/90 group-hover:gap-3">
                        <span>{banner.buttonText}</span>
                        <ChevronLeft className="size-4" />
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* دکمه‌های ناوبری دسکتاپ (قبلی سمت راست، بعدی سمت چپ طبق اصول RTL) */}
        <CarouselPrevious
          aria-label="اسلاید قبلی"
          className="hidden sm:flex right-4 left-auto top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border shadow-md rotate-180 transition-all hover:scale-105"
        />
        <CarouselNext
          aria-label="اسلاید بعدی"
          className="hidden sm:flex left-4 right-auto top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border shadow-md rotate-180 transition-all hover:scale-105"
        />

        {/* ۳. نشانگرهای زیر اسلایدر (Pagination Dots) */}
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center pointer-events-none">
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
