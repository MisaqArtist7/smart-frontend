"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Percent } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useProducts, type Product } from "@/lib/api";
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
      className={cn("w-full py-6 select-none", className)}
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
              className="flex flex-col justify-between h-85 w-full rounded-xs border border-border/70 bg-card p-3.5 shadow-sm animate-pulse"
            >
              <div className="w-full h-44 rounded-md bg-muted/60 mb-2" />
              <div className="space-y-2 my-auto">
                <div className="h-3.5 bg-muted/60 rounded w-4/5 mx-auto" />
                <div className="h-3 bg-muted/40 rounded w-3/5 mx-auto" />
              </div>
              <div className="h-5 bg-muted/50 rounded w-1/2 my-2" />
              <div className="h-9 bg-muted/60 rounded-md w-full" />
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
              const displayPrice = product.discountPrice ?? product.price;
              const discountPercent =
                product.discountPrice != null &&
                product.discountPrice > 0 &&
                product.discountPrice < product.price
                  ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
                  : null;

              return (
                <CarouselItem
                  key={product.id}
                  className="ps-[3px] basis-[72%] sm:basis-[48%] md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
                >
                  <div className="group/card relative flex flex-col justify-between h-85 w-full rounded-xs border border-border/80 bg-card text-card-foreground p-3.5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    {/* بج درصد تخفیف قرمز رنگ در صورت تخفیف‌دار بودن */}
                    {discountPercent && (
                      <div className="absolute top-3 inset-e-3 z-10 flex items-center gap-0.5 bg-primary text-primary-foreground font-black text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                        <span>{discountPercent.toLocaleString("fa-IR")}٪</span>
                        <Percent className="size-2.5" />
                      </div>
                    )}

                    {/* بخش تصویر محصول در بالا */}
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

                    {/* عنوان و مدل محصول در میانه */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="focus:outline-none focus-visible:underline"
                    >
                      <h3 className="font-bold text-foreground leading-snug line-clamp-2 min-h-10 transition-colors group-hover/card:text-primary">
                        {product.title}
                      </h3>
                    </Link>

                    {/* بخش قیمت و واحد پولی */}
                    <div className="flex items-center justify-between mt-auto pt-3 pb-2 px-0.5 border-t border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground tracking-tight">
                          {displayPrice.toLocaleString("fa-IR")}
                        </span>
                        {discountPercent != null && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            {product.price.toLocaleString("fa-IR")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        تومان
                      </span>
                    </div>

                    {/* دکمه اکشن قرمز رنگ «مشاهده محصول» */}
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
