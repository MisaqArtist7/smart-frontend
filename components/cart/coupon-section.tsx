"use client";

import React, { useState } from "react";
import { Tag, CheckCircle2, X, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import { ApiError } from "@/lib/api";
import { useValidateCoupon, normalizeCouponCode } from "@/lib/api/coupons";
import { cn } from "@/lib/utils";

interface CouponSectionProps {
  className?: string;
  orderAmount?: number;
}

export function CouponSection({ className, orderAmount }: CouponSectionProps) {
  const [inputCode, setInputCode] = useState("");
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const getRawTotal = useCartStore((s) => s.getRawTotal);
  const getDiscountTotal = useCartStore((s) => s.getDiscountTotal);

  const validateMutation = useValidateCoupon();

  // مبلغ جاری سفارش (مجموع پس از کسر تخفیف‌های مستقیم کالاها)
  const currentSubtotal = orderAmount ?? Math.max(0, getRawTotal() - getDiscountTotal());

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeCouponCode(inputCode);

    if (!cleanCode) {
      toast.error("لطفاً ابتدا کد تخفیف خود را وارد کنید.");
      return;
    }

    try {
      const result = await validateMutation.mutateAsync({
        code: cleanCode,
        orderAmount: currentSubtotal,
      });

      if (result.valid) {
        setCoupon({
          code: result.code,
          type: result.type,
          value: result.value,
          percent: result.type === "PERCENTAGE" ? result.value : undefined,
          discountAmount: result.discountAmount,
        });

        setInputCode("");
        toast.success(
          result.message || `کد تخفیف ${result.code} با موفقیت اعمال شد.`
        );
      } else {
        toast.error(
          result.message || "کد تخفیف وارد شده معتبر نیست یا منقضی شده است."
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const msg = err.message;
        toast.error(msg || "کد تخفیف وارد شده معتبر نیست یا منقضی شده است.");
      } else {
        toast.error("خطا در برقراری ارتباط با سرور. لطفاً مجدداً تلاش فرمایید.");
      }
    }
  };

  const handleRemove = () => {
    removeCoupon();
    toast.info("کد تخفیف حذف شد.");
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3", className)}>
      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
        <Tag className="size-4 text-primary" />
        <span>کد تخفیف دارید؟</span>
      </div>

      {coupon ? (
        /* کارت کد اعمال‌شده */
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                {coupon.code}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {coupon.discountAmount.toLocaleString("fa-IR")} تومان تخفیف روی فاکتور
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors cursor-pointer"
            title="انصراف و حذف کد تخفیف"
          >
            <X className="size-3.5" />
            <span className="text-[11px]">حذف کد</span>
          </button>
        </div>
      ) : (
        /* فرم وارد کردن کد تخفیف */
        <form onSubmit={handleApply} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(normalizeCouponCode(e.target.value))}
              placeholder="کد تخفیف دارید؟ وارد کنید..."
              dir="ltr"
              disabled={validateMutation.isPending}
              className="w-full h-11 rounded-xl border border-input bg-muted/30 px-3.5 text-xs sm:text-sm font-mono uppercase tracking-wider text-start text-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={validateMutation.isPending || !inputCode.trim()}
            className="h-11 px-4 sm:px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>بررسی...</span>
              </>
            ) : (
              <>
                <span>اعمال کد</span>
                <ArrowLeft className="size-3.5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
