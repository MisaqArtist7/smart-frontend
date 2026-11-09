import { ThumbsUp, ThumbsDown, HelpCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ReviewRecommendation, ReviewStatus } from "./types";

export interface ReviewRecommendationConfig {
  value: ReviewRecommendation;
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const REVIEW_RECOMMENDATION_CONFIG: Record<
  ReviewRecommendation,
  ReviewRecommendationConfig
> = {
  RECOMMENDED: {
    value: "RECOMMENDED",
    label: "خرید این محصول را پیشنهاد می‌کنم",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: ThumbsUp,
  },
  NOT_RECOMMENDED: {
    value: "NOT_RECOMMENDED",
    label: "خرید این محصول را پیشنهاد نمی‌کنم",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    icon: ThumbsDown,
  },
  NO_OPINION: {
    value: "NO_OPINION",
    label: "نظری ندارم / مطمئن نیستم",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
  },
};

export interface ReviewStatusConfig {
  value: ReviewStatus;
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, ReviewStatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "در انتظار تأیید",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  APPROVED: {
    value: "APPROVED",
    label: "تأیید شده",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  REJECTED: {
    value: "REJECTED",
    label: "رد شده",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
};

