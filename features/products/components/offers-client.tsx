"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Clock,
  Sparkles,
  Percent,
  ShoppingCart,
  Search,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  PackageX,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, type Product } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type SortOption = "discount-desc" | "price-asc" | "price-desc" | "newest";
type DiscountFilter = "all" | "discounted" | "high-discount" | "in-stock";

export function OffersClient() {
  const { data: serverProducts = [], isLoading } = useProducts();
  const addItemToCart = useCartStore((s) => s.addItem);

  // وضعیت‌های فیلتر و جستجو
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDiscountFilter, setSelectedDiscountFilter] =
    useState<DiscountFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("discount-desc");

  // تایمر معکوس زنده ۲۴ ساعته پیشنهادهای روز
  const [timeLeft, setTimeLeft] = useState({
    hours: 15,
    minutes: 42,
    seconds: 18,
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

  // لیست دسته‌بندی‌های موجود از محصولات دریافتی
  const categories = useMemo(() => {
    const set = new Set<string>();
    serverProducts.forEach((p) => {
      const catName =
        p.categoryName ||
        (typeof p.category === "object" && p.category?.name) ||
        null;
      if (catName) set.add(catName);
    });
    return Array.from(set);
  }, [serverProducts]);

  // پردازش و فیلتر محصولات
  const processedProducts = useMemo(() => {
    return serverProducts
      .filter((p) => p.isActive !== false)
      .map((p) => {
        const isDiscounted =
          p.discountPrice != null && p.discountPrice < p.price;
        const discountPercent = isDiscounted
          ? Math.round(((p.price - p.discountPrice!) / p.price) * 100)
          : 0;
        const finalPrice = p.discountPrice ?? p.price;
        const catName =
          p.categoryName ||
          (typeof p.category === "object" && p.category?.name) ||
          "تجهیزات برق";

        return {
          ...p,
          isDiscounted,
          discountPercent,
          finalPrice,
          categoryDisplay: catName,
        };
      })
      .filter((p) => {
        // فیلتر جستجو
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCategory = p.categoryDisplay.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory) return false;
        }

        // فیلتر دسته‌بندی
        if (selectedCategory !== "all") {
          if (p.categoryDisplay !== selectedCategory) return false;
        }

        // فیلتر نوع تخفیف و موجودی
        if (selectedDiscountFilter === "discounted") {
          return p.isDiscounted;
        } else if (selectedDiscountFilter === "high-discount") {
          return p.discountPercent >= 15;
        } else if (selectedDiscountFilter === "in-stock") {
          return p.stock > 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "discount-desc") {
          // اول درصد تخفیف بیشتر
          if (b.discountPercent !== a.discountPercent) {
            return b.discountPercent - a.discountPercent;
          }
          return b.id - a.id;
        } else if (sortBy === "price-asc") {
          return a.finalPrice - b.finalPrice;
        } else if (sortBy === "price-desc") {
          return b.finalPrice - a.finalPrice;
        } else if (sortBy === "newest") {
          return b.id - a.id;
        }
        return 0;
      });
  }, [
    serverProducts,
    searchQuery,
    selectedCategory,
    selectedDiscountFilter,
    sortBy,
  ]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast.error("متأسفانه موجودی این کالا در انبار به اتمام رسیده است.");
      return;
    }

    addItemToCart(product, 1);
    toast.success(`«${product.title}» به سبد خرید اضافه شد.`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDiscountFilter("all");
    setSortBy("discount-desc");
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* =========================================================================
          ۱. بنر هیرو پیشنهادهای شگفت‌انگیز با تایمر معکوس
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-6 sm:p-8 lg:p-10 shadow-lg">
        {/* المان‌های نوری و ترنسپرنت پس‌زمینه */}
        <div className="absolute -left-16 -bottom-16 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-black/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold shadow-xs">
              <Flame className="size-4 text-amber-300 animate-pulse" />
              <span>جشنواره فروش شگفت‌انگیز (افرز)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              پیشنهادات ویژه و تخفیف‌های استثنایی
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/85 leading-relaxed">
              انواع تجهیزات برق صنعتی، روشنایی، سیم و کابل و تابلو برق با بهترین قیمت‌های بازار و تخفیف‌های محدود روزانه.
            </p>
          </div>

          {/* باکس تایمر معکوس ۲۴ ساعته */}
          <div className="flex flex-col items-center lg:items-end justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 shrink-0">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary-foreground/90">
              <Clock className="size-4 text-amber-300" />
              <span>فرصت باقی‌مانده تخفیف امروز:</span>
            </div>
            <div className="flex items-center gap-2" dir="ltr">
              <div className="flex flex-col items-center justify-center min-w-12 h-14 rounded-xl bg-white/20 backdrop-blur-xs border border-white/25 px-2">
                <span className="font-mono text-xl font-black">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-white/80 font-medium">ثانیه</span>
              </div>
              <span className="text-lg font-black text-white/80">:</span>
              <div className="flex flex-col items-center justify-center min-w-12 h-14 rounded-xl bg-white/20 backdrop-blur-xs border border-white/25 px-2">
                <span className="font-mono text-xl font-black">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-white/80 font-medium">دقیقه</span>
              </div>
              <span className="text-lg font-black text-white/80">:</span>
              <div className="flex flex-col items-center justify-center min-w-12 h-14 rounded-xl bg-white/20 backdrop-blur-xs border border-white/25 px-2">
                <span className="font-mono text-xl font-black">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-white/80 font-medium">ساعت</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ۲. نوار فیلترها، جستجو و مرتب‌سازی
          ========================================================================= */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* سطر اول: جستجو و دسته‌بندی و مرتب‌سازی */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* کادر جستجو */}
          <div className="md:col-span-5 relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در میان کالاهای شگفت‌انگیز..."
              className="w-full rounded-xl border border-input bg-muted/40 pr-10 pl-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* انتخاب دسته‌بندی */}
          {categories.length > 0 && (
            <div className="md:col-span-4 relative flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-input bg-muted/40 pr-10 pl-8 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Tag className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}

          {/* ترتیب مرتب‌سازی */}
          <div
            className={cn(
              "relative flex items-center",
              categories.length > 0 ? "md:col-span-3" : "md:col-span-7"
            )}
          >
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none rounded-xl border border-input bg-muted/40 pr-10 pl-8 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="discount-desc">بیشترین تخفیف (پیش‌فرض)</option>
              <option value="price-asc">ارزان‌ترین قیمت</option>
              <option value="price-desc">گران‌ترین قیمت</option>
              <option value="newest">جدیدترین محصولات</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* سطر دوم: دکمه‌های فیلتر سریع (Tabs) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground ml-1">
              فیلتر سریع:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDiscountFilter("all")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                selectedDiscountFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              همه کالاها
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountFilter("discounted")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                selectedDiscountFilter === "discounted"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Percent className="size-3" />
              <span>فقط تخفیف‌دارها</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountFilter("high-discount")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                selectedDiscountFilter === "high-discount"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Flame className="size-3" />
              <span>بالای ۱۵٪ تخفیف</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountFilter("in-stock")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                selectedDiscountFilter === "in-stock"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CheckCircle2 className="size-3" />
              <span>فقط کالاهای موجود</span>
            </button>
          </div>

          {/* شمارنده نتایج */}
          <div className="text-xs text-muted-foreground font-medium">
            نمایش <span className="font-bold text-foreground">{processedProducts.length.toLocaleString("fa-IR")}</span> کالا
          </div>
        </div>
      </div>

      {/* =========================================================================
          ۳. شبکه محصولات (Product Grid)
          ========================================================================= */}
      {isLoading ? (
        /* اسکلتون لودینگ هنگام دریافت اطلاعات */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col justify-between h-[370px] w-full rounded-2xl border border-border/70 bg-card p-4 shadow-xs animate-pulse"
            >
              <div className="w-full h-40 rounded-xl bg-muted/60 mb-3" />
              <div className="space-y-2 my-auto">
                <div className="h-4 bg-muted/60 rounded w-4/5 mx-auto" />
                <div className="h-3 bg-muted/40 rounded w-2/3 mx-auto" />
              </div>
              <div className="h-6 bg-muted/50 rounded w-1/2 my-3" />
              <div className="h-10 bg-muted/60 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : processedProducts.length === 0 ? (
        /* وضعیت بدون محصول با دکمه ریست فیلترها */
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageX className="size-7" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">
              کالایی با شرایط انتخابی شما یافت نشد
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              لطفاً فیلترها یا عبارت جستجو را تغییر دهید تا سایر پیشنهادات به شما نمایش داده شوند.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>پاکسازی فیلترها و مشاهده همه</span>
            </button>
          </div>
        </div>
      ) : (
        /* لیست محصولات تخفیف‌دار و پیشنهادات شگفت‌انگیز */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {processedProducts.map((product) => {
            const imageUrl =
              product.images?.[0]?.url ||
              (typeof product.images?.[0] === "string"
                ? product.images[0]
                : null) ||
              "/images/products/adapter-52240.png";

            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 3;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between h-[380px] sm:h-[400px] w-full rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:-translate-y-1"
              >
                {/* برچسب‌های شناور در بالای کارت */}
                <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10 pointer-events-none">
                  {/* بج درصد تخفیف */}
                  {product.isDiscounted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-[11px] font-black shadow-xs">
                      <Percent className="size-3" />
                      <span>{product.discountPercent}٪ تخفیف</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                      <Sparkles className="size-3" />
                      <span>پیشنهاد روز</span>
                    </span>
                  )}

                  {/* وضعیت موجودی انبار */}
                  {isOutOfStock ? (
                    <span className="rounded-md bg-muted/80 text-muted-foreground px-1.5 py-0.5 text-[10px] font-medium">
                      ناموجود
                    </span>
                  ) : isLowStock ? (
                    <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                      تنها {product.stock} عدد
                    </span>
                  ) : null}
                </div>

                {/* بخش تصویر محصول با لینک به صفحه اختصاصی */}
                <Link
                  href={`/product/${product.slug}`}
                  className="relative w-full h-36 sm:h-40 flex items-center justify-center p-2 mt-4 mb-2 focus:outline-none"
                >
                  <div className="relative size-full flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      width={140}
                      height={100}
                      className={cn(
                        "max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 drop-shadow-xs",
                        isOutOfStock && "opacity-50 grayscale"
                      )}
                    />
                  </div>
                </Link>

                {/* اطلاعات محصول: دسته‌بندی و عنوان */}
                <div className="space-y-1 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground block line-clamp-1">
                    {product.categoryDisplay}
                  </span>
                  <Link
                    href={`/product/${product.slug}`}
                    className="focus:outline-none focus-visible:underline block"
                  >
                    <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem] transition-colors group-hover:text-primary">
                      {product.title}
                    </h3>
                  </Link>
                </div>

                {/* بخش قیمت و واحد تومان */}
                <div className="mt-auto pt-3 pb-2.5 px-0.5 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col text-right">
                      <span className="text-sm sm:text-base font-black text-foreground tracking-tight">
                        {product.finalPrice.toLocaleString("fa-IR")}
                      </span>
                      {product.isDiscounted && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          {product.price.toLocaleString("fa-IR")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">
                      تومان
                    </span>
                  </div>
                </div>

                {/* دکمه افزودن به سبد خرید */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={(e) => handleAddToCart(product, e)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <ShoppingCart className="size-4 shrink-0" />
                  <span>{isOutOfStock ? "ناموجود در انبار" : "افزودن به سبد خرید"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
