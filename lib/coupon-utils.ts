import { Percent, Banknote } from "lucide-react";
import type { DiscountType, Coupon } from "./types";
import { toEnglishDigits } from "./contact-utils";

export interface DiscountTypeConfig {
  value: DiscountType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DISCOUNT_TYPE_CONFIG: Record<DiscountType, DiscountTypeConfig> = {
  PERCENTAGE: {
    value: "PERCENTAGE",
    label: "درصدی (٪)",
    icon: Percent,
  },
  FIXED_AMOUNT: {
    value: "FIXED_AMOUNT",
    label: "مبلغ ثابت (تومان)",
    icon: Banknote,
  },
};

/**
 * پاکسازی و استانداردسازی کد تخفیف: تبدیل ارقام به انگلیسی، بزرگ‌سازی حروف و حذف فاصله‌ها
 */
export function normalizeCouponCode(code: string): string {
  if (!code) return "";
  const english = toEnglishDigits(code.trim());
  return english.toUpperCase().replace(/\s+/g, "");
}

export type CouponStatus = "ACTIVE" | "EXPIRED" | "DEPLETED" | "INACTIVE";

export interface CouponStatusConfig {
  value: CouponStatus;
  label: string;
  badgeClass: string;
}

export const COUPON_STATUS_CONFIG: Record<CouponStatus, CouponStatusConfig> = {
  ACTIVE: {
    value: "ACTIVE",
    label: "فعال",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  EXPIRED: {
    value: "EXPIRED",
    label: "منقضی شده",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  DEPLETED: {
    value: "DEPLETED",
    label: "پایان سقف استفاده",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
  INACTIVE: {
    value: "INACTIVE",
    label: "غیرفعال دستی",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

/**
 * تعیین وضعیت پویای یک کوپن بر اساس تاریخ و سقف استفاده
 */
export function getCouponStatus(coupon: Coupon): CouponStatus {
  if (!coupon.isActive) return "INACTIVE";

  const now = new Date();
  if (coupon.endDate) {
    const end = new Date(coupon.endDate);
    if (!isNaN(end.getTime()) && now > end) {
      return "EXPIRED";
    }
  }

  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return "INACTIVE";
    }
  }

  if (
    coupon.totalUsageLimit != null &&
    coupon.totalUsageLimit > 0 &&
    coupon.usedCount >= coupon.totalUsageLimit
  ) {
    return "DEPLETED";
  }

  return "ACTIVE";
}

