"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  ShoppingBag,
  Plus,
  ArrowUpLeft,
  Eye,
  Store,
} from "lucide-react";
import { useAdminProducts, useAdminMetrics, useAdminBrands } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: metrics, isLoading: isMetricsLoading } = useAdminMetrics();
  const { data: products, isLoading: isProductsLoading } = useAdminProducts();
  const { data: brands = [] } = useAdminBrands();

  const brandNameMap = useMemo(() => {
    const map = new Map<number, string>();
    brands.forEach((b) => {
      if (b.id && b.name) map.set(b.id, b.name);
    });
    return map;
  }, [brands]);

  const recentProducts = products?.slice(0, 5) || [];

  return (
    <div className="space-y-8 select-none">
      {/* سربرگ پیشخوان ادمین */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            پیشخوان مدیریت فروشگاه
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            خلاصه آمار فروش، وضعیت انبارداری و تازه‌ترین محصولات ثبت‌شده در سیستم
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders"
            className={buttonVariants({
              variant: "outline",
              className: "gap-2 rounded-xl text-xs sm:text-sm font-semibold",
            })}
          >
            <ShoppingBag className="size-4 text-primary" />
            <span>مدیریت سفارش‌ها</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className: "gap-2 rounded-xl text-xs sm:text-sm font-semibold",
            })}
          >
            <Store className="size-4" />
            <span>نمایش فروشگاه</span>
          </Link>

          <Link
            href="/admin/products"
            className={buttonVariants({
              className: "gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90",
            })}
          >
            <Plus className="size-4" />
            <span>مدیریت محصولات</span>
          </Link>
        </div>
      </div>

      {/* بخش کارت‌های آمار و KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* ۱. فروش کل */}
        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">
              مجموع فروش کل
            </CardTitle>
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {isMetricsLoading
                ? "..."
                : `${metrics?.totalSales.toLocaleString("fa-IR")} تومان`}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
              <span>+۱۲.۵٪</span>
              <span className="text-muted-foreground font-normal">نسبت به ماه قبل</span>
            </p>
          </CardContent>
        </Card>

        {/* ۲. محصولات فعال */}
        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">
              محصولات فعال در ویترین
            </CardTitle>
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PackageCheck className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {isMetricsLoading ? "..." : `${metrics?.activeProductsCount.toLocaleString("fa-IR")} کالا`}
            </div>
            <p className="text-[11px] text-muted-foreground font-normal mt-1.5">
              آماده سفارش آنلاین و موجود
            </p>
          </CardContent>
        </Card>

        {/* ۳. هشدار کسری موجودی */}
        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">
              هشدار کسری انبار
            </CardTitle>
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {isMetricsLoading ? "..." : `${metrics?.lowStockCount.toLocaleString("fa-IR")} محصول`}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1.5">
              موجودی ۵ عدد یا کمتر
            </p>
          </CardContent>
        </Card>

        {/* ۴. کل سفارشات */}
        <Link href="/admin/orders" className="block focus:outline-none group">
          <Card className="rounded-2xl border-border bg-card shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-bold text-muted-foreground group-hover:text-blue-600 transition-colors">
                تعداد کل سفارشات
              </CardTitle>
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="size-6" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {isMetricsLoading ? "..." : `${metrics?.totalOrders.toLocaleString("fa-IR")} سفارش`}
              </div>
              <p className="text-[11px] text-primary font-semibold mt-1.5 flex items-center gap-1">
                <span>مشاهده سفارش‌ها</span>
                <ArrowUpLeft className="size-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* جدول تازه‌ترین محصولات */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 sm:p-6 pb-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground">
              تازه‌ترین محصولات ثبت‌شده
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              آخرین اقلام ثبت‌شده در کاتالوگ فروشگاه اسمارت الکتریک
            </CardDescription>
          </div>

          <Link
            href="/admin/products"
            className="flex items-center gap-1 font-bold text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <span>مشاهده و ویرایش همه محصولات</span>
            <ArrowUpLeft className="size-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">تصویر</TableHead>
                  <TableHead>نام کالا و شناسه</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>برند</TableHead>
                  <TableHead>قیمت (تومان)</TableHead>
                  <TableHead>تخفیف</TableHead>
                  <TableHead>موجودی</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-20 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isProductsLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      در حال دریافت لیست محصولات...
                    </TableCell>
                  </TableRow>
                ) : recentProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      هنوز هیچ محصولی ثبت نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentProducts.map((product) => {
                    const discountPercent =
                      product.discountPrice != null &&
                      product.price > 0 &&
                      product.discountPrice < product.price
                        ? Math.round(
                            ((product.price - product.discountPrice) / product.price) * 100
                          )
                        : 0;

                    const brandName =
                      product.brand?.name ||
                      (product.brandId ? brandNameMap.get(product.brandId) : undefined);

                    return (
                      <TableRow key={product.id}>
                        {/* تصویر کوچک */}
                        <TableCell className="text-center py-2.5">
                          <div className="size-11 rounded-xl border border-border bg-muted/30 p-1 mx-auto flex items-center justify-center overflow-hidden">
                            <Image
                              src={normalizeImageUrl(product.images?.[0]?.url)}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="object-contain size-full"
                            />
                          </div>
                        </TableCell>

                        {/* عنوان و شناسه کالا */}
                        <TableCell>
                          <div className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 max-w-xs">
                            {product.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {product.sku || `ID-${product.id}`}
                          </div>
                        </TableCell>

                        {/* دسته‌بندی */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-medium">
                            {product.category?.name || product.categoryName || "عمومی"}
                          </span>
                        </TableCell>

                        {/* برند */}
                        <TableCell>
                          {brandName ? (
                            <Badge variant="outline" className="text-[11px] font-medium">
                              {brandName}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* قیمت */}
                        <TableCell>
                          <div className="font-extrabold text-xs sm:text-sm text-foreground">
                            {(product.discountPrice ?? product.price).toLocaleString("fa-IR")}
                          </div>
                          {product.discountPrice != null && (
                            <div className="text-[11px] text-muted-foreground line-through">
                              {product.price.toLocaleString("fa-IR")}
                            </div>
                          )}
                        </TableCell>

                        {/* تخفیف */}
                        <TableCell>
                          {discountPercent > 0 ? (
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                              {discountPercent.toLocaleString("fa-IR")}٪
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* موجودی */}
                        <TableCell>
                          <span
                            className={`text-xs font-bold ${
                              product.stock <= 5
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {product.stock.toLocaleString("fa-IR")} عدد
                          </span>
                        </TableCell>

                        {/* تاریخ ثبت */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {product.createdAt
                            ? new Intl.DateTimeFormat("fa-IR", {
                                dateStyle: "medium",
                              }).format(new Date(product.createdAt))
                            : "—"}
                        </TableCell>

                        {/* وضعیت فعال بودن */}
                        <TableCell>
                          {product.isActive ? (
                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                              فعال
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px]">
                              غیرفعال
                            </Badge>
                          )}
                        </TableCell>

                        {/* دکمه عملیات سریع */}
                        <TableCell className="text-center">
                          <Link
                            href="/admin/products"
                            className="size-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">مشاهده</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
