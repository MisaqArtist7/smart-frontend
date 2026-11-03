"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { KeyRound, Phone, Loader2, ArrowRight } from "lucide-react";

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
const toEnglishDigits = (str: string): string => {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

const requestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "لطفاً شماره موبایل خود را وارد نمایید")
    .regex(/^09[0-9]{9}$/, "شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)"),
});

type RequestOtpFormData = z.infer<typeof requestOtpSchema>;

function RequestOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      phoneNumber: initialPhone,
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: RequestOtpFormData) => {
    try {
      setIsLoading(true);
      // شبیه‌سازی ارسال کد پیامکی توسط سرویس OTP
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push(`/verify-otp?phone=${encodeURIComponent(data.phoneNumber)}`);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5 transition-all">
      {/* دکمه بازگشت و لوگو */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
        >
          <ArrowRight className="size-4" />
          <span>بازگشت</span>
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center focus:outline-none transition-transform hover:scale-105"
        >
          <Image
            src="/images/brand/logo.png"
            alt="اسمارت الکتریک"
            width={130}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
        <div className="w-10" />
      </div>

      {/* هدر کارت */}
      <div className="mb-6 space-y-1.5 text-right">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            ورود با کد یکبار مصرف
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pr-11">
          شماره موبایل خود را وارد کنید تا کد تایید یکبار مصرف برای شما پیامک شود.
        </p>
      </div>

      {/* فرم دریافت شماره جهت ارسال OTP */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  const cleaned = toEnglishDigits(e.target.value.trim());
                  setValue("phoneNumber", cleaned, { shouldValidate: true });
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

        {/* دکمه ارسال پیامک */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4.5 animate-spin" />
                <span>در حال ارسال پیامک...</span>
              </>
            ) : (
              <span>دریافت کد تایید (پیامک)</span>
            )}
          </button>
        </div>

        {/* لینک‌های کمکی */}
        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border mt-4">
          <Link
            href="/login"
            className="hover:text-primary transition-colors font-medium"
          >
            ورود با کلمه عبور
          </Link>
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            ثبت‌نام حساب جدید
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function RequestOtpPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-muted/20 flex flex-col items-center justify-center p-4 transition-colors"
    >
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-12 text-center shadow-xl">
            <Loader2 className="size-6 animate-spin mx-auto text-primary" />
          </div>
        }
      >
        <RequestOtpContent />
      </Suspense>

      {/* متن قوانین و شرایط در زیر کارت */}
      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        با ورود به سایت، تمامی{" "}
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
