"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
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
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>

      {/* وضعیت در حال بارگذاری: اسکلتون لودینگ متناسب با ۶ ستون */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col justify-between h-[340px] sm:h-[360px] w-full rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs animate-pulse"
            >
              <div className="w-full h-32 sm:h-36 rounded-xl bg-muted/60 mb-2" />
              <div className="space-y-2 my-auto">
                <div className="h-3.5 bg-muted/60 rounded w-4/5 mx-auto" />
                <div className="h-3 bg-muted/40 rounded w-3/5 mx-auto" />
              </div>
              <div className="h-5 bg-muted/50 rounded w-1/2 my-2" />
              <div className="h-9 bg-muted/60 rounded-xl w-full" />
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
          {/* کانتینر اسلایدها با مارجین منطقی */}
          <CarouselContent className="-ms-3 sm:-ms-4">
            {products.map((product) => {
              const rawImageUrl =
                product.images?.[0]?.url ||
                (typeof product.images?.[0] === "string" ? product.images[0] : null);
              const imageUrl = normalizeImageUrl(rawImageUrl, "/images/products/adapter-52240.png");
              const displayPrice = product.discountPrice ?? product.price;

              return (
                <CarouselItem
                  key={product.id}
                  className="ps-3 sm:ps-4 basis-[72%] sm:basis-[48%] md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
                >
                  <div className="group relative flex flex-col justify-between h-[340px] w-full rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-1">
                    {/* بخش تصویر محصول در بالا */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative w-full h-32 sm:h-36 flex items-center justify-center p-2 mb-2 focus:outline-none"
                    >
                      <div className="relative size-full flex items-center justify-center">
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          width={130}
                          height={90}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-108 drop-shadow-xs"
                        />
                      </div>
                    </Link>

                    {/* عنوان و مدل محصول در میانه */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="focus:outline-none focus-visible:underline"
                    >
                      <h3 className="text-xs sm:text-[13px] font-bold text-foreground text-justify leading-snug line-clamp-2 min-h-[2.5rem] transition-colors group-hover:text-primary">
                        {product.title}
                      </h3>
                    </Link>

                    {/* بخش قیمت و واحد پولی */}
                    <div className="flex items-center justify-between mt-auto pt-3 pb-2.5 px-0.5 border-t border-border/30">
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                          {displayPrice.toLocaleString("fa-IR")}
                        </span>
                        {product.discountPrice != null && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            {product.price.toLocaleString("fa-IR")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        تومان
                      </span>
                    </div>

                    {/* دکمه اکشن قرمز رنگ «مشاهده و خرید» همراه با آیکون سبد خرید */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <ShoppingCart className="size-4 shrink-0" />
                      <span>مشاهده و خرید</span>
                    </Link>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* دکمه‌های ناوبری چپ و راست روی هاور دسکتاپ */}
          <CarouselPrevious
            aria-label="محصول قبلی"
            className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity start-2 end-auto top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md"
          />
          <CarouselNext
            aria-label="محصول بعدی"
            className="hidden md:flex opacity-0 group-hover/carousel:opacity-100 transition-opacity end-2 start-auto top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-background/90 hover:bg-background text-foreground border border-border shadow-md"
          />
        </Carousel>
      )}
    </section>
  );
}

export default LatestProducts;
