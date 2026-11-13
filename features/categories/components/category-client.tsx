"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ShoppingCart,
  PackageX,
  RotateCcw,
  Loader2,
  FolderTree,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCategories, useCategory, type Product } from "@/lib/api";
import { useBrands } from "@/lib/api/brands";
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

export interface CategoryClientProps {
  slug: string;
  fullPath?: string[];
}

export function CategoryClient({ slug }: CategoryClientProps) {
  const { data: serverProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: specificCategory, isLoading: isCategoryLoading } = useCategory(slug);
  const { data: brands = [] } = useBrands();
  const addItemToCart = useCartStore((s) => s.addItem);

  // استیت‌های فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
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

  // اعمال فیلترها و مرتب‌سازی روی محصولات دسته‌بندی
  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((p) => {
        // فیلتر جستجو
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
          const matchBrand = p.brand ? p.brand.name.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchSku && !matchBrand) return false;
        }

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
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [categoryProducts, searchQuery, selectedBrandIds, inStockOnly, sortBy]);

  // افزودن کالا به سبد خرید
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast.error("متأسفانه موجودی این کالا به پایان رسیده است.");
      return;
    }

    addItemToCart(product, 1);

    toast.success(`«${product.title}» به سبد خرید افزوده شد.`);
  };

  // پاک کردن تمام فیلترها
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBrandIds([]);
    setInStockOnly(false);
    setSortBy("newest");
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedBrandIds.length > 0 || inStockOnly
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
          متأسفانه دسته‌بندی «{slug}» وجود ندارد یا غیرفعال شده است. می‌توانید به کاتالوگ تمام محصولات برگردید.
        </p>
        <Link href="/products">
          <Button className="rounded-xl px-6 bg-primary text-primary-foreground font-bold text-xs sm:text-sm">
            مشاهده تمام محصولات فروشگاه
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* بردکرامب (Breadcrumb) ناوبری */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          خانه
        </Link>
        <ChevronLeft className="size-3 text-muted-foreground/60" />
        <Link href="/products" className="hover:text-primary transition-colors">
          محصولات
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

      {/* سربرگ اختصاصی دسته‌بندی */}
      <header className="relative rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                دسته‌بندی {currentCategory.name}
              </h1>
              <Badge variant="outline" className="text-[11px] font-semibold border-border">
                {categoryProducts.length} کالا
              </Badge>
            </div>

            {currentCategory.description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                {currentCategory.description}
              </p>
            )}
          </div>

          {/* تصویر یا آیکون دسته‌بندی */}
          {currentCategory.image && (
            <div className="size-20 sm:size-24 rounded-2xl border border-border bg-muted/30 p-2 flex items-center justify-center shrink-0 self-start sm:self-center overflow-hidden">
              <Image
                src={normalizeImageUrl(currentCategory.image)}
                alt={currentCategory.imageAlt || currentCategory.name}
                width={80}
                height={80}
                className="size-full object-contain drop-shadow-sm"
              />
            </div>
          )}
        </div>

        {/* لیست زیردسته‌ها به صورت چیپ‌های فیلتر (در صورت وجود) */}
        {subcategories.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 ms-1">
              <CornerDownLeft className="size-3.5" />
              <span>زیردسته‌ها:</span>
            </span>
            {subcategories.map((sub) => (
              <Link key={sub.id} href={`/category/${sub.slug}`}>
                <Badge
                  variant="outline"
                  className="rounded-lg py-1 px-3 text-xs font-semibold bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all"
                >
                  {sub.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* نوار جستجو و ابزار فیلتر در بالای گرید */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-xs">
        {/* اینپوت جستجو در این دسته */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`جستجو در محصولات ${currentCategory.name}...`}
            className="ps-9 h-10 rounded-xl bg-background border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* دکمه‌های مرتب‌سازی و فیلتر موبایل */}
        <div className="flex items-center gap-2">
          {/* دکمه باز کردن سایدبار فیلتر در موبایل */}
          <Button
            variant="outline"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden h-10 px-3.5 gap-2 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="size-4 text-primary" />
            <span>فیلترها</span>
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* مرتب‌سازی */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">مرتب‌سازی:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 text-xs rounded-xl min-w-[130px]"
            >
              <option value="newest">جدیدترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="discount-desc">بیشترین تخفیف</option>
            </Select>
          </div>
        </div>
      </div>

      {/* بدنه دو ستونه: سایدبار فیلترها + گرید محصولات */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 items-start">
        {/* سایدبار فیلترهای دسکتاپ */}
        <aside className="hidden lg:block lg:col-span-1 space-y-4 sticky top-24">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <Filter className="size-4 text-primary" />
                <span>فیلترهای پیشرفته</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
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

            {/* فیلتر برندهای موجود در این دسته‌بندی */}
            {brands.length > 0 && (
              <div className="pt-2 border-t border-border">
                <BrandFilterBox
                  selectedBrandIds={selectedBrandIds}
                  onChange={setSelectedBrandIds}
                  brandCounts={brandCounts}
                />
              </div>
            )}
          </div>
        </aside>

        {/* گرید نمایش محصولات */}
        <section className="lg:col-span-3 xl:col-span-4 2xl:col-span-5">
          {isProductsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-4 h-[320px] animate-pulse space-y-3 flex flex-col justify-between"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice != null && product.discountPrice < product.price;
                const finalPrice = product.discountPrice ?? product.price;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  >
                    <Link href={`/product/${product.slug}`} className="block space-y-3">
                      {/* تصویر کالا */}
                      <div className="relative aspect-square w-full rounded-xl bg-muted/20 p-2 flex items-center justify-center overflow-hidden">
                        <Image
                          src={normalizeImageUrl(product.images?.[0]?.url, FALLBACK_PRODUCT_IMAGE)}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* بج تخفیف */}
                        {hasDiscount && (
                          <span className="absolute top-2 start-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-xs">
                            {Math.round(((product.price - product.discountPrice!) / product.price) * 100)}٪
                          </span>
                        )}

                        {/* برچسب برند */}
                        {product.brand && (
                          <span className="absolute bottom-2 start-2 bg-background/90 text-foreground border border-border/60 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {product.brand.name}
                          </span>
                        )}
                      </div>

                      {/* عنوان و مشخصات */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        {product.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground block">
                            کد: {product.sku}
                          </span>
                        )}
                      </div>

                      {/* قیمت */}
                      <div className="pt-2">
                        {hasDiscount && (
                          <div className="text-[11px] text-muted-foreground line-through">
                            {formatToman(product.price)}
                          </div>
                        )}
                        <div className="font-black text-xs sm:text-sm md:text-base text-foreground">
                          {formatToman(finalPrice)}
                        </div>
                      </div>
                    </Link>

                    {/* دکمه افزودن به سبد خرید */}
                    <div className="pt-3">
                      <Button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={isOutOfStock}
                        variant={isOutOfStock ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          "w-full rounded-xl text-xs font-bold gap-1.5 h-9",
                          !isOutOfStock && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        )}
                      >
                        <ShoppingCart className="size-3.5" />
                        <span>{isOutOfStock ? "ناموجود" : "افزودن به سبد"}</span>
                      </Button>
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
              <div className="flex items-center justify-between py-2 border-b border-border">
                <label htmlFor="inStockSwitchMobile" className="text-xs font-bold">
                  فقط کالاهای موجود
                </label>
                <Switch
                  id="inStockSwitchMobile"
                  checked={inStockOnly}
                  onCheckedChange={setInStockOnly}
                />
              </div>

              {brands.length > 0 && (
                <div>
                  <BrandFilterBox
                    selectedBrandIds={selectedBrandIds}
                    onChange={setSelectedBrandIds}
                    brandCounts={brandCounts}
                  />
                </div>
              )}
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
                نمایش نتایج ({filteredProducts.length} کالا)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryClient;
