"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  CreditCard,
  Truck,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useOrder, type OrderStatus, type PaymentStatus } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";

const ORDER_STATUS_LABELS: Record<OrderStatus, { text: string; color: string }> = {
  PENDING: { text: "در انتظار پرداخت / بررسی", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  CONFIRMED: { text: "تایید شده و در حال آماده‌سازی", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  SHIPPED: { text: "تحویل به پست / ارسال شده", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  DELIVERED: { text: "تحویل داده شده", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  CANCELLED: { text: "لغو شده", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { text: string; color: string }> = {
  PENDING: { text: "در انتظار پرداخت", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  WAITING_REVIEW: { text: "رسید ارسال شده (در انتظار تایید)", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  PAID: { text: "پرداخت تایید شده", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  FAILED: { text: "ناموفق یا رد شده", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const isNew = searchParams.get("new") === "1";

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: order, isLoading: isOrderLoading, error } = useOrder(orderId);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} با موفقیت کپی شد.`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (isAuthLoading || isOrderLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground">در حال بارگذاری اطلاعات سفارش...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-lg font-black">ورود به حساب کاربری الزامی است</h2>
          <p className="text-xs text-muted-foreground">برای مشاهده مشخصات این سفارش ابتدا باید وارد حساب خود شوید.</p>
          <Link
            href={`/login?redirect=/orders/${orderId}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
          >
            ورود به حساب
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-lg font-black">سفارش مورد نظر یافت نشد</h2>
          <p className="text-xs text-muted-foreground">ممکن است شناسه سفارش اشتباه باشد یا به این سفارش دسترسی نداشته باشید.</p>
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
          >
            مشاهده سفارش‌های من
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const orderStatusConfig = ORDER_STATUS_LABELS[order.status] || {
    text: order.status,
    color: "bg-muted text-muted-foreground",
  };

  const paymentStatusConfig = PAYMENT_STATUS_LABELS[order.paymentStatus] || {
    text: order.paymentStatus,
    color: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 select-none">
        {/* بنر تبریک ثبت موفقیت‌آمیز سفارش در صورت هدایت از چک‌اوت */}
        {isNew && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 text-center space-y-3">
            <div className="size-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="size-8 stroke-[2.5]" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
              سفارش شما با موفقیت ثبت گردید!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 max-w-lg mx-auto leading-relaxed">
              سفارش شما با کد پیگیری <span className="font-mono font-bold">{order.orderNumber}</span> در سامانه ثبت شد و اقلام درخواستی در انبار برای شما رزرو گردید.
            </p>
          </div>
        )}

        {/* سربرگ مشخصات اصلی سفارش */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">کد پیگیری سفارش:</span>
              <span className="font-mono font-black text-base text-foreground">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderNumber, "کد سفارش")}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                title="کپی شماره سفارش"
              >
                {copiedText === "کد سفارش" ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground">
              تاریخ ثبت سفارش:{" "}
              <span className="font-mono">
                {new Intl.DateTimeFormat("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.createdAt))}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-bold border px-3 py-1 ${orderStatusConfig.color}`}>
              وضعیت سفارش: {orderStatusConfig.text}
            </Badge>

            <Badge className={`text-xs font-bold border px-3 py-1 ${paymentStatusConfig.color}`}>
              وضعیت پرداخت: {paymentStatusConfig.text}
            </Badge>
          </div>
        </div>

        {/* راهنمای واریز کارت‌به‌کارت و پرداخت */}
        {order.paymentStatus === "PENDING" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <CreditCard className="size-5 text-amber-600 shrink-0" />
              <h2 className="font-black text-sm sm:text-base">
                دستورالعمل پرداخت کارت‌به‌کارت
              </h2>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              لطفاً مبلغ کل فاکتور (<strong className="text-foreground font-mono">{order.totalPrice.toLocaleString("fa-IR")} تومان</strong>) را به شماره کارت فروشگاه واریز نموده و سپس از طریق بخش «سفارش‌های من»، تصویر فیش یا ۴ رقم آخر کارت و شماره پیگیری را ثبت نمایید.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block text-[11px]">شماره کارت بانکی:</span>
                  <span className="font-mono font-bold text-sm tracking-wider text-foreground">
                    ۶۰۳۷-۹۹۷۵-۱234-۵۶۷۸
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("6037997512345678", "شماره کارت")}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="size-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block text-[11px]">به نام:</span>
                  <span className="font-bold text-foreground">فروشگاه اسمارت الکتریک</span>
                </div>
                <span className="text-[11px] text-muted-foreground">بانک ملی ایران</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href="/profile/orders"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-primary/90"
              >
                <span>بارگذاری رسید در سفارش‌های من</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* لیست اقلام سفارش */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <ShoppingBag className="size-5 text-primary" />
                <h3 className="font-black text-sm sm:text-base text-foreground">
                  اقلام سفارش ({order.items?.length || 0} کالا)
                </h3>
              </div>

              <div className="divide-y divide-border/60">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-14 rounded-xl bg-muted/20 border border-border p-1.5 shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image || "/images/products/adapter-52240.png"}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="object-contain size-full"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="font-bold text-foreground line-clamp-1 block">
                          {item.title}
                        </span>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          <span>تعداد: <strong className="font-mono text-foreground">{item.quantity.toLocaleString("fa-IR")}</strong></span>
                          <span>•</span>
                          <span>قیمت واحد: <span className="font-mono">{item.price.toLocaleString("fa-IR")}</span> تومان</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0 font-mono font-bold text-foreground text-sm">
                      {(item.price * item.quantity).toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* یادداشت سفارش اگر ثبت شده باشد */}
            {order.note && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <FileText className="size-4 text-primary" />
                  <span>یادداشت ثبت شده برای سفارش:</span>
                </div>
                <p className="text-muted-foreground pr-6 leading-relaxed">{order.note}</p>
              </div>
            )}
          </div>

          {/* فاکتور مالی و آدرس تحویل */}
          <div className="lg:col-span-4 space-y-4">
            {/* کارت صورتحساب */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3.5 text-xs">
              <h4 className="font-black text-sm text-foreground pb-2 border-b border-border/60">
                خلاصه مالی فاکتور
              </h4>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>مجموع قیمت اقلام:</span>
                <span className="font-mono font-bold text-foreground">
                  {order.itemsPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  پس‌کرایه (۰ تومان در فاکتور)
                </span>
              </div>

              <div className="pt-2.5 border-t border-border flex items-baseline justify-between">
                <span className="font-black text-xs text-foreground">مبلغ نهایی فاکتور:</span>
                <div className="text-end">
                  <span className="text-lg font-black text-primary font-mono">
                    {order.totalPrice.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-[11px] text-muted-foreground ms-1">تومان</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
                <Truck className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  هزینه ارسال به صورت پس‌کرایه بوده و مستقیماً هنگام تحویل بسته به مامور پست پرداخت می‌شود.
                </span>
              </div>
            </div>

            {/* کارت مشخصات آدرس تحویل */}
            {(order.receiverName || order.address) && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground pb-2 border-b border-border/60">
                  <MapPin className="size-4 text-primary" />
                  <span>نشانی تحویل سفارش</span>
                </div>

                <div className="space-y-1 text-muted-foreground leading-relaxed">
                  <div className="font-bold text-foreground">
                    {order.receiverName || order.address?.receiverName} ({order.receiverPhone || order.address?.receiverPhone})
                  </div>
                  <div>
                    {order.province || order.address?.province}، {order.city || order.address?.city}، {order.addressLine || order.address?.addressLine}
                  </div>
                  <div className="font-mono text-[11px]">
                    کد پستی: {order.postalCode || order.address?.postalCode}
                  </div>
                </div>
              </div>
            )}

            {/* دکمه‌های ناوبری سریع */}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/profile/orders"
                className="w-full h-11 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>مشاهده همه سفارش‌های من</span>
              </Link>

              <Link
                href="/products"
                className="w-full h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>بازگشت به فروشگاه و ادامه خرید</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
