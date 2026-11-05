"use client";

import React, { useState } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { useAccountStore } from "@/lib/account-store";
import {
  formatPrice,
  toPersianDigits,
  type Order,
} from "@/lib/account-data";
import { ORDER_STATUS_CONFIG } from "../page";
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

type TabFilter = "all" | "in-progress" | "delivered" | "cancelled";

export default function ProfileOrdersPage() {
  const orders = useAccountStore((s) => s.orders);
  const uploadReceipt = useAccountStore((s) => s.uploadReceipt);

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [receiptUrlInput, setReceiptUrlInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // فیلتر تب‌ها
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "in-progress")
      return ["PENDING", "CONFIRMED", "SHIPPED"].includes(order.status);
    if (activeTab === "delivered") return order.status === "DELIVERED";
    if (activeTab === "cancelled") return order.status === "CANCELLED";
    return true;
  });

  // کپی کد پیگیری
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("کد رهگیری مرسوله با موفقیت کپی شد.");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // آپلود فیش
  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptModalOrder) return;
    const finalUrl = receiptUrlInput.trim() || "/images/brand/logo.png";
    uploadReceipt(receiptModalOrder.id, finalUrl);
    toast.success("فیش واریزی با موفقیت ثبت شد و وضعیت سفارش به‌روزرسانی گردید.");
    setReceiptModalOrder(null);
    setReceiptUrlInput("");
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
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
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
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
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
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
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
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
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
        {filteredOrders.length === 0 ? (
          <Card className="rounded-2xl border-border bg-card p-10 text-center">
            <PackageCheck className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <div className="font-bold text-sm text-foreground">
              سفارشی در این وضعیت یافت نشد
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              سفارش‌های جدید شما بلافاصله پس از ثبت در این بخش قابل رهگیری خواهند بود.
            </p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusCfg = ORDER_STATUS_CONFIG[order.status];
            const StatusIcon = statusCfg.icon;

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
                        {order.createdAt}
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

                  {/* ردیف رهگیری پستی و هشدار فیش واریزی */}
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
                          order.paymentStatus === "PAID"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {order.paymentStatus === "PAID"
                          ? "پرداخت شده"
                          : "در انتظار پرداخت"}
                      </span>
                    </div>

                    {/* کد رهگیری پستی در صورت وجود */}
                    {order.trackingCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">کد رهگیری:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(order.trackingCode!)}
                          className="flex items-center gap-1.5 font-mono font-bold bg-background px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
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
                            این سفارش از طریق کارت‌به‌کارت ثبت شده است. لطفاً پس از واریز، تصویر فیش را ثبت فرمایید.
                          </span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setReceiptModalOrder(order);
                            setReceiptUrlInput("");
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <Upload className="size-3.5" />
                          <span>ثبت فیش واریزی</span>
                        </Button>
                      </div>
                    )}

                  {/* نمایش اقلام خریداری شده در سفارش */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-muted-foreground">
                      اقلام سفارش:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/80"
                        >
                          <div className="size-14 rounded-lg bg-muted/20 border border-border p-1.5 flex items-center justify-center shrink-0">
                            <Image
                              src={item.image || "/images/products/adapter-52240.png"}
                              alt={item.title}
                              width={44}
                              height={44}
                              className="object-contain size-full"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center justify-between">
                              <span>تعداد: {toPersianDigits(item.quantity)}</span>
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-xl border-border text-xs font-bold gap-1.5 hover:bg-accent self-end sm:self-auto"
                    >
                      <Eye className="size-4 text-primary" />
                      <span>مشاهده جزئیات سفارش</span>
                    </Button>
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
                ثبت‌شده در تاریخ {selectedOrder.createdAt}
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
                  {selectedOrder.items.map((it) => (
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
                  <span>
                    {selectedOrder.shippingPrice === 0
                      ? "رایگان"
                      : formatPrice(selectedOrder.shippingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border font-black text-sm text-foreground">
                  <span>مبلغ نهایی پرداخت شده / قابل پرداخت:</span>
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
                    فیش شما دریافت و توسط واحد مالی اسمارت الکتریک تایید گردید.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl text-xs sm:text-sm font-semibold"
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
                <div>بانک ملت - به نام فروشگاه تخصصی اسمارت الکتریک</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  آدرس اینترنتی یا بارگذاری تصویر فیش
                </label>
                <Input
                  value={receiptUrlInput}
                  onChange={(e) => setReceiptUrlInput(e.target.value)}
                  placeholder="/images/receipts/slip-1.jpg"
                  dir="ltr"
                  className="text-start"
                />
                <p className="text-[11px] text-muted-foreground">
                  می‌توانید لینک مستقیم فیش را وارد کرده یا از تصویر پیش‌فرض تایید استفاده نمایید.
                </p>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptModalOrder(null)}
                  className="rounded-xl text-xs sm:text-sm"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
                >
                  ثبت نهایی فیش
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
