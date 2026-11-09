import { AlertCircle, Clock, CheckCircle2, MessageSquare, CreditCard, ShoppingBag, Truck, HelpCircle } from "lucide-react";
import type { ContactSubject, ContactStatus } from "./types";

export interface ContactSubjectConfig {
  value: ContactSubject;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CONTACT_SUBJECT_CONFIG: Record<ContactSubject, ContactSubjectConfig> = {
  ORDER_ISSUE: {
    value: "ORDER_ISSUE",
    label: "پیگیری یا مشکل سفارش",
    icon: ShoppingBag,
  },
  PAYMENT_ISSUE: {
    value: "PAYMENT_ISSUE",
    label: "مشکل در پرداخت یا واریز کارت به کارت",
    icon: CreditCard,
  },
  PRODUCT_QUESTION: {
    value: "PRODUCT_QUESTION",
    label: "سوال درباره موجودی یا مشخصات کالا",
    icon: HelpCircle,
  },
  DELIVERY_ISSUE: {
    value: "DELIVERY_ISSUE",
    label: "تاخیر یا مشکل در ارسال مرسوله پستی",
    icon: Truck,
  },
  OTHER: {
    value: "OTHER",
    label: "سایر موضوعات و پیشنهادات",
    icon: MessageSquare,
  },
};

export const CONTACT_SUBJECT_OPTIONS: ContactSubjectConfig[] = [
  CONTACT_SUBJECT_CONFIG.ORDER_ISSUE,
  CONTACT_SUBJECT_CONFIG.PAYMENT_ISSUE,
  CONTACT_SUBJECT_CONFIG.PRODUCT_QUESTION,
  CONTACT_SUBJECT_CONFIG.DELIVERY_ISSUE,
  CONTACT_SUBJECT_CONFIG.OTHER,
];

export interface ContactStatusConfig {
  value: ContactStatus;
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CONTACT_STATUS_CONFIG: Record<ContactStatus, ContactStatusConfig> = {
  NEW: {
    value: "NEW",
    label: "جدید",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "در حال پیگیری",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Clock,
  },
  DONE: {
    value: "DONE",
    label: "انجام‌شده",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
};

/**
 * تبدیل ارقام فارسی و عربی به ارقام انگلیسی
 */
export const toEnglishDigits = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی، حذف فاصله‌ها و کاراکترهای غیرعددی
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  return toEnglishDigits(raw.trim()).replace(/\D/g, "");
}

