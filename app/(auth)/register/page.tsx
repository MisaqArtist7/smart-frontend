"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, User, Phone, Loader2, CheckCircle2 } from "lucide-react";

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی جهت پردازش صحیح اعتبارسنجی
 */
const toEnglishDigits = (str: string): string => {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

/**
 * شمای اعتبارسنجی فرم ثبت‌نام با Zod
 */
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "لطفاً نام و نام خانوادگی را وارد کنید")
    .min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  phoneNumber: z
    .string()
    .min(1, "لطفاً شماره موبایل را وارد کنید")
    .regex(/^09[0-9]{9}$/, "شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // شبیه‌سازی فراخوانی API احراز هویت / ثبت‌نام
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSuccess(true);

      // انتقال به صفحه ورود یا اعتبارسنجی OTP پس از ثبت موفق
      setTimeout(() => {
        router.push(`/verify-otp?phone=${encodeURIComponent(data.phoneNumber)}`);
      }, 1500);
    } catch {
      // در صورت وقوع خطا
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-muted/20 flex flex-col items-center justify-center p-4 transition-colors"
    >
      {/* کارت فرم ثبت‌نام */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5 transition-all">
        {/* لوگو برند در بالای کارت */}
        <div className="flex justify-center mb-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 focus:outline-none transition-transform hover:scale-105"
          >
            <Image
              src="/images/brand/logo.png"
              alt="اسمارت الکتریک"
              width={140}
              height={44}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>
        </div>

        {/* هدر کارت: عنوان و لینک ورود */}
        <div className="mb-6 space-y-1.5 text-right">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              عضویت در سایت
            </h1>
          </div>
          <p className="text-sm text-muted-foreground pr-11">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline transition-colors"
            >
              وارد شوید
            </Link>
          </p>
        </div>

        {/* فرم ثبت‌نام */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              ثبت‌نام با موفقیت انجام شد
            </h2>
            <p className="text-xs text-muted-foreground">
              در حال انتقال به صفحه تایید شماره موبایل...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* فیلد نام و نام خانوادگی */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="fullName"
                className="block text-xs sm:text-sm font-medium text-foreground"
              >
                نام و نام خانوادگی
              </label>
              <div className="relative flex items-center">
                <input
                  id="fullName"
                  type="text"
                  placeholder="مثال: محمد امینی"
                  {...register("fullName")}
                  className={`w-full rounded-xl border bg-muted/30 pr-11 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:ring-2 ${
                    errors.fullName
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-input focus:border-primary focus:ring-primary/20"
                  }`}
                />
                <User className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
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
                شماره موبایل
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
                  className={`w-full rounded-xl border bg-muted/30 pr-11 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all text-left font-mono tracking-wider focus:bg-background focus:ring-2 ${
                    errors.phoneNumber
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-input focus:border-primary focus:ring-primary/20"
                  }`}
                />
                <Phone className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.phoneNumber && (
                <p className="text-destructive text-xs mt-1 font-medium">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* دکمه ارسال فرم */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin" />
                    <span>در حال ایجاد حساب...</span>
                  </>
                ) : (
                  <span>ثبت نام و ایجاد حساب</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* متن قوانین و شرایط در زیر کارت */}
      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        با عضویت در سایت، تمامی{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          قوانین و شرایط
        </Link>{" "}
        استفاده از خدمات{" "}
        <span className="text-primary font-semibold">اسمارت الکتریک</span> را
        پذیرفته‌اید.
      </p>
    </div>
  );
}
