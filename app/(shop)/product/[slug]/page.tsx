"use client";

import React, { useState, use, useMemo } from "react";
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
  Award,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useProduct } from "@/lib/api";
import { useProductReviews } from "@/lib/api/reviews";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LatestProducts from "@/components/home/latest-products";
import { ProductReviews } from "@/components/product/product-reviews";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SingleProductPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  // دریافت اطلاعات محصول از هوک
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: reviewsData } = useProductReviews(product?.id);
  const reviewsSummary = reviewsData?.summary;
  const addItemToCart = useCartStore((s) => s.addItem);

  // استیت‌های صفحه
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  // گالری تصاویر محصول
  const images = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return ["/images/products/adapter-52240.png"];
    }
    return product.images.map((img) =>
      typeof img === "string" ? img : img.url || "/images/products/adapter-52240.png"
    );
  }, [product]);

  const activeImage = images[selectedImageIndex] || images[0];

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
            href="/products"
            className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm"
          >
            بازگشت به فهرست محصولات
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 select-none">
        {/* مسیر راهنما (Breadcrumbs) */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap py-1"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            صفحه اصلی
          </Link>
          <ChevronLeft className="size-3.5 text-muted-foreground/60 shrink-0" />
          <Link href="/products" className="hover:text-primary transition-colors">
            محصولات
          </Link>
          {product.category?.name && (
            <>
              <ChevronLeft className="size-3.5 text-muted-foreground/60 shrink-0" />
              <Link
                href={product.category.slug ? `/category/${product.category.slug}` : "/products"}
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
                <div className="absolute top-3 end-3 z-10 bg-primary text-primary-foreground text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
                  {discountPercent}٪ تخفیف
                </div>
              )}

              <Image
                src={activeImage}
                alt={product.title}
                width={400}
                height={400}
                priority
                className="object-contain size-full max-h-[320px] drop-shadow-sm transition-transform duration-300 hover:scale-105"
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
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
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
              {/* دسته‌بندی، برند و کد کالا */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-semibold border-border">
                  {product.category?.name || product.categoryName || "تجهیزات صنعتی"}
                </Badge>

                {product.brand && (
                  <Link
                    href={`/products?brandId=${product.brand.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    {product.brand.logo ? (
                      <span className="relative size-4 rounded-full overflow-hidden bg-background shrink-0 inline-block">
                        <Image
                          src={product.brand.logo}
                          alt={product.brand.name}
                          fill
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <Award className="size-3.5" />
                    )}
                    <span>برند: {product.brand.name}</span>
                  </Link>
                )}

                {product.sku && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              {/* عنوان کالا */}
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* نامک انگلیسی */}
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {product.slug}
              </p>
            </div>

            {/* امتیاز و ارزیابی خریداران */}
            <div className="flex items-center gap-3 text-xs border-y border-border/50 py-3">
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
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground">ویژگی‌های اصلی محصول:</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>طراحی صنعتی مقاوم و سازگار با شرایط آب و هوایی سخت</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>تضمین اصالت ۱۰۰٪ فیزیکی و قطعات استاندارد با بازدهی بالا</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>دارای گواهی استاندارد بین‌المللی CE و استانداردهای برق صنعتی</span>
                </li>
                {product.description && (
                  <li className="flex items-start gap-2 pt-1 text-justify">
                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <span className="line-clamp-3">{product.description}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* بنر تضمین اصالت و گارانتی */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/60">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-foreground">گارانتی تعویض ۲۴ ماهه</div>
                  <div className="text-muted-foreground mt-0.5">ضمانت رسمی شرکتی</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/60">
                <Truck className="size-5 text-primary shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold text-foreground">تحویل فوری سفارش</div>
                  <div className="text-muted-foreground mt-0.5">تهران امروز / شهرستان تیپاکس</div>
                </div>
              </div>
            </div>
          </div>

          {/* ستون چپ: باکس خرید هوشمند (Buy Box) */}
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5 sticky top-24">
            {/* وضعیت فروشنده و انبارداری */}
            <div className="space-y-3 pb-4 border-b border-border/60 text-xs">
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
                  <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    {discountPercent}٪ تخفیف
                  </span>
                  <span className="text-xs text-muted-foreground line-through font-mono">
                    {product.price.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
                  {finalPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-xs text-muted-foreground font-medium">تومان</span>
              </div>

              {hasDiscount && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  سود شما از این خرید: {(product.price - finalPrice).toLocaleString("fa-IR")} تومان
                </div>
              )}
            </div>

            {/* شمارنده انتخاب تعداد */}
            {product.stock > 0 && (
              <div className="flex items-center justify-between p-2 rounded-2xl border border-border bg-muted/20">
                <span className="text-xs font-bold text-foreground ps-2">تعداد سفارش:</span>
                <div className="flex items-center gap-2 bg-card rounded-xl border border-border p-1">
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= product.stock}
                    className="size-7 rounded-lg hover:bg-accent flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </button>

                  <span className="font-mono font-bold text-xs px-2 min-w-5 text-center">
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
                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                <ShoppingCart className="size-4" />
                <span>افزودن به سبد خرید</span>
              </Button>

              <Button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                variant="outline"
                className="w-full h-11 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="size-4" />
                <span>خرید سریع و تسویه</span>
              </Button>
            </div>
          </div>
        </div>

        {/* تب‌های تکمیلی کالا (توضیحات جامع، مشخصات فنی، نظرات خریداران) */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none p-0 bg-transparent h-auto gap-4 sm:gap-6 overflow-x-auto">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-xs sm:text-sm font-bold gap-2 cursor-pointer"
              >
                <FileText className="size-4" />
                <span>توضیحات و نقد تخصصی</span>
              </TabsTrigger>

              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-xs sm:text-sm font-bold gap-2 cursor-pointer"
              >
                <Sliders className="size-4" />
                <span>مشخصات فنی و استانداردهای کالا</span>
              </TabsTrigger>

              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary data-active:bg-transparent pb-3 text-xs sm:text-sm font-bold gap-2 cursor-pointer"
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

            {/* محتوای تب توضیحات */}
            <TabsContent value="description" className="pt-6 space-y-4">
              <h2 className="text-base sm:text-lg font-black text-foreground">
                معرفی اجمالی {product.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-justify">
                {product.description ||
                  `محصول ${product.title} با تکیه بر استانداردهای بالای صنعتی تولید شده و برای پاسخگویی به الزامات دقیق مهندسی برق و شبکه طراحی گردیده است. ساختار آلومینیومی مستحکم، عملکرد بی وقفه در بازه دمایی گسترده و مصرف بهینه انرژی از ویژگی‌های ممتاز این کالا به شمار می‌روند.`}
              </p>
              <div className="rounded-2xl bg-muted/20 border border-border p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                <div className="font-bold text-foreground">نکات مهم قبل از نصب و راه‌اندازی:</div>
                <p>• از تطابق ولتاژ ورودی تجهیز با شبکه برق محلی اطمینان حاصل نمایید.</p>
                <p>• جهت افزایش طول عمر قطعه، از سیستم اتصال به زمین (ارتینگ) استاندارد استفاده کنید.</p>
              </div>
            </TabsContent>

            {/* محتوای تب مشخصات فنی */}
            <TabsContent value="specs" className="pt-6">
              <h2 className="text-base sm:text-lg font-black text-foreground mb-4">
                جدول مشخصات فنی کالا
              </h2>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-xs text-right">
                  <tbody>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground w-1/3">شناسه کالا (SKU)</td>
                      <td className="p-3.5 text-muted-foreground font-mono">{product.sku || "—"}</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-3.5 font-bold text-foreground">دسته‌بندی تخصصی</td>
                      <td className="p-3.5 text-muted-foreground">
                        {product.category?.name || product.categoryName || "عمومی"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground">برند سازنده</td>
                      <td className="p-3.5 text-muted-foreground">
                        {product.brand ? (
                          <Link
                            href={`/products?brandId=${product.brand.id}`}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                          >
                            <span>{product.brand.name}</span>
                          </Link>
                        ) : (
                          "متفرقه / بدون برند"
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground">نوع کاربری</td>
                      <td className="p-3.5 text-muted-foreground">صنعتی، ساختمانی و شبکه‌های اداری</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="p-3.5 font-bold text-foreground">دمای کاری مجاز</td>
                      <td className="p-3.5 text-muted-foreground font-mono">منفی ۴۰ الی ۸۵ درجه سانتی‌گراد</td>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground">گارانتی و خدمات</td>
                      <td className="p-3.5 text-muted-foreground">۲۴ ماه تعویض قطعات شرکتی</td>
                    </tr>
                    {product.specs &&
                      typeof product.specs === "object" &&
                      Object.entries(product.specs).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={`border-b border-border/60 ${
                            idx % 2 === 0 ? "bg-muted/10" : ""
                          }`}
                        >
                          <td className="p-3.5 font-bold text-foreground">{key}</td>
                          <td className="p-3.5 text-muted-foreground font-mono">{String(val)}</td>
                        </tr>
                      ))}
                    <tr>
                      <td className="p-3.5 font-bold text-foreground">موجودی انبار مرکزی</td>
                      <td className="p-3.5 text-muted-foreground">
                        {product.stock > 0 ? `${product.stock} عدد موجود` : "ناموجود"}
                      </td>
                    </tr>
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
