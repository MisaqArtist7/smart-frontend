"use client";

import React, { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Check,
  Package,
  MapPin,
  Clock,
  Printer,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useMyOrders, type Order } from "@/lib/api";
import { formatPrice, toPersianDigits } from "@/lib/account-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("orderNumber");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { data: orders = [], isLoading } = useMyOrders();

  const currentOrder: Order | undefined =
    orders.find((o) => o.orderNumber === orderNumberParam) || orders[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast.success(`${label} با موفقیت کپی شد`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!mounted || isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        در حال آماده‌سازی فاکتور سفارش...
      </div>
    );
  }

  // در صورت نبود هیچ سفارشی (فالبک امن)
  const displayOrderNumber = currentOrder?.orderNumber || orderNumberParam || "سفارش ثبت‌شده";
  const displayTrackingCode = currentOrder?.trackingCode || "در انتظار ثبت کد رهگیری پستی";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* کارت اصلی تایید موفقیت */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm text-center relative overflow-hidden">
        {/* گرادیان پس‌زمینه لطیف */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary" />

        {/* آیکون تیک سبز */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
          سفارش شما با موفقیت ثبت و تایید شد!
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-6">
          از خرید شما از شرکت اسمارت الکتریک متشکریم. فاکتور سفارش صادر شده و کارشناسان انبار در حال آماده‌سازی کالاهای شما هستند.
        </p>

        {/* جعبه مشخصات کلیدی رهگیری */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto bg-muted/40 p-4 rounded-2xl border border-border/60 text-right">
          {/* شماره سفارش */}
          <div className="bg-card p-3 rounded-xl border border-border/50">
            <span className="text-[11px] text-muted-foreground block mb-1">شماره سفارش:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-foreground" dir="ltr">
                {displayOrderNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(displayOrderNumber, "شماره سفارش")}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                {copiedCode === "شماره سفارش" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* کد رهگیری پستی / بارنامه */}
          <div className="bg-card p-3 rounded-xl border border-border/50">
            <span className="text-[11px] text-muted-foreground block mb-1">کد پیگیری مرسوله:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-foreground" dir="ltr">
                {displayTrackingCode}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(displayTrackingCode, "کد پیگیری")}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                {copiedCode === "کد پیگیری" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* وضعیت پرداخت */}
          <div className="bg-card p-3 rounded-xl border border-border/50">
            <span className="text-[11px] text-muted-foreground block mb-1">وضعیت پرداخت:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                className={
                  currentOrder?.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
                }
              >
                {currentOrder?.paymentStatus === "PAID" ? "پرداخت موفق" : "در انتظار تایید"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({currentOrder?.paymentMethod === "CARD_TO_CARD"
                  ? "کارت‌به‌کارت"
                  : "پرداخت در محل"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* اطلاعات تحویل و نشانی خریدار */}
      {currentOrder && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 text-right">
          <div className="flex items-center gap-2 text-primary pb-3 border-b border-border">
            <MapPin className="w-5 h-5" />
            <h2 className="font-bold text-base text-foreground">مشخصات ارسال و تحویل‌گیرنده</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">نام تحویل‌گیرنده: </span>
              <span className="font-semibold text-foreground">{currentOrder.receiverName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">شماره تماس: </span>
              <span className="font-mono text-foreground" dir="ltr">
                {currentOrder.receiverPhone}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">نشانی دقیق تحویل: </span>
              <span className="text-foreground leading-relaxed">
                {currentOrder.province}، {currentOrder.city}، {currentOrder.addressLine}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">کد پستی ۱۰ رقمی: </span>
              <span className="font-mono text-foreground" dir="ltr">
                {toPersianDigits(currentOrder.postalCode)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">زمان ثبت سفارش: </span>
              <span className="text-foreground">{currentOrder.createdAt}</span>
            </div>
          </div>
        </div>
      )}

      {/* لیست اقلام فاکتور */}
      {currentOrder && currentOrder.items && currentOrder.items.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 text-right">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-primary">
              <Package className="w-5 h-5" />
              <h2 className="font-bold text-base text-foreground">اقلام فاکتور شده</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(currentOrder.items.length)} قلم کالا
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                    <Image
                      src={item.image || "/images/products/adapter-52240.png"}
                      alt={item.title}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {toPersianDigits(item.quantity)} عدد × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                <div className="font-bold text-xs sm:text-sm text-foreground shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* خلاصه پرداخت فاکتور */}
          <div className="pt-4 border-t border-border space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>مبلغ اقلام سفارش:</span>
              <span className="font-semibold text-foreground">
                {formatPrice(currentOrder.itemsPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>هزینه حمل و ارسال:</span>
              <span>
                {currentOrder.shippingPrice === 0
                  ? "رایگان"
                  : formatPrice(currentOrder.shippingPrice)}
              </span>
            </div>
            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-sm sm:text-base font-bold text-primary">
              <span>مبلغ نهایی پرداختی:</span>
              <span>{formatPrice(currentOrder.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      {/* راهنما و گام‌های بعدی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 text-right">
          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-foreground mb-1">زمان‌بندی تحویل مرسوله</p>
            <p className="text-muted-foreground">
              سفارش‌های تهران همان روز یا حداکثر ۲۴ ساعت آینده و شهرستان‌ها ۲۴ الی ۷۲ ساعت بعد از تحویل به باربری یا تیپاکس به دست شما خواهد رسید.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 text-right">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-foreground mb-1">فاکتور رسمی و ضمانت کالا</p>
            <p className="text-muted-foreground">
              کلیه محصولات ارسالی دارای ضمانت اصالت فیزیکی، مهلت تست فنی ۷ روزه و فاکتور چاپی رسمی شرکت اسمارت الکتریک هستند.
            </p>
          </div>
        </div>
      </div>

      {/* دکمه‌های عملیات */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          href="/profile/orders"
          className={cn(buttonVariants({ size: "lg" }), "rounded-xl gap-2 font-bold text-xs sm:text-sm")}
        >
          <ExternalLink className="w-4 h-4" />
          مشاهده و پیگیری سفارش در پنل کاربری
        </Link>

        <Button
          variant="outline"
          size="lg"
          onClick={() => window.print()}
          className="rounded-xl gap-2 text-xs sm:text-sm"
        >
          <Printer className="w-4 h-4" />
          چاپ پیش‌فاکتور رسمی
        </Button>

        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "rounded-xl gap-2 text-xs sm:text-sm")}
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به صفحه اصلی فروشگاه
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* نوار مراحل سفارش */}
        <div className="mb-10">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {/* مرحله ۱: سبد خرید */}
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Check className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">سبد خرید</span>
            </div>

            <div className="flex-1 h-0.5 bg-emerald-500/40 mx-2 sm:mx-4" />

            {/* مرحله ۲: اطلاعات ارسال و پرداخت */}
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Check className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">اطلاعات ارسال و پرداخت</span>
            </div>

            <div className="flex-1 h-0.5 bg-emerald-500/40 mx-2 sm:mx-4" />

            {/* مرحله ۳: تایید نهایی و فاکتور */}
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4" />
              </div>
              <span>تایید نهایی و فاکتور</span>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="py-20 text-center text-muted-foreground animate-pulse">
              در حال بارگذاری فاکتور سفارش...
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
