"use client";

import React, { Suspense, useState, use, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingCart,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Star,
  ChevronLeft,
  Share2,
  Heart,
  FileText,
  Sliders,
  MessageSquare,
  AlertCircle,
  Plus,
  Minus,
  PhoneCall,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useProduct } from "@/lib/api";
import { useBrands } from "@/lib/api/brands";
import { useProductReviews } from "@/lib/api/reviews";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LatestProducts from "@/components/home/latest-products";
import { ProductReviews } from "@/components/product/product-reviews";
import { normalizeImageUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SingleProductPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Header />
          <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
              <div className="lg:col-span-5 h-[420px] rounded-3xl bg-muted/60" />
              <div className="lg:col-span-4 space-y-4">
                <div className="h-8 bg-muted/60 rounded w-3/4" />
                <div className="h-4 bg-muted/40 rounded w-1/2" />
                <div className="h-24 bg-muted/30 rounded mt-6" />
              </div>
              <div className="lg:col-span-3 h-[360px] rounded-3xl bg-muted/60" />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <SingleProductContent params={params} />
    </Suspense>
  );
}

function SingleProductContent({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  // دریافت اطلاعات محصول از هوک
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: brands = [] } = useBrands();
  const { data: reviewsData } = useProductReviews(product?.id);
  const reviewsSummary = reviewsData?.summary;
  const addItemToCart = useCartStore((s) => s.addItem);

  const resolvedBrand = useMemo(() => {
    if (product?.brand) return product.brand;
    if (product?.brandId && brands.length > 0) {
      return brands.find((b) => b.id === product.brandId) || null;
    }
    return null;
  }, [product, brands]);

  // استیت‌های صفحه
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  // گالری تصاویر محصول
  const images = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return ["/images/products/adapter-52240.png"];
    }
    return product.images.map((img) => {
      const raw = typeof img === "string" ? img : img.url;
      return normalizeImageUrl(raw, "/images/products/adapter-52240.png");
    });
  }, [product]);

  const activeImage = images[selectedImageIndex] || images[0];

  // مشخصات فنی پارس شده کالا
  const rawSpecs = product?.specs;
  const parsedSpecs = useMemo<Record<string, unknown>>(() => {
    if (!rawSpecs) return {};
    if (typeof rawSpecs === "object" && !Array.isArray(rawSpecs)) {
      return rawSpecs as Record<string, unknown>;
    }
    if (typeof rawSpecs === "string") {
      try {
        const parsed = JSON.parse(rawSpecs);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return {};
  }, [rawSpecs]);

  // محاسبه قیمت‌ها و درصد تخفیف
  const finalPrice = product ? product.discountPrice ?? product.price : 0;
  const hasDiscount = Boolean(product && product.discountPrice && product.discountPrice < product.price);
  const discountPercent = hasDiscount && product
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  // افزایش تعداد
  const handleIncrease = () => {
    if (product && quantity < (product.stock || 99)) {
      setQuantity((q) => q + 1);
    }
  };

  // کاهش تعداد
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  // افزودن به سبد خرید
  const handleAddToCart = () => {
    if (!product) return;
    addItemToCart(product, quantity);
    toast.success(`«${product.title}» به سبد خرید اضافه شد.`, {
      action: {
        label: "مشاهده سبد",
        onClick: () => router.push("/cart"),
      },
    });
  };

  // خرید سریع و انتقال به صفحه تسویه
  const handleBuyNow = () => {
    if (!product) return;
    addItemToCart(product, quantity);
    router.push("/checkout");
  };

  // اشتراک‌گذاری لینک محصول
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.info("لینک صفحه محصول در کلیپ‌بورد کپی شد.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-5 h-[420px] rounded-3xl bg-muted/60" />
            <div className="lg:col-span-4 space-y-4">
              <div className="h-8 bg-muted/60 rounded w-3/4" />
              <div className="h-4 bg-muted/40 rounded w-1/2" />
              <div className="h-24 bg-muted/30 rounded mt-6" />
            </div>
            <div className="lg:col-span-3 h-[360px] rounded-3xl bg-muted/60" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="size-16 text-destructive mb-4" />
          <h1 className="text-xl sm:text-2xl font-black mb-2">محصول مورد نظر یافت نشد!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            ممکن است این کالا حذف شده یا شناسه آن تغییر کرده باشد.
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm"
          >
            بازگشت به صفحه اصلی
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* مسیر راهنما (Breadcrumbs) */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap py-1"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            صفحه اصلی
          </Link>
          {product.category?.name && (
            <>
              <ChevronLeft className="size-3.5 text-muted-foreground/60 shrink-0" />
              <Link
                href={product.category.slug ? `/category/${product.category.slug}` : "/"}
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="size-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-foreground font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>

        {/* بخش اصلی محصول (گالری + مشخصات + باکس خرید ۳ ستونه) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ستون راست (در RTL): گالری تصویر کالا */}
          <div className="lg:col-span-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            {/* تصویر بزرگ اصلی */}
            <div className="relative w-full aspect-square rounded-2xl bg-muted/20 border border-border/60 p-4 flex items-center justify-center overflow-hidden">
              {hasDiscount && (
                <div className="absolute top-3 end-3 z-10 bg-primary text-primary-foreground text-sm font-black px-2.5 py-1 rounded-full shadow-xs">
                  {discountPercent}٪ تخفیف
                </div>
              )}

              <Image
                src={activeImage}
                alt={product.title}
                width={400}
                height={400}
                priority
                className="object-contain size-full max-h-[320px] transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* بندانگشتی‌های گالری */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative size-16 sm:size-18 rounded-xl border p-1 shrink-0 overflow-hidden transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 bg-card"
                        : "border-border bg-muted/30 hover:border-muted-foreground/40"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} - تصویر ${idx + 1}`}
                      width={64}
                      height={64}
                      className="object-contain size-full"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* دکمه‌های اشتراک‌گذاری و علاقه‌مندی */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
              >
                <Share2 className="size-4" />
                <span>اشتراک‌گذاری</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsWishlist(!isWishlist);
                  toast.success(
                    isWishlist ? "از علاقه‌مندی‌ها حذف شد." : "به علاقه‌مندی‌ها اضافه شد."
                  );
                }}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isWishlist ? "text-primary" : "hover:text-foreground"
                }`}
              >
                <Heart className={`size-4 ${isWishlist ? "fill-primary" : ""}`} />
                <span>علاقه‌مندی</span>
              </button>
            </div>
          </div>

          {/* ستون وسط: اطلاعات، مشخصات اجمالی و امتیاز محصول */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              {/* عنوان کالا */}
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                {product.title}
              </h1>
            </div>

            {/* امتیاز و ارزیابی خریداران */}
            <div className="flex items-center gap-3 text-sm border-y border-border/50 py-3">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="size-4 fill-amber-500" />
                <span>
                  {reviewsSummary && reviewsSummary.totalReviews > 0
                    ? reviewsSummary.averageRating.toLocaleString("fa-IR")
                    : "۴.۸"}
                </span>
              </div>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-muted-foreground">
                {reviewsSummary && reviewsSummary.totalReviews > 0
                  ? `${reviewsSummary.totalReviews.toLocaleString("fa-IR")} دیدگاه ثبت‌شده`
                  : "دیدگاه‌های کاربران"}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {reviewsSummary && reviewsSummary.totalReviews > 0
                  ? `${reviewsSummary.satisfactionRate.toLocaleString("fa-IR")}٪ رضایت خریداران`
                  : "رضایت خریداران"}
              </span>
            </div>

            {/* ویژگی‌های شاخص کالا */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-foreground">ویژگی‌های اصلی محصول:</h3>
              <div className="rounded-2xl border border-border overflow-hidden text-sm">
                {Object.keys(parsedSpecs).length > 0 ? (
                  Object.entries(parsedSpecs)
                    .slice(0, 4)
                    .map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between gap-4 px-4 py-2.5 border-b border-border/60 last:border-b-0 ${
                          idx % 2 === 0 ? "bg-muted/15" : "bg-card"
                        }`}
                      >
                        <span className="font-bold text-foreground shrink-0">{key}</span>
                        <span className="text-muted-foreground text-left truncate">
                          {typeof val === "boolean"
                            ? val
                              ? "دارد"
                              : "ندارد"
                            : String(val ?? "—")}
                        </span>
                      </div>
                    ))
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-border/60 bg-muted/15">
                      <span className="font-bold text-foreground">ساختار و کیفیت</span>
                      <span className="text-muted-foreground">طراحی صنعتی مقاوم و استاندارد</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-border/60 last:border-b-0 bg-card">
                      <span className="font-bold text-foreground">اصالت کالا</span>
                      <span className="text-muted-foreground">تضمین اصالت ۱۰۰٪ فیزیکی</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* بنر تضمین اصالت و گارانتی */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border shadow-xs">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <div className="text-xs sm:text-sm leading-tight">
                  <div className="font-bold text-foreground">گارانتی تعویض ۲۴ ماهه</div>
                  <div className="text-muted-foreground mt-0.5">ضمانت رسمی شرکتی</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border shadow-xs">
                <Truck className="size-5 text-primary shrink-0" />
                <div className="text-xs sm:text-sm leading-tight">
                  <div className="font-bold text-foreground">تحویل فوری سفارش</div>
                  <div className="text-muted-foreground mt-0.5">تهران امروز / شهرستان تیپاکس</div>
                </div>
              </div>
            </div>

            {/* شرایط بازگشت کالا */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-card border border-border shadow-xs">
              <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <div className="font-bold text-foreground">شرایط بازگشت کالا</div>
                <p className="text-muted-foreground mt-1 text-justify">
                  درخواست مرجوع کردن کالا با دلیل &quot;انصراف از خرید&quot; تنها در صورتی قابل تایید است که کالا در شرایط اولیه باشد (در صورت پلمپ بودن، کالا نباید باز شده باشد).
                </p>
              </div>
            </div>
          </div>

          {/* ستون چپ: باکس خرید هوشمند (Buy Box) */}
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5 sticky top-24">
            {/* وضعیت فروشنده و انبارداری */}
            <div className="space-y-3 pb-4 border-b border-border/60 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">فروشنده:</span>
                <span className="font-bold text-foreground">اسمارت الکتریک (تامین‌کننده اصلی)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">وضعیت انبار:</span>
                {product.stock > 5 ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    موجود در انبار
                  </span>
                ) : product.stock > 0 ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    تنها {product.stock.toLocaleString("fa-IR")} عدد باقیست
                  </span>
                ) : (
                  <span className="font-bold text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    ناموجود در انبار
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ارسال رایگان:</span>
                <span className="font-semibold text-foreground">برای خریدهای بالای ۵ میلیون</span>
              </div>
            </div>

            {/* بخش قیمت و تخفیف */}
            <div className="space-y-1 text-end">
              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    {discountPercent}٪ تخفیف
                  </span>
                  <span className="text-sm text-muted-foreground line-through font-mono">
                    {product.price.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-mono">
                  {finalPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-sm text-muted-foreground font-medium">تومان</span>
              </div>

              {hasDiscount && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  سود شما از این خرید: {(product.price - finalPrice).toLocaleString("fa-IR")} تومان
                </div>
              )}
            </div>

            {/* شمارنده انتخاب تعداد */}
            {product.stock > 0 && (
              <div className="flex items-center justify-between p-2 rounded-2xl border border-border bg-muted/20">
                <span className="text-sm font-bold text-foreground ps-2">تعداد سفارش:</span>
                <div className="flex items-center gap-2 bg-card rounded-xl border border-border p-1">
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= product.stock}
                    className="size-7 rounded-lg hover:bg-accent flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </button>

                  <span className="font-mono font-bold text-sm px-2 min-w-5 text-center">
                    {quantity.toLocaleString("fa-IR")}
                  </span>

                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    className="size-7 rounded-lg hover:bg-accent flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* دکمه‌های اقدام خرید */}
            <div className="space-y-2.5 pt-1">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full h-10 px-5 rounded-md bg-primary text-primary-foreground font-bold text-sm leading-none flex items-center justify-center gap-2 shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                <ShoppingCart className="size-4" />
                <span>افزودن به سبد خرید</span>
              </Button>

              <Button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                variant="outline"
                className="w-full h-10 px-5 rounded-md border-primary/30 text-primary hover:bg-primary/5 font-bold text-sm leading-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="size-4" />
                <span>خرید سریع و تسویه</span>
              </Button>
            </div>
          </div>
        </div>

        {/* تب‌های تکمیلی کالا (معرفی محصول، مشخصات فنی، نظرات خریداران) */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none p-0 bg-transparent h-auto gap-4 sm:gap-6 overflow-x-auto">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-sm sm:text-base font-bold gap-2 cursor-pointer"
              >
                <FileText className="size-4" />
                <span>معرفی محصول</span>
              </TabsTrigger>

              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-sm sm:text-base font-bold gap-2 cursor-pointer"
              >
                <Sliders className="size-4" />
                <span>مشخصات فنی</span>
              </TabsTrigger>

              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-sm sm:text-base font-bold gap-2 cursor-pointer"
              >
                <MessageSquare className="size-4" />
                <span>
                  دیدگاه خریداران
                  {reviewsSummary && reviewsSummary.totalReviews > 0
                    ? ` (${reviewsSummary.totalReviews.toLocaleString("fa-IR")})`
                    : ""}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* محتوای تب معرفی محصول (توضیحات کلی) */}
            <TabsContent value="description" className="pt-6 space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-foreground">
                معرفی {product.title}
              </h2>
              {product.description ? (
                <div className="rounded-2xl bg-muted/10 border border-border/60 p-5 text-sm sm:text-base text-foreground/90 leading-relaxed text-justify whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <div className="rounded-2xl bg-muted/10 border border-border/60 p-5 text-sm sm:text-base text-muted-foreground text-center">
                  توضیحات و معرفی تکمیلی برای این کالا ثبت نشده است.
                </div>
              )}
            </TabsContent>

            {/* محتوای تب مشخصات فنی (برگرفته از specs و اطلاعات ساختاری) */}
            <TabsContent value="specs" className="pt-6">
              <h2 className="text-lg sm:text-xl font-black text-foreground mb-4">
                جدول مشخصات فنی {product.title}
              </h2>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm text-right">
                  <tbody>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground w-1/3 sm:w-1/4">شناسه کالا (SKU)</td>
                      <td className="p-3.5 text-muted-foreground font-mono">{product.sku || "—"}</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-3.5 font-bold text-foreground">دسته‌بندی</td>
                      <td className="p-3.5 text-muted-foreground">
                        {product.category?.name || product.categoryName || "عمومی"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground">برند سازنده</td>
                      <td className="p-3.5 text-muted-foreground">
                        {resolvedBrand ? resolvedBrand.name : "متفرقه / بدون برند"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-3.5 font-bold text-foreground">وضعیت موجودی</td>
                      <td className="p-3.5 text-muted-foreground">
                        {product.stock > 0 ? "موجود در انبار" : "ناموجود"}
                      </td>
                    </tr>

                    {/* مشخصات داینامیک استخراج‌شده از specs JSON */}
                    {Object.entries(parsedSpecs).map(([key, val], idx) => (
                      <tr
                        key={key}
                        className={`border-b border-border/60 ${
                          idx % 2 === 1 ? "bg-muted/10" : ""
                        }`}
                      >
                        <td className="p-3.5 font-bold text-foreground">{key}</td>
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {typeof val === "boolean"
                            ? val
                              ? "دارد"
                              : "ندارد"
                            : String(val ?? "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* محتوای تب نظرات خریداران */}
            <TabsContent value="reviews" className="pt-6">
              <ProductReviews productId={product.id} productTitle={product.title} />
            </TabsContent>
          </Tabs>
        </div>

        {/* کالاهای پیشنهادی و مرتبط */}
        <LatestProducts title="کالاهای پیشنهادی و مرتبط" />
      </main>

      <Footer />
    </div>
  );
}
