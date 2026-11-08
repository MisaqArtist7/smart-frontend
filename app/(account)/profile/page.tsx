"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  PackageCheck,
  MapPin,
  ArrowUpLeft,
  ChevronLeft,
  Truck,
  AlertCircle,
  ShieldCheck,
  Phone,
  LogOut,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useMyOrders, useAddresses, type OrderStatus } from "@/lib/api";
import { formatPrice, toPersianDigits } from "@/lib/account-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

// رنگ و برچسب وضعیت‌های مختلف سفارش
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: {
    label: "در انتظار بررسی و پرداخت",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  CONFIRMED: {
    label: "تایید شده و در حال بسته‌بندی",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: ShieldCheck,
  },
  SHIPPED: {
    label: "تحویل به پست / در مسیر ارسال",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
  },
  DELIVERED: {
    label: "تحویل داده شده",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: PackageCheck,
  },
  CANCELLED: {
    label: "لغو شده",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
  },
};

export default function ProfileDashboardPage() {
  const { user, logout } = useAuth();
  const { data: orders = [], isLoading: isOrdersLoading } = useMyOrders();
  const { data: addresses = [], isLoading: isAddressesLoading } = useAddresses();

  // محاسبه آمارها از داده‌های واقعی سرور
  const inProgressOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const recentOrders = orders.slice(0, 2);

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* پیام خوش‌آمدگویی، مشخصات کاربر و دکمه خروج */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <span className="size-2 rounded-full bg-primary" />
                <span>حساب کاربری</span>
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                {user?.role === "ADMIN" ? "مدیر سیستم" : "مشتری"}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              سلام، {user?.name || "کاربر گرامی"} عزیز
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {user?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  <span className="font-mono tracking-wider" dir="ltr">
                    {toPersianDigits(user.phone)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/profile/orders"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-xl border-border text-xs sm:text-sm font-bold gap-2",
              })}
            >
              <span>مشاهده همه سفارش‌ها</span>
              <ChevronLeft className="size-4" />
            </Link>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm("آیا برای خروج از حساب کاربری اطمینان دارید؟")) {
                  await logout();
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-all cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* بخش ۳ کارت شاخص خلاصه (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* ۱. سفارش‌های جاری */}
        <Link href="/profile/orders" className="block focus:outline-none group">
          <Card className="rounded-2xl border-border bg-card shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                سفارش‌های جاری
              </CardTitle>
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-black text-foreground tracking-tight">
                {isOrdersLoading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    {toPersianDigits(inProgressOrders.length)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">سفارش</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                در انتظار پرداخت یا در حال ارسال
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* ۲. سفارش‌های تحویل شده */}
        <Link href="/profile/orders" className="block focus:outline-none group">
          <Card className="rounded-2xl border-border bg-card shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-bold text-muted-foreground group-hover:text-emerald-600 transition-colors">
                سفارش‌های تحویل شده
              </CardTitle>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PackageCheck className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-black text-foreground tracking-tight">
                {isOrdersLoading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    {toPersianDigits(deliveredOrders.length)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">سفارش</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                با موفقیت به دست شما رسیده‌اند
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* ۳. آدرس‌های ثبت‌شده */}
        <Link href="/profile/addresses" className="block focus:outline-none group">
          <Card className="rounded-2xl border-border bg-card shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                آدرس‌های ثبت‌شده
              </CardTitle>
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-black text-foreground tracking-tight">
                {isAddressesLoading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    {toPersianDigits(addresses.length)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">نشانی</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                محل کار و نشانی‌های ارسال کالا
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ویجت آخرین سفارش‌های ثبت شده */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 sm:p-6 pb-4 border-b border-border/70">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <PackageCheck className="size-5 text-primary" />
              <span>آخرین سفارش‌های من</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              سفارش‌های ثبت‌شده در سامانه فروشگاه اسمارت الکتریک
            </CardDescription>
          </div>

          {orders.length > 0 && (
            <Link
              href="/profile/orders"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors mt-2 sm:mt-0"
            >
              <span>مشاهده همه سفارش‌ها</span>
              <ArrowUpLeft className="size-3.5" />
            </Link>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {isOrdersLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>در حال بارگذاری سفارش‌های شما از سرور...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <ShoppingBag className="size-12 text-muted-foreground mx-auto opacity-30 stroke-1" />
              <div className="text-sm font-bold text-foreground">
                شما تا کنون هیچ سفارشی ثبت نکرده‌اید.
              </div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                برای مشاهده و خرید انواع تجهیزات برق و شبکه، می‌توانید به فروشگاه مراجعه فرمایید.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-primary/90 mt-2"
              >
                <span>مشاهده محصولات فروشگاه</span>
                <ChevronLeft className="size-3.5" />
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                badgeClass: "bg-muted text-muted-foreground",
                icon: Clock,
              };
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border/80 bg-background p-4 sm:p-5 transition-all hover:border-border hover:shadow-xs space-y-4"
                >
                  {/* ردیف بالا: شماره سفارش، تاریخ و بَج وضعیت */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span>شماره سفارش:</span>
                      <span className="font-mono text-primary font-black">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDate(order.createdAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-bold px-2 py-0.5 gap-1 ${statusCfg.badgeClass}`}
                      >
                        <StatusIcon className="size-3" />
                        <span>{statusCfg.label}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* پیش‌نمایش اقلام سفارش */}
                  <div className="flex flex-wrap items-center gap-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/70"
                      >
                        <div className="size-11 rounded-lg bg-muted/30 border border-border p-1 flex items-center justify-center shrink-0">
                          <Image
                            src={item.image || "/images/products/adapter-52240.png"}
                            alt={item.title}
                            width={36}
                            height={36}
                            className="object-contain size-full"
                          />
                        </div>
                        <div className="text-start">
                          <div className="text-xs font-bold text-foreground line-clamp-1 max-w-50">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {toPersianDigits(item.quantity)} عدد × {item.price.toLocaleString("fa-IR")} تومان
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ردیف پایین: مبلغ کل و لینک مشاهده جزئیات */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">مبلغ پرداختی:</span>
                      <span className="text-sm font-black text-foreground">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="text-primary hover:text-primary/90 text-xs font-bold flex items-center gap-1"
                    >
                      <span>مشاهده فاکتور و جزئیات</span>
                      <ChevronLeft className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* کارت سریع آدرس پیش‌فرض */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 sm:p-6 pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <span>آدرس پیش‌فرض تحویل کالا</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              سفارش‌های جدید شما به طور پیش‌فرض به این نشانی ارسال خواهند شد.
            </CardDescription>
          </div>

          <Link
            href="/profile/addresses"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-xl border-border text-xs font-bold mt-2 sm:mt-0",
            })}
          >
            <span>مدیریت و افزودن آدرس</span>
          </Link>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-2">
          {isAddressesLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>در حال بارگذاری آدرس‌های ثبت‌شده...</span>
            </div>
          ) : defaultAddress ? (
            <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{defaultAddress.title}</span>
                  {defaultAddress.isDefault && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      پیش‌فرض
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  تحویل‌گیرنده: {defaultAddress.receiverName} ({toPersianDigits(defaultAddress.receiverPhone)})
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {defaultAddress.province}، {defaultAddress.city}، {defaultAddress.addressLine}
              </p>

              <div className="text-xs text-muted-foreground font-mono pt-1">
                کد پستی: {toPersianDigits(defaultAddress.postalCode)}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              هنوز هیچ آدرسی ثبت نکرده‌اید.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
