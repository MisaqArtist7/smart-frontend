"use client";

import React, { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Loader2,
  FileText,
  Receipt,
  MoreVertical,
  X,
  MapPin,
  ShoppingBag,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import {
  useAdminOrders,
  useAdminProducts,
  useReviewReceipt,
  useUpdateAdminOrderStatus,
  useAdminCancelOrder,
  fetchAdminReceiptBlob,
  ApiError,
  type AdminOrderListItem,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatPersianDate,
  formatToman,
  toPersianDigits,
} from "@/lib/order-utils";
import { normalizeImageUrl } from "@/lib/utils";

function formatPersianPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("09")) {
    return toPersianDigits(`${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`);
  }
  if (digits.length === 11) {
    return toPersianDigits(`${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`);
  }
  return toPersianDigits(phone);
}

function formatPersianPostalCode(code?: string | null): string {
  if (!code) return "";
  const digits = code.replace(/\D/g, "");
  if (digits.length === 10) {
    return toPersianDigits(`${digits.slice(0, 5)} ${digits.slice(5)}`);
  }
  return toPersianDigits(code);
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminOrdersPage() {
  // فیلترها و وضعیت صفحه‌بندی
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useAdminOrders({
    page,
    limit,
    status: statusFilter,
    paymentStatus: paymentFilter,
    search: activeSearch,
  });

  const orders: AdminOrderListItem[] = ordersData?.items || ordersData || [];
  const total = ordersData?.total ?? orders.length;
  const totalPages = ordersData?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  const { data: adminProducts = [] } = useAdminProducts();
  const productImageMap = useMemo(() => {
    const map = new Map<number, string>();
    adminProducts.forEach((p) => {
      const firstUrl = p.images?.[0]?.url;
      if (firstUrl) map.set(p.id, firstUrl);
    });
    return map;
  }, [adminProducts]);

  // موتاسیون‌های عملیاتی ادمین
  const reviewReceiptMutation = useReviewReceipt();
  const updateStatusMutation = useUpdateAdminOrderStatus();
  const cancelOrderMutation = useAdminCancelOrder();

  // وضعیت کپی کلیپ‌بورد
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // دیالوگ‌ها
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<AdminOrderListItem | null>(null);
  const [reviewOrder, setReviewOrder] = useState<AdminOrderListItem | null>(null);
  const [reviewAdminNote, setReviewAdminNote] = useState("");
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [isFetchingBlob, setIsFetchingBlob] = useState(false);

  // دیالوگ تغییر وضعیت سفارش (ارسال / تحویل)
  const [statusModalOrder, setStatusModalOrder] = useState<AdminOrderListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"SHIPPED" | "DELIVERED">("SHIPPED");
  const [trackingCodeInput, setTrackingCodeInput] = useState("");
  const [statusAdminNote, setStatusAdminNote] = useState("");

  // دیالوگ لغو سفارش
  const [cancelModalOrder, setCancelModalOrder] = useState<AdminOrderListItem | null>(null);
  const [cancelAdminNote, setCancelAdminNote] = useState("");

  // پاک‌سازی حافظه blob
  useEffect(() => {
    return () => {
      if (receiptBlobUrl && receiptBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(receiptBlobUrl);
      }
    };
  }, [receiptBlobUrl]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} کپی شد.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setActiveSearch((prev) => {
        if (prev !== next) {
          setPage(1);
          return next;
        }
        return prev;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleResetFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  // باز کردن دیالوگ بررسی فیش
  const handleOpenReviewReceipt = async (order: AdminOrderListItem) => {
    setReviewOrder(order);
    setReviewAdminNote(order.adminNote || "");
    setIsFetchingBlob(true);
    setReceiptBlobUrl(null);
    try {
      const url = await fetchAdminReceiptBlob(order.id);
      setReceiptBlobUrl(url);
    } catch {
      toast.error("خطا در واکشی تصویر فیش پرداختی از سرور.");
    } finally {
      setIsFetchingBlob(false);
    }
  };

  const handleCloseReviewReceipt = () => {
    setReviewOrder(null);
    if (receiptBlobUrl && receiptBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(receiptBlobUrl);
    }
    setReceiptBlobUrl(null);
  };

  // ارسال تأیید یا رد فیش
  const handleSubmitReceiptReview = async (action: "approve" | "reject") => {
    if (!reviewOrder) return;
    try {
      await reviewReceiptMutation.mutateAsync({
        orderId: reviewOrder.id,
        action,
        adminNote: reviewAdminNote.trim() || undefined,
      });

      if (action === "approve") {
        toast.success(`فیش سفارش ${reviewOrder.orderNumber} با موفقیت تایید و سفارش آماده بسته‌بندی شد.`);
      } else {
        toast.info(`فیش سفارش ${reviewOrder.orderNumber} رد شد و خریدار باید فیش جدید ارسال کند.`);
      }
      handleCloseReviewReceipt();
      refetch();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در ثبت وضعیت فیش پرداختی");
      }
    }
  };

  // باز کردن مدال تغییر وضعیت
  const handleOpenStatusModal = (order: AdminOrderListItem, nextStatus: "SHIPPED" | "DELIVERED") => {
    setStatusModalOrder(order);
    setTargetStatus(nextStatus);
    setTrackingCodeInput(order.trackingCode || "");
    setStatusAdminNote(order.adminNote || "");
  };

  // ثبت تغییر وضعیت
  const handleSubmitStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    try {
      await updateStatusMutation.mutateAsync({
        orderId: statusModalOrder.id,
        status: targetStatus,
        trackingCode: trackingCodeInput.trim() || undefined,
        adminNote: statusAdminNote.trim() || undefined,
      });

      toast.success(
        targetStatus === "SHIPPED"
          ? "وضعیت سفارش به «ارسال شده» تغییر یافت و کد رهگیری پستی ثبت گردید."
          : "سفارش به عنوان «تحویل داده شده» نهایی شد."
      );
      setStatusModalOrder(null);
      refetch();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در بروزرسانی وضعیت سفارش");
      }
    }
  };

  // ثبت لغو سفارش توسط ادمین
  const handleSubmitCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;

    try {
      await cancelOrderMutation.mutateAsync({
        orderId: cancelModalOrder.id,
        adminNote: cancelAdminNote.trim() || undefined,
      });

      toast.success(`سفارش ${cancelModalOrder.orderNumber} با موفقیت لغو شد و موجودی انبار بازگردانده شد.`);
      setCancelModalOrder(null);
      refetch();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در لغو سفارش");
      }
    }
  };

  // آمارهای سریع جهت هدر
  const waitingReviewCount = orders.filter((o) => o.paymentStatus === "WAITING_REVIEW").length;
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* سربرگ مدیریت سفارشات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            مدیریت و پیگیری سفارشات
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            بررسی فیش‌های واریزی، تغییر وضعیت مرسوله‌ها، ثبت کدهای رهگیری پستی و فاکتورها
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="font-semibold gap-2 self-start sm:self-auto"
        >
          <RotateCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          <span>بروزرسانی داده‌ها</span>
        </Button>
      </div>

      {/* کارت‌های شاخص سریع بالای صفحه */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">کل سفارش‌ها</CardTitle>
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {toPersianDigits(total)} سفارش
            </div>
            <p className="text-[11px] text-muted-foreground font-normal mt-1.5">
              مجموع کل سفارش‌های ثبت‌شده
            </p>
          </CardContent>
        </Card>

        {/* نیازمند بررسی فیش با هایلایت نارنجی/زرد */}
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-400">
              فیش‌های در انتظار بررسی
            </CardTitle>
            <div className="size-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-2">
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {toPersianDigits(waitingReviewCount)} فیش
              </div>
              {waitingReviewCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px]">
                  فوری
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-semibold mt-1.5">
              نیازمند بررسی و تایید پرداخت
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">آماده بسته‌بندی</CardTitle>
            <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {toPersianDigits(confirmedCount)} سفارش
            </div>
            <p className="text-[11px] text-muted-foreground font-normal mt-1.5">
              پرداخت تاییدشده در صف ارسال
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
            <CardTitle className="text-xs font-bold text-muted-foreground">در مسیر ارسال پست</CardTitle>
            <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="size-6" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {toPersianDigits(shippedCount)} مرسوله
            </div>
            <p className="text-[11px] text-muted-foreground font-normal mt-1.5">
              تحویل‌شده به پست و در حال ارسال
            </p>
          </CardContent>
        </Card>
      </div>

      {/* بخش فیلترها و جستجوی زنده */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* جستجوی زنده */}
            <div className="sm:col-span-6 relative">
              <Search className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در شماره سفارش یا شماره تماس گیرنده..."
                className="pe-4 ps-10 rounded-xl text-xs h-10"
              />
            </div>

            {/* فیلتر وضعیت سفارش */}
            <div className="sm:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | "");
                  setPage(1);
                }}
                className="rounded-xl text-xs h-10 w-full"
              >
                <option value="">همه وضعیت‌های سفارش</option>
                <option value="PENDING">در انتظار پرداخت</option>
                <option value="CONFIRMED">تأیید شده / انبار</option>
                <option value="SHIPPED">ارسال شده به پست</option>
                <option value="DELIVERED">تحویل داده شده</option>
                <option value="CANCELLED">لغو شده</option>
              </Select>
            </div>

            {/* فیلتر وضعیت پرداخت */}
            <div className={activeSearch || statusFilter || paymentFilter ? "sm:col-span-2" : "sm:col-span-3"}>
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value as PaymentStatus | "");
                  setPage(1);
                }}
                className="rounded-xl text-xs h-10 w-full"
              >
                <option value="">همه وضعیت‌های پرداخت</option>
                <option value="PENDING">پرداخت نشده</option>
                <option value="WAITING_REVIEW">در انتظار بررسی رسید</option>
                <option value="PAID">پرداخت شده</option>
                <option value="FAILED">رسید رد شده</option>
              </Select>
            </div>

            {/* دکمه پاک‌کردن فیلترها در صورت فعال بودن */}
            {(activeSearch || statusFilter || paymentFilter) && (
              <div className="sm:col-span-1 flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="h-10 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1"
                  title="پاک‌کردن فیلترها"
                >
                  <X className="size-4" />
                  <span className="sm:hidden">پاک‌کردن فیلترها</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول سفارشات */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">در حال بارگذاری لیست سفارشات از سرور...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <ShoppingBag className="size-12 stroke-[1.5] text-muted-foreground mx-auto opacity-30" />
              <div className="text-sm font-bold text-foreground">هیچ سفارشی یافت نشد</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                سفارشی مطابق با فیلترهای جستجوی انتخابی وجود ندارد.
              </p>
              {(activeSearch || statusFilter || paymentFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="rounded-xl text-xs font-bold mt-2"
                >
                  پاک‌سازی فیلترها
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-right text-xs font-bold text-muted-foreground w-40">
                      شماره سفارش
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      مشتری / گیرنده
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      تاریخ ثبت
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      وضعیت پردازش
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      وضعیت پرداخت
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      فیش واریزی
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">
                      مبلغ کل
                    </TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground w-36">
                      عملیات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
                      label: order.status,
                      badgeClass: "border-border bg-muted text-muted-foreground",
                      icon: Clock,
                    };
                    const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
                      label: order.paymentStatus,
                      badgeClass: "border-border bg-muted text-muted-foreground",
                      icon: CreditCard,
                    };

                    const isWaitingReview = order.paymentStatus === "WAITING_REVIEW";
                    const isConfirmed = order.status === "CONFIRMED";
                    const isShipped = order.status === "SHIPPED";
                    const canCancel = order.status !== "DELIVERED" && order.status !== "CANCELLED";

                    const rowTintByStatus: Record<OrderStatus, string> = {
                      PENDING: "bg-amber-500/[0.06] hover:bg-amber-500/[0.11]",
                      CONFIRMED: "bg-sky-500/[0.06] hover:bg-sky-500/[0.11]",
                      SHIPPED: "bg-indigo-500/[0.06] hover:bg-indigo-500/[0.11]",
                      DELIVERED: "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.11]",
                      CANCELLED: "bg-destructive/[0.07] hover:bg-destructive/[0.12]",
                    };

                    return (
                      <TableRow
                        key={order.id}
                        className={`border-border/50 transition-colors ${
                          rowTintByStatus[order.status] || "hover:bg-muted/30"
                        }`}
                      >
                        {/* شماره سفارش */}
                        <TableCell className="font-mono text-xs font-black text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{order.orderNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.orderNumber, order.orderNumber)}
                              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                              title="کپی شماره سفارش"
                            >
                              {copiedId === order.orderNumber ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* مشخصات مشتری */}
                        <TableCell className="text-xs">
                          <div className="font-bold text-foreground truncate max-w-[150px]">
                            {order.receiverName || order.user?.name || "کاربر"}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            {order.receiverPhone || order.user?.phone || "-"}
                          </div>
                        </TableCell>

                        {/* تاریخ ثبت سفارش */}
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatPersianDate(order.createdAt)}
                        </TableCell>

                        {/* وضعیت سفارش */}
                        <TableCell>
                          <Badge className={`text-[11px] font-bold border px-2.5 py-0.5 gap-1 ${statusCfg.badgeClass}`}>
                            <statusCfg.icon className="size-3" />
                            <span>{statusCfg.label}</span>
                          </Badge>
                        </TableCell>

                        {/* وضعیت پرداخت */}
                        <TableCell>
                          {isWaitingReview ? (
                            <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 gap-1 animate-pulse">
                              <Receipt className="size-3 text-amber-600" />
                              <span>نیازمند بررسی فیش</span>
                            </Badge>
                          ) : (
                            <Badge className={`text-[11px] font-bold border px-2.5 py-0.5 ${paymentCfg.badgeClass}`}>
                              <span>{paymentCfg.label}</span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* فیش واریزی */}
                        <TableCell>
                          {order.hasReceipt || isWaitingReview || order.receiptUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReviewReceipt(order)}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1 text-primary hover:text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                            >
                              <Eye className="size-3" />
                              <span>مشاهده فیش</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono">بدون فیش</span>
                          )}
                        </TableCell>

                        {/* مبلغ کل فاکتور */}
                        <TableCell className="font-mono text-xs font-black text-foreground">
                          {formatToman(order.totalPrice)}
                        </TableCell>

                        {/* دکمه‌های عملیات */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* دکمه بررسی سریع در صورت وجود فیش */}
                            {isWaitingReview ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReviewReceipt(order)}
                                className="h-7 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold gap-1 shadow-xs cursor-pointer"
                              >
                                <Receipt className="size-3" />
                                <span>بررسی</span>
                              </Button>
                            ) : isConfirmed && order.paymentStatus === "PAID" ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenStatusModal(order, "SHIPPED")}
                                className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold gap-1 shadow-xs cursor-pointer"
                              >
                                <Truck className="size-3" />
                                <span>ارسال</span>
                              </Button>
                            ) : isShipped ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenStatusModal(order, "DELIVERED")}
                                className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-1 shadow-xs cursor-pointer"
                              >
                                <PackageCheck className="size-3" />
                                <span>تحویل</span>
                              </Button>
                            ) : null}

                            {/* منوی سایر عملیات */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                aria-label="منوی عملیات"
                              >
                                <MoreVertical className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-auto min-w-56 rounded-xl p-1.5 text-xs whitespace-nowrap" dir="rtl">
                                <DropdownMenuItem
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="flex items-center gap-2 cursor-pointer font-medium py-1.5 whitespace-nowrap"
                                >
                                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                                  <span>مشاهده کامل فاکتور</span>
                                </DropdownMenuItem>

                                {(order.hasReceipt || isWaitingReview || order.receiptUrl) && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenReviewReceipt(order)}
                                    className="flex items-center gap-2 cursor-pointer font-medium py-1.5 text-primary whitespace-nowrap"
                                  >
                                    <Receipt className="size-3.5 shrink-0" />
                                    <span>بررسی / پیش‌نمایش فیش</span>
                                  </DropdownMenuItem>
                                )}

                                {isConfirmed && order.paymentStatus === "PAID" && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenStatusModal(order, "SHIPPED")}
                                    className="flex items-center gap-2 cursor-pointer font-medium py-1.5 text-blue-600 dark:text-blue-400 whitespace-nowrap"
                                  >
                                    <Truck className="size-3.5 shrink-0" />
                                    <span>ثبت کد رهگیری و ارسال</span>
                                  </DropdownMenuItem>
                                )}

                                {isShipped && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenStatusModal(order, "DELIVERED")}
                                    className="flex items-center gap-2 cursor-pointer font-medium py-1.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                                  >
                                    <PackageCheck className="size-3.5 shrink-0" />
                                    <span>ثبت تحویل سفارش</span>
                                  </DropdownMenuItem>
                                )}

                                {canCancel && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCancelModalOrder(order);
                                        setCancelAdminNote("");
                                      }}
                                      className="flex items-center gap-2 cursor-pointer font-medium py-1.5 text-destructive focus:text-destructive whitespace-nowrap"
                                    >
                                      <XCircle className="size-3.5 shrink-0" />
                                      <span>لغو سفارش</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* صفحه‌بندی جدول */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                نمایش سفارش {toPersianDigits((page - 1) * limit + 1)} تا{" "}
                {toPersianDigits(Math.min(page * limit, total))} از مجموع {toPersianDigits(total)} سفارش
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="rounded-xl text-xs"
                >
                  صفحه قبل
                </Button>
                <span className="text-xs font-mono font-bold px-2.5">
                  {toPersianDigits(page)} / {toPersianDigits(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="rounded-xl text-xs"
                >
                  صفحه بعد
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          دیالوگ ۱: بررسی فیش واریزی (تأیید / رد) - PATCH /admin/orders/:id/payment
         ========================================================================= */}
      <Dialog open={!!reviewOrder} onOpenChange={(open) => !open && handleCloseReviewReceipt()}>
        {reviewOrder && (
          <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                <span>بررسی فیش واریز کارت‌به‌کارت</span>
              </DialogTitle>
              <DialogDescription className="text-right text-xs">
                سفارش {reviewOrder.orderNumber} به مبلغ {formatToman(reviewOrder.totalPrice)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* کادر پیش‌نمایش تصویر فیش */}
              <div className="rounded-xl border border-border bg-muted/20 p-2 flex flex-col items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden">
                {isFetchingBlob ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span>در حال بارگذاری تصویر امن فیش...</span>
                  </div>
                ) : receiptBlobUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={receiptBlobUrl}
                    alt="تصویر فیش واریز"
                    className="max-h-[340px] w-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground text-center">
                    تصویر فیش توسط سرور برگردانده نشد یا در دسترس نیست.
                  </div>
                )}
              </div>

              {/* مشخصات و یادداشت */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-foreground">
                  یادداشت داخلی ادمین (اختیاری):
                </label>
                <Textarea
                  value={reviewAdminNote}
                  onChange={(e) => setReviewAdminNote(e.target.value)}
                  placeholder="مثلاً: فیش بانکی با واریزی ساعت ۱۰ مطابقت داشت و تایید شد..."
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => handleSubmitReceiptReview("reject")}
                disabled={reviewReceiptMutation.isPending}
              >
                <XCircle className="size-4" />
                <span>رد فیش پرداختی</span>
              </Button>

              <Button
                onClick={() => handleSubmitReceiptReview("approve")}
                disabled={reviewReceiptMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {reviewReceiptMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                <span>تأیید فیش و ثبت پرداخت</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* =========================================================================
          دیالوگ ۲: تغییر وضعیت پردازش سفارش (ارسال / تحویل) - PATCH /admin/orders/:id/status
         ========================================================================= */}
      <Dialog open={!!statusModalOrder} onOpenChange={(open) => !open && setStatusModalOrder(null)}>
        {statusModalOrder && (
          <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <form onSubmit={handleSubmitStatusChange} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-right flex items-center gap-2">
                  {targetStatus === "SHIPPED" ? (
                    <>
                      <Truck className="size-5 text-blue-600" />
                      <span>ثبت ارسال سفارش و کد رهگیری پستی</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="size-5 text-emerald-600" />
                      <span>ثبت تحویل سفارش به خریدار</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-right text-xs">
                  شماره سفارش: {statusModalOrder.orderNumber} | گیرنده: {statusModalOrder.receiverName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs pt-2">
                {targetStatus === "SHIPPED" && (
                  <div className="space-y-2">
                    <label className="block font-bold text-foreground">
                      کد رهگیری مرسوله پستی (اختیاری):
                    </label>
                    <Input
                      value={trackingCodeInput}
                      onChange={(e) => setTrackingCodeInput(e.target.value)}
                      placeholder="مثال: ۲۴ رقم بارکد پستی پیشتاز..."
                      dir="ltr"
                      maxLength={50}
                      className="font-mono text-start"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block font-bold text-foreground">
                    یادداشت داخلی ادمین (اختیاری):
                  </label>
                  <Textarea
                    value={statusAdminNote}
                    onChange={(e) => setStatusAdminNote(e.target.value)}
                    placeholder="مثال: بسته به پست مرکزی تحویل گردید..."
                    rows={2}
                    maxLength={500}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusModalOrder(null)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  <span>تأیید و ذخیره تغییر وضعیت</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* =========================================================================
          دیالوگ ۳: لغو سفارش توسط ادمین - POST /admin/orders/:id/cancel
         ========================================================================= */}
      <Dialog open={!!cancelModalOrder} onOpenChange={(open) => !open && setCancelModalOrder(null)}>
        {cancelModalOrder && (
          <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <form onSubmit={handleSubmitCancelOrder} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-right flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-5 shrink-0" />
                  <span>لغو سفارش {cancelModalOrder.orderNumber}</span>
                </DialogTitle>
                <DialogDescription className="text-right text-xs leading-relaxed">
                  با لغو این سفارش، موجودی تمام اقلام به صورت اتمیک به انبار بازمی‌گردد. در صورت پرداخت شدن فاکتور، وجه باید به صورت دستی به مشتری استرداد داده شود.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 text-xs pt-2">
                <label className="block font-bold text-foreground">
                  علت لغو سفارش (در یادداشت ادمین ثبت می‌شود):
                </label>
                <Textarea
                  value={cancelAdminNote}
                  onChange={(e) => setCancelAdminNote(e.target.value)}
                  placeholder="مثال: لغو به علت درخواست تلفنی مشتری یا عدم موجودی کالا..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelModalOrder(null)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={cancelOrderMutation.isPending}
                >
                  {cancelOrderMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  <span>تأیید لغو سفارش</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* =========================================================================
          دیالوگ ۴: فاکتور کامل و جزئیات سفارش (Full Order Details)
         ========================================================================= */}
      <Dialog
        open={!!selectedOrderDetails}
        onOpenChange={(open) => !open && setSelectedOrderDetails(null)}
      >
        {selectedOrderDetails && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <span>فاکتور جامع سفارش</span>
                <span className="font-mono text-primary">{selectedOrderDetails.orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-right text-xs">
                ثبت‌شده در تاریخ {formatPersianDate(selectedOrderDetails.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* مشخصات گیرنده و نشانی */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" />
                    <span>نشانی کامل تحویل گیرنده:</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] cursor-pointer"
                    onClick={() => {
                      const fullText = [
                        `${selectedOrderDetails.receiverName}`,
                        `تلفن: ${selectedOrderDetails.receiverPhone}${selectedOrderDetails.secondaryPhone ? ` / ${selectedOrderDetails.secondaryPhone}` : ""}`,
                        selectedOrderDetails.addressLine ||
                          `${selectedOrderDetails.province}، ${selectedOrderDetails.city}`,
                        selectedOrderDetails.postalCode
                          ? `کد پستی: ${selectedOrderDetails.postalCode}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" | ");
                      navigator.clipboard?.writeText(fullText);
                      toast.success("نشانی و شماره تماس کپی شد");
                    }}
                  >
                    کپی نشانی
                  </Button>
                </div>
                <div className="text-muted-foreground leading-relaxed select-text">
                  {toPersianDigits(
                    selectedOrderDetails.addressLine
                      ? selectedOrderDetails.addressLine
                      : `${selectedOrderDetails.province}، ${selectedOrderDetails.city}`
                  )}
                </div>
                {selectedOrderDetails.streetAddress && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>استان: <strong className="text-foreground">{selectedOrderDetails.province}</strong></span>
                    <span>شهر: <strong className="text-foreground">{selectedOrderDetails.city}</strong></span>
                    <span>خیابان: <strong className="text-foreground">{toPersianDigits(selectedOrderDetails.streetAddress)}</strong></span>
                    {selectedOrderDetails.plaque && (
                      <span>پلاک: <strong className="text-foreground">{toPersianDigits(selectedOrderDetails.plaque)}</strong></span>
                    )}
                    {selectedOrderDetails.floor && (
                      <span>طبقه: <strong className="text-foreground">{toPersianDigits(selectedOrderDetails.floor)}</strong></span>
                    )}
                    {selectedOrderDetails.unit && (
                      <span>واحد: <strong className="text-foreground">{toPersianDigits(selectedOrderDetails.unit)}</strong></span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground pt-1.5 border-t border-border/50 text-[11px]">
                  <span>
                    تحویل‌گیرنده: <strong className="text-foreground">{selectedOrderDetails.receiverName}</strong>
                  </span>
                  <span>
                    تلفن اصلی:{" "}
                    <strong dir="ltr" className="inline-block font-mono text-foreground">
                      {formatPersianPhone(selectedOrderDetails.receiverPhone)}
                    </strong>
                  </span>
                  {selectedOrderDetails.secondaryPhone && (
                    <span>
                      تلفن دوم:{" "}
                      <strong dir="ltr" className="inline-block font-mono text-foreground">
                        {formatPersianPhone(selectedOrderDetails.secondaryPhone)}
                      </strong>
                    </span>
                  )}
                  {selectedOrderDetails.postalCode && (
                    <span>
                      کد پستی:{" "}
                      <strong dir="ltr" className="inline-block font-mono text-foreground">
                        {formatPersianPostalCode(selectedOrderDetails.postalCode)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* لیست اقلام سفارش */}
              <div className="space-y-2">
                <div className="font-bold text-foreground">
                  اقلام سفارش ({toPersianDigits(selectedOrderDetails.items?.length || 0)} قلم):
                </div>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
                  {selectedOrderDetails.items?.map((item) => {
                    const rawImg =
                      item.image ||
                      item.product?.images?.[0]?.url ||
                      productImageMap.get(item.productId);
                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-card">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-xl bg-muted/30 border border-border p-1 flex items-center justify-center shrink-0">
                            {rawImg ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={normalizeImageUrl(rawImg)}
                                alt={item.title}
                                className="size-full object-contain"
                              />
                            ) : (
                              <ShoppingBag className="size-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground line-clamp-1">{item.title}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {toPersianDigits(item.quantity)} عدد × {item.price.toLocaleString("fa-IR")} تومان
                            </div>
                          </div>
                        </div>

                        <div className="font-mono font-bold text-foreground text-sm shrink-0">
                          {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* خلاصه مالی فاکتور */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>مجموع قیمت اقلام:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatToman(selectedOrderDetails.itemsPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    پس‌کرایه (۰ تومان در فاکتور)
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
                  <span className="font-black text-foreground">مبلغ نهایی پرداختی:</span>
                  <span className="font-mono font-black text-primary text-base">
                    {formatToman(selectedOrderDetails.totalPrice)}
                  </span>
                </div>
              </div>

              {/* یادداشت‌های مشتری و ادمین */}
              {selectedOrderDetails.note && (
                <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-foreground block">یادداشت مشتری:</span>
                  <p className="text-muted-foreground leading-relaxed">{selectedOrderDetails.note}</p>
                </div>
              )}

              {selectedOrderDetails.adminNote && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                  <span className="font-bold text-primary block">یادداشت داخلی مدیریت (Admin Note):</span>
                  <p className="text-foreground leading-relaxed">{selectedOrderDetails.adminNote}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderDetails(null)}
                className="rounded-xl text-xs font-bold w-full"
              >
                بستن فاکتور
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
