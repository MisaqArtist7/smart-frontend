"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  CreditCard,
  Truck,
  ShoppingBag,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  Eye,
  X,
  XCircle,
  ArrowRight,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import {
  useOrder,
  usePaymentInfo,
  useUploadReceipt,
  useCancelOrder,
  fetchReceiptBlob,
  ApiError,
} from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatPersianDate,
  formatToman,
  toPersianDigits,
} from "@/lib/order-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const isNew = searchParams.get("new") === "1";

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    data: order,
    isLoading: isOrderLoading,
    error,
    refetch: refetchOrder,
  } = useOrder(orderId);

  const { data: paymentInfo } = usePaymentInfo();
  const uploadReceiptMutation = useUploadReceipt();
  const cancelOrderMutation = useCancelOrder();

  // وضعیت‌های کپی در کلیپ‌بورد
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // وضعیت فایل انتخابی برای بارگذاری رسید
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // دیالوگ مشاهده فیش واریزی
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [isFetchingBlob, setIsFetchingBlob] = useState(false);

  // دیالوگ تایید لغو سفارش
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // پاک‌سازی حافظه blobها هنگام unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (receiptBlobUrl && receiptBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(receiptBlobUrl);
      }
    };
  }, [previewUrl, receiptBlobUrl]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast.success(`${label} کپی شد.`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("فرمت فایل نامعتبر است. لطفاً فایل تصویری JPEG، PNG یا WebP انتخاب کنید.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error("حجم فایل بیشتر از ۵ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب فرمایید.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUploadReceipt = async () => {
    if (!order) return;
    if (!selectedFile) {
      toast.error("لطفاً ابتدا تصویر فیش واریز را انتخاب کنید.");
      return;
    }

    try {
      await uploadReceiptMutation.mutateAsync({
        orderId: order.id,
        receipt: selectedFile,
      });
      toast.success("رسید پرداخت با موفقیت ثبت شد و وضعیت سفارش به بررسی رسید تغییر یافت.");
      handleRemoveFile();
      refetchOrder();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در بارگذاری فیش واریزی رخ داد.");
      }
    }
  };

  const handleOpenReceiptModal = async () => {
    if (!order) return;
    setIsReceiptModalOpen(true);
    setIsFetchingBlob(true);
    try {
      const url = await fetchReceiptBlob(order.id);
      setReceiptBlobUrl(url);
    } catch {
      toast.error("خطا در دریافت تصویر رسید از سرور.");
    } finally {
      setIsFetchingBlob(false);
    }
  };

  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
    if (receiptBlobUrl && receiptBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(receiptBlobUrl);
    }
    setReceiptBlobUrl(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!order) return;
    try {
      await cancelOrderMutation.mutateAsync(order.id);
      toast.success("سفارش با موفقیت لغو شد و کالاهای رزرو شده به انبار بازگردانده شدند.");
      setIsCancelModalOpen(false);
      refetchOrder();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در لغو سفارش رخ داد.");
      }
    }
  };

  if (isAuthLoading || isOrderLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground font-medium">
            در حال بارگذاری مشخصات سفارش...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-lg font-black text-foreground">ورود به حساب کاربری الزامی است</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            برای مشاهده فاکتور و جزئیات این سفارش ابتدا باید وارد حساب کاربری خود شوید.
          </p>
          <Link
            href={`/login?redirect=/orders/${orderId}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary/90"
          >
            ورود به حساب کاربری
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-lg font-black text-foreground">سفارش مورد نظر یافت نشد</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            ممکن است شماره سفارش اشتباه باشد یا دسترسی به این سفارش متعلق به حساب شما نباشد.
          </p>
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary/90"
          >
            بازگشت به سفارش‌های من
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const orderStatusCfg = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    badgeClass: "border-border bg-muted text-muted-foreground",
    icon: AlertCircle,
  };

  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
    label: order.paymentStatus,
    badgeClass: "border-border bg-muted text-muted-foreground",
    icon: CreditCard,
  };

  // آیا پنل پرداخت باید نمایش داده شود؟
  const shouldShowPaymentPanel =
    order.status === "PENDING" &&
    (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");

  // آیا دکمه لغو سفارش مجاز است؟
  const canCancelOrder =
    order.status === "PENDING" && order.paymentStatus !== "PAID";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 select-none">
        {/* بنر موفقیت ثبت سفارش اولیه هدایت‌شده از چک‌اوت */}
        {isNew && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 text-center space-y-3">
            <div className="size-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="size-8 stroke-[2.5]" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
              سفارش شما با موفقیت ثبت گردید!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 max-w-lg mx-auto leading-relaxed">
              سفارش شما با کد <span className="font-mono font-bold">{order.orderNumber}</span> ثبت شد و اقلام در انبار برای شما رزرو گردید. لطفاً برای نهایی‌سازی سفارش، مبلغ را به شماره کارت اعلام شده واریز و رسید را بارگذاری فرمایید.
            </p>
          </div>
        )}

        {/* سربرگ مشخصات سفارش و بج‌های وضعیت */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">شماره سفارش:</span>
              <span className="font-mono font-black text-base text-foreground">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderNumber, "شماره سفارش")}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                title="کپی شماره سفارش"
              >
                {copiedLabel === "شماره سفارش" ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>تاریخ ثبت:</span>
              <span className="font-mono font-medium">
                {formatPersianDate(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-bold border px-3 py-1 gap-1.5 ${orderStatusCfg.badgeClass}`}>
              <orderStatusCfg.icon className="size-3.5" />
              <span>وضعیت: {orderStatusCfg.label}</span>
            </Badge>

            <Badge className={`text-xs font-bold border px-3 py-1 gap-1.5 ${paymentStatusCfg.badgeClass}`}>
              <paymentStatusCfg.icon className="size-3.5" />
              <span>پرداخت: {paymentStatusCfg.label}</span>
            </Badge>

            {/* دکمه لغو سفارش اگر مجاز باشد */}
            {canCancelOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-destructive hover:bg-destructive/10 border-destructive/30 rounded-xl text-xs font-bold gap-1 cursor-pointer"
              >
                <XCircle className="size-3.5" />
                <span>لغو سفارش</span>
              </Button>
            )}
          </div>
        </div>

        {/* تایم‌لاین مراحل پیشرفت سفارش */}
        {order.status === "CANCELLED" ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-center gap-3 text-rose-800 dark:text-rose-200">
            <AlertCircle className="size-6 text-rose-600 shrink-0" />
            <div className="text-xs sm:text-sm font-bold">
              این سفارش لغو شده است و اقلام رزرو شده به موجودی فروشگاه بازگردانده شده‌اند.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <h3 className="text-xs font-bold text-muted-foreground mb-4">
              مراحل پردازش و ارسال سفارش
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { title: "۱. ثبت سفارش", done: true },
                {
                  title: "۲. پرداخت وجه",
                  done: order.paymentStatus === "PAID",
                  inProgress: order.paymentStatus === "WAITING_REVIEW",
                },
                {
                  title: "۳. تأیید انبار",
                  done: ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status),
                },
                {
                  title: "۴. تحویل به پست",
                  done: ["SHIPPED", "DELIVERED"].includes(order.status),
                },
                {
                  title: "۵. تحویل سفارش",
                  done: order.status === "DELIVERED",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                    step.done
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                      : step.inProgress
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {step.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : step.inProgress ? (
                      <Loader2 className="size-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="size-2.5 rounded-full bg-border" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold">{step.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* کد رهگیری مرسوله پستی در صورت وجود */}
        {order.trackingCode && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              <div>
                <span className="font-bold text-foreground block sm:inline sm:me-2">
                  مرسوله به شرکت پست تحویل داده شده است.
                </span>
                <span className="text-muted-foreground text-[11px]">
                  کد رهگیری مرسوله پستی:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm bg-background border border-border px-3 py-1.5 rounded-xl text-primary">
                {order.trackingCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(order.trackingCode!, "کد رهگیری")}
                className="rounded-xl text-xs gap-1 cursor-pointer"
              >
                {copiedLabel === "کد رهگیری" ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>کپی</span>
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            پنل راهنمای پرداخت کارت‌به‌کارت و بارگذاری رسید
            (فقط برای وضعیت سفارش PENDING و پرداخت PENDING یا FAILED)
           ========================================================================= */}
        {shouldShowPaymentPanel && (
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/[0.07] p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h2 className="font-black text-base text-foreground">
                  راهنمای پرداخت کارت‌به‌کارت
                </h2>
                <p className="text-xs text-muted-foreground">
                  اقلام سفارش تا بارگذاری فیش پرداختی در انبار رزرو شده‌اند.
                </p>
              </div>
            </div>

            {/* در صورت رد شدن فیش قبلی */}
            {order.paymentStatus === "FAILED" && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="size-4.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    رسید پرداخت قبلی توسط مدیریت رد شد.
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    لطفاً تصویر فیش واریزی معتبر و جدید با اطلاعات کامل را مجدداً بارگذاری نمایید.
                  </div>
                </div>
              </div>
            )}

            {/* کارت مشخصات حساب و مبلغ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* شماره کارت */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-muted-foreground block text-[11px]">
                  شماره کارت واریز:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base tracking-widest text-foreground">
                    {paymentInfo?.cardNumber || "۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        paymentInfo?.cardNumber?.replace(/-/g, "") || "6037997512345678",
                        "شماره کارت"
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="کپی شماره کارت"
                  >
                    {copiedLabel === "شماره کارت" ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span>به نام: <strong className="text-foreground">{paymentInfo?.cardHolder || "فروشگاه اسمارت الکتریک"}</strong></span>
                  {paymentInfo?.bankName && <span>{paymentInfo.bankName}</span>}
                </div>
              </div>

              {/* مبلغ دقیق واریز */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <span className="text-muted-foreground block text-[11px]">
                  مبلغ دقیق پرداختی:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-primary">
                    {formatToman(order.totalPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(String(order.totalPrice), "مبلغ فاکتور")
                    }
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="کپی مبلغ عددی جهت واریز در اپ بانکی"
                  >
                    {copiedLabel === "مبلغ فاکتور" ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
                <div className="pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  هزینه پست به صورت پس‌کرایه هنگام تحویل به مامور پست پرداخت می‌شود و شامل این مبلغ نیست.
                </div>
              </div>
            </div>

            {/* بخش آپلود فیش */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3.5">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-primary" />
                <h4 className="font-bold text-xs sm:text-sm text-foreground">
                  بارگذاری تصویر فیش واریزی
                </h4>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر حجم فایل: ۵ مگابایت
              </p>

              {/* فیلد انتخاب فایل یا پیش‌نمایش */}
              {!previewUrl ? (
                <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/30">
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-bold text-foreground">
                    انتخاب تصویر فیش واریز
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    برای انتخاب تصویر از دستگاه کلیک کنید
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-border bg-muted/20">
                  <div className="relative size-24 rounded-xl overflow-hidden border border-border bg-background shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="پیش‌نمایش فیش"
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-center sm:text-start">
                    <span className="text-xs font-bold text-foreground truncate block">
                      {selectedFile?.name}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground block">
                      {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} مگابایت
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="rounded-xl text-xs gap-1"
                    >
                      <X className="size-3.5" />
                      <span>تغییر فایل</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadReceipt}
                      disabled={uploadReceiptMutation.isPending}
                      className="rounded-xl text-xs font-bold gap-1.5"
                    >
                      {uploadReceiptMutation.isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>در حال ارسال رسید...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          <span>ارسال و ثبت فیش</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* وضعیت رسید در حال بررسی یا تأیید شده */}
        {order.paymentStatus === "WAITING_REVIEW" && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-blue-900 dark:text-blue-200">
              <Loader2 className="size-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  رسید پرداخت شما دریافت شد و در انتظار بررسی و تأیید مدیریت است.
                </span>
                <span className="text-[11px] text-blue-800 dark:text-blue-300">
                  پس از تأیید فیش واریزی، سفارش شما بسته‌بندی و ارسال خواهد شد.
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReceiptModal}
              className="rounded-xl text-xs font-bold gap-1.5 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shrink-0 cursor-pointer"
            >
              <Eye className="size-3.5" />
              <span>مشاهده تصویر فیش ارسالی</span>
            </Button>
          </div>
        )}

        {order.paymentStatus === "PAID" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  پرداخت این سفارش با موفقیت تأیید گردید.
                </span>
                {order.paidAt && (
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
                    تاریخ تأیید پرداخت: {formatPersianDate(order.paidAt)}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReceiptModal}
              className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shrink-0 cursor-pointer"
            >
              <Eye className="size-3.5" />
              <span>مشاهده رسید پرداخت</span>
            </Button>
          </div>
        )}

        {/* بخش دو ستونه: اقلام سفارش و فاکتور مالی / نشانی */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* لیست اقلام سفارش */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <ShoppingBag className="size-5 text-primary" />
                <h3 className="font-black text-sm sm:text-base text-foreground">
                  اقلام سفارش ({toPersianDigits(order.items?.length || 0)} قلم کالا)
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
                          <span>
                            تعداد: <strong className="font-mono text-foreground">{toPersianDigits(item.quantity)} عدد</strong>
                          </span>
                          <span>•</span>
                          <span>
                            قیمت واحد: <span className="font-mono font-medium">{item.price.toLocaleString("fa-IR")}</span> تومان
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0 font-mono font-black text-foreground text-sm">
                      {(item.price * item.quantity).toLocaleString("fa-IR")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">تومان</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* یادداشت مشتری در صورت وجود */}
            {order.note && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <FileText className="size-4 text-primary" />
                  <span>توضیحات و یادداشت سفارش شما:</span>
                </div>
                <p className="text-muted-foreground pr-6 leading-relaxed">
                  {order.note}
                </p>
              </div>
            )}
          </div>

          {/* سایدبار: خلاصه مالی فاکتور و نشانی تحویل */}
          <div className="lg:col-span-4 space-y-4">
            {/* کارت خلاصه مالی */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3.5 text-xs">
              <h4 className="font-black text-sm text-foreground pb-2 border-b border-border/60">
                خلاصه مالی فاکتور
              </h4>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>مجموع اقلام:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatToman(order.itemsPrice)}
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
                  هزینه ارسال به صورت پس‌کرایه بوده و مستقیماً هنگام تحویل بسته به مامور پست پرداخت خواهد شد.
                </span>
              </div>
            </div>

            {/* کارت نشانی تحویل سفارش */}
            {(order.receiverName || order.address) && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground pb-2 border-b border-border/60">
                  <MapPin className="size-4 text-primary" />
                  <span>نشانی تحویل سفارش</span>
                </div>

                <div className="space-y-1.5 text-muted-foreground leading-relaxed">
                  <div className="font-bold text-foreground">
                    {order.receiverName || order.address?.receiverName} (
                    <span className="font-mono">
                      {order.receiverPhone || order.address?.receiverPhone}
                    </span>
                    )
                  </div>
                  <div>
                    {order.province || order.address?.province}،{" "}
                    {order.city || order.address?.city}،{" "}
                    {order.addressLine || order.address?.addressLine}
                  </div>
                  <div className="font-mono text-[11px]">
                    کد پستی: {order.postalCode || order.address?.postalCode}
                  </div>
                </div>
              </div>
            )}

            {/* لینک‌های ناوبری سریع */}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/profile/orders"
                className="w-full h-11 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <PackageCheck className="size-4 text-primary" />
                <span>مشاهده همه سفارش‌های من</span>
              </Link>

              <Link
                href="/"
                className="w-full h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>بازگشت به صفحه اصلی</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* دیالوگ مشاهده فیش واریزی امن (Blob Viewer) */}
      <Dialog open={isReceiptModalOpen} onOpenChange={handleCloseReceiptModal}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              تصویر فیش واریزی
            </DialogTitle>
            <DialogDescription className="text-xs">
              فیش واریزی ثبت شده برای سفارش {order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center min-h-[220px]">
            {isFetchingBlob ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span>در حال دریافت تصویر امن فیش...</span>
              </div>
            ) : receiptBlobUrl ? (
              <div className="relative max-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-muted/20 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptBlobUrl}
                  alt="فیش واریزی"
                  className="max-h-[380px] w-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                تصویر فیش در دسترس نیست یا بارگذاری نشد.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseReceiptModal}
              className="rounded-xl text-xs font-bold w-full"
            >
              بستن پنجره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ تأیید لغو سفارش */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-base font-black">
              لغو سفارش
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              آیا از لغو این سفارش اطمینان دارید؟ با لغو سفارش، کالاهای رزرو شده آزاد می‌شوند و به موجودی انبار فروشگاه بازگردانده خواهند شد.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={cancelOrderMutation.isPending}
              className="rounded-xl text-xs font-bold"
            >
              انصراف
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>در حال لغو سفارش...</span>
                </>
              ) : (
                <>
                  <XCircle className="size-3.5" />
                  <span>بله، سفارش را لغو کن</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
