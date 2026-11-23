"use client";

import React from "react";
import type { TopBarProps } from "./header.types";

/**
 * لایه اول: نوار بالای هدر (Top Bar)
 * - سمت راست (RTL): نقطه نشانگر رنگ اصلی (bg-primary) + متن اطلاعیه ارسال رایگان
 * - سمت چپ (RTL): متن بنر اطلاع‌رسانی
 */
export function TopBar({ config, className = "" }: TopBarProps) {
  const { announcement } = config;

  return (
    <div
      className={`border-b border-border bg-card text-xs transition-colors ${className}`}
    >
      <div className="mx-auto max-w-8xl flex min-h-10 bg-gray-100 items-center justify-center sm:justify-between gap-2 px-3 sm:px-6 lg:px-8 py-1.5">
        {/* سمت راست: نشانگر وضعیت + متن اطلاعیه (در دسکتاپ و تبلت) */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-muted-foreground font-medium truncate max-w-xs md:max-w-none">
            {announcement.text}
          </span>
        </div>

        {/* سمت چپ (در موبایل وسط‌چین): ارسال رایگان */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="group flex items-center gap-1.5 rounded border border-dashed border-primary px-2 py-0.5 font-mono text-[11px] sm:text-xs font-bold text-primary transition-colors hover:bg-accent"
          >
            ارسال بالای ۳ میلیون تومان رایگان است
          </span>
        </div>
      </div>
    </div>
  );
}

export default TopBar;

