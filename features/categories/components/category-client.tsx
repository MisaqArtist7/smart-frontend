"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  Eye,
  PackageX,
  RotateCcw,
  Loader2,
  FolderTree,
  Banknote,
  Layers,
} from "lucide-react";
import { useProducts, useCategories, useCategory } from "@/lib/api";
import { BrandFilterBox } from "@/features/brands/components/brand-filter-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { formatToman } from "@/lib/order-utils";
import { toEnglishDigits } from "@/lib/auth-api";
import { cn, normalizeImageUrl } from "@/lib/utils";

type SortOption = "newest" | "bestselling" | "price-desc" | "price-asc";

const PRICE_MIN = 0;
const PRICE_MAX = 500_000_000;
const PRICE_STEP = 100_000;

/** تبدیل رشته عددی فارسی یا انگلیسی (با یا بدون کاما) به عدد معتبر */
function parsePriceInput(val: string): number | null {
  const digits = toEnglishDigits(val).replace(/[^0-9]/g, "");
  if (!digits) return null;
  const num = Number(digits);
  return Number.isFinite(num) ? num : null;
}

/** فرمت‌دهی عدد قیمت به ارقام فارسی با جداکننده هزارگان */
function formatPriceInput(num: number): string {
  return num.toLocaleString("fa-IR");
}

const FALLBACK_PRODUCT_IMAGE = "/images/products/adapter-52240.png";

export interface CategoryClientProps {
  slug: string;
  fullPath?: string[];
}

export function CategoryClient({ slug }: CategoryClientProps) {
  const router = useRouter();
  const { data: serverProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: specificCategory, isLoading: isCategoryLoading } = useCategory(slug);

  // استیت‌های فیلتر
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // تشخیص دسته‌بندی جاری از روی لیست کل دسته‌ها یا کوئری تکی
  const currentCategory = useMemo(() => {
    if (specificCategory) return specificCategory;
    const cleanSlug = slug.toLowerCase().trim();
    return (
      categories.find((c) => c.slug.toLowerCase().trim() === cleanSlug) ||
      categories.find((c) => String(c.id) === cleanSlug) ||
      null
    );
  }, [specificCategory, categories, slug]);

  // دسته‌بندی والد (در صورت وجود)
  const parentCategory = useMemo(() => {
    if (!currentCategory?.parentId) return null;
    return categories.find((c) => c.id === currentCategory.parentId) || null;
  }, [currentCategory, categories]);

  // زیردسته‌های دسته‌بندی فعلی
  const subcategories = useMemo(() => {
    if (!currentCategory) return [];
    return categories.filter((c) => c.parentId === currentCategory.id && c.isActive !== false);
  }, [currentCategory, categories]);

  // شناسه‌های دسته‌بندی و تمام زیردسته‌های آن برای واکشی محصولات
  const targetCategoryIds = useMemo(() => {
    if (!currentCategory) return [];
    const ids = [currentCategory.id];
    subcategories.forEach((sub) => ids.push(sub.id));
    return ids;
  }, [currentCategory, subcategories]);

  // فیلتر محصولات این دسته‌بندی
  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return serverProducts.filter(
      (p) => p.isActive !== false && targetCategoryIds.includes(p.categoryId)
    );
  }, [serverProducts, currentCategory, targetCategoryIds]);

  // محاسبه تعداد محصولات هر برند برای این دسته‌بندی
  const brandCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    categoryProducts.forEach((p) => {
      if (p.brandId) {
        counts[p.brandId] = (counts[p.brandId] || 0) + 1;
      }
    });
    return counts;
  }, [categoryProducts]);

  // مقادیر اسلایدر خطی در بازه ثابت ۰ تا ۵۰۰ میلیون تومان
  const sliderMinVal = useMemo(() => {
    const parsed = parsePriceInput(minPrice);
    if (parsed === null) return PRICE_MIN;
    return Math.max(PRICE_MIN, Math.min(parsed, PRICE_MAX));
  }, [minPrice]);

  const sliderMaxVal = useMemo(() => {
    const parsed = parsePriceInput(maxPrice);
    if (parsed === null) return PRICE_MAX;
    return Math.min(PRICE_MAX, Math.max(parsed, sliderMinVal));
  }, [maxPrice, sliderMinVal]);

  const handleSliderChange = (newValue: number | readonly number[]) => {
    if (Array.isArray(newValue) && newValue.length === 2) {
      const [low, high] = newValue;
      setMinPrice(low <= PRICE_MIN ? "" : formatPriceInput(low));
      setMaxPrice(high >= PRICE_MAX ? "" : formatPriceInput(high));
    }
  };

  const handlePriceTextChange = (
    raw: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const parsed = parsePriceInput(raw);
    if (parsed === null) {
      setter("");
      return;
    }
    const clamped = Math.min(PRICE_MAX, Math.max(PRICE_MIN, parsed));
    setter(formatPriceInput(clamped));
  };

  // اعمال فیلترها و مرتب‌سازی روی محصولات دسته‌بندی
  const filteredProducts = useMemo(() => {
    const minPriceVal = parsePriceInput(minPrice);
    const maxPriceVal = parsePriceInput(maxPrice);

    return categoryProducts
      .filter((p) => {
        // فیلتر برند
        if (selectedBrandIds.length > 0) {
          if (!p.brandId || !selectedBrandIds.includes(p.brandId)) {
            return false;
          }
        }

        // فقط کالاهای موجود
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        // محدودیت قیمت
        const finalPrice = p.discountPrice ?? p.price;
        if (minPriceVal !== null && finalPrice < minPriceVal) {
          return false;
        }
        if (maxPriceVal !== null && finalPrice > maxPriceVal) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price;
        const priceB = b.discountPrice ?? b.price;

        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "bestselling") {
          const discA = a.discountPrice ? a.price - a.discountPrice : 0;
          const discB = b.discountPrice ? b.price - b.discountPrice : 0;
          if (discB !== discA) return discB - discA;
          return b.id - a.id;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [categoryProducts, selectedBrandIds, inStockOnly, minPrice, maxPrice, sortBy]);

  // پاک کردن تمام فیلترها
  const handleResetFilters = () => {
    setSelectedBrandIds([]);
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const hasActiveFilters = Boolean(
    selectedBrandIds.length > 0 ||
      inStockOnly ||
      minPrice.trim() !== "" ||
      maxPrice.trim() !== ""
  );

  // بخش فیلتر محدودیت قیمت (مشترک بین دسکتاپ و موبایل)
  const priceFilterSection = (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="size-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground">محدوده قیمت (تومان)</h3>
        </div>
        {(minPrice.trim() !== "" || maxPrice.trim() !== "") && (
          <button
            type="button"
            onClick={() => {
              setMinPrice("");
              setMaxPrice("");
            }}
            className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>حذف</span>
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground block">
            تا قیمت
          </label>
          <Input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={maxPrice}
            onChange={(e) => handlePriceTextChange(e.target.value, setMaxPrice)}
            placeholder={formatPriceInput(PRICE_MAX)}
            className="h-8.5 text-xs rounded-xl bg-muted/40 border-border/80 text-start font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground block">
            از قیمت
          </label>
          <Input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={minPrice}
            onChange={(e) => handlePriceTextChange(e.target.value, setMinPrice)}
            placeholder={formatPriceInput(PRICE_MIN)}
            className="h-8.5 text-xs rounded-xl bg-muted/40 border-border/80 text-start font-semibold"
          />
        </div>
      </div>

      {/* اهرم خطی دوپوزیشنی (Range Slider) */}
      <div className="pt-1 space-y-1.5" dir="ltr">
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={[sliderMinVal, sliderMaxVal]}
          onValueChange={handleSliderChange}
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium" dir="rtl">
          <span>تا {formatToman(sliderMaxVal)}</span>
          <span>از {formatToman(sliderMinVal)}</span>
        </div>
      </div>
    </div>
  );

  // در حال بارگذاری اولیه
  if (isCategoriesLoading || isCategoryLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-xs">در حال بارگذاری اطلاعات دسته‌بندی...</span>
      </div>
    );
  }

  // اگر دسته‌بندی یافت نشد
  if (!currentCategory) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="size-20 rounded-full bg-muted/50 border border-border flex items-center justify-center mb-4 text-muted-foreground">
          <FolderTree className="size-10" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">
          دسته‌بندی مورد نظر یافت نشد
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6">
          متأسفانه دسته‌بندی «{slug}» وجود ندارد یا غیرفعال شده است. می‌توانید به صفحه اصلی برگردید.
        </p>
        <Link href="/">
          <Button className="rounded-xl px-6 bg-primary text-primary-foreground font-bold text-xs sm:text-sm">
            بازگشت به صفحه اصلی
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* بردکرامب (Breadcrumb) ناوبری */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          خانه
        </Link>
        {parentCategory && (
          <>
            <ChevronLeft className="size-3 text-muted-foreground/60" />
            <Link
              href={`/category/${parentCategory.slug}`}
              className="hover:text-primary transition-colors"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        <ChevronLeft className="size-3 text-muted-foreground/60" />
        <span className="font-bold text-foreground">{currentCategory.name}</span>
      </nav>

      {/* نوار مرتب‌سازی (سمت راست) و تعداد کل کالاها (سمت چپ) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-border shadow-xs">
        {/* سمت راست (RTL): گزینه‌های مرتب‌سازی به صورت دکمه‌ای */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground shrink-0">
            <SlidersHorizontal className="size-4 text-primary hidden sm:inline" />
            <span>مرتب‌سازی:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "newest" as const, label: "جدیدترین" },
              { id: "bestselling" as const, label: "پرفروش‌ترین" },
              { id: "price-desc" as const, label: "گران‌ترین" },
              { id: "price-asc" as const, label: "ارزان‌ترین" },
            ].map((option) => {
              const isSelected = sortBy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortBy(option.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* سمت چپ (RTL): دکمه فیلتر موبایل + تعداد کل کالاها */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-border/60">
          <Button
            variant="outline"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden h-9 px-3 gap-1.5 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="size-3.5 text-primary" />
            <span>فیلترها</span>
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-primary" />
            )}
          </Button>

          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            {filteredProducts.length.toLocaleString("fa-IR")} کالا
          </span>
        </div>
      </div>

      {/* بدنه دو ستونه: سایدبار فیلترها + گرید محصولات */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 items-start">
        {/* سایدبار فیلترهای دسکتاپ */}
        <aside className="hidden lg:block lg:col-span-1 space-y-4 sticky top-24">
          <div className="rounded-xs border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <Filter className="size-4 text-primary" />
                <span>فیلترهای پیشرفته</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>حذف فیلترها</span>
                </button>
              )}
            </div>

            {/* سوئیچ کالاهای موجود */}
            <div className="flex items-center justify-between py-1">
              <label htmlFor="inStockSwitchDesktop" className="text-xs font-bold text-foreground cursor-pointer">
                فقط کالاهای موجود
              </label>
              <Switch
                id="inStockSwitchDesktop"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
              />
            </div>

            {/* محدوده قیمت */}
            <div className="pt-2 border-t border-border">
              {priceFilterSection}
            </div>

            {/* فیلتر دسته‌بندی کالا */}
            <div className="pt-2 border-t border-border space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Layers className="size-4 text-primary" />
                <span>دسته‌بندی محصولات</span>
              </div>
              <Select
                value={currentCategory.slug}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all") {
                    router.push("/products");
                  } else {
                    router.push(`/category/${val}`);
                  }
                }}
                className="text-xs rounded-xl h-9 w-full"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories
                  .filter((c) => c.isActive !== false)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </div>

            {/* فیلتر برندهای موجود در این دسته‌بندی */}
            <div className="pt-2 border-t border-border">
              <BrandFilterBox
                selectedBrandIds={selectedBrandIds}
                onChange={setSelectedBrandIds}
                brandCounts={brandCounts}
              />
            </div>
          </div>
        </aside>

        {/* گرید نمایش محصولات */}
        <section className="lg:col-span-3 xl:col-span-4 2xl:col-span-5">
          {isProductsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xs border border-border bg-card p-4 h-[320px] animate-pulse space-y-3 flex flex-col justify-between"
                >
                  <div className="size-full max-h-[160px] bg-muted/60 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/60 rounded w-3/4" />
                    <div className="h-3 bg-muted/40 rounded w-1/2" />
                  </div>
                  <div className="h-9 bg-muted/60 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-card p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="size-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                <PackageX className="size-8" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                کالایی با این مشخصات یافت نشد
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                در این دسته‌بندی با فیلترهای انتخابی شما کالایی ثبت نشده است. فیلترها را حذف کرده یا عبارت دیگری را جستجو کنید.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-xl text-xs font-bold gap-1.5 mt-2"
                >
                  <RotateCcw className="size-3.5" />
                  <span>حذف فیلترها</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0">
              {filteredProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice != null && product.discountPrice < product.price;
                const finalPrice = product.discountPrice ?? product.price;
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
                          src={normalizeImageUrl(product.images?.[0]?.url, FALLBACK_PRODUCT_IMAGE)}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className={cn(
                            "object-contain p-2 transition-transform duration-300 group-hover:scale-105",
                            isOutOfStock && "opacity-50 grayscale"
                          )}
                        />

                        {/* بج تخفیف */}
                        {hasDiscount && (
                          <span className="absolute top-1.5 end-1.5 -rotate-12 bg-primary text-primary-foreground text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
                            {Math.round(((product.price - product.discountPrice!) / product.price) * 100).toLocaleString("fa-IR")}٪
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
                        <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 overflow-hidden h-12 leading-6 group-hover:text-primary transition-colors">
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
                              {formatToman(finalPrice)}
                            </span>
                          </div>
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
        </section>
      </div>

      {/* مدال فیلترهای موبایل */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-h-[85vh] rounded-t-3xl border-t border-border flex flex-col overflow-hidden">
            {/* هدر مدال موبایل */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2 font-black text-sm">
                <SlidersHorizontal className="size-4 text-primary" />
                <span>فیلترهای کالا</span>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* بدنه فیلترهای موبایل */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1">
              <div className="flex items-center justify-between">
                <label htmlFor="inStockSwitchMobile" className="text-xs font-bold">
                  فقط کالاهای موجود
                </label>
                <Switch
                  id="inStockSwitchMobile"
                  checked={inStockOnly}
                  onCheckedChange={setInStockOnly}
                />
              </div>

              <div className="pt-3 border-t border-border">{priceFilterSection}</div>

              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layers className="size-4 text-primary" />
                  <span>دسته‌بندی محصولات</span>
                </div>
                <Select
                  value={currentCategory.slug}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsMobileFilterOpen(false);
                    if (val === "all") {
                      router.push("/products");
                    } else {
                      router.push(`/category/${val}`);
                    }
                  }}
                  className="text-xs rounded-xl h-9 w-full"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {categories
                    .filter((c) => c.isActive !== false)
                    .map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="pt-3 border-t border-border">
                <BrandFilterBox
                  selectedBrandIds={selectedBrandIds}
                  onChange={setSelectedBrandIds}
                  brandCounts={brandCounts}
                />
              </div>
            </div>

            {/* دکمه اعمال در فوتر مدال */}
            <div className="p-4 border-t border-border flex items-center gap-2 bg-muted/20">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-xl text-xs font-bold"
                >
                  حذف همه
                </Button>
              )}
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                مشاهده ({filteredProducts.length.toLocaleString("fa-IR")}) کالا
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryClient;
