"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const router = useRouter();
  const [couponInput, setCouponInput] = useState("");

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const {
    items,
    updateQuantity,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    getRawTotal,
    getDiscountTotal,
    getShippingFee,
    getFinalTotal,
    getTotalCount,
  } = useCartStore();

  const totalCount = mounted ? getTotalCount() : 0;
  const rawTotal = mounted ? getRawTotal() : 0;
  const discountTotal = mounted ? getDiscountTotal() : 0;
  const shippingFee = mounted ? getShippingFee() : 0;
  const finalTotal = mounted ? getFinalTotal() : 0;

  // اعمال کد تخفیف
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error("لطفاً کد تخفیف را وارد نمایید.");
      return;
    }
    const result = applyCoupon(couponInput);
    if (result.success) {
      toast.success(result.message);
      setCouponInput("");
    } else {
      toast.error(result.message);
    }
  };

  // حذف همه اقلام با تایید
  const handleClearAll = () => {
    if (window.confirm("آیا از حذف تمام کالاهای موجود در سبد خرید اطمینان دارید؟")) {
      clearCart();
      toast.info("سبد خرید شما خالی شد.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        {/* نوار مراحل خرید (Checkout Steps Bar) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-center gap-3 sm:gap-8 text-xs font-bold">
            <div className="flex items-center gap-2 text-primary">
              <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                ۱
              </span>
              <span>سبد خرید</span>
            </div>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="size-6 rounded-full bg-muted flex items-center justify-center text-xs">
                ۲
              </span>
              <span className="hidden sm:inline">آدرس و شیوه ارسال</span>
              <span className="sm:hidden">ارسال</span>
            </div>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="size-6 rounded-full bg-muted flex items-center justify-center text-xs">
                ۳
              </span>
              <span>پرداخت و ثبت نهایی</span>
            </div>
          </div>
        </div>

        {/* حالت سبد خرید خالی */}
        {mounted && items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 sm:p-16 text-center space-y-5 my-6">
            <div className="size-20 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <ShoppingBag className="size-10 stroke-1" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                سبد خرید شما در حال حاضر خالی است!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                می‌توانید برای مشاهده و خرید انواع تجهیزات برق صنعتی، اتوماسیون، سوئیچ‌های شبکه و سیستم‌های هوشمند به فروشگاه سر بزنید.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all active:scale-95"
            >
              <span>مشاهده محصولات فروشگاه</span>
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        ) : (
          /* سبد خرید پر (دو ستونه: لیست اقلام + فاکتور کناری) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ستون راست: لیست کالاهای سبد خرید */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-foreground">
                    کالاهای انتخابی شما
                  </h1>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                    {totalCount} عدد
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="size-3.5" />
                  <span>حذف همه اقلام</span>
                </button>
              </div>

              {/* کارت‌های اقلام */}
              <div className="space-y-3">
                {items.map((item) => {
                  const currentPrice = item.discountPrice ?? item.price;
                  const itemTotal = currentPrice * item.quantity;
                  const hasDiscount = Boolean(item.discountPrice && item.discountPrice < item.price);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                    >
                      {/* تصویر کالا */}
                      <Link
                        href={`/product/${item.slug}`}
                        className="relative size-24 sm:size-28 rounded-xl bg-muted/20 border border-border/60 p-2 flex items-center justify-center shrink-0"
                      >
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={96}
                          height={96}
                          className="object-contain size-full"
                        />
                      </Link>

                      {/* اطلاعات عنوان، گارانتی و قیمت */}
                      <div className="flex-1 w-full space-y-2 text-center sm:text-right">
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          {item.sku && (
                            <span className="font-mono text-[11px] text-muted-foreground block mt-0.5">
                              کد کالا: {item.sku}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="size-3.5" />
                            موجود در انبار
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="size-3.5 text-primary" />
                            گارانتی اصالت و سلامت فیزیکی
                          </span>
                        </div>

                        {/* بخش قیمت واحد و کل */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          {/* کنترلر تعداد */}
                          <div className="flex items-center gap-2 bg-muted/40 rounded-xl border border-border p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="size-7 rounded-lg hover:bg-card flex items-center justify-center text-foreground disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                            </button>

                            <span className="font-mono font-bold text-xs px-2 min-w-5 text-center">
                              {item.quantity.toLocaleString("fa-IR")}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="size-7 rounded-lg hover:bg-card flex items-center justify-center text-foreground cursor-pointer"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="size-3.5 text-destructive" />
                              ) : (
                                <Minus className="size-3.5" />
                              )}
                            </button>
                          </div>

                          {/* قیمت کل کالا */}
                          <div className="text-end">
                            {hasDiscount && (
                              <div className="text-[11px] text-muted-foreground line-through font-mono">
                                {(item.price * item.quantity).toLocaleString("fa-IR")}
                              </div>
                            )}
                            <div className="text-sm sm:text-base font-black text-foreground font-mono">
                              {itemTotal.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* یادداشت اطمینان خرید */}
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 text-xs text-muted-foreground flex items-center gap-3">
                <Truck className="size-5 text-primary shrink-0" />
                <span>
                  سفارش‌های ثبت شده تا ساعت ۱۴ در تهران همان روز ارسال شده و سایر استان‌ها ظرف ۲۴ تا ۴۸ ساعت کاری تحویل می‌گردند.
                </span>
              </div>
            </div>

            {/* ستون چپ: کارت خلاصه سفارش و فاکتور (چسبان) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              {/* فرم کد تخفیف */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Tag className="size-4 text-primary" />
                  <span>کد تخفیف دارید؟</span>
                </div>

                {coupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <span>کد فعال: {coupon.code} ({coupon.percent}٪ تخفیف)</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="size-6 rounded-md hover:bg-emerald-500/20 flex items-center justify-center text-destructive cursor-pointer"
                      title="حذف کد تخفیف"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="مثال: SMART یا OFF10"
                      dir="ltr"
                      className="text-start h-10 rounded-xl text-xs uppercase font-mono"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="rounded-xl h-10 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      اعمال کد
                    </Button>
                  </form>
                )}
              </div>

              {/* کارت فاکتور و پرداخت نهایی */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-black text-sm text-foreground pb-2 border-b border-border/60">
                  خلاصه فاکتور خرید
                </h3>

                <div className="space-y-3 text-xs">
                  {/* قیمت بدون تخفیف */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مجموع قیمت کالاها:</span>
                    <span className="font-mono font-bold text-foreground">
                      {rawTotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  {/* سود / تخفیف کالاها */}
                  {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>تخفیف کالاها:</span>
                      <span className="font-mono font-bold">
                        - {discountTotal.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  {/* کد تخفیف اختصاصی */}
                  {coupon && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>تخفیف کوپن ({coupon.code}):</span>
                      <span className="font-mono font-bold">
                        - {coupon.discountAmount.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  {/* هزینه ارسال */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">هزینه ارسال:</span>
                    {shippingFee === 0 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        رایگان
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-foreground">
                        {shippingFee.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>

                  {/* خط جداکننده و مبلغ نهایی */}
                  <div className="pt-3 border-t border-border flex items-baseline justify-between">
                    <span className="font-black text-xs sm:text-sm text-foreground">
                      مبلغ قابل پرداخت:
                    </span>
                    <div className="text-end">
                      <span className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">
                        {finalTotal.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs text-muted-foreground ms-1 font-normal">تومان</span>
                    </div>
                  </div>
                </div>

                {/* دکمه اقدام جهت تسویه */}
                <Button
                  onClick={() => router.push("/checkout")}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>ادامه فرایند خرید و ثبت آدرس</span>
                  <ArrowLeft className="size-4" />
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  هزینه سفارش شامل مالیات بر ارزش افزوده می‌باشد.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
