"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUp,
  Truck,
  Headset,
  BadgePercent,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
} from "lucide-react";

/**
 * دیتای ویژگی‌های طلایی فوتر (فیچربار)
 */
interface FooterFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FOOTER_FEATURES: FooterFeature[] = [
  {
    id: "express-delivery",
    title: "تحویل اکسپرس",
    subtitle: "ارسال سریع به سراسر کشور",
    icon: Truck,
  },
  {
    id: "support-24-7",
    title: "پشتیبانی ۲۴ ساعته",
    subtitle: "۷ روز هفته پاسخگوییم",
    icon: Headset,
  },
  {
    id: "special-discounts",
    title: "تخفیف‌های ویژه",
    subtitle: "بهترین قیمت بازار الکتریک",
    icon: BadgePercent,
  },
  {
    id: "authenticity-guarantee",
    title: "ضمانت اصالت",
    subtitle: "۱۰۰٪ کالای اورجینال و معتبر",
    icon: ShieldCheck,
  },
  {
    id: "secure-payment",
    title: "پرداخت امن",
    subtitle: "درگاه‌های رسمی و معتبر بانک",
    icon: CreditCard,
  },
];

/**
 * لینک‌های بخش دسترسی سریع
 */
const QUICK_LINKS = [
  { id: "home", title: "صفحه اصلی", href: "/" },
  { id: "offers", title: "تخفیف‌ها و پیشنهادها", href: "/offers" },
  { id: "blog", title: "وبلاگ اسمارت الکتریک", href: "/blog" },
  { id: "about", title: "درباره ما", href: "/about" },
  { id: "contact", title: "تماس با ما", href: "/contact" },
];

/**
 * کامپوننت فوتر کامل، مدرن و ریسپانسیو فروشگاه اسمارت الکتریک
 */
export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer
      dir="rtl"
      className="w-full border-t border-border bg-card/60 text-foreground transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        {/* =========================================================================
            ردیف اول: معرفی برند و دکمه بازگشت به بالا
            ========================================================================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
          {/* سمت راست: لوگو + عنوان بولد + متن معرفی طولانی */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center shrink-0">
                <Image
                  src="/images/brand/logo.png"
                  alt="فروشگاه اینترنتی اسمارت الکتریک"
                  width={140}
                  height={44}
                  priority
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </Link>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                فروشگاه اینترنتی اسمارت الکتریک
              </h2>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-4xl text-justify sm:text-right">
              فروشگاه اینترنتی اسمارت الکتریک، مرجع تخصصی تامین و توزیع تجهیزات برق صنعتی، ساختمانی، اتوماسیون و سیستم‌های نوین خانه هوشمند (BMS) است. ما با سال‌ها تجربه در بازار صنعت برق کشور و همکاری مستقیم با برترین برندهای داخلی و بین‌المللی، اصالت و کیفیت کالاهای عرضه‌شده را تضمین نموده و با ارائه مشاوره فنی مهندسی، سریع‌ترین و مطمئن‌ترین تجربه خرید آنلاین تجهیزات الکتریکی را برای همکاران، مهندسان و مصرف‌کنندگان گرامی به ارمغان می‌آوریم.
            </p>
          </div>

          {/* سمت چپ: دکمه کپسولی بازگشت به بالا */}
          <div className="w-full md:w-auto flex justify-end shrink-0">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 cursor-pointer"
            >
              <span>برو به بالا</span>
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            ردیف دوم: بنر ویژگی‌های طلایی (فیچربار ۵ گانه)
            ========================================================================= */}
        <div className="rounded-2xl border border-primary/10 bg-muted/30 p-4 sm:p-6 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {FOOTER_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="flex items-center gap-3.5 p-2 rounded-xl transition-colors hover:bg-accent/40"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 transition-transform hover:scale-105">
                    <IconComponent className="size-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {feature.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {feature.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            ردیف سوم: لینک‌های سریع و مجوزها / اینماد
            ========================================================================= */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pt-2">
          {/* سمت راست: بخش دسترسی سریع با نشانگر قرمز عمودی */}
          <div className="w-full md:w-auto text-right">
            <h3 className="border-r-4 border-primary pr-2.5 font-bold text-sm text-foreground mb-3 inline-block">
              دسترسی سریع
            </h3>
            <ul className="space-y-2 pr-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary py-0.5 group"
                  >
                    <ChevronLeft className="size-3 text-muted-foreground/60 transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* سمت چپ: باکس‌های مجوزها و تاییدیه‌ها (اینماد و ساماندهی) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <div className="text-xs text-muted-foreground mb-2 sm:mb-0 sm:ml-2">
              <span className="block font-semibold text-foreground">
                مجوزها و تاییدیه رسمی
              </span>
              <span className="text-[11px]">با اطمینان خرید کنید</span>
            </div>

            <div className="flex items-center gap-3">
              {/* باکس نماد اعتماد الکترونیکی */}
              <div
                title="نماد اعتماد الکترونیکی (اینماد)"
                className="group relative flex size-24 items-center justify-center rounded-xl border border-border bg-card p-2 shadow-xs transition-transform hover:scale-105"
              >
                <Image
                  src="/images/placeholders/enamad.png"
                  alt="نماد اعتماد الکترونیکی اینماد"
                  width={80}
                  height={80}
                  className="size-full object-contain"
                />
              </div>

              {/* باکس نشان ملی ثبت (ساماندهی) */}
              <div
                title="نشان ملی ثبت (ساماندهی)"
                className="group relative flex size-24 items-center justify-center rounded-xl border border-border bg-card p-2 shadow-xs transition-transform hover:scale-105"
              >
                <Image
                  src="/images/placeholders/samandehi.png"
                  alt="نشان ملی ثبت ساماندهی"
                  width={80}
                  height={80}
                  className="size-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ردیف چهارم: کپی‌رایت و امضای طراح
            ========================================================================= */}
        <div className="border-t border-border/80 pt-6 mt-8 space-y-2">
          {/* متن کپی‌رایت وسط‌چین */}
          <p className="text-center text-xs text-muted-foreground font-medium">
            تمامی حقوق مادی و معنوی این وب‌سایت برای فروشگاه اینترنتی اسمارت الکتریک محفوظ است.
          </p>

          {/* امضای طراح */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <span>طراحی و توسعه توسط</span>
            <span className="inline-block size-2 rounded-full bg-primary" />
            <a
              href="https://novalabs.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              تیم نوا لبز
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
export { Footer };

