"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  CornerDownLeft,
  Trash2,
  ExternalLink,
  ShieldCheck,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  useAdminReviews,
  useUpdateAdminReview,
  useDeleteAdminReview,
  REVIEW_STATUS_CONFIG,
  REVIEW_RECOMMENDATION_CONFIG,
  type ProductReview,
  type ReviewStatus,
} from "@/lib/api/reviews";
import { formatPersianDate } from "@/lib/order-utils";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FilterTab = "ALL" | ReviewStatus;

export default function AdminCommentsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("PENDING");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // دیالوگ پاسخ ادمین
  const [replyReview, setReplyReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState("");

  // دیالوگ تأیید حذف
  const [deleteTarget, setDeleteTarget] = useState<ProductReview | null>(null);

  // واکشی داده‌های دیدگاه‌ها از هوک ادمین
  const {
    data: reviewsData,
    isLoading,
    isFetching,
    refetch,
  } = useAdminReviews({
    status: activeTab === "ALL" ? undefined : activeTab,
    search: activeSearch,
    page,
    limit,
  });

  const updateMutation = useUpdateAdminReview();
  const deleteMutation = useDeleteAdminReview();

  const reviews: ProductReview[] = reviewsData?.items || [];
  const counts = reviewsData?.counts || { PENDING: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 };
  const total = reviewsData?.total ?? reviews.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // تغییر تب و ریست صفحه
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // جستجو
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  // بازنشانی جستجو
  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  // تغییر سریع وضعیت (تأیید یا رد)
  const handleStatusChange = async (review: ProductReview, newStatus: ReviewStatus) => {
    const statusLabel = newStatus === "APPROVED" ? "تأیید" : "رد";
    try {
      await updateMutation.mutateAsync({
        id: review.id,
        status: newStatus,
      });
      toast.success(`دیدگاه با موفقیت ${statusLabel} شد.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در تغییر وضعیت دیدگاه";
      toast.error(msg);
    }
  };

  // باز کردن دیالوگ پاسخ
  const handleOpenReplyDialog = (review: ProductReview) => {
    setReplyReview(review);
    setReplyText(review.adminReply || "");
  };

  // ثبت یا به‌روزرسانی پاسخ ادمین
  const handleSubmitReply = async () => {
    if (!replyReview) return;
    try {
      await updateMutation.mutateAsync({
        id: replyReview.id,
        adminReply: replyText.trim() || null,
      });
      toast.success("پاسخ مدیریت با موفقیت ذخیره شد.");
      setReplyReview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ثبت پاسخ مدیریت";
      toast.error(msg);
    }
  };

  // تأیید و اجرای حذف
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("دیدگاه موردنظر با موفقیت حذف گردید.");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در حذف دیدگاه";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه و آمار کلی */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <MessageSquare className="size-6 text-primary" />
            <span>مدیریت دیدگاه‌ها و نظرات کاربران</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            بررسی، تأیید، رد، ثبت پاسخ رسمی و پایش بازخورد خریداران روی کالاها
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl text-xs font-bold gap-2 self-start sm:self-auto"
        >
          {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
          <span>بروزرسانی لیست</span>
        </Button>
      </div>

      {/* کارت‌های خلاصه وضعیت */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          onClick={() => handleTabChange("PENDING")}
          className={cn(
            "cursor-pointer transition-all hover:border-amber-500/50",
            activeTab === "PENDING" && "ring-2 ring-amber-500/40 bg-amber-500/5"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">در انتظار تأیید</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {(counts.PENDING || 0).toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleTabChange("APPROVED")}
          className={cn(
            "cursor-pointer transition-all hover:border-emerald-500/50",
            activeTab === "APPROVED" && "ring-2 ring-emerald-500/40 bg-emerald-500/5"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">تأیید شده</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {(counts.APPROVED || 0).toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleTabChange("REJECTED")}
          className={cn(
            "cursor-pointer transition-all hover:border-destructive/50",
            activeTab === "REJECTED" && "ring-2 ring-destructive/40 bg-destructive/5"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">رد شده</span>
              <div className="text-2xl font-black text-destructive">
                {(counts.REJECTED || 0).toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleTabChange("ALL")}
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            activeTab === "ALL" && "ring-2 ring-primary/40 bg-primary/5"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">کل دیدگاه‌ها</span>
              <div className="text-2xl font-black text-foreground">
                {(counts.TOTAL || 0).toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار جستجو و تب‌های وضعیت */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* تب‌ها */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleTabChange("PENDING")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0",
                activeTab === "PENDING"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>در انتظار تأیید</span>
              {counts.PENDING > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    activeTab === "PENDING"
                      ? "bg-white/20 text-white"
                      : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {counts.PENDING.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("APPROVED")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0",
                activeTab === "APPROVED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>تأیید شده</span>
              {counts.APPROVED > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    activeTab === "APPROVED"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts.APPROVED.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("REJECTED")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0",
                activeTab === "REJECTED"
                  ? "bg-destructive text-destructive-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>رد شده</span>
              {counts.REJECTED > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    activeTab === "REJECTED"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts.REJECTED.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("ALL")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0",
                activeTab === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>همه دیدگاه‌ها</span>
            </button>
          </div>

          {/* فرم جستجو */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجو در کاربر، متن، محصول..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-9 pl-3 text-xs rounded-xl"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-xl text-xs font-bold shrink-0">
              جستجو
            </Button>
            {activeSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="rounded-xl text-xs shrink-0"
              >
                پاک‌کردن
              </Button>
            )}
          </form>
        </div>
      </Card>

      {/* جدول دیدگاه‌ها */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs">در حال بارگذاری دیدگاه‌ها...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
              <MessageSquare className="size-7" />
            </div>
            <h3 className="font-bold text-foreground text-sm">هیچ دیدگاهی یافت نشد</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {activeSearch
                ? `برای عبارت «${activeSearch}» در این وضعیت نتیجه‌ای ثبت نشده است.`
                : "در این بخش دیدگاهی برای نمایش وجود ندارد."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right text-xs font-black">کاربر ثبت‌کننده</TableHead>
                  <TableHead className="text-right text-xs font-black">محصول</TableHead>
                  <TableHead className="text-right text-xs font-black">امتیاز و توصیه</TableHead>
                  <TableHead className="text-right text-xs font-black min-w-[280px]">
                    متن دیدگاه و پاسخ
                  </TableHead>
                  <TableHead className="text-right text-xs font-black">تاریخ ثبت</TableHead>
                  <TableHead className="text-right text-xs font-black">وضعیت</TableHead>
                  <TableHead className="text-left text-xs font-black">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reviews.map((review) => {
                  const statusConf = REVIEW_STATUS_CONFIG[review.status];
                  const StatusIcon = statusConf?.icon || Clock;
                  const recConf = review.recommendation
                    ? REVIEW_RECOMMENDATION_CONFIG[review.recommendation]
                    : null;
                  const RecIcon = recConf?.icon || HelpCircle;

                  return (
                    <TableRow key={review.id} className="text-xs hover:bg-muted/20">
                      {/* ستون مشخصات کاربر */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <User className="size-3.5 text-muted-foreground" />
                            <span>{review.userName || "کاربر مهمان"}</span>
                          </div>
                          {review.userPhone && (
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {review.userPhone}
                            </div>
                          )}
                          {review.isBuyer && (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                              <ShieldCheck className="size-3" />
                              <span>خریدار قطعی</span>
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* ستون محصول */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="font-semibold text-foreground line-clamp-2">
                            {review.product?.title || `محصول کد #${review.productId}`}
                          </div>
                          <Link
                            href={`/product/${review.product?.slug || review.productId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <span>مشاهده کالا</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      </TableCell>

                      {/* ستون امتیاز و پیشنهاد */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1.5">
                          {/* ستاره‌ها */}
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "size-3.5",
                                  i < (review.rating || 5)
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                            <span className="font-bold text-[11px] text-foreground mr-1">
                              {(review.rating || 5).toLocaleString("fa-IR")}
                            </span>
                          </div>

                          {/* توصیه */}
                          {recConf && (
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] gap-1 font-medium", recConf.badgeClass)}
                            >
                              <RecIcon className="size-3" />
                              <span>{recConf.label}</span>
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* ستون متن دیدگاه و پاسخ */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-2">
                          {review.title && (
                            <div className="font-bold text-foreground">{review.title}</div>
                          )}
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {review.message}
                          </p>

                          {/* پاسخ رسمی مدیریت */}
                          {review.adminReply && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[11px] space-y-1">
                              <div className="font-bold text-primary flex items-center gap-1.5">
                                <CornerDownLeft className="size-3.5" />
                                <span>پاسخ رسمی فروشگاه:</span>
                              </div>
                              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {review.adminReply}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* ستون تاریخ */}
                      <TableCell className="align-top py-3.5 text-muted-foreground font-mono">
                        {formatPersianDate(review.createdAt)}
                      </TableCell>

                      {/* ستون وضعیت */}
                      <TableCell className="align-top py-3.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] gap-1 font-bold", statusConf?.badgeClass)}
                        >
                          <StatusIcon className="size-3" />
                          <span>{statusConf?.label || review.status}</span>
                        </Badge>
                      </TableCell>

                      {/* ستون عملیات */}
                      <TableCell className="align-top py-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* دکمه تأیید */}
                          {review.status !== "APPROVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="تأیید دیدگاه"
                              disabled={updateMutation.isPending}
                              onClick={() => handleStatusChange(review, "APPROVED")}
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 rounded-lg text-xs gap-1"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span className="hidden xl:inline">تأیید</span>
                            </Button>
                          )}

                          {/* دکمه رد */}
                          {review.status !== "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="رد دیدگاه"
                              disabled={updateMutation.isPending}
                              onClick={() => handleStatusChange(review, "REJECTED")}
                              className="h-8 px-2 text-destructive hover:bg-destructive/10 border-destructive/30 rounded-lg text-xs gap-1"
                            >
                              <XCircle className="size-3.5" />
                              <span className="hidden xl:inline">رد</span>
                            </Button>
                          )}

                          {/* دکمه پاسخ ادمین */}
                          <Button
                            size="sm"
                            variant="outline"
                            title="پاسخ مدیریت"
                            onClick={() => handleOpenReplyDialog(review)}
                            className="h-8 px-2 text-primary hover:bg-primary/10 border-primary/30 rounded-lg text-xs gap-1"
                          >
                            <MessageSquare className="size-3.5" />
                            <span className="hidden xl:inline">
                              {review.adminReply ? "ویرایش پاسخ" : "پاسخ"}
                            </span>
                          </Button>

                          {/* دکمه حذف */}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="حذف دیدگاه"
                            onClick={() => setDeleteTarget(review)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* صفحه‌بندی */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-xs">
            <span className="text-muted-foreground">
              نمایش صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} (کل:{" "}
              {total.toLocaleString("fa-IR")} دیدگاه)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg h-8 px-2 gap-1 text-xs"
              >
                <ChevronRight className="size-3.5" />
                <span>قبلی</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg h-8 px-2 gap-1 text-xs"
              >
                <span>بعدی</span>
                <ChevronLeft className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* مودال ثبت یا ویرایش پاسخ مدیریت */}
      <Dialog open={Boolean(replyReview)} onOpenChange={(open) => !open && setReplyReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CornerDownLeft className="size-4 text-primary" />
              <span>پاسخ مدیریت به دیدگاه</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              پاسخ رسمی شما در صفحه محصول زیر دیدگاه این کاربر با نشان رسمی فروشگاه نمایش داده خواهد شد.
            </DialogDescription>
          </DialogHeader>

          {replyReview && (
            <div className="space-y-4 pt-2">
              {/* مرور نظر کاربر */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {replyReview.userName || "کاربر"}
                  </span>
                  <span>{formatPersianDate(replyReview.createdAt)}</span>
                </div>
                <p className="text-foreground line-clamp-3 whitespace-pre-wrap">
                  {replyReview.message}
                </p>
              </div>

              {/* ورودی پاسخ */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  متن پاسخ رسمی فروشگاه:
                </label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را به این دیدگاه بنویسید (مثلاً راهنمایی فنی، قدردانی یا توضیحات تکمیلی)..."
                  rows={4}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplyReview(null)}
              className="rounded-xl text-xs"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={updateMutation.isPending}
              onClick={handleSubmitReply}
              className="rounded-xl text-xs font-bold gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>ذخیره پاسخ</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال تأیید حذف دیدگاه */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>حذف دائمی دیدگاه</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              آیا از حذف این دیدگاه اطمینان دارید؟ این عمل غیرقابل بازگشت است و دیدگاه به همراه تمام
              پاسخ‌های آن از پایگاه داده حذف خواهد شد.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1">
              <div className="font-bold text-foreground">
                کاربر: {deleteTarget.userName || "کاربر مهمان"}
              </div>
              <p className="text-muted-foreground line-clamp-2">{deleteTarget.message}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl text-xs"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              <span>بله، حذف کن</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
