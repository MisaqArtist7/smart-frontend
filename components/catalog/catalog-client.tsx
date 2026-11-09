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
  Award,
  Layers,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCategories, type Product } from "@/lib/api";
import { useBrands } from "@/lib/api/brands";
import { useCartStore } from "@/lib/cart-store";
import { BrandFilterBox } from "./brand-filter-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { formatToman } from "@/lib/order-utils";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price-asc" | "price-desc" | "discount-desc";

export function CatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: serverProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const addItemToCart = useCartStore((s) => s.addItem);

  // استیت‌های فیلتر، مقداردهی اولیه هوشمند از روی URL
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "all"
  );
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>(() => {
    const brandIdParam = searchParams.get("brandId");
    if (brandIdParam) {
      const id = Number(brandIdParam);
      if (!isNaN(id)) return [id];
    }
    return [];
  });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // استخراج برندهای فعال با پشتیبانی همزمان از ?brandId و ?brand (اسلاگ برند)
  const activeBrandIds = useMemo(() => {
    if (selectedBrandIds.length > 0) return selectedBrandIds;
    const brandSlugParam = searchParams.get("brand");
    if (brandSlugParam && brands.length > 0) {
      const found = brands.find((b) => b.slug.toLowerCase() === brandSlugParam.toLowerCase());
      if (found) return [found.id];
    }
    return [];
  }, [selectedBrandIds, searchParams, brands]);

  // محاسبه تعداد محصولات هر برند
  const brandCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    serverProducts.forEach((p) => {
      if (p.brandId) {
        counts[p.brandId] = (counts[p.brandId] || 0) + 1;
      }
    });
    return counts;
  }, [serverProducts]);

  // فیلتر و مرتب‌سازی نهایی کاتالوگ محصولات
  const filteredProducts = useMemo(() => {
    return serverProducts
      .filter((p) => p.isActive !== false)
      .filter((p) => {
        // فیلتر متن جستجو
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
          const matchBrand = p.brand ? p.brand.name.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchSku && !matchBrand) return false;
        }

        // فیلتر دسته‌بندی
        if (selectedCategory !== "all") {
          const catId = Number(selectedCategory);
          if (!isNaN(catId) && p.categoryId !== catId) {
            return false;
          }
        }

        // فیلتر برند کالا (هسته اصلی فیچر)
        if (activeBrandIds.length > 0) {
          if (!p.brandId || !activeBrandIds.includes(p.brandId)) {
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
        // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [serverProducts, searchQuery, selectedCategory, activeBrandIds, inStockOnly, sortBy]);

  // پاک کردن تمام فیلترها
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrandIds([]);
    setInStockOnly(false);
    setSortBy("newest");
    router.replace("/products");
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

  return (
    <div className="space-y-6">
      {/* نوار مسیر (Breadcrumb) */}
      <nav
        aria-label="مسیر صفحه"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          خانه
        </Link>
        <ChevronLeft className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-bold">کاتالوگ و لیست محصولات</span>
      </nav>

      {/* سربرگ صفحه و تعداد نتایج */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <SlidersHorizontal className="size-5 text-primary" />
            <span>کاتالوگ تجهیزات برق و شبکه</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مشاهده، مقایسه مشخصات فنی و خرید محصولات اصل از معتبرترین برندهای ایرانی و بین‌المللی
          </p>
        </div>

        {/* دکمه باز کردن فیلتر در موبایل */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="rounded-xl text-xs font-bold gap-2 flex-1"
          >
            <Filter className="size-4 text-primary" />
            <span>فیلترها و برندها</span>
            {activeBrandIds.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] h-4.5 px-1.5 rounded-full">
                {activeBrandIds.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* بخش اصلی: ستون سایدبار فیلترها + گرید محصولات */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* سایدبار فیلترها (دسکتاپ + منوی تاشو موبایل) */}
        <aside
          className={cn(
            "space-y-4 lg:block",
            isMobileFilterOpen
              ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 overflow-y-auto block"
              : "hidden"
          )}
        >
          {/* هدر فیلتر در موبایل */}
          <div className="flex items-center justify-between lg:hidden mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-black text-sm">
              <Filter className="size-4 text-primary" />
              <span>فیلترهای کاتالوگ</span>
            </div>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* ۱. باکس جستجو */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <label className="text-xs font-bold text-foreground">جستجو در نتایج</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="عنوان کالا، مدل یا کد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 pl-3 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* ۲. باکس فیلتر برند کالا (کامپوننت اختصاصی فیچر برندها) */}
          <BrandFilterBox
            selectedBrandIds={activeBrandIds}
            onChange={setSelectedBrandIds}
            brandCounts={brandCounts}
          />

          {/* ۳. فیلتر دسته‌بندی کالا */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <label className="text-xs font-bold text-foreground">دسته‌بندی کالا</label>
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

          {/* ۴. فقط کالاهای موجود */}
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">فقط کالاهای موجود</div>
              <div className="text-[10px] text-muted-foreground">حذف کالاهای ناموجود از لیست</div>
            </div>
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
          </div>

          {/* دکمه پاک‌سازی تمام فیلترها */}
          <Button
            variant="outline"
            onClick={handleClearAllFilters}
            className="w-full rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>بازنشانی تمام فیلترها</span>
          </Button>

          {isMobileFilterOpen && (
            <Button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full rounded-xl text-xs font-bold mt-2"
            >
              مشاهده ({filteredProducts.length.toLocaleString("fa-IR")}) کالا
            </Button>
          )}
        </aside>

        {/* ستون اصلی کاتالوگ و گرید کالاها */}
        <div className="lg:col-span-3 space-y-5">
          {/* نوار بالای گرید: تعداد کالاها، تگ‌های فیلتر فعال و مرتب‌سازی */}
          <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">تعداد کالاهای منطبق:</span>
              <span className="font-bold text-foreground">
                {filteredProducts.length.toLocaleString("fa-IR")} محصول
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">مرتب‌سازی بر اساس:</span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-[160px] text-xs rounded-xl h-8.5"
              >
                <option value="newest">جدیدترین</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="discount-desc">بیشترین تخفیف</option>
              </Select>
            </div>
          </div>

          {/* تگ‌های فیلترهای فعال (Brand Tags) */}
          {activeBrandIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">برندهای فیلترشده:</span>
              {activeBrandIds.map((bId) => {
                const brand = brands.find((b) => b.id === bId);
                if (!brand) return null;
                return (
                  <Badge
                    key={brand.id}
                    variant="outline"
                    className="gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-primary/10 text-primary border-primary/20"
                  >
                    <span>{brand.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBrandIds(activeBrandIds.filter((id) => id !== brand.id))
                      }
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* وضعیت لودینگ */}
          {isProductsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs">در حال بارگذاری محصولات...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* خالی بودن نتایج */
            <div className="py-20 rounded-3xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <PackageX className="size-8" />
              </div>
              <h3 className="font-bold text-foreground text-sm">محصولی با این مشخصات یافت نشد</h3>
              <p className="text-xs text-muted-foreground max-w-md">
                فیلترهای اعمال‌شده (به خصوص برندهای انتخابی یا عبارت جستجو) را تغییر دهید تا محصولات
                دیگر را مشاهده نمایید.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="rounded-xl text-xs font-bold mt-2 gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span>حذف تمام فیلترها</span>
              </Button>
            </div>
          ) : (
            /* گرید محصولات */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isDiscounted =
                  product.discountPrice != null && product.discountPrice < product.price;
                const discountPercent = isDiscounted
                  ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
                  : 0;
                const finalPrice = product.discountPrice ?? product.price;

                const mainImage =
                  product.images && product.images.length > 0
                    ? typeof product.images[0] === "string"
                      ? product.images[0]
                      : product.images[0].url || "/images/products/adapter-52240.png"
                    : "/images/products/adapter-52240.png";

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {/* تصویر کالا و بج‌ها */}
                      <div className="relative aspect-square w-full rounded-xl bg-muted/20 overflow-hidden flex items-center justify-center p-3">
                        <Image
                          src={mainImage}
                          alt={product.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* بج درصد تخفیف */}
                        {isDiscounted && (
                          <div className="absolute top-2.5 right-2.5 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-[11px] font-black">
                            {discountPercent.toLocaleString("fa-IR")}٪ تخفیف
                          </div>
                        )}

                        {/* بج ناموجود */}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
                            <span className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
                              ناموجود
                            </span>
                          </div>
                        )}
                      </div>

                      {/* بج برند و دسته‌بندی */}
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-muted-foreground truncate">
                          {product.category?.name || product.categoryName || "تجهیزات برق"}
                        </span>

                        {/* نمایش برند کالا */}
                        {product.brand ? (
                          <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md truncate">
                            <Award className="size-3" />
                            <span>{product.brand.name}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* عنوان کالا */}
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-relaxed"
                      >
                        {product.title}
                      </Link>
                    </div>

                    {/* فوتر کارت: قیمت و دکمه خرید */}
                    <div className="p-4 pt-0 border-t border-border/40 mt-3 flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        {isDiscounted && (
                          <div className="text-[11px] text-muted-foreground line-through font-mono">
                            {formatToman(product.price)}
                          </div>
                        )}
                        <div className="text-xs sm:text-sm font-black text-foreground font-mono">
                          {formatToman(finalPrice)}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={product.stock <= 0}
                        onClick={() => handleAddToCart(product)}
                        className="rounded-xl text-xs font-bold gap-1.5 h-8 px-3"
                      >
                        <ShoppingCart className="size-3.5" />
                        <span>خرید</span>
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

export default CatalogClient;
