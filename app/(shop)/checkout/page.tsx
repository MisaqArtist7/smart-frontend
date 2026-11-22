"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  Plus,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useCartStore } from "@/lib/cart-store";
import {
  useAddresses,
  useCreateOrder,
  useMyOrders,
  useProducts,
  ApiError,
} from "@/lib/api";
import { formatAddressSummary } from "@/lib/address-utils";
import { toPersianDigits } from "@/lib/account-data";
import { AddressFormDialog } from "@/components/address/address-form-dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CouponSection } from "@/components/cart/coupon-section";
import { Badge } from "@/components/ui/badge";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const createOrderMutation = useCreateOrder();
  const { data: myOrders = [] } = useMyOrders();
  const { data: addresses = [], isLoading: isAddressesLoading } = useAddresses();
  const { data: freshProducts } = useProducts();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // محافظت از مسیر: ورود الزامی است
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.info("برای تکمیل سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید.");
      router.replace("/login?redirect=/checkout");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // دسترسی به سبد خرید
  const {
    items,
    orderNote,
    setOrderNote,
    coupon,
    getRawTotal,
    getDiscountTotal,
    getFinalTotal,
    clearCart,
    syncWithProducts,
  } = useCartStore();

  // همگام‌سازی موجودی و قیمت قبل از پرداخت نهایی
  useEffect(() => {
    if (freshProducts && freshProducts.length > 0) {
      const warnings = syncWithProducts(freshProducts);
      if (warnings.length > 0) {
        warnings.forEach((msg) => toast.warning(msg));
      }
    }
  }, [freshProducts, syncWithProducts]);

  // انتخاب آدرس تحویل
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const effectiveAddressId =
    selectedAddressId ??
    (addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null);
  const selectedAddress = addresses.find((a) => a.id === effectiveAddressId) || null;

  // فرم ایجاد آدرس درون‌خطی
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleOpenNewAddressModal = () => {
    if (addresses.length >= 10) {
      toast.error("امکان ثبت بیش از ۱۰ آدرس وجود ندارد (حداکثر سقف مجاز تکمیل است).");
      return;
    }
    setIsAddressModalOpen(true);
  };

  // ثبت نهایی سفارش
  const handleFinalSubmit = async () => {
    if (!effectiveAddressId) {
      toast.error("لطفاً یک آدرس تحویل را انتخاب کنید یا آدرس جدیدی اضافه نمایید.");
      return;
    }

    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است.");
      return;
    }

    try {
      // ارسال ساختار دقیق DTO به بک‌اند:
      // فقط addressId, paymentMethod: "CARD_TO_CARD", items: [{ productId, quantity }], note?
      const res = await createOrderMutation.mutateAsync({
        addressId: effectiveAddressId,
        paymentMethod: "CARD_TO_CARD",
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
        note: orderNote.trim() ? orderNote.trim().slice(0, 500) : undefined,
      });

      toast.success("سفارش شما با موفقیت ثبت شد!");
      clearCart();
      router.push(`/orders/${res.id}?new=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const lower = String(err.message).toLowerCase();
          if (lower.includes("stock") || lower.includes("موجودی")) {
            toast.error("موجودی برخی از کالاها در انبار تغییر یافته است. لطفاً سبد خرید خود را بازبینی فرمایید.");
          } else if (lower.includes("unpaid") || lower.includes("پرداخت")) {
            const unpaidOrder = myOrders.find(
              (o) =>
                o.status === "PENDING" &&
                (o.paymentStatus === "PENDING" || o.paymentStatus === "FAILED")
            );
            toast.error(
              "شما سفارش پرداخت‌نشده‌ی فعالی دارید. لطفاً ابتدا سفارش قبلی را تکمیل یا لغو فرمایید.",
              {
                duration: 8000,
                action: {
                  label: unpaidOrder ? "مشاهده و مدیریت سفارش" : "مشاهده سفارش‌ها",
                  onClick: () =>
                    router.push(
                      unpaidOrder ? `/orders/${unpaidOrder.id}` : "/profile/orders"
                    ),
                },
              }
            );
          } else {
            toast.error(err.message);
          }
          return;
        }

        if (err.status === 400) {
          const lower = String(err.message).toLowerCase();
          if (lower.includes("inactive") || lower.includes("غیرفعال")) {
            toast.error("یکی از اقلام سفارش دیگر فعال نیست و امکان خرید آن وجود ندارد.");
          } else {
            toast.error(err.message);
          }
          return;
        }

        toast.error(err.message);
      } else {
        toast.error("خطایی در ثبت سفارش رخ داد. لطفاً مجدداً امتحان کنید.");
      }
    }
  };

  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>در حال بررسی اطلاعات کاربری...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const rawTotal = getRawTotal();
  const discountTotal = getDiscountTotal();
  const finalTotal = getFinalTotal();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* نوار مراحل خرید */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-center gap-3 sm:gap-8 text-sm font-bold">
            <Link href="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <span className="size-7 rounded-full bg-muted flex items-center justify-center text-sm">
                ۱
              </span>
              <span>سبد خرید</span>
            </Link>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                ۲
              </span>
              <span>انتخاب آدرس تحویل</span>
            </div>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                ۳
              </span>
              <span>پرداخت کارت‌به‌کارت و ثبت نهایی</span>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 sm:p-16 text-center space-y-5 my-6">
            <ShoppingBag className="size-16 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground">کالایی در سبد خرید شما وجود ندارد!</h2>
              <p className="text-sm text-muted-foreground">برای ثبت سفارش ابتدا کالاهای مورد نظر خود را به سبد خرید اضافه کنید.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl text-sm sm:text-base shadow-xs hover:bg-primary/90 transition-all"
            >
              <span>بازگشت به صفحه اصلی</span>
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ستون اصلی راست: آدرس تحویل، روش پرداخت و یادداشت سفارش */}
            <div className="lg:col-span-8 space-y-6">
              {/* بخش ۱: انتخاب یا افزودن آدرس تحویل */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    <h2 className="font-black text-lg text-foreground">آدرس تحویل سفارش</h2>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewAddressModal}
                    disabled={addresses.length >= 10}
                    className="rounded-xl text-sm font-bold gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>افزودن آدرس جدید</span>
                  </Button>
                </div>

                {isAddressesLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>در حال بارگذاری آدرس‌های ثبت‌شده...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-3 bg-muted/10">
                    <p className="text-sm text-muted-foreground">هنوز هیچ آدرسی ثبت نکرده‌اید.</p>
                    <Button onClick={handleOpenNewAddressModal} className="rounded-xl text-sm font-bold cursor-pointer">
                      ثبت آدرس تحویل
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => {
                      const isSelected = effectiveAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border text-sm cursor-pointer transition-all space-y-2 relative ${
                            isSelected
                              ? "border-primary bg-primary/[0.04] ring-1 ring-primary/40 shadow-xs"
                              : "border-border hover:border-border/80 bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {isSelected ? (
                                <CheckCircle2 className="size-4 text-primary" />
                              ) : (
                                <div className="size-4 rounded-full border border-border" />
                              )}
                              {addr.title}
                            </span>
                            {addr.isDefault && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                پیش‌فرض
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                            {formatAddressSummary(addr)}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono pt-1 border-t border-border/40">
                            <span>گیرنده: {addr.receiverName}</span>
                            <span>
                              {toPersianDigits(addr.receiverPhone)}
                              {addr.secondaryPhone ? ` / ${toPersianDigits(addr.secondaryPhone)}` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedAddress && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-foreground">
                      نشانی انتخاب‌شده برای ارسال ({selectedAddress.title}):
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {formatAddressSummary(selectedAddress)}
                      {selectedAddress.postalCode
                        ? ` — کد پستی: ${toPersianDigits(selectedAddress.postalCode)}`
                        : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-mono">
                      <span>تحویل‌گیرنده: {selectedAddress.receiverName}</span>
                      <span>تماس اصلی: {toPersianDigits(selectedAddress.receiverPhone)}</span>
                      {selectedAddress.secondaryPhone && (
                        <span>تماس دوم: {toPersianDigits(selectedAddress.secondaryPhone)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* بخش ۲: روش پرداخت و تسویه حساب */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <CreditCard className="size-5 text-primary" />
                  <h2 className="font-black text-lg text-foreground">روش پرداخت و تسویه حساب</h2>
                </div>

                {/* گزینه ۱: پرداخت کارت‌به‌کارت (فعال و انتخاب‌شده) */}
                <div className="p-4 rounded-xl border border-primary/40 bg-primary/[0.03] flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-base text-foreground">
                        پرداخت از طریق کارت‌به‌کارت (انتقال بانکی و بارگذاری رسید)
                      </span>
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        فعال
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      پس از ثبت نهایی سفارش، شماره کارت فروشگاه و دستورالعمل واریز همراه با فاکتور به شما نمایش داده می‌شود و می‌توانید فیش واریزی خود را ثبت نمایید تا بلافاصله تایید و پردازش گردد.
                    </p>
                  </div>
                </div>

                {/* گزینه ۲: درگاه پرداخت اینترنتی (غیرفعال) */}
                <div
                  aria-disabled="true"
                  className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3 opacity-70 cursor-not-allowed"
                >
                  <div className="size-5 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-base text-muted-foreground">
                        درگاه پرداخت اینترنتی
                      </span>
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30 bg-destructive/5">
                        غیرفعال
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      به دلیل اینکه قیمت‌ها مدام در حال تغییر هستند و ثبات ندارند، درگاه پرداخت آنلاین فعلاً غیرفعال می‌باشد.
                    </p>
                  </div>
                </div>
              </div>

              {/* بخش ۴: یادداشت سفارش (اختیاری، حداکثر ۵۰۰ کاراکتر) */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="orderNote" className="text-sm font-bold text-foreground">
                    یادداشت یا توضیحات سفارش (اختیاری)
                  </label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {orderNote.length}/۵۰۰
                  </span>
                </div>

                <Textarea
                  id="orderNote"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                  placeholder="در صورت وجود توضیح خاص پیرامون زمان تحویل، هماهنگی یا نوع بسته‌بندی اینجا بنویسید..."
                  rows={3}
                  maxLength={500}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {/* ستون چپ: کارت صورتحساب و دکمه پرداخت نهایی (Sticky) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              {/* بخش کد تخفیف */}
              <CouponSection />

              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="size-4.5 text-primary shrink-0" />
                    <h3 className="font-black text-base text-foreground">
                      فاکتور و اقلام سفارش
                    </h3>
                  </div>
                  <Link href="/cart" className="text-xs text-primary hover:underline font-bold">
                    ویرایش سبد ({toPersianDigits(items.reduce((sum, i) => sum + i.quantity, 0))} عدد)
                  </Link>
                </div>

                {/* لیست اقلام سفارش داخل فاکتور */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pe-1 border-b border-border/60 pb-3.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/20 border border-border/50 p-2.5 text-xs"
                    >
                      <div className="size-16 rounded-xl bg-background border border-border p-1.5 shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={60}
                          height={60}
                          className="object-contain size-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="font-bold text-sm text-foreground line-clamp-2 leading-snug block">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono block">
                          تعداد: {item.quantity.toLocaleString("fa-IR")} عدد
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مجموع قیمت اقلام:</span>
                    <span className="font-mono font-bold text-foreground">
                      {rawTotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>تخفیف کالاها:</span>
                      <span className="font-mono font-bold">
                        - {discountTotal.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  {coupon && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>تخفیف کد ({coupon.code}):</span>
                      <span className="font-mono font-bold">
                        - {coupon.discountAmount.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">هزینه ارسال پستی:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      پس‌کرایه (۰ تومان در فاکتور)
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border flex items-baseline justify-between">
                    <span className="font-black text-sm sm:text-base text-foreground">
                      مبلغ نهایی پرداخت:
                    </span>
                    <div className="text-end">
                      <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                        {finalTotal.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-sm text-muted-foreground ms-1">تومان</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFinalSubmit}
                  disabled={createOrderMutation.isPending || !effectiveAddressId || items.length === 0}
                  className="w-full h-10 px-5 rounded-md bg-primary text-primary-foreground font-bold text-sm leading-none shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {createOrderMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      در حال ثبت سفارش...
                    </span>
                  ) : (
                    <span>ثبت سفارش و دریافت اطلاعات پرداخت</span>
                  )}
                </Button>

                <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>تضمین اصالت کالا و گارانتی معتبر</span>
                  </div>
                  <p className="leading-relaxed">
                    با کلیک روی ثبت سفارش، اقلام انتخابی برای شما رزرو شده و کد پیگیری سفارش صادر می‌گردد.
                  </p>
                </div>
              </div>

              {/* اطلاعیه رسمی نحوه ارسال و پس‌کرایه */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
                <Truck className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-muted-foreground">
                  <strong className="text-foreground block text-sm sm:text-base">
                    هزینه ارسال به صورت پس‌کرایه (پرداخت در مقصد):
                  </strong>
                  <span>
                    هزینه بسته‌بندی و ارسال سفارش در این فاکتور <strong>۰ تومان</strong> لحاظ شده است؛ زیرا هزینه کرایه پستی یا باربری به صورت مستقیم توسط خریدار به مامور محترم پست در هنگام تحویل کالا پرداخت می‌شود.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* مدال افزودن آدرس جدید به صورت درون‌خطی در چک‌اوت */}
      <AddressFormDialog
        open={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        onSuccess={(newAddr) => setSelectedAddressId(newAddr.id)}
      />

      <Footer />
    </div>
  );
}
