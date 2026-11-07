"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  Pencil,
  RotateCw,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
  KeyRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OtpInput } from "./otp-input";
import { useAccountStore } from "@/lib/account-store";
import {
  registerUser,
  loginUser,
  resendOtp,
  verifyOtp,
  isValidIranPhone,
  normalizePhoneNumber,
  toEnglishDigits,
  AuthApiError,
} from "@/lib/auth-api";
import { toPersianDigits } from "@/lib/account-data";
import { cn } from "@/lib/utils";

export type AuthTab = "login" | "register";
export type AuthStep = "phone" | "otp";

interface AuthCardProps {
  initialTab?: AuthTab;
  initialStep?: AuthStep;
  redirectUrl?: string;
}

export function AuthCard({
  initialTab = "login",
  initialStep = "phone",
  redirectUrl = "/profile",
}: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // خواندن پارامترهای احتمالی از URL
  const queryTab = searchParams.get("tab") as AuthTab | null;
  const queryStep = searchParams.get("step") as AuthStep | null;
  const queryPhone = searchParams.get("phone") || "";
  const queryRedirect = searchParams.get("redirect") || redirectUrl;

  const [activeTab, setActiveTab] = useState<AuthTab>(queryTab || initialTab);
  const [step, setStep] = useState<AuthStep>(
    queryStep === "otp" || initialStep === "otp" ? "otp" : "phone"
  );

  // مقادیر فرم
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>(queryPhone);
  const [otpCode, setOtpCode] = useState<string>("");

  // استیت‌های لودینگ و خطا
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<boolean>(false);

  // پیام پیشنهادی هوشمند (در صورت 409 یا 404)
  const [smartSuggestion, setSmartSuggestion] = useState<{
    type: "switch-to-login" | "switch-to-register";
    message: string;
  } | null>(null);

  // کد تست محیط توسعه (devCode)
  const [devCode, setDevCode] = useState<string | null>(null);

  // تایمر ۶۰ ثانیه‌ای ارسال مجدد
  const [timer, setTimer] = useState<number>(60);

  const { setAuthUser } = useAccountStore();

  // مدیریت شمارش معکوس تایمر
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // تغییر تب و پاک کردن خطاهای قبلی
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSmartSuggestion(null);
  };

  // ارسال فرم مرحله اول (ثبت‌نام یا ورود)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSmartSuggestion(null);

    const cleanPhone = normalizePhoneNumber(phone);

    // اعتبارسنجی سمت کلاینت
    if (!cleanPhone) {
      setErrorMessage("لطفاً شماره موبایل خود را وارد نمایید.");
      return;
    }

    if (!isValidIranPhone(cleanPhone)) {
      setErrorMessage("شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }

    if (activeTab === "register") {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage("نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "register") {
        const res = await registerUser(name, cleanPhone);
        toast.success(res.message || "کد تأیید ارسال گردید");
        if (res.devCode) {
          setDevCode(res.devCode);
        }
      } else {
        const res = await loginUser(cleanPhone);
        toast.success(res.message || "کد تأیید ارسال گردید");
        if (res.devCode) {
          setDevCode(res.devCode);
        }
      }

      // رفتن به مرحله دوم (OTP)
      setStep("otp");
      setTimer(60);
      setOtpCode("");
      setOtpError(false);
    } catch (err) {
      if (err instanceof AuthApiError) {
        // مدیریت هوشمند خطای ۴۰۹ (ثبت‌نام با شماره تکراری)
        if (err.statusCode === 409) {
          setErrorMessage(err.message);
          setSmartSuggestion({
            type: "switch-to-login",
            message: "شماره شما قبلاً ثبت شده است. مایلید وارد شوید؟",
          });
          toast.info("این شماره قبلاً ثبت شده است. لطفاً وارد شوید.");
          return;
        }

        // مدیریت هوشمند خطای ۴۰۴ (ورود با شماره ثبت‌نشده)
        if (err.statusCode === 404) {
          setErrorMessage(err.message);
          setSmartSuggestion({
            type: "switch-to-register",
            message: "این شماره هنوز ثبت‌نام نشده است. مایلید ثبت‌نام کنید؟",
          });
          toast.info("کاربری با این شماره یافت نشد. لطفاً ثبت‌نام کنید.");
          return;
        }

        setErrorMessage(err.message);
        toast.error(err.message);
      } else {
        const msg = "خطای غیرمنتظره در برقراری ارتباط با سرور. لطفاً مجدداً تلاش فرمایید.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ارسال مجدد کد تأیید (Resend OTP)
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setOtpError(false);

    try {
      const res = await resendOtp(phone);
      toast.success(res.message || "کد جدید با موفقیت ارسال شد");
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setTimer(60);
      setOtpCode("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ارسال مجدد کد";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  // تأیید نهایی کد OTP
  const handleVerifyOtp = useCallback(
    async (codeToVerify?: string) => {
      const code = toEnglishDigits(codeToVerify || otpCode).trim();

      if (!code || code.length !== 6) {
        setErrorMessage("لطفاً کد تأیید ۶ رقمی را به صورت کامل وارد نمایید.");
        setOtpError(true);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setOtpError(false);

      try {
        const res = await verifyOtp(phone, code);
        toast.success(res.message || "ورود با موفقیت انجام شد!");

        // ذخیره اطلاعات کاربر لاگین‌شده در استور اکانت
        setAuthUser({
          id: res.user.id,
          name: res.user.name,
          phone: res.user.phone,
          role: res.user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
        });

        // هدایت به صفحه مقصد
        setTimeout(() => {
          router.push(queryRedirect);
        }, 400);
      } catch (err) {
        setOtpError(true);
        if (err instanceof AuthApiError) {
          setErrorMessage(err.message);
          toast.error(err.message);
        } else {
          const msg = "کد تأیید وارد شده اشتباه یا منقضی شده است.";
          setErrorMessage(msg);
          toast.error(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [otpCode, phone, queryRedirect, router, setAuthUser]
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

  // سوئیچ هوشمند بین تب‌ها بر اساس پیشنهاد خطا
  const handleApplySuggestion = () => {
    if (smartSuggestion?.type === "switch-to-login") {
      setActiveTab("login");
      setSmartSuggestion(null);
      setErrorMessage(null);
    } else if (smartSuggestion?.type === "switch-to-register") {
      setActiveTab("register");
      setSmartSuggestion(null);
      setErrorMessage(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianDigits(mins.toString().padStart(2, "0"))}:${toPersianDigits(secs.toString().padStart(2, "0"))}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* کارت اصلی با طراحی مدرن و توکن‌های تم */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xs">
        {/* خط گرادیان ظریف بالای کارت */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

        {/* لوگو و عنوان برند اسمارت الکتریک */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-primary" />
            </div>
            <div className="text-right">
              <span className="font-extrabold text-lg text-foreground block leading-tight">
                اسمارت الکتریک
              </span>
              <span className="text-[11px] text-muted-foreground block">
                سامانه هوشمند تجهیزات برق و شبکه
              </span>
            </div>
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* مرحله اول: ورود / ثبت‌نام */}
        {/* ------------------------------------------------------------------ */}
        {step === "phone" && (
          <div>
            {/* تب‌های انتخاب: ورود / ثبت‌نام */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-2xl mb-6 border border-border/50">
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "login"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LogIn className="w-4 h-4" />
                ورود به حساب
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("register")}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "register"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserPlus className="w-4 h-4" />
                ثبت‌نام جدید
              </button>
            </div>

            {/* توضیحات راهنما */}
            <div className="text-center mb-6">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {activeTab === "login" ? "ورود با رمز یکبار مصرف (OTP)" : "ایجاد حساب کاربری جدید"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {activeTab === "login"
                  ? "جهت ورود، شماره موبایل خود را وارد نمایید تا کد تأیید ارسال گردد."
                  : "با عضویت در اسمارت الکتریک از فاکتور رسمی و پیگیری سریع سفارش بهره‌مند شوید."}
              </p>
            </div>

            {/* پیشنهاد هوشمند جابجایی بین تب‌ها (در صورت ۴۰۹ یا ۴۰۴) */}
            {smartSuggestion && (
              <div className="mb-5 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>{smartSuggestion.message}</span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApplySuggestion}
                  className="rounded-xl text-xs h-8 shrink-0 font-bold"
                >
                  {smartSuggestion.type === "switch-to-login" ? "انتقال به ورود" : "انتقال به ثبت‌نام"}
                </Button>
              </div>
            )}

            {/* آلرت پیام خطا */}
            {errorMessage && !smartSuggestion && (
              <div className="mb-5 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* فرم ورود / ثبت‌نام */}
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {/* فیلد نام (تنها در حالت ثبت‌نام) */}
              {activeTab === "register" && (
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    نام و نام خانوادگی *
                  </label>
                  <Input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="h-11 rounded-xl text-xs sm:text-sm bg-background"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* فیلد شماره موبایل */}
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
                    در حال بررسی و ارسال پیامک...
                  </span>
                ) : activeTab === "login" ? (
                  "دریافت کد تأیید ورود"
                ) : (
                  "ثبت‌نام و ارسال کد تأیید"
                )}
              </Button>
            </form>

            {/* پاورقی کارت */}
            <div className="mt-6 pt-5 border-t border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>ورود امن و رمزنگاری‌شده با پروتکل شاپرک و مخابرات</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* مرحله دوم: تأیید کد پیامکی (OTP Verification) */}
        {/* ------------------------------------------------------------------ */}
        {step === "otp" && (
          <div className="space-y-6">
            {/* سربرگ تأیید کد */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">تأیید کد پیامکی</h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                کد تأیید ۶ رقمی به شماره زیر ارسال گردید:
              </p>

              {/* شماره موبایل و دکمه ویرایش */}
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

            {/* جعبه کمکی محیط توسعه (DevCode Helper) */}
            {devCode && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-2 animate-in fade-in">
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

            {/* آلرت پیام خطا در صورت اشتباه بودن کد */}
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

            {/* دکمه تأیید نهایی */}
            <Button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isSubmitting || otpCode.length !== 6}
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
                تغییر شماره یا روش ورود
              </button>
            </div>
          </div>
        )}
      </div>

      {/* پیوند بازگشت به فروشگاه */}
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
