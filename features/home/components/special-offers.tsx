"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, ArrowLeft, ShoppingCart, Percent } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useProducts } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface SpecialOffersProps {
  className?: string;
}

/**
 * بخش پیشنهاد شگفت‌انگیز (Amazing Deals / Flash Sale)
 * همراه با تایمر معکوس زنده ۲۴ ساعته، کارت‌های محصولات تخفیف‌دار و اسلایدر
 */
export function SpecialOffers({ className }: SpecialOffersProps) {
  const { data: products = [], isLoading } = useProducts();

  // فیلتر کردن محصولاتی که دارای تخفیف هستند
  const discountedProducts = useMemo(() => {
    const withDiscount = products.filter(
      (p) => p.isActive !== false && p.discountPrice != null && p.discountPrice < p.price
    );
    // اگر کالای تخفیف‌دار کمی ثبت شده باشد، محصولات موجود را اضافه می‌کنیم
    if (withDiscount.length < 3 && products.length > 0) {
      return products.filter((p) => p.isActive !== false).slice(0, 6);
    }
    return withDiscount;
  }, [products]);

  // تایمر معکوس زنده ۲۴ ساعته
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isLoading && discountedProducts.length === 0) {
    return null;
  }

  return (
    <section
      dir="rtl"
      aria-label="پیشنهادهای شگفت‌انگیز"
      className={cn("w-full py-4 select-none", className)}
    >
      <div className="rounded-3xl bg-primary text-primary-foreground p-4 sm:p-6 lg:p-7 shadow-md overflow-hidden relative">
        {/* پس‌زمینه تزئینی ملایم */}
        <div className="absolute -start-10 -bottom-10 size-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -end-10 -top-10 size-60 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* ستون راست (در دسکتاپ): عنوان شگفت‌انگیز + تایمر معکوس */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-start space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <Flame className="size-4 text-amber-300 animate-pulse" />
              <span>پیشنهاد شگفت‌انگیز</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                تخفیف‌های ویژه امروز
              </h2>
              <p className="text-xs text-primary-foreground/80 mt-1.5 leading-relaxed">
                فرصت محدود خرید تجهیزات برق و شبکه با تخفیف طلایی
              </p>
            </div>

            {/* باکس‌های شمارنده تایمر معکوس */}
            <div className="flex items-center gap-2 pt-1" dir="ltr">
              <div className="flex flex-col items-center justify-center size-12 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
                <span className="font-mono text-base font-black">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-primary-foreground/75 font-medium -mt-1">ثانیه</span>
              </div>
              <span className="font-black text-lg">:</span>
              <div className="flex flex-col items-center justify-center size-12 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
                <span className="font-mono text-base font-black">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-primary-foreground/75 font-medium -mt-1">دقیقه</span>
              </div>
              <span className="font-black text-lg">:</span>
              <div className="flex flex-col items-center justify-center size-12 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
                <span className="font-mono text-base font-black">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] text-primary-foreground/75 font-medium -mt-1">ساعت</span>
              </div>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary-foreground/90 hover:text-white transition-colors group pt-2"
            >
              <span>مشاهده تمام تخفیف‌ها</span>
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* ستون چپ: اسلایدر محصولات تخفیف‌دار */}
          <div className="lg:col-span-9 w-full overflow-hidden">
            <Carousel
              dir="rtl"
              opts={{
                direction: "rtl",
                dragFree: true,
                containScroll: "trimSnaps",
              }}
              className="w-full relative group/special"
            >
              <CarouselContent className="-ms-3">
                {discountedProducts.map((product) => {
                  const imageUrl =
                    product.images?.[0]?.url ||
                    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
                    "/images/products/adapter-52240.png";

                  const currentPrice = product.discountPrice ?? product.price;
                  const discountPercent = product.discountPrice
                    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
                    : null;

                  return (
                    <CarouselItem
                      key={product.id}
                      className="ps-3 basis-[70%] sm:basis-[45%] md:basis-1/3 xl:basis-1/4"
                    >
                      <div className="group/card relative flex flex-col justify-between h-[340px] w-full rounded-2xl bg-card text-card-foreground p-3.5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* بج درصد تخفیف قرمز رنگ */}
                        {discountPercent && (
                          <div className="absolute top-3 end-3 z-10 flex items-center gap-0.5 bg-primary text-primary-foreground font-black text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                            <span>{discountPercent.toLocaleString("fa-IR")}٪</span>
                            <Percent className="size-2.5" />
                          </div>
                        )}

                        {/* تصویر کالا */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="relative w-full h-32 flex items-center justify-center p-2 mb-2 focus:outline-none"
                        >
                          <div className="relative size-full flex items-center justify-center">
                            <Image
                              src={imageUrl}
                              alt={product.title}
                              width={120}
                              height={85}
                              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover/card:scale-108 drop-shadow-xs"
                            />
                          </div>
                        </Link>

                        {/* عنوان کالا */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="focus:outline-none focus-visible:underline"
                        >
                          <h3 className="text-xs font-bold text-foreground text-center leading-snug line-clamp-2 min-h-[2.5rem] transition-colors group-hover/card:text-primary">
                            {product.title}
                          </h3>
                        </Link>

                        {/* قیمت و تخفیف */}
                        <div className="flex items-center justify-between mt-auto pt-3 pb-2 px-0.5 border-t border-border/40">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground tracking-tight">
                              {currentPrice.toLocaleString("fa-IR")}
                            </span>
                            {product.discountPrice != null && (
                              <span className="text-[11px] text-muted-foreground line-through">
                                {product.price.toLocaleString("fa-IR")}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            تومان
                          </span>
                        </div>

                        {/* دکمه خرید */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                        >
                          <ShoppingCart className="size-3.5" />
                          <span>خرید شگفت‌انگیز</span>
                        </Link>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious
                aria-label="کالای قبلی"
                className="hidden md:flex opacity-0 group-hover/special:opacity-100 transition-opacity start-2 end-auto top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-background/90 text-foreground border border-border shadow-md"
              />
              <CarouselNext
                aria-label="کالای بعدی"
                className="hidden md:flex opacity-0 group-hover/special:opacity-100 transition-opacity end-2 start-auto top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-background/90 text-foreground border border-border shadow-md"
              />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpecialOffers;
