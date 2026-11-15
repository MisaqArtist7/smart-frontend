"use client";

import React from "react";
import { PhoneCall } from "lucide-react";

export interface FloatingCallButtonProps {
  techSupportPhone?: string;
  adminPhone?: string;
  className?: string;
}

/**
 * دکمه شناور ثابت تماس تلفنی در سمت چپ پایین سایت
 * باز کردن مستقیم شماره‌گیر گوشی هنگام کلیک (tel:)
 */
export function FloatingCallButton({
  techSupportPhone = "09302340279",
  adminPhone = "09122193551",
  className = "",
}: FloatingCallButtonProps) {
  return (
    <div
      dir="rtl"
      className={`fixed bottom-6 left-6 z-50 flex items-center select-none ${className}`}
    >
      <a
        href={`tel:${techSupportPhone}`}
        aria-label="تماس تلفنی با پشتیبانی فنی وب‌سایت"
        title="تماس تلفنی با پشتیبانی فنی وب‌سایت"
        className="group relative flex size-13 sm:size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-108 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 cursor-pointer"
      >
        {/* موج پالس رادار بیرونی */}
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40 pointer-events-none" />

        {/* آیکون تماس تلفنی */}
        <PhoneCall className="size-5 sm:size-6 text-primary-foreground transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />

        {/* لیبل راهنما در دسکتاپ (سمت راست دکمه) */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden sm:flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-card text-foreground text-xs font-bold border border-border/80 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-[11px]">پشتیبانی فنی:</span>
            <span className="font-mono text-primary text-xs font-black" dir="ltr">
              ۰۹۳۰ ۲۳۴ ۰۲۷۹
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-1">
            <span className="text-muted-foreground text-[11px]">مدیریت و ادمین:</span>
            <span className="font-mono text-foreground text-xs font-black" dir="ltr">
              ۰۹۱۲ ۲۱۹ ۳۵۵۱
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

export default FloatingCallButton;

