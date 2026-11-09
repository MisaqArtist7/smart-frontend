import React from "react";
import Link from "next/link";
import {
  FileText,
  PhoneCall,
  CheckCircle2,
  Headphones,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface B2BConsultationProps {
  className?: string;
}

/**
 * بخش مشاوره تخصصی و خرید پروژه‌ای B2B
 * ویژه پیمانکاران، کارخانجات و خریداران عمده تجهیزات صنعتی
 */
export function B2BConsultation({ className }: B2BConsultationProps) {
  return (
    <section
      dir="rtl"
      aria-label="خدمات پروژه‌ای و سازمانی B2B"
      className={cn("w-full py-4 select-none", className)}
    >
      <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card p-6 sm:p-8 lg:p-10 shadow-xs overflow-hidden">
        {/* نورپردازی پس‌زمینه */}
        <div className="absolute top-0 end-0 size-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 size-60 bg-primary/[0.03] rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* متن و معرفی خدمات */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
              <FileText className="size-3.5" />
              <span>خدمات ویژه سازمانی و خرید پروژه‌ای</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-snug">
              تامین صفر تا صد تجهیزات برق صنعتی، ساختمانی و شبکه
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              تیم فنی اسمارت الکتریک با سال‌ها تجربه در اجرای پروژه‌های کابل‌کشی، شبکه‌های صنعتی PoE و سیستم‌های روشنایی هوشمند، آماده ارائه مشاوره رایگان و صدور پیش‌فاکتور رسمی به کلیه پیمانکاران، ارگان‌ها و کارخانجات سراسر کشور است.
            </p>

            {/* لیست ویژگی‌های کلیدی */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>صدور پیش‌فاکتور رسمی شرکتی</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>تخفیف پله‌ای خرید عمده</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>ارسال مستقیم باربری و تیپاکس</span>
              </div>
            </div>
          </div>

          {/* اکشن‌ها و دکمه‌های تماس در ستون چپ */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            {/* دکمه تماس مستقیم با کارشناس فروش */}
            <a
              href="tel:09122193551"
              className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <PhoneCall className="size-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">تماس مستقیم با کارشناس فنی</div>
                  <div className="text-sm font-black text-foreground font-mono mt-0.5" dir="ltr">
                    ۰۹۱۲ ۲۱۹ ۳۵۵۱
                  </div>
                </div>
              </div>
              <ArrowLeft className="size-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
            </a>

            {/* دکمه ارسال درخواست استعلام */}
            <Link
              href="/contact-us"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
            >
              <Headphones className="size-4" />
              <span>ثبت درخواست مشاوره و استعلام قیمت</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default B2BConsultation;
