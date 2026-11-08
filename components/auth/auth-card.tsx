"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Pencil,
  RotateCw,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OtpInput } from "./otp-input";
import { useAuth } from "@/components/providers/auth-provider";
import {
  requestOtp,
  verifyOtp,
  isValidIranPhone,
  normalizePhoneNumber,
  toEnglishDigits,
} from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/account-data";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export type AuthStep = "phone" | "otp";

interface AuthCardProps {
  initialTab?: string;
  initialStep?: AuthStep;
  redirectUrl?: string;
}

export function AuthCard({
  initialStep = "phone",
  redirectUrl = "/profile",
}: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // خواندن پارامترهای احتمالی از URL
  const queryStep = searchParams.get("step") as AuthStep | null;
  const queryPhone = searchParams.get("phone") || "";
  const queryRedirect = searchParams.get("redirect") || redirectUrl;

  const [step, setStep] = useState<AuthStep>(
    queryStep === "otp" || initialStep === "otp" ? "otp" : "phone"
  );

  // مقادیر فرم
  const [phone, setPhone] = useState<string>(queryPhone);
  const [name, setName] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  // استیت‌های لودینگ و خطا
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<boolean>(false);

  // کد تست محیط توسعه (devCode)
  const [devCode, setDevCode] = useState<string | null>(null);

  // تایمر ۶۰ ثانیه‌ای شمارش معکوس ارسال مجدد
  const [timer, setTimer] = useState<number>(60);

  const { loginSuccess, refreshUser } = useAuth();

  // مدیریت شمارش معکوس تایمر ۶۰ ثانیه‌ای
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // ----------------------------------------------------
  // مرحله اول: ارسال شماره موبایل و درخواست OTP
  // ----------------------------------------------------
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = normalizePhoneNumber(phone);

    if (!cleanPhone) {
      setErrorMessage("لطفاً شماره موبایل خود را وارد نمایید.");
      return;
    }

    if (!isValidIranPhone(cleanPhone)) {
      setErrorMessage("شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await requestOtp(cleanPhone);
      setIsNewUser(Boolean(res.isNewUser));
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep("otp");
      setTimer(60);
      setOtpCode("");
      setOtpError(false);
      toast.success(res.message || "کد تأیید ارسال گردید.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setErrorMessage("کمی صبر کنید. تعداد درخواست‌های ارسال پیامک بیش از حد مجاز است.");
          setTimer(60);
          toast.warning("کمی صبر کنید. لطفاً منتظر بمانید.");
          return;
        }
        setErrorMessage(err.message);
        toast.error(err.message);
      } else {
        const msg = "خطا در برقراری ارتباط با سرور. لطفاً مجدداً تلاش فرمایید.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // ارسال مجدد کد تأیید (Resend OTP) با تایمر ۶۰ ثانیه‌ای
  // ----------------------------------------------------
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setOtpError(false);

    try {
      const res = await requestOtp(phone);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setTimer(60);
      setOtpCode("");
      toast.success(res.message || "کد جدید با موفقیت ارسال شد.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage("کمی صبر کنید. تعداد درخواست‌های ارسال پیامک بیش از حد مجاز است.");
        setTimer(60);
        toast.warning("کمی صبر کنید. لطفاً منتظر بمانید.");
      } else {
        const msg = err instanceof Error ? err.message : "خطا در ارسال مجدد کد";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsResending(false);
    }
  };

  // ----------------------------------------------------
  // مرحله دوم: تأیید کد پیامکی و ورود نهایی
  // ارسال name تنها در صورتی که isNewUser باشد
  // ----------------------------------------------------
  const handleVerifyOtp = useCallback(
    async (codeToVerify?: string) => {
      const code = toEnglishDigits(codeToVerify || otpCode).trim();

      if (!code || code.length !== 6) {
        setErrorMessage("لطفاً کد تأیید ۶ رقمی را به صورت کامل وارد نمایید.");
        setOtpError(true);
        return;
      }

      // در صورت کاربر جدید، فیلد نام الزامی است (۲ تا ۱۰۰ کاراکتر)
      const cleanName = name.trim();
      if (isNewUser) {
        if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
          setErrorMessage("نام و نام خانوادگی الزامی است (بین ۲ تا ۱۰۰ کاراکتر).");
          return;
        }
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setOtpError(false);

      try {
        // فیلد name تنها و تنها در صورتی که isNewUser باشد ارسال می‌شود
        const res = await verifyOtp(
          phone,
          code,
          isNewUser ? cleanName : undefined
        );

        // واکشی مشخصات کامل و موثق کاربر از GET /auth/me
        let currentUser: User = res.user;
        try {
          const freshUser = await refreshUser();
          if (freshUser) {
            currentUser = freshUser;
          } else {
            loginSuccess(res.user);
          }
        } catch {
          loginSuccess(res.user);
        }

        toast.success(res.message || "ورود با موفقیت انجام شد!");

        // تعیین هوشمند مقصد ریدایرکت:
        // اگر ADMIN است -> /admin
        // در غیر این صورت -> queryRedirect معتبر یا /profile
        let destination = "/profile";
        if (currentUser.role === "ADMIN") {
          destination = "/admin";
        } else if (
          queryRedirect &&
          queryRedirect.startsWith("/") &&
          !queryRedirect.startsWith("//") &&
          !queryRedirect.startsWith("/admin")
        ) {
          destination = queryRedirect;
        }

        setTimeout(() => {
          router.push(destination);
        }, 300);
      } catch (err) {
        setOtpError(true);
        if (err instanceof ApiError) {
          if (err.status === 400) {
            setErrorMessage("کد تأیید وارد شده اشتباه یا منقضی شده است.");
            toast.error("کد تأیید اشتباه یا منقضی شده است.");
          } else if (err.status === 401) {
            setErrorMessage("کد تأیید نامعتبر است.");
            toast.error("کد تأیید نامعتبر است.");
          } else if (err.status === 403) {
            setErrorMessage("حساب کاربری شما مسدود یا غیرفعال است (دسترسی غیرمجاز ۴۰۳).");
            toast.error("حساب کاربری غیرفعال است.");
          } else if (err.status === 429) {
            setErrorMessage("کمی صبر کنید. تعداد درخواست‌های ناموفق بیش از حد مجاز است.");
            setTimer(60);
            toast.warning("کمی صبر کنید. لطفاً منتظر بمانید.");
          } else {
            setErrorMessage(err.message);
            toast.error(err.message);
          }
        } else {
          const msg = "خطای غیرمنتظره در تأیید کد. لطفاً دوباره تلاش کنید.";
          setErrorMessage(msg);
          toast.error(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isNewUser, loginSuccess, name, otpCode, phone, queryRedirect, refreshUser, router]
  );

  // درج خودکار کد تست محیط توسعه
  const handleAutoFillDevCode = () => {
    if (!devCode) return;
    setOtpCode(devCode);
    setOtpError(false);
    setErrorMessage(null);
    toast.success(`کد تستی ${devCode} درج شد.`);
  };

  // ویرایش شماره و بازگشت به مرحله اول
  const handleBackToPhone = () => {
    setStep("phone");
    setErrorMessage(null);
    setOtpError(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianDigits(mins.toString().padStart(2, "0"))}:${toPersianDigits(secs.toString().padStart(2, "0"))}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* کارت اصلی با تم سازگار با کل فروشگاه */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xs">
        {/* خط گرادیان ظریف بالای کارت */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

        {/* لوگو و عنوان برند اسمارت الکتریک */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-primary" />
            </div>
            <div className="text-right">
              <span className="font-extrabold text-lg text-foreground block leading-tight">
                اسمارت الکتریک
              </span>
              <span className="text-[11px] text-muted-foreground block">
                تجهیزات برق و شبکه هوشمند
              </span>
            </div>
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* مرحله اول: ورود / ثبت‌نام یکپارچه (Single Flow) */}
        {/* ------------------------------------------------------------------ */}
        {step === "phone" && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                ورود یا ثبت‌نام
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                لطفاً شماره موبایل خود را وارد نمایید تا کد تأیید برای شما ارسال شود.
              </p>
            </div>

            {/* آلرت پیام خطا */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* فرم ورود یکپارچه */}
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    شماره موبایل *
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    فرمت: ۰۹۱۲۳۴۵۶۷۸۹
                  </span>
                </label>
                <div className="relative">
                  <Input
                    required
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                    placeholder="09123456789"
                    maxLength={11}
                    className="h-11 rounded-xl text-sm font-mono text-center tracking-wider bg-background pl-10"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    +۹۸
                  </div>
                </div>
              </div>

              {/* دکمه ارسال */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ارسال کد تأیید...
                  </span>
                ) : (
                  "دریافت کد تأیید"
                )}
              </Button>
            </form>

            {/* پاورقی کارت */}
            <div className="mt-6 pt-5 border-t border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>احراز هویت امن و محافظت‌شده بر بستر پیامک</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* مرحله دوم: تأیید کد پیامکی (OTP) و فیلد نام برای کاربر جدید */}
        {/* ------------------------------------------------------------------ */}
        {step === "otp" && (
          <div className="space-y-5">
            {/* سربرگ تأیید کد */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                تأیید شماره موبایل
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                کد تأیید ۶ رقمی به شماره زیر ارسال گردید:
              </p>

              {/* نمایش شماره موبایل به همراه دکمه ویرایش */}
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/60 text-xs">
                <span className="font-mono font-bold text-foreground" dir="ltr">
                  {normalizePhoneNumber(phone)}
                </span>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  ویرایش شماره
                </button>
              </div>
            </div>

            {/* در صورت کاربر جدید: نمایش پیام و فیلد الزامی نام */}
            {isNewUser && (
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <UserIcon className="w-4 h-4" />
                  <span>تکمیل حساب کاربری جدید</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  شما کاربر جدید هستید. لطفاً نام و نام خانوادگی خود را وارد نمایید.
                </p>
                <Input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام و نام خانوادگی (مثال: علی رضایی)"
                  maxLength={100}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* جعبه کمکی محیط توسعه (DevCode Helper) */}
            {devCode && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>کد تستی محیط توسعه:</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
                    {devCode}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillDevCode}
                  className="w-full h-7 rounded-lg text-xs font-medium border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  درج خودکار کد تست ({devCode})
                </Button>
              </div>
            )}

            {/* آلرت پیام خطا */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ۶ باکس ورودی کد OTP */}
            <div className="space-y-2">
              <OtpInput
                length={6}
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  setOtpError(false);
                  setErrorMessage(null);
                }}
                onComplete={(code) => {
                  handleVerifyOtp(code);
                }}
                disabled={isSubmitting}
                hasError={otpError}
              />
            </div>

            {/* تایمر ارسال مجدد و دکمه درخواست مجدد کد */}
            <div className="text-center text-xs">
              {timer > 0 ? (
                <div className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>امکان ارسال مجدد کد پس از</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatTimer(timer)}
                  </span>
                  <span>دیگر</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={cn("w-3.5 h-3.5", isResending && "animate-spin")} />
                  {isResending ? "در حال ارسال..." : "ارسال مجدد کد پیامکی"}
                </button>
              )}
            </div>

            {/* دکمه تأیید و ورود نهایی */}
            <Button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isSubmitting || otpCode.length !== 6 || (isNewUser && name.trim().length < 2)}
              className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال بررسی و ورود...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  تأیید و ورود به سایت
                </span>
              )}
            </Button>

            {/* بازگشت به مرحله قبل */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                تغییر شماره موبایل
              </button>
            </div>
          </div>
        )}
      </div>

      {/* بازگشت به صفحه اصلی فروشگاه */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          بازگشت به صفحه اصلی فروشگاه
        </Link>
      </div>
    </div>
  );
}
