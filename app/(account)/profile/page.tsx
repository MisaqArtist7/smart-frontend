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
} from "lucide-react";
import { useAccountStore } from "@/lib/account-store";
import {
  formatPrice,
  toPersianDigits,
  type OrderStatus,
} from "@/lib/account-data";
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
  const user = useAccountStore((s) => s.user);
  const orders = useAccountStore((s) => s.orders);
  const addresses = useAccountStore((s) => s.addresses);

  // محاسبه آمارها
  const inProgressOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const defaultAddress =
    addresses.find((a) => a.isDefault) || addresses[0];

  const recentOrders = orders.slice(0, 2);

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* پیام خوش‌آمدگویی و خلاصه وضعیت */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
              <span className="size-2 rounded-full bg-primary" />
              <span>پیشخوان حساب کاربری</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              سلام، {user.name} عزیز
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              به پنل کاربری اسمارت الکتریک خوش آمدید. از این بخش می‌توانید وضعیت سفارش‌ها و آدرس‌های تحویل خود را پیگیری کنید.
            </p>
          </div>

          <Link
            href="/profile/orders"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-xl border-border text-xs sm:text-sm font-bold gap-2 shrink-0 self-start sm:self-auto",
            })}
          >
            <span>مشاهده همه سفارش‌ها</span>
            <ChevronLeft className="size-4" />
          </Link>
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
                {toPersianDigits(inProgressOrders.length)} <span className="text-xs font-normal text-muted-foreground">سفارش</span>
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
                {toPersianDigits(deliveredOrders.length)} <span className="text-xs font-normal text-muted-foreground">سفارش</span>
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
                {toPersianDigits(addresses.length)} <span className="text-xs font-normal text-muted-foreground">نشانی</span>
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
              ۲ سفارش آخر ثبت‌شده در سامانه فروشگاه اسمارت الکتریک
            </CardDescription>
          </div>

          <Link
            href="/profile/orders"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors mt-2 sm:mt-0"
          >
            <span>مشاهده همه سفارش‌ها</span>
            <ArrowUpLeft className="size-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              شما تا کنون هیچ سفارشی ثبت نکرده‌اید.
            </div>
          ) : (
            recentOrders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status];
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
                        {order.createdAt}
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
                    {order.items.map((item) => (
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
                          <div className="text-xs font-bold text-foreground line-clamp-1 max-w-[200px]">
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
                      href={`/profile/orders`}
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
          {defaultAddress ? (
            <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{defaultAddress.title}</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    پیش‌فرض
                  </Badge>
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
