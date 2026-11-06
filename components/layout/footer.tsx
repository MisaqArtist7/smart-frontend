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
  PhoneCall,
  MapPin,
  Clock,
} from "lucide-react";

/**
 * دیتای ویژگی‌های طلایی فوتر (فیچربار ۵ گانه)
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
  { id: "products", title: "فروشگاه و محصولات", href: "/products" },
  { id: "offers", title: "پیشنهادهای شگفت‌انگیز", href: "/products" },
  { id: "about", title: "درباره اسمارت الکتریک", href: "/about-us" },
  { id: "contact", title: "تماس با ما", href: "/contact-us" },
];

/**
 * لینک‌های بخش خدمات مشتریان
 */
const CUSTOMER_SERVICES = [
  { id: "faq", title: "پرسش‌های متداول", href: "/#faq" },
  { id: "order-track", title: "پیگیری سفارش‌ها", href: "/profile/orders" },
  { id: "guarantee", title: "شرایط گارانتی و اصالت", href: "/about-us" },
  { id: "privacy", title: "قوانین و حریم خصوصی", href: "/about-us" },
];

/**
 * لینک‌های بخش خرید سازمانی و پروژه‌ای B2B
 */
const B2B_LINKS = [
  { id: "b2b-invoice", title: "درخواست پیش‌فاکتور رسمی", href: "/contact-us" },
  { id: "bulk-discount", title: "تخفیف همکاری و خرید عمده", href: "/contact-us" },
  { id: "project-supply", title: "تجهیز پروژه‌های صنعتی", href: "/contact-us" },
  { id: "consultation", title: "مشاوره فنی رایگان", href: "tel:09122193551" },
];

/**
 * کامپوننت فوتر فول‌وید (Full-Width)، مدرن و ریسپانسیو فروشگاه اسمارت الکتریک
 * هماهنگ با عرض کامل هدر و پدینگ‌های واکنش‌گرا
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
      className="w-full border-t border-border bg-card/70 text-foreground transition-colors"
    >
      {/* کانتینر فول‌وید هماهنگ با هدر (بدون محدودیت max-w-7xl) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        {/* =========================================================================
            ردیف اول: معرفی برند و دکمه بازگشت به بالا
            ========================================================================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
          {/* سمت راست: لوگو + عنوان بولد + متن معرفی */}
          <div className="space-y-3 flex-1">
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
            <p className="text-muted-foreground text-xs leading-relaxed max-w-5xl text-justify sm:text-right">
              فروشگاه اینترنتی اسمارت الکتریک، مرجع تخصصی تامین و توزیع تجهیزات برق صنعتی، ساختمانی، اتوماسیون، سوئیچ‌های شبکه PoE و سیستم‌های نوین خانه هوشمند (BMS) است. ما با سال‌ها تجربه در بازار صنعت برق کشور و همکاری مستقیم با برترین برندهای داخلی و بین‌المللی، اصالت و کیفیت کالاهای عرضه‌شده را تضمین نموده و با ارائه مشاوره فنی مهندسی، سریع‌ترین و مطمئن‌ترین تجربه خرید آنلاین تجهیزات الکتریکی را برای همکاران، مهندسان و مصرف‌کنندگان گرامی به ارمغان می‌آوریم.
            </p>
          </div>

          {/* سمت چپ: دکمه کپسولی بازگشت به بالا */}
          <div className="w-full md:w-auto flex justify-end shrink-0">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-xs transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 cursor-pointer"
            >
              <span>برو به بالا</span>
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            ردیف دوم: بنر ویژگی‌های طلایی (فیچربار ۵ گانه فول‌وید)
            ========================================================================= */}
        <div className="w-full rounded-2xl border border-primary/10 bg-muted/30 p-4 sm:p-6 transition-colors">
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
            ردیف سوم: ۵ ستون کامل (لینک‌ها، خدمات، B2B، تماس و مجوزها)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pt-2">
          {/* ستون ۱: دسترسی سریع */}
          <div className="text-right">
            <h3 className="border-r-4 border-primary pr-2.5 font-bold text-sm text-foreground mb-4 inline-block">
              دسترسی سریع
            </h3>
            <ul className="space-y-2.5 pr-1">
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

          {/* ستون ۲: خدمات مشتریان */}
          <div className="text-right">
            <h3 className="border-r-4 border-primary pr-2.5 font-bold text-sm text-foreground mb-4 inline-block">
              خدمات مشتریان
            </h3>
            <ul className="space-y-2.5 pr-1">
              {CUSTOMER_SERVICES.map((link) => (
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

          {/* ستون ۳: خرید سازمانی و B2B */}
          <div className="text-right">
            <h3 className="border-r-4 border-primary pr-2.5 font-bold text-sm text-foreground mb-4 inline-block">
              پروژه‌ها و خرید عمده
            </h3>
            <ul className="space-y-2.5 pr-1">
              {B2B_LINKS.map((link) => (
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

          {/* ستون ۴: اطلاعات تماس و دفتر پخش */}
          <div className="text-right space-y-3">
            <h3 className="border-r-4 border-primary pr-2.5 font-bold text-sm text-foreground mb-4 inline-block">
              ارتباط با ما
            </h3>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <a
                href="tel:09122193551"
                className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
              >
                <PhoneCall className="size-4 text-primary shrink-0" />
                <span dir="ltr">۰۹۱۲ ۲۱۹ ۳۵۵۱</span>
              </a>

              <div className="flex items-start gap-2 leading-relaxed">
                <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                <span>شنبه تا چهارشنبه ۹ الی ۱۸ | پنج‌شنبه‌ها ۹ الی ۱۴</span>
              </div>

              <div className="flex items-start gap-2 leading-relaxed">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <span>تهران، خیابان لاله‌زار جنوبی، پاساژ صنعت، پلاک ۲۴</span>
              </div>
            </div>
          </div>

          {/* ستون ۵: باکس‌های مجوزها و تاییدیه‌ها (اینماد و ساماندهی) */}
          <div className="flex flex-col items-start sm:items-end lg:items-start text-right">
            <div className="text-xs text-muted-foreground mb-3">
              <span className="block font-semibold text-foreground">
                مجوزها و تاییدیه رسمی
              </span>
              <span className="text-[11px]">با اطمینان خرید کنید</span>
            </div>

            <div className="flex items-center gap-3">
              {/* باکس نماد اعتماد الکترونیکی */}
              <div
                title="نماد اعتماد الکترونیکی (اینماد)"
                className="group relative flex size-24 items-center justify-center rounded-2xl border border-border bg-card p-2 shadow-xs transition-transform hover:scale-105"
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
                className="group relative flex size-24 items-center justify-center rounded-2xl border border-border bg-card p-2 shadow-xs transition-transform hover:scale-105"
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
