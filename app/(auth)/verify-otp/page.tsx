"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  RotateCw,
  Loader2,
  CheckCircle2,
  Pencil,
  ArrowRight,
} from "lucide-react";

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
const toEnglishDigits = (str: string): string => {
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

const OTP_LENGTH = 5;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "۰۹۱۲۳۴۵۶۷۸۹";

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState<number>(120);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // مدیریت تایمر شمارش معکوس جهت ارسال مجدد کد
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // فوکوس خودکار روی خانه اول پس از بارگذاری
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage("");
    const cleaned = toEnglishDigits(value);

    // اگر کاربر متنی چند رقمی پیست کند
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // حالت تایپ تک رقمی
    if (/^[0-9]?$/.test(cleaned)) {
      const newOtp = [...otp];
      newOtp[index] = cleaned;
      setOtp(newOtp);

      if (cleaned && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    setTimer(120);
    setErrorMessage("");
    // شبیه‌سازی ارسال مجدد کد
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otp.join("");

    if (fullCode.length < OTP_LENGTH) {
      setErrorMessage("لطفاً کد تایید ۵ رقمی را کامل وارد کنید");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      // شبیه‌سازی اعتبارسنجی کد ارسالی
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // بررسی فرضی (هر کد ۵ رقمی صحیح تلقی می‌شود)
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch {
      setIsSubmitting(false);
      setErrorMessage("کد تایید وارد شده نامعتبر یا منقضی شده است");
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5 transition-all">
      {/* دکمه بازگشت و لوگو */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/request-otp?phone=${encodeURIComponent(phone)}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
        >
          <ArrowRight className="size-4" />
          <span>ویرایش شماره</span>
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
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            تایید شماره موبایل
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground pr-11">
          <span>کد ارسال شده به شماره</span>
          <span dir="ltr" className="font-mono font-bold text-foreground">
            {phone}
          </span>
          <Link
            href={`/request-otp?phone=${encodeURIComponent(phone)}`}
            title="ویرایش شماره"
            className="text-primary hover:opacity-80 p-0.5 inline-flex"
          >
            <Pencil className="size-3.5" />
          </Link>
        </div>
      </div>

      {isSuccess ? (
        <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            شماره موبایل با موفقیت تایید شد
          </h2>
          <p className="text-xs text-muted-foreground">
            در حال انتقال به صفحه اصلی...
          </p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          {/* خانه‌های ورودی سگمنتال کد OTP */}
          <div className="space-y-2">
            <div dir="ltr" className="flex items-center justify-center gap-2.5 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`size-12 sm:size-13 rounded-xl border bg-muted/30 text-center font-mono text-xl font-bold text-foreground outline-none transition-all focus:bg-background focus:ring-2 ${
                    errorMessage
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-input focus:border-primary focus:ring-primary/20"
                  }`}
                />
              ))}
            </div>
            {errorMessage && (
              <p className="text-destructive text-xs text-center font-medium mt-2">
                {errorMessage}
              </p>
            )}
          </div>

          {/* شمارش معکوس و ارسال مجدد کد */}
          <div className="flex items-center justify-center text-xs">
            {timer > 0 ? (
              <span className="text-muted-foreground">
                ارسال مجدد کد تا{" "}
                <span dir="ltr" className="font-mono font-bold text-foreground">
                  {formatTimer(timer)}
                </span>{" "}
                دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                className="group flex items-center gap-1.5 text-primary font-semibold hover:underline cursor-pointer focus:outline-none"
              >
                <RotateCw className="size-3.5 group-hover:rotate-180 transition-transform duration-500" />
                <span>ارسال مجدد کد تایید</span>
              </button>
            )}
          </div>

          {/* دکمه تایید نهایی */}
          <button
            type="submit"
            disabled={isSubmitting || otp.some((d) => !d)}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4.5 animate-spin" />
                <span>در حال بررسی کد...</span>
              </>
            ) : (
              <span>تایید و ورود</span>
            )}
          </button>

          {/* بازگشت به ورود با رمز عبور */}
          <div className="pt-2 text-center border-t border-border">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              ورود با نام کاربری و کلمه عبور
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function VerifyOtpPage() {
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
        <VerifyOtpContent />
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
