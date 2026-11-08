"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  PackageCheck,
  ShoppingBag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/components/providers/auth-provider";
import { useMyOrders, type Order } from "@/lib/api";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatPersianDate,
  formatToman,
  toPersianDigits,
} from "@/lib/order-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OrderTabFilter = "ALL" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderTabFilter>("ALL");
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isFetching,
  } = useMyOrders({ page: currentPage, limit: 10 });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login?redirect=/orders");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const rawOrders: Order[] = ordersData?.items || ordersData || [];
  const totalOrders = ordersData?.total ?? rawOrders.length;
  const totalPages = ordersData?.totalPages ?? 1;

  // فیلتر کلاینت تب‌ها بر اساس وضعیت
  const filteredOrders = rawOrders.filter((order) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "IN_PROGRESS") {
      return ["PENDING", "CONFIRMED", "SHIPPED"].includes(order.status);
    }
    if (activeTab === "DELIVERED") return order.status === "DELIVERED";
    if (activeTab === "CANCELLED") return order.status === "CANCELLED";
    return true;
  });

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    toast.success("شماره سفارش کپی شد.");
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  if (isAuthLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground font-medium">
            در حال اعتبارسنجی حساب کاربری...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // ریدایرکت توسط useEffect انجام می‌شود
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 select-none">
        {/* نوار مسیر و عنوان صفحه */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/" className="hover:text-primary transition-colors">
                صفحه اصلی
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold">سفارش‌های من</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
              <PackageCheck className="size-6 text-primary" />
              <span>تاریخچه سفارش‌های من</span>
              {totalOrders > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                  {toPersianDigits(totalOrders)} سفارش
                </span>
              )}
            </h1>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <span>مشاهده همه محصولات فروشگاه</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* تب‌های فیلتر وضعیت سفارش‌ها */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            همه سفارش‌ها
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_PROGRESS")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === "IN_PROGRESS"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            در حال پردازش و جاری
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DELIVERED")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === "DELIVERED"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            تحویل داده شده
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CANCELLED")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === "CANCELLED"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            لغو شده
          </button>
        </div>

        {/* لیست سفارش‌ها یا وضعیت لودینگ */}
        {isOrdersLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">در حال فراخوانی سفارش‌ها از سرور...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-4 rounded-3xl border border-dashed border-border bg-card/60 text-center space-y-4">
            <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="size-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-foreground">
                هیچ سفارشی در این وضعیت یافت نشد
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                هنوز سفارشی ثبت نکرده‌اید یا سفارشی مطابق با فیلتر انتخابی شما وجود ندارد.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary/90 transition-colors"
            >
              <span>مشاهده محصولات و شروع خرید</span>
              <ChevronLeft className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                badgeClass: "border-border bg-muted text-muted-foreground",
              };
              const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
                label: order.paymentStatus,
                badgeClass: "border-border bg-muted text-muted-foreground",
              };
              const StatusIcon = statusCfg.icon || Clock;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-4"
                >
                  {/* ردیف بالا: شماره سفارش، تاریخ و وضعیت‌ها */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-foreground">
                        <span className="text-muted-foreground font-sans font-normal text-[11px]">
                          شماره سفارش:
                        </span>
                        <span>{order.orderNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderNumber(order.orderNumber)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                          title="کپی شماره سفارش"
                        >
                          {copiedOrderId === order.orderNumber ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      <span className="text-muted-foreground text-xs hidden sm:inline">•</span>

                      <span className="text-[11px] text-muted-foreground">
                        {formatPersianDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-[11px] font-bold border px-2.5 py-0.5 gap-1 ${statusCfg.badgeClass}`}>
                        <StatusIcon className="size-3" />
                        <span>{statusCfg.label}</span>
                      </Badge>

                      <Badge className={`text-[11px] font-bold border px-2.5 py-0.5 ${paymentCfg.badgeClass}`}>
                        <span>{paymentCfg.label}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* پیش‌نمایش اقلام سفارش */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {order.items && order.items.length > 0 ? (
                        order.items.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="size-13 rounded-xl border border-border bg-muted/20 p-1.5 shrink-0 flex items-center justify-center relative group"
                            title={`${item.title} (${item.quantity} عدد)`}
                          >
                            <Image
                              src={item.image || "/images/products/adapter-52240.png"}
                              alt={item.title}
                              width={44}
                              height={44}
                              className="size-full object-contain"
                            />
                            <span className="absolute -bottom-1 -left-1 font-mono text-[10px] font-bold bg-primary text-primary-foreground rounded-full size-4 flex items-center justify-center">
                              {toPersianDigits(item.quantity)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">اقلام ثبت‌شده</span>
                      )}

                      {order.items && order.items.length > 4 && (
                        <div className="size-13 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs font-mono font-bold text-muted-foreground shrink-0">
                          +{toPersianDigits(order.items.length - 4)}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground ms-2 hidden md:inline">
                        {toPersianDigits(order.items?.length || 0)} قلم کالا
                      </span>
                    </div>

                    {/* مبلغ نهایی و دکمه جزییات */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-start sm:text-end">
                        <span className="block text-[10px] text-muted-foreground">
                          مبلغ فاکتور
                        </span>
                        <span className="text-sm sm:text-base font-black text-foreground font-mono">
                          {formatToman(order.totalPrice)}
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
                      >
                        {order.status === "PENDING" && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") ? (
                          <>
                            <CreditCard className="size-3.5" />
                            <span>پرداخت و ثبت فیش</span>
                          </>
                        ) : (
                          <>
                            <span>مشاهده جزئیات</span>
                            <ChevronLeft className="size-4" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* صفحه‌بندی (Pagination) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isFetching}
                  className="rounded-xl text-xs gap-1"
                >
                  <ChevronRight className="size-4" />
                  <span>صفحه قبل</span>
                </Button>

                <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-card border border-border">
                  صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isFetching}
                  className="rounded-xl text-xs gap-1"
                >
                  <span>صفحه بعد</span>
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
