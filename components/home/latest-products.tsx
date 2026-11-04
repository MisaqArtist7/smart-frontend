"use client";

import React from "react";
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
import { cn } from "@/lib/utils";

/**
 * تایپ آیتم محصول
 */
export interface ProductItem {
  id: string;
  title: string;
  price: number;
  image: string;
  href: string;
  model?: string;
  inStock?: boolean;
}

/**
 * دیتای نمونه محصولات مطابق تصویر پیوستی کاربر
 */
export const LATEST_PRODUCTS_DATA: ProductItem[] = [
  {
    id: "prod-1",
    title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
    price: 5250000,
    image: "/images/products/adapter-52240.png",
    href: "/product/adapter-52240",
    model: "Adapter 52240",
    inStock: true,
  },
  {
    id: "prod-2",
    title: "آداپتور سوئیچ شبکه Industrial Adapter 52120 HRUI",
    price: 2450000,
    image: "/images/products/adapter-52120.png",
    href: "/product/adapter-52120",
    model: "Adapter 52120",
    inStock: true,
  },
  {
    id: "prod-3",
    title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
    price: 19600000,
    image: "/images/products/switch-8port.png",
    href: "/product/switch-hr500-afg-82s",
    model: "HR500-AFG-82S",
    inStock: true,
  },
  {
    id: "prod-4",
    title: "سوئیچ PoE صنعتی اچ ار یو ای HRUI HR500-AF-811GS",
    price: 8000000,
    image: "/images/products/switch-hr500.png",
    href: "/product/switch-hr500-af-811gs",
    model: "HR500-AF-811GS",
    inStock: true,
  },
  {
    id: "prod-5",
    title: "سوئیچ ۱۰ پورت POE اچ آر یو آی مدل HR901-AF-82N",
    price: 28900000,
    image: "/images/products/switch-10port.png",
    href: "/product/switch-10port-poe",
    model: "HR901-AF-82N",
    inStock: true,
  },
  {
    id: "prod-6",
    title: "سوئیچ شبکه مدیریتی ۱۶ پورت PoE گیگابیت HRUI",
    price: 34500000,
    image: "/images/products/switch-8port.png",
    href: "/product/switch-16port-poe",
    model: "HR500-AFG-162S",
    inStock: true,
  },
  {
    id: "prod-7",
    title: "منبع تغذیه ریلی صنعتی ۲۴ ولت HRUI مدل NDR-120",
    price: 3800000,
    image: "/images/products/adapter-52240.png",
    href: "/product/power-supply-ndr-120",
    model: "NDR-120-24",
    inStock: true,
  },
  {
    id: "prod-8",
    title: "سوئیچ شبکه صنعتی ۵ پورت گیگابیت مدل HR500-AF-41G",
    price: 6900000,
    image: "/images/products/switch-hr500.png",
    href: "/product/switch-5port-gigabit",
    model: "HR500-AF-41G",
    inStock: true,
  },
];

export interface LatestProductsProps {
  products?: ProductItem[];
  title?: string;
  className?: string;
}

/**
 * کامپوننت اسلایدر «جدید ترین محصولات ما»
 * طراحی شده دقیقاً منطبق بر تصویر پیوست شده، با دات شاخص قرمز،
 * کارت‌های شیک، قیمت و دکمه «مشاهده و خرید»،
 * تنظیم شده برای نمایش دقیقاً ۶ محصول در مانیتور دسکتاپ (xl/2xl)
 */
export function LatestProducts({
  products = LATEST_PRODUCTS_DATA,
  title = "جدید ترین محصولات ما",
  className,
}: LatestProductsProps) {
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

      {/* اسلایدر محصولات */}
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
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="ps-3 sm:ps-4 basis-[72%] sm:basis-[48%] md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
            >
              <div className="group relative flex flex-col justify-between h-[340px] sm:h-[360px] w-full rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-1">
                {/* بخش تصویر محصول در بالا */}
                <Link
                  href={product.href}
                  className="relative w-full h-32 sm:h-36 flex items-center justify-center p-2 mb-2 focus:outline-none"
                >
                  <div className="relative size-full flex items-center justify-center">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={130}
                      height={90}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-108 drop-shadow-xs"
                    />
                  </div>
                </Link>

                {/* عنوان و مدل محصول در میانه */}
                <Link
                  href={product.href}
                  className="focus:outline-none focus-visible:underline"
                >
                  <h3 className="text-xs sm:text-[13px] font-bold text-foreground text-center leading-snug line-clamp-2 min-h-[2.5rem] transition-colors group-hover:text-primary">
                    {product.title}
                  </h3>
                </Link>

                {/* بخش قیمت و واحد پولی: در RTL قیمت در سمت راست و تومان در سمت چپ */}
                <div className="flex items-center justify-between mt-auto pt-3 pb-2.5 px-0.5 border-t border-border/30">
                  <span className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                    {product.price.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    تومان
                  </span>
                </div>

                {/* دکمه اکشن قرمز رنگ «مشاهده و خرید» همراه با آیکون سبد خرید */}
                <Link
                  href={product.href}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <ShoppingCart className="size-4 shrink-0" />
                  <span>مشاهده و خرید</span>
                </Link>
              </div>
            </CarouselItem>
          ))}
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
    </section>
  );
}

export default LatestProducts;

