"use client";

import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  ChevronDown,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  Navigation,
  ExternalLink,
  Compass,
  Building2,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useSubmitContact,
  CONTACT_SUBJECT_OPTIONS,
  normalizePhone,
  type ContactSubject,
} from "@/lib/api/contact";
import { ApiError } from "@/lib/api";

/**
 * شمای اعتبارسنجی فرم تماس با ما مطابق با قوانین بک‌اند
 */
const contactFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "لطفاً نام و نام خانوادگی خود را وارد کنید")
    .min(2, "نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام و نام خانوادگی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  phone: z
    .string()
    .min(1, "لطفاً شماره موبایل خود را وارد کنید")
    .refine((val) => /^09\d{9}$/.test(normalizePhone(val)), {
      message: "شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)",
    }),
  subject: z.enum(
    [
      "ORDER_ISSUE",
      "PAYMENT_ISSUE",
      "PRODUCT_QUESTION",
      "DELIVERY_ISSUE",
      "OTHER",
    ],
    {
      message: "موضوع پیام را انتخاب کنید",
    }
  ),
  message: z
    .string()
    .trim()
    .min(1, "لطفاً متن پیام خود را وارد کنید")
    .min(10, "متن پیام باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "متن پیام نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد"),
  website: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function ContactUsClient() {
  const { user } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitContactMutation = useSubmitContact();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      subject: undefined,
      message: "",
      website: "",
    },
    mode: "onTouched",
  });

  // مقداردهی اولیه فیلدها در صورت لاگین بودن کاربر
  useEffect(() => {
    if (user) {
      const currentName = getValues("fullName");
      const currentPhone = getValues("phone");
      if (!currentName && user.name) {
        setValue("fullName", user.name);
      }
      if (!currentPhone && user.phone) {
        setValue("phone", user.phone);
      }
    }
  }, [user, setValue, getValues]);

  // متغیرهای اطلاعات تماس و آدرس حضوری فروشگاه با مقادیر پیش‌فرض اسمارت الکتریک
  const shopPhone =
    process.env.NEXT_PUBLIC_SHOP_PHONE?.trim() || "۰۲۱-۹۱۰۱۵۵۵۵";
  const shopMobile =
    process.env.NEXT_PUBLIC_SHOP_MOBILE?.trim() || "۰۹۱۲۲۱۹۳۵۵۱";
  const shopAddress =
    process.env.NEXT_PUBLIC_SHOP_ADDRESS?.trim() ||
    "تهران، خیابان لاله‌زار جنوبی، کوچه باربد، پاساژ ادیسون، طبقه همکف، پلاک ۱۲";
  const shopWorkingHours =
    process.env.NEXT_PUBLIC_SHOP_WORKING_HOURS?.trim() ||
    "شنبه تا چهارشنبه ۹ الی ۱۸ | پنجشنبه‌ها ۹ الی ۱۴";
  const shopEmail =
    process.env.NEXT_PUBLIC_SHOP_EMAIL?.trim() || "info@smart-electric.ir";

  // پیوندهای مسیریابی با اپلیکیشن‌های نقشه
  const neshanUrl =
    process.env.NEXT_PUBLIC_SHOP_NESHAN_URL?.trim() ||
    "https://neshan.org/maps/@35.6912,51.4211,16z";
  const baladUrl =
    process.env.NEXT_PUBLIC_SHOP_BALAD_URL?.trim() ||
    "https://balad.ir/location?latitude=35.6912&longitude=51.4211";
  const googleMapsUrl =
    process.env.NEXT_PUBLIC_SHOP_MAP_URL?.trim() ||
    "https://www.google.com/maps/search/?api=1&query=35.6912,51.4211";

  // شمارشگر زنده کاراکترهای پیام
  const currentMessage = useWatch({ control, name: "message", defaultValue: "" }) || "";
  const messageLength = currentMessage.length;
  const isMessageTooLong = messageLength > 2000;

  const onSubmit = async (data: ContactFormData) => {
    setFormError(null);
    try {
      await submitContactMutation.mutateAsync({
        fullName: data.fullName,
        phone: normalizePhone(data.phone),
        subject: data.subject as ContactSubject,
        message: data.message,
        website: data.website,
      });

      setIsSuccess(true);
      toast.success("پیام شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.");
      reset({
        fullName: "",
        phone: "",
        subject: undefined,
        message: "",
        website: "",
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const msg = err.message || "اطلاعات ارسالی نامعتبر است. لطفاً ورودی‌ها را بررسی کنید.";
          setFormError(msg);
          toast.error(msg);
        } else if (err.status === 429) {
          const msg = "تعداد پیام‌های ارسالی شما بیش از حد مجاز است. لطفاً ساعتی دیگر مجدداً تلاش کنید.";
          setFormError(msg);
          toast.error(msg);
        } else {
          const msg = err.message || "خطایی در ثبت پیام رخ داد. لطفاً مجدداً تلاش کنید.";
          setFormError(msg);
          toast.error(msg);
        }
      } else {
        const msg = "خطای غیرمنتظره در برقراری ارتباط با سرور رخ داد. لطفاً اتصال اینترنت خود را بررسی کنید.";
        setFormError(msg);
        toast.error(msg);
      }
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setFormError(null);
    reset({
      fullName: user?.name || "",
      phone: user?.phone || "",
      subject: undefined,
      message: "",
      website: "",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* =========================================================================
          ستون اطلاعات تماس، آدرس حضوری و نقشه (۵ ستون در دسکتاپ)
          ========================================================================= */}
      <div className="lg:col-span-5 space-y-4">
        {/* کارت آدرس حضوری و فروشگاه */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Building2 className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-right">
              <span className="block text-xs font-bold text-muted-foreground">
                آدرس دفتر مرکزی و فروشگاه حضوری
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                {shopAddress}
              </p>
              <span className="block text-[11px] text-muted-foreground">
                امکان مراجعه حضوری و دریافت کالا در ساعات کاری رسمی
              </span>
            </div>
          </div>
        </div>

        {/* کارت تماس تلفنی و خطوط ویژه */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <PhoneCall className="size-5" />
            </div>
            <div className="space-y-2.5 flex-1">
              <span className="block text-xs font-bold text-muted-foreground text-right">
                تماس تلفنی و مشاوره تخصصی
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">تلفن دفتر مرکزی:</span>
                  <a
                    href={`tel:${shopPhone.replace(/[^0-9]/g, "")}`}
                    dir="ltr"
                    className="text-sm sm:text-base font-black text-foreground hover:text-primary transition-colors text-start"
                  >
                    {shopPhone}
                  </a>
                </div>
                {shopMobile && (
                  <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                    <span className="text-xs text-muted-foreground">پشتیبانی و همراه:</span>
                    <a
                      href={`tel:${shopMobile.replace(/[^0-9]/g, "")}`}
                      dir="ltr"
                      className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors text-start"
                    >
                      {shopMobile}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* کارت پست الکترونیک */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Mail className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-right">
              <span className="block text-xs font-bold text-muted-foreground">
                پست الکترونیک رسمی
              </span>
              <a
                href={`mailto:${shopEmail}`}
                dir="ltr"
                className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors block text-start"
              >
                {shopEmail}
              </a>
              <span className="block text-[11px] text-muted-foreground">
                ارسال استعلام بها، پیش‌فاکتور رسمی و مکاتبات سازمانی
              </span>
            </div>
          </div>
        </div>

        {/* کارت ساعات کاری */}
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
                {shopWorkingHours}
              </p>
              <span className="block text-[11px] text-muted-foreground">
                (ثبت سفارش و پاسخگویی آنلاین در تمام روزهای هفته فعال است)
              </span>
            </div>
          </div>
        </div>

        {/* بخش نقشه موقعیت مکانی و مسیریابی هوشمند */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                موقعیت مکانی فروشگاه روی نقشه
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <MapPin className="size-3 text-primary" />
              لاله‌زار جنوبی
            </span>
          </div>

          {/* نمای نقشه */}
          <div className="relative aspect-video w-full bg-muted/40 overflow-hidden">
            <iframe
              title="موقعیت مکانی فروشگاه اسمارت الکتریک روی نقشه"
              src="https://www.openstreetmap.org/export/embed.html?bbox=51.4170%2C35.6880%2C51.4250%2C35.6940&layer=mapnik&marker=35.6912%2C51.4211"
              className="w-full h-full border-0 grayscale-[15%] contrast-105"
              loading="lazy"
            />
          </div>

          {/* دکمه‌های مسیریابی با اپلیکیشن‌های محبوب */}
          <div className="p-3.5 bg-muted/20 border-t border-border/60 space-y-2">
            <span className="block text-[11px] font-semibold text-muted-foreground text-right">
              مسیریابی با اپلیکیشن‌های نقشه:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={neshanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-card/80 border border-border px-2 py-2 text-xs font-bold text-foreground shadow-xs transition-colors hover:text-primary hover:border-primary/40 text-center"
              >
                <Navigation className="size-3.5 text-primary shrink-0" />
                <span>نشان</span>
              </a>
              <a
                href={baladUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-card/80 border border-border px-2 py-2 text-xs font-bold text-foreground shadow-xs transition-colors hover:text-primary hover:border-primary/40 text-center"
              >
                <Compass className="size-3.5 text-primary shrink-0" />
                <span>بلد</span>
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-card/80 border border-border px-2 py-2 text-xs font-bold text-foreground shadow-xs transition-colors hover:text-primary hover:border-primary/40 text-center"
              >
                <ExternalLink className="size-3.5 text-primary shrink-0" />
                <span>گوگل مپس</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ستون فرم ارسال پیام (۷ ستون در دسکتاپ)
          ========================================================================= */}
      <div className="lg:col-span-7">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {isSuccess ? (
            /* وضعیت موفقیت ثبت پیام */
            <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  پیام شما با موفقیت ثبت شد
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  کارشناسان ما به زودی با شما تماس خواهند گرفت. از توجه و اعتماد شما به اسمارت الکتریک متشکریم.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                  <span>ارسال پیام جدید</span>
                </button>
              </div>
            </div>
          ) : (
            /* فرم ارسال پیام */
            <div>
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

              {formError && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 flex items-start gap-3 animate-in fade-in"
                >
                  <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-right flex-1">
                    <p className="text-xs sm:text-sm font-medium text-destructive leading-relaxed">
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* فیلد هانی‌پات (مخفی برای کاربران عادی و آشکار برای ربات‌ها) */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-0 h-0 w-0 opacity-0 pointer-events-none overflow-hidden select-none"
                  tabIndex={-1}
                >
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    {...register("website")}
                  />
                </div>

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
                        placeholder="مثال: علی رضایی"
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
                      <p role="alert" className="text-destructive text-xs mt-1 font-medium">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* فیلد شماره موبایل */}
                  <div className="space-y-1.5 text-right">
                    <label
                      htmlFor="phone"
                      className="block text-xs sm:text-sm font-medium text-foreground"
                    >
                      شماره موبایل <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        placeholder="09123456789"
                        {...register("phone")}
                        className={`w-full rounded-xl border bg-muted/30 pr-11 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all text-start font-mono tracking-wider focus:bg-background focus:ring-2 ${
                          errors.phone
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-input focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      <Phone className="pointer-events-none absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {errors.phone && (
                      <p role="alert" className="text-destructive text-xs mt-1 font-medium">
                        {errors.phone.message}
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
                        موضوع پیام را انتخاب کنید
                      </option>
                      {CONTACT_SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-foreground bg-card">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.subject && (
                    <p role="alert" className="text-destructive text-xs mt-1 font-medium">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* فیلد متن پیام با شمارشگر زنده */}
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="message"
                      className="block text-xs sm:text-sm font-medium text-foreground"
                    >
                      متن پیام یا شرح درخواست <span className="text-destructive">*</span>
                    </label>
                    <span
                      dir="ltr"
                      className={`text-xs font-mono ${
                        isMessageTooLong
                          ? "text-destructive font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {messageLength.toLocaleString("fa-IR")} / ۲۰۰۰ کاراکتر
                    </span>
                  </div>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="پیام، سوال یا شرح درخواست خود را اینجا بنویسید..."
                    {...register("message")}
                    className={`w-full rounded-xl border bg-muted/30 p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all resize-y min-h-[120px] focus:bg-background focus:ring-2 leading-relaxed ${
                      errors.message
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-input focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.message && (
                    <p role="alert" className="text-destructive text-xs mt-1 font-medium">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* دکمه ارسال پیام */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || submitContactMutation.isPending}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting || submitContactMutation.isPending ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
