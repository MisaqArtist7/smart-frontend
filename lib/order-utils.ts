import { Clock, ShieldCheck, Truck, PackageCheck, AlertCircle, CheckCircle2, FileQuestion, XCircle } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "./types";

export interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: "در انتظار پرداخت",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  CONFIRMED: {
    label: "تأیید شده",
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: ShieldCheck,
  },
  SHIPPED: {
    label: "ارسال شده",
    badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
    icon: Truck,
  },
  DELIVERED: {
    label: "تحویل داده شده",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: PackageCheck,
  },
  CANCELLED: {
    label: "لغو شده",
    badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: AlertCircle,
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  PENDING: {
    label: "پرداخت نشده",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  WAITING_REVIEW: {
    label: "در انتظار بررسی رسید",
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: FileQuestion,
  },
  PAID: {
    label: "پرداخت شده",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "رسید رد شده",
    badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: XCircle,
  },
};

export function formatPersianDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

export function formatToman(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "۰ تومان";
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (x) => persianDigits[parseInt(x, 10)] ?? x);
}

