"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, ArrowLeft, Eye, Percent } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useProducts } from "@/lib/api";
import { cn, normalizeImageUrl } from "@/lib/utils";

export interface SpecialOffersProps {
  className?: string;
}

/**
 * بخش پیشنهاد شگفت‌انگیز (Amazing Deals / Flash Sale)
 * همراه با تایمر معکوس زنده ۲۴ ساعته، کارت‌های محصولات تخفیف‌دار و اسلایدر
 */
export function SpecialOffers({ className }: SpecialOffersProps) {
  const { data: products = [], isLoading } = useProducts();

  // فیلتر کردن دقیق و صرفاً محصولاتی که دارای تخفیف معتبر هستند
  const discountedProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.isActive !== false &&
        p.discountPrice != null &&
        typeof p.discountPrice === "number" &&
        p.discountPrice > 0 &&
        p.discountPrice < p.price
    );
  }, [products]);

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
        <div className="absolute -inset-s-10 -bottom-10 size-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -inset-e-10 -top-10 size-60 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* ستون راست (در دسکتاپ): عنوان شگفت‌انگیز */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-start space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-4 py-1.5 rounded-full text-sm font-bold shadow-xs">
              <Flame className="size-4.5 text-amber-300 animate-pulse" />
              <span>پیشنهاد شگفت‌انگیز</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                تخفیف‌های ویژه امروز
              </h2>
              <p className="text-sm sm:text-base text-primary-foreground/90 mt-2 leading-relaxed">
                فرصت خرید تجهیزات برق و شبکه با تخفیف طلایی
              </p>
            </div>

            <Link
              href="/offers"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-foreground/95 hover:text-white transition-colors group pt-2"
            >
              <span>مشاهده تمام تخفیف‌ها</span>
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
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
              <CarouselContent className="-ms-[3px]">
                {discountedProducts.map((product) => {
                  const rawImageUrl =
                    product.images?.[0]?.url ||
                    (typeof product.images?.[0] === "string" ? product.images[0] : null);
                  const imageUrl = normalizeImageUrl(rawImageUrl, "/images/products/adapter-52240.png");

                  const currentPrice = product.discountPrice ?? product.price;
                  const discountPercent = product.discountPrice
                    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
                    : null;

                  return (
                    <CarouselItem
                      key={product.id}
                      className="ps-[3px] basis-[70%] sm:basis-[45%] md:basis-1/3 xl:basis-1/4"
                    >
                      <div className="group/card relative flex flex-col justify-between h-85 w-full rounded-xs bg-card text-card-foreground p-3.5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {/* بج درصد تخفیف قرمز رنگ */}
                        {discountPercent && (
                          <div className="absolute top-3 inset-e-3 z-10 flex items-center gap-0.5 bg-primary text-primary-foreground font-black text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                            <span>{discountPercent.toLocaleString("fa-IR")}٪</span>
                            <Percent className="size-2.5" />
                          </div>
                        )}

                        {/* تصویر کالا */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="relative w-full h-44 flex items-center justify-center p-2 mb-2 focus:outline-none"
                        >
                          <div className="relative size-full flex items-center justify-center">
                            <Image
                              src={imageUrl}
                              alt={product.title}
                              width={444}
                              height={444}
                              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover/card:scale-108"
                            />
                          </div>
                        </Link>

                        {/* عنوان کالا */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="focus:outline-none focus-visible:underline"
                        >
                          <h3 className="font-bold text-foreground leading-snug line-clamp-2 min-h-10 transition-colors group-hover/card:text-primary">
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

                        {/* دکمه مشاهده محصول */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                        >
                          <Eye className="size-3.5" />
                          <span>مشاهده محصول</span>
                        </Link>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious
                aria-label="کالای قبلی"
                className="hidden md:flex opacity-0 pointer-events-none group-hover/special:opacity-100 group-hover/special:pointer-events-auto group-hover/special:disabled:opacity-40 inset-s-2 inset-e-auto top-1/2 bottom-auto -translate-y-1/2 z-30 size-11 [&_svg]:size-5 rounded-full bg-primary hover:bg-primary/90 text-white hover:text-white border-2 border-white/80 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 disabled:pointer-events-none group-hover/special:disabled:pointer-events-auto disabled:cursor-not-allowed"
              />
              <CarouselNext
                aria-label="کالای بعدی"
                className="hidden md:flex opacity-0 pointer-events-none group-hover/special:opacity-100 group-hover/special:pointer-events-auto group-hover/special:disabled:opacity-40 inset-e-2 inset-s-auto top-1/2 bottom-auto -translate-y-1/2 z-30 size-11 [&_svg]:size-5 rounded-full bg-primary hover:bg-primary/90 text-white hover:text-white border-2 border-white/80 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 disabled:pointer-events-none group-hover/special:disabled:pointer-events-auto disabled:cursor-not-allowed"
              />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpecialOffers;
