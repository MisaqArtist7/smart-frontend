"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useProducts, type Product } from "@/lib/api";
import { formatToman } from "@/lib/order-utils";
import { cn, normalizeImageUrl } from "@/lib/utils";

export interface LatestProductsProps {
  initialProducts?: Product[];
  title?: string;
  className?: string;
}

/**
 * کامپوننت اسلایدر «جدید ترین محصولات ما»
 * اتصال مستقیم به بک‌اند جهت دریافت محصولات واقعی از دیتابیس،
 * همراه با اسکلتون لودینگ و پشتیبانی از ۶ محصول در صفحه دسکتاپ
 */
export function LatestProducts({
  initialProducts,
  title = "جدید ترین محصولات ما",
  className,
}: LatestProductsProps) {
  // دریافت لیست محصولات واقعی از API بک‌اند (http://localhost:4000/product)
  const { data: serverProducts = [], isLoading } = useProducts();

  // فیلتر کردن محصولات فعال برای نمایش در فروشگاه
  const products = useMemo(() => {
    const list = serverProducts.length > 0 ? serverProducts : initialProducts ?? [];
    return list.filter((p) => p.isActive !== false);
  }, [serverProducts, initialProducts]);

  return (
    <section
      dir="rtl"
      aria-label={title}
      className={cn("w-full py-6", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان بولد «جدید ترین محصولات ما» */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>

      {/* وضعیت در حال بارگذاری: اسکلتون لودینگ متناسب با ۶ ستون */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[3px]">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col justify-between h-72 sm:h-80 rounded-xs border border-border/70 bg-card p-3 sm:p-4 shadow-xs animate-pulse space-y-2.5"
            >
              <div className="w-full h-36 sm:h-40 rounded-xl bg-muted/60" />
              <div className="space-y-2">
                <div className="h-4 bg-muted/60 rounded w-3/4" />
                <div className="h-3 bg-muted/40 rounded w-1/2" />
              </div>
              <div className="h-9 bg-muted/60 rounded-sm w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* وضعیت خالی بودن محصولات در دیتابیس */
        <div className="w-full rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            هنوز کالای فعالی در این بخش از فروشگاه ثبت نشده است.
          </p>
        </div>
      ) : (
        /* اسلایدر محصولات واقعی خوانده شده از دیتابیس */
        <Carousel
          dir="rtl"
          opts={{
            direction: "rtl",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full relative group/carousel"
        >
          {/* کانتینر اسلایدها با فاصله ۳ پیکسل */}
          <CarouselContent className="-ms-[3px]">
            {products.map((product) => {
              const rawImageUrl =
                product.images?.[0]?.url ||
                (typeof product.images?.[0] === "string" ? product.images[0] : null);
              const imageUrl = normalizeImageUrl(rawImageUrl, "/images/products/adapter-52240.png");
              const hasDiscount =
                product.discountPrice != null &&
                product.discountPrice > 0 &&
                product.discountPrice < product.price;
              const displayPrice = product.discountPrice ?? product.price;
              const discountPercent = hasDiscount
                ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
                : 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <CarouselItem
                  key={product.id}
                  className="ps-[3px] basis-[72%] sm:basis-[48%] md:basis-1/3 lg:basis-1/4 xl:basis-[18.18%] 2xl:basis-[15.38%]"
                >
                  <div className="group relative flex flex-col justify-between h-full rounded-xs border border-border/80 bg-card p-3 sm:p-4 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md">
                    <Link href={`/product/${product.slug}`} className="flex flex-col flex-1 justify-between space-y-3">
                      {/* تصویر کالا */}
                      <div className="relative aspect-square w-full rounded-xl bg-muted/20 p-2 flex items-center justify-center overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 20vw"
                          className={cn(
                            "object-contain p-2 transition-transform duration-300 group-hover:scale-105",
                            isOutOfStock && "opacity-50 grayscale"
                          )}
                        />

                        {/* بج درصد تخفیف کج و فارسی */}
                        {discountPercent > 0 && (
                          <span className="absolute top-1.5 end-1.5 -rotate-12 bg-primary text-primary-foreground text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
                            {discountPercent.toLocaleString("fa-IR")}٪
                          </span>
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-background/90 text-foreground text-xs font-black px-3 py-1 rounded-lg border border-border shadow-xs">
                              ناموجود
                            </span>
                          </div>
                        )}
                      </div>

                      {/* عنوان و قیمت */}
                      <div className="space-y-2 mt-auto">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 h-[2.75rem] leading-snug group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>

                        <div className="pt-1.5 border-t border-border/40 flex flex-col items-end justify-end min-h-[3.25rem]">
                          {hasDiscount && (
                            <span className="text-[11px] text-muted-foreground line-through">
                              {product.price.toLocaleString("fa-IR")}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-sm sm:text-base font-black text-foreground">
                              {formatToman(displayPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* دکمه اکشن «مشاهده محصول» */}
                    <div className="pt-3">
                      <Link
                        href={`/product/${product.slug}`}
                        className="w-full rounded-sm text-xs font-bold gap-1.5 h-9 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center justify-center transition-all"
                      >
                        <Eye className="size-3.5" />
                        <span>مشاهده محصول</span>
                      </Link>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* دکمه‌های ناوبری چپ و راست روی هاور دسکتاپ */}
          <CarouselPrevious
            aria-label="محصول قبلی"
            className="hidden md:flex opacity-0 pointer-events-none group-hover/carousel:opacity-100 group-hover/carousel:pointer-events-auto group-hover/carousel:disabled:opacity-40 inset-s-2 inset-e-auto top-1/2 bottom-auto -translate-y-1/2 z-30 size-11 [&_svg]:size-5 rounded-full bg-primary hover:bg-primary/90 text-white hover:text-white border-2 border-white/80 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 disabled:pointer-events-none group-hover/carousel:disabled:pointer-events-auto disabled:cursor-not-allowed"
          />
          <CarouselNext
            aria-label="محصول بعدی"
            className="hidden md:flex opacity-0 pointer-events-none group-hover/carousel:opacity-100 group-hover/carousel:pointer-events-auto group-hover/carousel:disabled:opacity-40 inset-e-2 inset-s-auto top-1/2 bottom-auto -translate-y-1/2 z-30 size-11 [&_svg]:size-5 rounded-full bg-primary hover:bg-primary/90 text-white hover:text-white border-2 border-white/80 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 disabled:pointer-events-none group-hover/carousel:disabled:pointer-events-auto disabled:cursor-not-allowed"
          />
        </Carousel>
      )}
    </section>
  );
}

export default LatestProducts;
