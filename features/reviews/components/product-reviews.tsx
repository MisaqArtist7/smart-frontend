"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  User,
  Plus,
  LogIn,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useProductReviews,
  useSubmitReview,
  REVIEW_RECOMMENDATION_CONFIG,
  type ReviewRecommendation,
  type ProductReview,
} from "@/lib/api/reviews";
import { formatPersianDate } from "@/lib/order-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
  productId: number;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useProductReviews(productId);
  const submitReviewMutation = useSubmitReview();

  // کنترل باز بودن مودال‌ها
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);

  // فیلدهای فرم ثبت دیدگاه
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [recommendation, setRecommendation] =
    useState<ReviewRecommendation>("RECOMMENDED");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const reviews = data?.reviews || [];
  const summary = data?.summary || {
    averageRating: 5,
    totalReviews: 0,
    satisfactionRate: 100,
    recommendationCounts: { recommended: 0, notRecommended: 0, noOpinion: 0 },
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setFormError(null);
    setIsAddReviewOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      setFormError("متن دیدگاه باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    if (cleanMessage.length > 2000) {
      setFormError("متن دیدگاه نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد.");
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        productId,
        rating,
        recommendation,
        title: title.trim() || undefined,
        message: cleanMessage,
      });

      setIsAddReviewOpen(false);
      setTitle("");
      setMessage("");
      setRating(5);
      setRecommendation("RECOMMENDED");

      toast.success(
        "دیدگاه شما با موفقیت ثبت شد و پس از بررسی و تأیید مدیریت در سایت نمایش داده خواهد شد."
      );
    } catch {
      toast.error("خطا در ارسال دیدگاه. لطفاً مجدداً تلاش فرمایید.");
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* =========================================================================
          ۱. خلاصه امتیازات و درصد رضایت (Rating Summary Header)
          ========================================================================= */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* میانگین ستاره‌ها و تعداد کل */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-start space-y-2 border-b md:border-b-0 md:border-e border-border/80 pb-5 md:pb-0 md:pe-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-foreground tracking-tight">
                {summary.averageRating.toLocaleString("fa-IR")}
              </span>
              <span className="text-sm text-muted-foreground font-semibold">از ۵</span>
            </div>

            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-5",
                    i < Math.round(summary.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              بر اساس {summary.totalReviews.toLocaleString("fa-IR")} دیدگاه ثبت‌شده خریداران
            </p>
          </div>

          {/* کادر درصد رضایت خریداران */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-2 text-right">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
              <Sparkles className="size-4 text-emerald-500" />
              <span>
                {summary.totalReviews > 0
                  ? `${summary.satisfactionRate.toLocaleString("fa-IR")}٪ از خریداران، خرید این کالا را پیشنهاد کرده‌اند.`
                  : "اولین نفری باشید که تجربه خرید این محصول را ثبت می‌کنید!"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              دیدگاه‌های خریداران به سایر مهندسان و کاربران در انتخاب دقیق‌تر تجهیزات کمک خواهد کرد.
            </p>
          </div>

          {/* دکمه برجسته ثبت دیدگاه جدید */}
          <div className="md:col-span-3 flex justify-center md:justify-end">
            <Button
              onClick={handleOpenReviewModal}
              className="w-full md:w-auto h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="size-4" />
              <span>ثبت دیدگاه جدید</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ۲. لیست و کارت‌های دیدگاه‌ها (Comments List)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4.5 text-primary" />
            <h3 className="text-sm sm:text-base font-black text-foreground">
              نظرات و بررسی‌های کاربران ({reviews.length.toLocaleString("fa-IR")})
            </h3>
          </div>
        </div>

        {isLoading ? (
          /* اسکلتون لودینگ */
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-muted/60 rounded w-1/4" />
                <div className="h-3 bg-muted/40 rounded w-1/6" />
                <div className="h-12 bg-muted/30 rounded w-full" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* حالت بدون نظر */
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                هنوز دیدگاهی برای این محصول ثبت نشده است.
              </h4>
              <p className="text-xs text-muted-foreground">
                اولین نفری باشید که نظر و تجربه خود را با سایر مشتریان به اشتراک می‌گذارید.
              </p>
            </div>
            <Button
              onClick={handleOpenReviewModal}
              variant="outline"
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              افزودن دیدگاه
            </Button>
          </div>
        ) : (
          /* لیست کارت‌های نظرات */
          <div className="space-y-3">
            {reviews.map((review: ProductReview) => {
              const recConfig =
                REVIEW_RECOMMENDATION_CONFIG[review.recommendation] ||
                REVIEW_RECOMMENDATION_CONFIG.NO_OPINION;
              const RecIcon = recConfig.icon;

              return (
                <div
                  key={review.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 transition-colors hover:border-primary/30"
                >
                  {/* سطر بالا: نام کاربر، بج خریدار، تاریخ و ستاره‌ها */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="size-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {review.userName || "کاربر اسمارت الکتریک"}
                      </span>

                      {/* بج خریدار محصول */}
                      {review.isBuyer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="size-3" />
                          <span>خریدار این محصول</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        {formatPersianDate(review.createdAt)}
                      </span>
                      {/* ستاره‌های امتیاز */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-3.5",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* بج پیشنهاد خرید */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border",
                        recConfig.badgeClass
                      )}
                    >
                      <RecIcon className="size-3.5" />
                      <span>{recConfig.label}</span>
                    </span>
                  </div>

                  {/* عنوان و متن نظر */}
                  <div className="space-y-1.5 text-right">
                    {review.title && (
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {review.message}
                    </p>
                  </div>

                  {/* باکس پاسخ پشتیبانی/ادمین */}
                  {review.adminReply && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 me-2 sm:me-4 space-y-1.5 text-right">
                      <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="size-4" />
                          <span>پاسخ پشتیبانی هوشمند الکتریک</span>
                        </div>
                        {review.adminReplyAt && (
                          <span className="text-muted-foreground font-normal">
                            {formatPersianDate(review.adminReplyAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {review.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          ۳. مودال هشدار لزوم ورود به حساب کاربری
          ========================================================================= */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <LogIn className="size-5 text-primary" />
              <span>ورود به حساب کاربری</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-2 text-right">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              برای ثبت دیدگاه و امتیازدهی به این محصول، ابتدا باید وارد حساب کاربری خود شوید.
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsAuthModalOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              انصراف
            </Button>
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center justify-center h-8 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold cursor-pointer transition-colors"
            >
              ورود یا ثبت‌نام
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ۴. مودال ثبت دیدگاه جدید (Add Review Modal)
          ========================================================================= */}
      <Dialog open={isAddReviewOpen} onOpenChange={setIsAddReviewOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl" dir="rtl">
          <DialogHeader className="text-right border-b border-border/60 pb-3">
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <span>ثبت دیدگاه جدید برای «{productTitle}»</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 py-2">
            {formError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* الف) انتخاب امتیاز ستاره‌ای تعاملی با هاور */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs sm:text-sm font-bold text-foreground">
                امتیاز شما به این کالا <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-1.5 py-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled =
                    hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform hover:scale-115 cursor-pointer focus:outline-none"
                      title={`${star} ستاره`}
                    >
                      <Star
                        className={cn(
                          "size-7 transition-colors",
                          isFilled
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted-foreground/30"
                        )}
                      />
                    </button>
                  );
                })}
                <span className="ms-2 font-mono font-bold text-sm text-foreground">
                  {(hoverRating ?? rating).toLocaleString("fa-IR")} از ۵
                </span>
              </div>
            </div>

            {/* ب) پرسش پیشنهاد خرید (توصیه) */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs sm:text-sm font-bold text-foreground">
                آیا خرید این محصول را به دیگران پیشنهاد می‌کنید؟ <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRecommendation("RECOMMENDED")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                    recommendation === "RECOMMENDED"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <ThumbsUp className="size-4" />
                  <span>پیشنهاد می‌کنم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendation("NOT_RECOMMENDED")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                    recommendation === "NOT_RECOMMENDED"
                      ? "border-destructive bg-destructive/10 text-destructive shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <ThumbsDown className="size-4" />
                  <span>پیشنهاد نمی‌کنم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendation("NO_OPINION")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                    recommendation === "NO_OPINION"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <HelpCircle className="size-4" />
                  <span>نظری ندارم</span>
                </button>
              </div>
            </div>

            {/* ج) عنوان دیدگاه (اختیاری) */}
            <div className="space-y-1.5 text-right">
              <label htmlFor="review-title" className="block text-xs sm:text-sm font-bold text-foreground">
                عنوان دیدگاه <span className="text-muted-foreground font-normal text-xs">(اختیاری)</span>
              </label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: کیفیت ساخت بالا و ارزش خرید عالی"
                maxLength={100}
                className="h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* د) متن دیدگاه (الزامی) با شمارنده زنده */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <label htmlFor="review-message" className="block text-xs sm:text-sm font-bold text-foreground">
                  متن دیدگاه یا نقد و بررسی شما <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                  {message.length.toLocaleString("fa-IR")} / ۲,۰۰۰
                </span>
              </div>
              <Textarea
                id="review-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="نقاط قوت و ضعف کالا، تجربه کاربری در پروژه و نکات فنی را بنویسید (حداقل ۱۰ کاراکتر)..."
                maxLength={2000}
                className="rounded-xl text-xs sm:text-sm leading-relaxed resize-y min-h-[100px]"
              />
            </div>

            <DialogFooter className="flex-row gap-2 justify-end pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                disabled={submitReviewMutation.isPending}
                onClick={() => setIsAddReviewOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={submitReviewMutation.isPending || message.trim().length < 10}
                className="rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                {submitReviewMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <span>ثبت دیدگاه</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
