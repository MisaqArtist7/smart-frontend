"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { TopBarProps } from "./header.types";

/**
 * لایه اول: نوار بالای هدر (Top Bar)
 * - سمت راست (RTL): نقطه نشانگر رنگ اصلی (bg-primary) + متن اطلاعیه ارسال رایگان
 * - سمت چپ (RTL): لیبل کد تخفیف + کادر خط‌چین تمیز (border-dashed border-primary text-primary)
 * با قابلیت کپی مستقیم کد تخفیف در کلیپ‌بورد کاربر
 */
export function TopBar({ config, className = "" }: TopBarProps) {
  const { announcement, discount } = config;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discount.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <div
      className={`border-b border-border bg-card text-xs transition-colors ${className}`}
    >
      <div className="mx-auto flex h-12 bg-gray-100 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* سمت راست: نشانگر وضعیت + متن ارسال رایگان */}
        <div className="flex items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-md md:max-w-none">
            {announcement.text}
          </span>
        </div>

        {/* سمت چپ: کادر کد تخفیف با خط‌چین تمیز */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-muted-foreground">
            {discount.label}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            title={copied ? (discount.copiedNotice || "کپی شد!") : "کلیک جهت کپی کد تخفیف"}
            className="group flex items-center gap-1.5 rounded border border-dashed border-primary px-2 py-0.5 font-mono text-xs font-bold text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <span>{discount.code}</span>
            {copied ? (
              <Check className="size-3 text-primary animate-in zoom-in" />
            ) : (
              <Copy className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
            {copied && (
              <span className="text-[10px] font-sans font-medium">
                {discount.copiedNotice || "کپی شد!"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;

