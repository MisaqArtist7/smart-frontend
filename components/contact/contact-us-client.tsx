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
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useSubmitContact,
  CONTACT_SUBJECT_OPTIONS,
  normalizePhone,
  ApiError,
  type ContactSubject,
} from "@/lib/api/contact";

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

  // مقداردهی اولیه فیلدها در صورت ورود کاربر
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

  // متغیرهای محیطی اطلاعات تماس فروشگاه
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE?.trim();
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS?.trim();
  const shopWorkingHours = process.env.NEXT_PUBLIC_SHOP_WORKING_HOURS?.trim();
  const shopEmail = process.env.NEXT_PUBLIC_SHOP_EMAIL?.trim();

  const hasAnyContactInfo = Boolean(
    shopPhone || shopAddress || shopWorkingHours || shopEmail
  );

  // شمارشگر زنده کاراکترهای پیام با useWatch
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
      toast.success("پیام شما با موفقیت ثبت شد");
      reset({
        fullName: user?.name || "",
        phone: user?.phone || "",
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
          const msg = "تعداد پیام‌های ارسالی شما زیاد است. لطفاً کمی بعد دوباره تلاش کنید.";
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
          ستون اطلاعات تماس (خواندن پویا فقط از متغیرهای محیطی)
          ========================================================================= */}
      <div className="lg:col-span-5 space-y-4">
        {shopPhone && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <PhoneCall className="size-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="block text-xs font-bold text-muted-foreground">
                  تماس تلفنی و پشتیبانی
                </span>
                <a
                  href={`tel:${shopPhone}`}
                  dir="ltr"
                  className="text-base font-black text-foreground hover:text-primary transition-colors inline-block text-start"
                >
                  {shopPhone}
                </a>
              </div>
            </div>
          </div>
        )}

        {shopWorkingHours && (
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
              </div>
            </div>
          </div>
        )}

        {shopAddress && (
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
                  {shopAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {shopEmail && (
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
                  href={`mailto:${shopEmail}`}
                  dir="ltr"
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors block text-start"
                >
                  {shopEmail}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* پیام راهنما در صورت خالی بودن مقادیر تماس در محیط */}
        {!hasAnyContactInfo && (
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-5 text-right space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="size-4.5 text-primary" />
              <span className="text-xs font-bold text-foreground">
                ارتباط مستقیم با کارشناسان
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              برای پیگیری سفارشات، سوالات فنی یا پشتیبانی، فرم ارسال پیام را تکمیل کنید. کارشناسان ما در سریع‌ترین زمان ممکن پاسخگوی شما خواهند بود.
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          ستون فرم ارسال پیام
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
                  پیام شما ثبت شد
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  همکاران ما در اسرع وقت با شما تماس می‌گیرند. از توجه و اعتماد شما به اسمارت الکتریک متشکریم.
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
