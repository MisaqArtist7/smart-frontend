"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Eye,
  RotateCcw,
  CheckCircle2,
  PackageX,
  ArrowUpDown,
  Tag,
  PhoneCall,
} from "lucide-react";
import { useProducts } from "@/lib/api";
import { formatToman } from "@/lib/order-utils";
import { Select } from "@/components/ui/select";
import { cn, normalizeImageUrl } from "@/lib/utils";

type SortOption = "discount-desc" | "price-asc" | "price-desc" | "newest";
type DiscountFilter = "all" | "discounted" | "high-discount" | "in-stock";

export function OffersClient() {
  const { data: serverProducts = [], isLoading } = useProducts();

  // وضعیت‌های فیلتر و مرتب‌سازی
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDiscountFilter, setSelectedDiscountFilter] =
    useState<DiscountFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("discount-desc");

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

  // پردازش و فیلتر محصولات (فقط محصولاتی که دارای تخفیف واقعی هستند)
  const processedProducts = useMemo(() => {
    return serverProducts
      .filter(
        (p) =>
          p.isActive !== false &&
          p.discountPrice != null &&
          typeof p.discountPrice === "number" &&
          p.discountPrice > 0 &&
          p.discountPrice < p.price
      )
      .map((p) => {
        const isDiscounted = true;
        const discountPercent = Math.round(
          ((p.price - p.discountPrice!) / p.price) * 100
        );
        const finalPrice = p.discountPrice!;
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
        // فیلتر دسته‌بندی
        if (selectedCategory !== "all") {
          if (p.categoryDisplay !== selectedCategory) return false;
        }

        // فیلتر نوع تخفیف و موجودی
        if (selectedDiscountFilter === "high-discount") {
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
    selectedCategory,
    selectedDiscountFilter,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedDiscountFilter("all");
    setSortBy("discount-desc");
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* =========================================================================
          ۱. بنر هیرو پیشنهادهای شگفت‌انگیز
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-6 sm:p-8 lg:p-10 shadow-lg">
        {/* المان‌های نوری و ترنسپرنت پس‌زمینه */}
        <div className="absolute -left-16 -bottom-16 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-black/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl text-right">
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
        </div>
      </div>

      {/* =========================================================================
          ۲. نوار فیلترها و مرتب‌سازی
          ========================================================================= */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* سطر اول: دسته‌بندی و مرتب‌سازی */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* انتخاب دسته‌بندی */}
          {categories.length > 0 && (
            <div className="md:col-span-6 relative flex items-center">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10.5 rounded-xl bg-muted/40 ps-10 text-xs sm:text-sm"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
              <Tag className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}

          {/* ترتیب مرتب‌سازی */}
          <div
            className={cn(
              "relative flex items-center",
              categories.length > 0 ? "md:col-span-6" : "md:col-span-12"
            )}
          >
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10.5 rounded-xl bg-muted/40 ps-10 text-xs sm:text-sm"
            >
              <option value="discount-desc">بیشترین تخفیف (پیش‌فرض)</option>
              <option value="price-asc">ارزان‌ترین قیمت</option>
              <option value="price-desc">گران‌ترین قیمت</option>
              <option value="newest">جدیدترین محصولات</option>
            </Select>
            <ArrowUpDown className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
              همه پیشنهادها
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xs border border-border bg-card p-4 h-[320px] animate-pulse space-y-3 flex flex-col justify-between"
            >
              <div className="size-full max-h-[160px] bg-muted/60 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-muted/60 rounded w-3/4" />
                <div className="h-3 bg-muted/40 rounded w-1/2" />
              </div>
              <div className="h-9 bg-muted/60 rounded-sm" />
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
              لطفاً فیلترها را تغییر دهید تا سایر پیشنهادات به شما نمایش داده شوند.
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
          {processedProducts.map((product) => {
            const rawImageUrl =
              product.images?.[0]?.url ||
              (typeof product.images?.[0] === "string" ? product.images[0] : null);
            const imageUrl = normalizeImageUrl(rawImageUrl, "/images/products/adapter-52240.png");

            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between h-full rounded-xs border border-border/80 bg-card p-3 sm:p-4 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md"
              >
                <Link href={`/product/${product.slug}`} className="flex flex-col flex-1 justify-between space-y-3">
                  {/* تصویر کالا */}
                  <div className="relative aspect-square w-full rounded-xl bg-muted/20 p-2 flex items-center justify-center overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className={cn(
                        "object-contain p-2 transition-transform duration-300 group-hover:scale-105",
                        isOutOfStock && "opacity-50 grayscale"
                      )}
                    />
                    {product.isDiscounted && product.discountPercent > 0 && (
                      <span className="absolute top-1.5 end-1.5 -rotate-12 bg-primary text-primary-foreground text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
                        {product.discountPercent.toLocaleString("fa-IR")}٪
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

                  {/* عنوان و استعلام قیمت */}
                  <div className="space-y-2 mt-auto">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 overflow-hidden h-12 leading-6 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between min-h-[2.75rem]">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <PhoneCall className="size-3.5 shrink-0" />
                        استعلام قیمت (تماس بگیرید)
                      </span>
                    </div>
                  </div>
                </Link>

                {/* دکمه مشاهده محصول */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
