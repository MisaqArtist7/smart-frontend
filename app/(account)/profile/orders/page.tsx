"use client";

import React, { useState } from "react";
import Image from "next/link";
import Link from "next/link";
import { toast } from "sonner";
import {
  PackageCheck,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Eye,
  CreditCard,
  MapPin,
  Receipt,
  FileCheck,
  Loader2,
  Clock,
  Truck,
  ShieldCheck,
  ShoppingBag,
  ChevronLeft,
} from "lucide-react";
import {
  useMyOrders,
  useUploadReceipt,
  ApiError,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api";
import {
  formatPrice,
  toPersianDigits,
} from "@/lib/account-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ORDER_STATUS_CONFIG: Record<
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

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; isPaid: boolean }> = {
  PENDING: { label: "در انتظار پرداخت", isPaid: false },
  WAITING_REVIEW: { label: "رسید ارسال شده (در انتظار تایید)", isPaid: false },
  PAID: { label: "پرداخت شده", isPaid: true },
  FAILED: { label: "ناموفق یا رد شده", isPaid: false },
};

type TabFilter = "all" | "in-progress" | "delivered" | "cancelled";

export default function ProfileOrdersPage() {
  const { data: orders = [], isLoading: isOrdersLoading } = useMyOrders();
  const uploadReceiptMutation = useUploadReceipt();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [receiptUrlInput, setReceiptUrlInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // فیلتر تب‌ها بر روی داده‌های واقعی سرور
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "in-progress")
      return ["PENDING", "CONFIRMED", "SHIPPED"].includes(order.status);
    if (activeTab === "delivered") return order.status === "DELIVERED";
    if (activeTab === "cancelled") return order.status === "CANCELLED";
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // کپی کد پیگیری
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("کد رهگیری مرسوله با موفقیت کپی شد.");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // آپلود فیش کارت‌به‌کارت
  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptModalOrder) return;
    const finalUrl = receiptUrlInput.trim();
    if (!finalUrl) {
      toast.error("لطفاً لینک فیش یا شماره پیگیری واریز را وارد نمایید.");
      return;
    }

    try {
      await uploadReceiptMutation.mutateAsync({
        orderId: receiptModalOrder.id,
        receipt: finalUrl,
      });
      toast.success("رسید پرداخت با موفقیت ثبت شد و وضعیت سفارش به بررسی رسید تغییر یافت.");
      setReceiptModalOrder(null);
      setReceiptUrlInput("");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در ثبت فیش واریز رخ داد.");
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* سربرگ بخش سفارش‌ها */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          سفارش‌های من
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          پیگیری مرسوله‌ها، ثبت فیش واریز، مشاهده فاکتور خرید و تاریخچه اقلام
        </p>
      </div>

      {/* تب‌های فیلتر وضعیت سفارش */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          همه سفارش‌ها ({toPersianDigits(orders.length)})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("in-progress")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "in-progress"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          جاری و در حال پردازش (
          {toPersianDigits(
            orders.filter((o) => ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status)).length
          )}
          )
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("delivered")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "delivered"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          تحویل شده (
          {toPersianDigits(orders.filter((o) => o.status === "DELIVERED").length)})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "cancelled"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          لغو شده (
          {toPersianDigits(orders.filter((o) => o.status === "CANCELLED").length)})
        </button>
      </div>

      {/* لیست کارت‌های سفارش */}
      <div className="space-y-4">
        {isOrdersLoading ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>در حال بارگذاری سفارش‌های شما از سرور...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="rounded-2xl border-border bg-card p-12 text-center space-y-3">
            <ShoppingBag className="size-12 text-muted-foreground mx-auto opacity-30 stroke-1" />
            <div className="font-bold text-sm text-foreground">
              {activeTab === "all"
                ? "شما در حال حاضر هیچ سفارشی ثبت نکرده‌اید."
                : "سفارشی در این وضعیت یافت نشد."}
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              سفارش‌های جدید شما بلافاصله پس از ثبت در این بخش قابل پیگیری و پرداخت خواهند بود.
            </p>
            {activeTab === "all" && (
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-primary/90 mt-2"
              >
                <span>مشاهده محصولات فروشگاه</span>
                <ChevronLeft className="size-3.5" />
              </Link>
            )}
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
              label: order.status,
              badgeClass: "bg-muted text-muted-foreground",
              icon: Clock,
            };
            const StatusIcon = statusCfg.icon;
            const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
              label: order.paymentStatus,
              isPaid: false,
            };

            return (
              <Card
                key={order.id}
                className="rounded-2xl border-border bg-card shadow-xs overflow-hidden transition-all hover:border-border/80 hover:shadow-sm"
              >
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* ردیف اول: مشخصات بالای کارت */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-black text-sm text-foreground">
                        {order.orderNumber}
                      </div>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[11px] font-bold px-2.5 py-1 gap-1.5 ${statusCfg.badgeClass}`}
                    >
                      <StatusIcon className="size-3.5" />
                      <span>{statusCfg.label}</span>
                    </Badge>
                  </div>

                  {/* ردیف رهگیری پستی و وضعیت پرداخت */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/50 text-xs">
                    {/* اطلاعات روش پرداخت */}
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">روش پرداخت:</span>
                      <span className="font-bold text-foreground">
                        {order.paymentMethod === "COD"
                          ? "پرداخت در محل (تحویل)"
                          : "کارت به کارت"}
                      </span>
                      <span className="text-muted-foreground/40">|</span>
                      <span
                        className={`font-semibold ${
                          paymentCfg.isPaid
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {paymentCfg.label}
                      </span>
                    </div>

                    {/* کد رهگیری پستی در صورت وجود */}
                    {order.trackingCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">کد رهگیری:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(order.trackingCode!)}
                          className="flex items-center gap-1.5 font-mono font-bold bg-background px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
                          title="کپی کد رهگیری"
                        >
                          <span>{order.trackingCode}</span>
                          {copiedCode === order.trackingCode ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* هشدار آپلود فیش برای سفارش‌های کارت به کارت در انتظار پرداخت */}
                  {order.paymentMethod === "CARD_TO_CARD" &&
                    order.paymentStatus === "PENDING" && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>
                            این سفارش از طریق کارت‌به‌کارت ثبت شده است. لطفاً پس از واریز مبلغ، مشخصات یا تصویر فیش را ثبت فرمایید.
                          </span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setReceiptModalOrder(order);
                            setReceiptUrlInput("");
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <Upload className="size-3.5" />
                          <span>ثبت فیش واریزی</span>
                        </Button>
                      </div>
                    )}

                  {/* نمایش اقلام خریداری شده در سفارش */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-muted-foreground">
                      اقلام سفارش ({order.items?.length || 0} قلم):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/80"
                        >
                          <div className="size-14 rounded-lg bg-muted/20 border border-border p-1.5 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || "/images/products/adapter-52240.png"}
                              alt={item.title}
                              className="object-contain size-full"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center justify-between">
                              <span>تعداد: {toPersianDigits(item.quantity)} عدد</span>
                              <span className="font-bold text-foreground">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ردیف پایین: مبلغ نهایی و دکمه جزئیات فاکتور */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">مبلغ نهایی سفارش:</span>
                      <span className="text-base sm:text-lg font-black text-foreground">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
                      >
                        <span>صفحه کامل سفارش</span>
                        <ChevronLeft className="size-3.5" />
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl border-border text-xs font-bold gap-1.5 hover:bg-accent cursor-pointer"
                      >
                        <Eye className="size-4 text-primary" />
                        <span>مشاهده فاکتور</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* مدال نمایش کامل جزئیات سفارش و فاکتور */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <span>فاکتور سفارش</span>
                <span className="font-mono text-primary">{selectedOrder.orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                ثبت‌شده در تاریخ {formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* نشانی تحویل */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <MapPin className="size-4 text-primary" />
                  <span>نشانی تحویل گیرنده:</span>
                </div>
                <div className="text-muted-foreground leading-relaxed pr-5">
                  {selectedOrder.province}، {selectedOrder.city}، {selectedOrder.addressLine}
                </div>
                <div className="text-muted-foreground pr-5 font-mono">
                  تحویل‌گیرنده: {selectedOrder.receiverName} ({toPersianDigits(selectedOrder.receiverPhone)}) | کد پستی: {toPersianDigits(selectedOrder.postalCode)}
                </div>
              </div>

              {/* لیست اقلام */}
              <div className="space-y-2">
                <div className="font-bold text-foreground">اقلام فاکتور:</div>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-foreground">{it.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          تعداد: {toPersianDigits(it.quantity)} عدد
                        </div>
                      </div>
                      <div className="font-bold text-foreground font-mono">
                        {formatPrice(it.price * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ریز مبالغ مالی */}
              <div className="p-3.5 rounded-xl border border-border bg-background space-y-2 font-medium">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>مجموع ارزش اقلام:</span>
                  <span>{formatPrice(selectedOrder.itemsPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedOrder.shippingPrice === 0
                      ? "پس‌کرایه (۰ تومان در فاکتور)"
                      : formatPrice(selectedOrder.shippingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border font-black text-sm text-foreground">
                  <span>مبلغ کل فاکتور:</span>
                  <span className="text-primary text-base font-black">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>

              {/* تصویر فیش واریز در صورت ثبت */}
              {selectedOrder.receiptUrl && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <FileCheck className="size-4" />
                    <span>فیش واریزی ثبت شده است</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    فیش شما با موفقیت دریافت و در صف بررسی قرار دارد.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Link
                href={`/orders/${selectedOrder.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold px-4 py-2"
              >
                صفحه پرداخت و مشخصات کارت
              </Link>
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
              >
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* مدال ثبت فیش واریزی کارت به کارت */}
      <Dialog open={!!receiptModalOrder} onOpenChange={(open) => !open && setReceiptModalOrder(null)}>
        {receiptModalOrder && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                <span>ثبت فیش واریزی</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                شماره سفارش: {receiptModalOrder.orderNumber} | مبلغ قابل پرداخت: {formatPrice(receiptModalOrder.totalPrice)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReceiptSubmit} className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5 text-muted-foreground leading-relaxed">
                <div className="font-bold text-foreground">اطلاعات حساب بانکی فروشگاه:</div>
                <div>شماره کارت: <span className="font-mono text-foreground font-bold">۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸</span></div>
                <div>فروشگاه تخصصی اسمارت الکتریک - بانک ملی ایران</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شماره پیگیری تراکنش بانکی یا آدرس تصویر فیش <span className="text-destructive">*</span>
                </label>
                <Input
                  value={receiptUrlInput}
                  onChange={(e) => setReceiptUrlInput(e.target.value)}
                  placeholder="مثال: پیگیری ۱۲۳۴۵۶۷۸۹ یا https://..."
                  dir="ltr"
                  className="text-start"
                  required
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptModalOrder(null)}
                  className="rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={uploadReceiptMutation.isPending}
                  className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  {uploadReceiptMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      در حال ثبت...
                    </span>
                  ) : (
                    "ثبت نهایی فیش"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
