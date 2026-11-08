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
    label: "مشکل در سفارش",
    icon: ShoppingBag,
  },
  PAYMENT_ISSUE: {
    value: "PAYMENT_ISSUE",
    label: "مشکل در پرداخت",
    icon: CreditCard,
  },
  PRODUCT_QUESTION: {
    value: "PRODUCT_QUESTION",
    label: "سؤال درباره‌ی محصول",
    icon: HelpCircle,
  },
  DELIVERY_ISSUE: {
    value: "DELIVERY_ISSUE",
    label: "مشکل در ارسال",
    icon: Truck,
  },
  OTHER: {
    value: "OTHER",
    label: "سایر موضوعات",
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
 * تبدیل ارقام فارسی و عربی به انگلیسی، حذف فاصله‌ها و خط تیره‌ها
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  let normalized = raw;
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replaceAll(persianDigits[i], String(i))
      .replaceAll(arabicDigits[i], String(i));
  }

  // حذف هرگونه فاصله، خط تیره، پرانتز یا کاراکتر غیرعددی
  return normalized.replace(/\D/g, "");
}

