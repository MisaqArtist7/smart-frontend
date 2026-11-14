"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ShoppingCart,
  PackageX,
  Layers,
  RotateCcw,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCategories, type Product } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { BrandFilterBox } from "@/features/brands/components/brand-filter-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { formatToman } from "@/lib/order-utils";
import { cn, normalizeImageUrl } from "@/lib/utils";

type SortOption = "newest" | "price-asc" | "price-desc" | "discount-desc";

const FALLBACK_PRODUCT_IMAGE = "/images/products/adapter-52240.png";

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: serverProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const addItemToCart = useCartStore((s) => s.addItem);

  // استخراج عبارت جستجو مستقیماً و به صورت واکنشی از URL
  const activeQuery = searchParams.get("q") || searchParams.get("search") || "";
  const [typedInput, setTypedInput] = useState<string | null>(null);
  const searchInput = typedInput !== null ? typedInput : activeQuery;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ثبت و اجرای جستجو
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchInput.trim();
    setTypedInput(null);
    if (clean) {
      router.push(`/search?q=${encodeURIComponent(clean)}`);
    } else {
      router.push("/search");
    }
  };

  const handleClearSearch = () => {
    setTypedInput(null);
    router.push("/search");
  };

  // فیلتر و جستجوی چندبعدی روی محصولات
  const filteredProducts = useMemo(() => {
    return serverProducts
      .filter((p) => p.isActive !== false)
      .filter((p) => {
        // ۱. فیلتر عبارت جستجو روی عنوان، توضیحات، SKU و نام برند
        if (activeQuery.trim()) {
          const q = activeQuery.trim().toLowerCase();
          const matchTitle = p.title ? p.title.toLowerCase().includes(q) : false;
          const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
          const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
          const matchBrand = p.brand ? p.brand.name.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchSku && !matchDesc && !matchBrand) {
            return false;
          }
        }

        // ۲. فیلتر دسته‌بندی
        if (selectedCategory !== "all") {
          const catId = Number(selectedCategory);
          if (!isNaN(catId) && p.categoryId !== catId) {
            return false;
          }
        }

        // ۳. فیلتر برندها
        if (selectedBrandIds.length > 0) {
          if (!p.brandId || !selectedBrandIds.includes(p.brandId)) {
            return false;
          }
        }

        // ۴. فقط کالاهای موجود
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price;
        const priceB = b.discountPrice ?? b.price;

        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "discount-desc") {
          const discA = a.discountPrice ? a.price - a.discountPrice : 0;
          const discB = b.discountPrice ? b.price - b.discountPrice : 0;
          return discB - discA;
        }
        // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [serverProducts, activeQuery, selectedCategory, selectedBrandIds, inStockOnly, sortBy]);

  // محاسبه تعداد محصولات هر برند برای نتایج جاری
  const brandCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    serverProducts.forEach((p) => {
      if (p.brandId && p.isActive !== false) {
        if (activeQuery.trim()) {
          const q = activeQuery.trim().toLowerCase();
          const match =
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q));
          if (!match) return;
        }
        counts[p.brandId] = (counts[p.brandId] || 0) + 1;
      }
    });
    return counts;
  }, [serverProducts, activeQuery]);

  // ریست همه فیلترها به جز متن جستجو
  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedBrandIds([]);
    setInStockOnly(false);
    setSortBy("newest");
  };

  // افزودن کالا به سبد
  const handleAddToCart = (product: Product) => {
    addItemToCart(product, 1);
    toast.success(`«${product.title}» به سبد خرید اضافه شد.`, {
      action: {
        label: "مشاهده سبد",
        onClick: () => router.push("/cart"),
      },
    });
  };

  const hasActiveFilters =
    selectedCategory !== "all" || selectedBrandIds.length > 0 || inStockOnly;

  return (
    <div className="space-y-6">
      {/* نوار مسیر (Breadcrumbs) */}
      <nav
        aria-label="مسیر صفحه"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          خانه
        </Link>
        <ChevronLeft className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-bold">
          {activeQuery ? `جستجوی «${activeQuery}»` : "جستجوی محصولات"}
        </span>
      </nav>

      {/* سربرگ اختصاصی صفحه جستجو */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-l from-primary/5 via-card to-card p-5 sm:p-7 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles className="size-3.5" />
            <span>جستجوی هوشمند در کاتالوگ تجهیزات برقی</span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {activeQuery ? (
                <>
                  نتایج جستجو برای:{" "}
                  <span className="text-primary font-black">«{activeQuery}»</span>
                </>
              ) : (
                "جستجوی پیشرفته محصولات"
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {activeQuery
                ? `تعداد ${filteredProducts.length.toLocaleString("fa-IR")} محصول متناسب با عبارت جستجوی شما یافت شد.`
                : "نام کالا، مدل، کد محصول یا برند مورد نظر خود را وارد کنید تا نتایج به صورت زنده نمایش داده شوند."}
            </p>
          </div>

          {/* فیلد جستجوی مستقیم داخل سربرگ */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full max-w-xl"
          >
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="عنوان کالا، برند یا کد فنی را تایپ کنید..."
                value={searchInput}
                onChange={(e) => setTypedInput(e.target.value)}
                className="pr-10 pl-24 h-11 sm:h-12 text-xs sm:text-sm rounded-2xl bg-background border-border/80 shadow-inner focus-visible:ring-primary"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="پاک کردن جستجو"
                  className="absolute left-16 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 h-8 sm:h-9 px-3.5 rounded-xl text-xs font-bold"
              >
                جستجو
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* دکمه فیلتر در موبایل */}
      <div className="flex items-center justify-between lg:hidden border-b border-border/80 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileFilterOpen(true)}
          className="rounded-xl text-xs font-bold gap-2"
        >
          <Filter className="size-4 text-primary" />
          <span>فیلترها و دسته‌بندی</span>
          {(hasActiveFilters || selectedBrandIds.length > 0) && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-4.5 px-1.5 rounded-full">
              {selectedBrandIds.length + (selectedCategory !== "all" ? 1 : 0) + (inStockOnly ? 1 : 0)}
            </Badge>
          )}
        </Button>

        <span className="text-xs text-muted-foreground font-medium">
          {filteredProducts.length.toLocaleString("fa-IR")} محصول
        </span>
      </div>

      {/* ساختار ستونی: سایدبار فیلترها + گرید نتایج */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 items-start">
        {/* سایدبار فیلترها (دسکتاپ + دراور موبایل) */}
        <aside
          className={cn(
            "space-y-4 lg:block",
            isMobileFilterOpen
              ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 overflow-y-auto block"
              : "hidden"
          )}
        >
          {/* هدر دراور موبایل */}
          <div className="flex items-center justify-between lg:hidden mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-black text-sm">
              <Filter className="size-4 text-primary" />
              <span>فیلترهای نتایج جستجو</span>
            </div>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* فیلتر دسته‌بندی کالا */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <label className="text-xs font-bold text-foreground">دسته‌بندی محصولات</label>
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs rounded-xl h-9 w-full"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* فیلتر برند کالا */}
          <BrandFilterBox
            selectedBrandIds={selectedBrandIds}
            onChange={setSelectedBrandIds}
            brandCounts={brandCounts}
          />

          {/* فقط کالاهای موجود */}
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">فقط کالاهای موجود</div>
              <div className="text-[10px] text-muted-foreground">حذف کالاهای ناموجود از نتایج</div>
            </div>
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
          </div>

          {/* بازنشانی فیلترها */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>بازنشانی فیلترها</span>
            </Button>
          )}

          {isMobileFilterOpen && (
            <Button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full rounded-xl text-xs font-bold mt-2"
            >
              مشاهده ({filteredProducts.length.toLocaleString("fa-IR")}) نتیجه
            </Button>
          )}
        </aside>

        {/* گرید و لیست محصولات نتایج جستجو */}
        <div className="lg:col-span-3 xl:col-span-4 2xl:col-span-5 space-y-5">
          {/* نوار بالای گرید: مرتب‌سازی و آمار */}
          <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-foreground">
                تعداد نتایج:{" "}
                <span className="text-primary font-black">
                  {filteredProducts.length.toLocaleString("fa-IR")}
                </span>{" "}
                کالا
              </span>

              {/* نشانگر فیلترهای فعال */}
              {activeQuery && (
                <Badge
                  variant="secondary"
                  className="rounded-lg text-[10px] gap-1 px-2 py-0.5"
                >
                  عبارت: «{activeQuery}»
                  <button
                    onClick={handleClearSearch}
                    className="hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {selectedCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="rounded-lg text-[10px] gap-1 px-2 py-0.5"
                >
                  دسته: {categories.find((c) => String(c.id) === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {selectedBrandIds.length > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-lg text-[10px] gap-1 px-2 py-0.5"
                >
                  {selectedBrandIds.length.toLocaleString("fa-IR")} برند انتخابی
                  <button
                    onClick={() => setSelectedBrandIds([])}
                    className="hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}

              {inStockOnly && (
                <Badge
                  variant="secondary"
                  className="rounded-lg text-[10px] gap-1 px-2 py-0.5"
                >
                  فقط کالاهای موجود
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}
            </div>

            {/* مرتب‌سازی */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <SlidersHorizontal className="size-3.5 text-muted-foreground hidden sm:block" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">مرتب‌سازی:</span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs rounded-xl h-8 w-36"
              >
                <option value="newest">جدیدترین</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="discount-desc">بیشترین تخفیف</option>
              </Select>
            </div>
          </div>

          {/* حالت لودینگ */}
          {isProductsLoading || isCategoriesLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs font-bold">در حال جستجو و بارگذاری محصولات...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* حالت بدون نتیجه */
            <div className="rounded-3xl border border-dashed border-border p-8 sm:p-14 text-center space-y-4 bg-card/50">
              <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-muted/70 text-muted-foreground">
                <PackageX className="size-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {activeQuery
                    ? `کالایی منطبق با «${activeQuery}» پیدا نشد`
                    : "هیچ کالایی یافت نشد"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  پیشنهاد می‌کنیم املای کلمه مورد نظر را بررسی کنید، از عبارات عمومی‌تر استفاده
                  کنید یا فیلترهای اعمال‌شده را بازنشانی نمایید.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="rounded-xl text-xs font-bold gap-2"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>بازنشانی فیلترها</span>
                  </Button>
                )}

                <Link href="/">
                  <Button className="rounded-xl text-xs font-bold gap-2">
                    <span>بازگشت به صفحه اصلی</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* گرید کارت‌های محصول */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
              {filteredProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice !== null &&
                  product.discountPrice !== undefined &&
                  product.discountPrice < product.price;

                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.price - (product.discountPrice as number)) / product.price) * 100
                    )
                  : 0;

                const primaryImage =
                  normalizeImageUrl(product.images?.[0]?.url, FALLBACK_PRODUCT_IMAGE);

                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div>
                      {/* تصویر کالا و بج‌های شناور */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/40 mb-3">
                        <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full">
                          <Image
                            src={primaryImage}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>

                        {/* بج درصد تخفیف */}
                        {hasDiscount && (
                          <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-black text-white shadow">
                            %{discountPercent}
                          </span>
                        )}

                        {/* نشانگر ناموجودی */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="rounded-xl bg-muted px-3 py-1 text-xs font-black text-muted-foreground border border-border">
                              ناموجود
                            </span>
                          </div>
                        )}
                      </div>

                      {/* متادیتای برند و کد فنی کالا */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                        {product.brand ? (
                          <span className="font-bold text-primary truncate">
                            {product.brand.name}
                          </span>
                        ) : (
                          <span className="truncate">اسمارت الکتریک</span>
                        )}

                        {product.sku && (
                          <span className="font-mono text-[10px] text-muted-foreground/80">
                            کد: {product.sku}
                          </span>
                        )}
                      </div>

                      {/* عنوان کالا */}
                      <Link href={`/product/${product.slug || product.id}`}>
                        <h2 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
                          {product.title}
                        </h2>
                      </Link>
                    </div>

                    {/* قیمت و دکمه افزودن به سبد */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        {hasDiscount ? (
                          <>
                            <span className="text-[11px] text-muted-foreground line-through">
                              {formatToman(product.price)}
                            </span>
                            <span className="text-sm sm:text-base font-black text-destructive">
                              {formatToman(product.discountPrice as number)}{" "}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                تومان
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-black text-foreground">
                            {formatToman(product.price)}{" "}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              تومان
                            </span>
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={isOutOfStock ? "outline" : "default"}
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className="rounded-xl h-9 px-3 gap-1.5 text-xs font-bold shrink-0"
                        aria-label="افزودن به سبد خرید"
                      >
                        <ShoppingCart className="size-3.5" />
                        <span className="hidden sm:inline">افزودن</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
