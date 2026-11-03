"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PhoneCall,
  Clock,
  MapPin,
  Mail,
  User,
  Phone,
  Send,
  CheckCircle2,
  Loader2,
  Navigation,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
const toEnglishDigits = (str: string): string => {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

/**
 * گزینه‌های موضوع پیام
 */
const SUBJECT_OPTIONS = [
  { value: "technical-consulting", label: "مشاوره فنی و انتخاب کالا" },
  { value: "order-tracking", label: "پیگیری سفارش و مرسوله" },
  { value: "project-wholesale", label: "همکاری در پروژه‌ها و خرید عمده" },
  { value: "warranty-services", label: "خدمات پس از فروش و گارانتی" },
  { value: "feedback", label: "انتقادات و پیشنهادات" },
  { value: "other", label: "سایر موضوعات" },
];

/**
 * شمای اعتبارسنجی فرم تماس با ما با Zod
 */
const contactSchema = z.object({
  fullName: z
    .string()
    .min(1, "لطفاً نام و نام خانوادگی خود را وارد کنید")
    .min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  phoneNumber: z
    .string()
    .min(1, "لطفاً شماره موبایل خود را وارد کنید")
    .regex(/^09[0-9]{9}$/, "شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)"),
  subject: z
    .string()
    .min(1, "لطفاً موضوع پیام را انتخاب کنید"),
  message: z
    .string()
    .min(1, "لطفاً متن پیام خود را بنویسید")
    .min(10, "متن پیام باید حداقل ۱۰ کاراکتر باشد"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactUsPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      subject: "",
      message: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (_data: ContactFormData) => {
    void _data;
    try {
      // شبیه‌سازی ارسال فرم به بک‌اند
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSuccess(true);
      reset();
    } catch {
      // مدیریت خطای احتمالی
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* هدر فروشگاه */}
      <Header cartCount={3} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* نوار ناوبری متنی (Breadcrumb) */}
        <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            خانه
          </Link>
          <ChevronLeft className="size-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium">تماس با ما</span>
        </nav>

        {/* ۱. بخش هدر صفحه */}
        <div className="mb-10 space-y-2 border-b border-border/60 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            پشتیبانی و ارتباط مستقیم
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            تماس با ما
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            تیم کارشناسان فنی و پشتیبانی اسمارت الکتریک آماده پاسخگویی به پرسش‌ها، ارائه مشاوره تخصصی خرید تجهیزات الکتریکی و پیگیری سفارش‌های شما هستند.
          </p>
        </div>

        {/* ۲ ستون چیدمان کلی: اطلاعات تماس و نقشه در راست، فرم پیام در چپ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              ستون اطلاعات تماس، آدرس و نقشه (سمت راست در RTL - ۵ ستون)
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* کارت تماس تلفنی */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <PhoneCall className="size-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    تماس تلفنی و مشاوره
                  </span>
                  <div className="flex flex-col gap-1">
                    <a
                      href="tel:09122193551"
                      dir="ltr"
                      className="text-base font-black text-foreground hover:text-primary transition-colors inline-block w-fit"
                    >
                      ۰۹۱۲۲۱۹۳۵۵۱
                    </a>
                    <a
                      href="tel:02191015555"
                      dir="ltr"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-block w-fit"
                    >
                      ۰۲۱-۹۱۰۱۵۵۵۵ (خط ویژه دفتر مرکزی)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* کارت ساعت کاری */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Clock className="size-5" />
                </div>
                <div className="space-y-1 flex-1 text-right">
                  <span className="block text-xs font-bold text-muted-foreground">
                    ساعات کاری و پاسخگویی
                  </span>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    شنبه تا چهارشنبه ۹ الی ۱۸ | پنجشنبه‌ها ۹ الی ۱۴
                  </p>
                  <span className="block text-[11px] text-muted-foreground">
                    (پاسخگویی آنلاین در روزهای تعطیل فعال است)
                  </span>
                </div>
              </div>
            </div>

            {/* کارت آدرس حضوری */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div className="space-y-1 flex-1 text-right">
                  <span className="block text-xs font-bold text-muted-foreground">
                    آدرس دفتر مرکزی و فروشگاه
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                    تهران، خیابان لاله‌زار جنوبی، کوچه باربد، پاساژ ادیسون، طبقه همکف، پلاک ۱۲
                  </p>
                </div>
              </div>
            </div>

            {/* کارت ایمیل پشتیبانی */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Mail className="size-5" />
                </div>
                <div className="space-y-1 flex-1 text-right">
                  <span className="block text-xs font-bold text-muted-foreground">
                    پست الکترونیک رسمی
                  </span>
                  <a
                    href="mailto:info@smart-electric.ir"
                    dir="ltr"
                    className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors block w-fit"
                  >
                    info@smart-electric.ir
                  </a>
                </div>
              </div>
            </div>

            {/* باکس نقشه موقعیت مکانی با دکمه‌های مسیریابی */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="relative aspect-video w-full bg-muted/50 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
                {/* پس‌زمینه گرافیکی نقشه با طرح انتزاعی */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="size-full border border-border bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                {/* پین مرکزی موقعیت مکانی */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute size-10 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <MapPin className="size-5" />
                    </div>
                  </div>
                </div>

                {/* برچسب لوکیشن در بالای نقشه */}
                <div className="relative z-10 self-start">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-foreground border border-border shadow-xs">
                    <MapPin className="size-3 text-primary" />
                    لاله‌زار جنوبی، پاساژ ادیسون
                  </span>
                </div>

                {/* دکمه‌های مسیریابی با نشان و گوگل مپس در پایین نقشه */}
                <div className="relative z-10 flex items-center gap-2 pt-2">
                  <a
                    href="https://neshan.org/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-card/95 hover:bg-card border border-border px-3 py-2 text-xs font-bold text-foreground shadow-xs transition-colors hover:text-primary"
                  >
                    <Navigation className="size-3.5 text-primary" />
                    <span>مسیریابی با نشان</span>
                  </a>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-card/95 hover:bg-card border border-border px-3 py-2 text-xs font-bold text-foreground shadow-xs transition-colors hover:text-primary"
                  >
                    <ExternalLink className="size-3.5 text-primary" />
                    <span>گوگل مپس</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ستون فرم ارسال پیام (سمت چپ در RTL - ۷ ستون)
              ========================================================================= */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6 space-y-1.5 text-right">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquare className="size-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    ارسال پیام مستقیم
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground pr-11 leading-relaxed">
                  فرم زیر را تکمیل کنید؛ کارشناسان فنی ما در کوتاه‌ترین زمان پس از بررسی پیام، با شما تماس خواهند گرفت.
                </p>
              </div>

              {/* بازخورد موفقیت ارسال پیام */}
              {isSuccess && (
                <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-right">
                    <h3 className="text-sm font-bold text-foreground">
                      پیام شما با موفقیت ثبت شد
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      از ارتباط شما با اسمارت الکتریک سپاسگزاریم. کارشناسان ما به زودی با شماره تماس شما ارتباط برقرار خواهند کرد.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* ردیف دوتایی: نام و نام خانوادگی + شماره موبایل */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* فیلد نام و نام خانوادگی */}
                  <div className="space-y-1.5 text-right">
                    <label
                      htmlFor="fullName"
                      className="block text-xs sm:text-sm font-medium text-foreground"
                    >
                      نام و نام خانوادگی <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="fullName"
                        type="text"
                        placeholder="مثال: علی کریمی"
                        {...register("fullName")}
                        className={`w-full rounded-xl border bg-muted/30 pr-11 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:ring-2 ${
                          errors.fullName
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-input focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      <User className="pointer-events-none absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1 font-medium">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* فیلد شماره موبایل */}
                  <div className="space-y-1.5 text-right">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-xs sm:text-sm font-medium text-foreground"
                    >
                      شماره موبایل <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder="09123456789"
                        {...register("phoneNumber", {
                          onChange: (e) => {
                            const converted = toEnglishDigits(e.target.value.trim());
                            setValue("phoneNumber", converted, { shouldValidate: true });
                          },
                        })}
                        className={`w-full rounded-xl border bg-muted/30 pr-11 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all text-left font-mono tracking-wider focus:bg-background focus:ring-2 ${
                          errors.phoneNumber
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-input focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      <Phone className="pointer-events-none absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-destructive text-xs mt-1 font-medium">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* فیلد موضوع پیام */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="subject"
                    className="block text-xs sm:text-sm font-medium text-foreground"
                  >
                    موضوع پیام <span className="text-destructive">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="subject"
                      {...register("subject")}
                      defaultValue=""
                      className={`w-full appearance-none rounded-xl border bg-muted/30 pr-4 pl-10 py-2.5 text-sm text-foreground outline-none transition-all focus:bg-background focus:ring-2 cursor-pointer ${
                        errors.subject
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-input focus:border-primary focus:ring-primary/20"
                      }`}
                    >
                      <option value="" disabled className="text-muted-foreground">
                        لطفاً یک موضوع انتخاب کنید...
                      </option>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.label} className="text-foreground bg-card">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.subject && (
                    <p className="text-destructive text-xs mt-1 font-medium">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* فیلد متن پیام */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="message"
                    className="block text-xs sm:text-sm font-medium text-foreground"
                  >
                    متن پیام یا شرح درخواست <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="پیام، سوال یا شرح پروژه الکتریکی خود را اینجا بنویسید..."
                    {...register("message")}
                    className={`w-full rounded-xl border bg-muted/30 p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all resize-y min-h-[120px] focus:bg-background focus:ring-2 leading-relaxed ${
                      errors.message
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-input focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-destructive text-xs mt-1 font-medium">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* دکمه ارسال پیام */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4.5 animate-spin" />
                        <span>در حال ارسال پیام...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>ثبت و ارسال پیام</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* فوتر فروشگاه */}
      <Footer />
    </div>
  );
}
