"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * کامپوننت نوتیفیکیشن (Toast) هماهنگ با تم و فونت وزیرمتن وب‌سایت
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      dir="rtl"
      position="top-center"
      className="toaster group font-sans"
      style={{
        fontFamily: "var(--font-vazir), ui-sans-serif, system-ui, sans-serif",
      }}
      icons={{
        success: (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </span>
        ),
        error: (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AlertCircle className="size-4" />
          </span>
        ),
        warning: (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4" />
          </span>
        ),
        info: (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Info className="size-4" />
          </span>
        ),
        loading: (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Loader2 className="size-4 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        style: {
          fontFamily: "var(--font-vazir), ui-sans-serif, system-ui, sans-serif",
        },
        classNames: {
          toast:
            "group flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-foreground shadow-lg font-sans text-right",
          icon: "shrink-0 flex items-center justify-center",
          content: "flex-1 min-w-0",
          title: "text-xs sm:text-sm font-bold text-foreground leading-relaxed",
          description: "text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed",
          actionButton:
            "ms-auto shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer",
          cancelButton:
            "shrink-0 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 cursor-pointer",
          closeButton:
            "rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer",
          success: "border-emerald-500/30",
          error: "border-primary/35",
          warning: "border-amber-500/35",
          info: "border-sky-500/30",
        },
      }}
      {...props}
    />
  );
}

