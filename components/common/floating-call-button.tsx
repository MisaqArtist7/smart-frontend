"use client";

import React from "react";
import { PhoneCall } from "lucide-react";

export interface FloatingCallButtonProps {
  phoneNumber?: string;
  displayPhone?: string;
  className?: string;
}

/**
 * دکمه شناور ثابت تماس تلفنی در سمت چپ پایین سایت
 * باز کردن مستقیم شماره‌گیر گوشی هنگام کلیک (tel:)
 */
export function FloatingCallButton({
  phoneNumber = "09122193551",
  displayPhone = "۰۹۱۲ ۲۱۹ ۳۵۵۱",
  className = "",
}: FloatingCallButtonProps) {
  return (
    <div
      dir="rtl"
      className={`fixed bottom-6 left-6 z-50 flex items-center select-none ${className}`}
    >
      <a
        href={`tel:${phoneNumber.replace(/\s+/g, "")}`}
        aria-label="تماس تلفنی با مدیریت و فروش"
        title="تماس تلفنی با مدیریت"
        className="group relative flex size-13 sm:size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-108 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 cursor-pointer"
      >
        {/* موج پالس رادار بیرونی */}
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40 pointer-events-none" />

        {/* آیکون تماس تلفنی */}
        <PhoneCall className="size-5 sm:size-6 text-primary-foreground transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />

        {/* لیبل راهنما در دسکتاپ (سمت راست دکمه) با ارقام فاصله‌دار و خوانا */}
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card text-foreground text-xs font-bold border border-border/80 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span>تماس با مدیریت</span>
          <span className="font-mono text-primary text-xs font-black tracking-wide" dir="ltr">
            {displayPhone}
          </span>
        </span>
      </a>
    </div>
  );
}

export default FloatingCallButton;

