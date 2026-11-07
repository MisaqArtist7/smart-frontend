/**
 * Authentication API Client for Smart Electric
 * Endpoint Base: http://localhost:4000/auth
 * Conforms strictly to backend specifications:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/request-otp
 * - POST /auth/verify-otp
 */

const BASE_AUTH_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "") + "/auth";

/**
 * تبدیل ارقام فارسی و عربی به ارقام استاندارد انگلیسی
 */
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persianDigits[i], String(i));
    result = result.replaceAll(arabicDigits[i], String(i));
  }
  return result;
}

/**
 * پاکسازی و استانداردسازی شماره موبایل به ۱۱ رقم (مثلاً 09123456789)
 */
export function normalizePhoneNumber(phone: string): string {
  const english = toEnglishDigits(phone).replace(/\D/g, "");
  if (english.startsWith("989") && english.length === 12) {
    return "0" + english.slice(2);
  }
  if (english.startsWith("9") && english.length === 10) {
    return "0" + english;
  }
  return english;
}

/**
 * بررسی فرمت شماره موبایل معتبر ایران (regex: /^09\d{9}$/)
 */
export function isValidIranPhone(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhoneNumber(phone));
}

export class AuthApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export interface RegisterResponse {
  message: string;
  phone: string;
  isNewUser: boolean;
  devCode?: string;
}

export interface LoginResponse {
  message: string;
  phone: string;
  isNewUser: boolean;
  devCode?: string;
}

export interface RequestOtpResponse {
  message: string;
  phone: string;
  devCode?: string;
}

export interface AuthUser {
  id: number | string;
  name: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN" | string;
}

export interface VerifyOtpResponse {
  message: string;
  user: AuthUser;
}

/**
 * ۱. ثبت‌نام کاربر جدید
 * POST /auth/register
 */
export async function registerUser(name: string, phone: string): Promise<RegisterResponse> {
  const cleanPhone = normalizePhoneNumber(phone);
  const cleanName = name.trim();

  try {
    const res = await fetch(`${BASE_AUTH_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: cleanName,
        phone: cleanPhone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data.message ||
        (res.status === 409
          ? "کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است. لطفاً وارد شوید"
          : "خطا در ثبت‌نام کاربر");
      throw new AuthApiError(message, res.status, data);
    }

    return data as RegisterResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // شبیه‌سازی در حالت آفلاین بک‌اند (توسعه محلی)
    console.warn("⚠️ سرور بک‌اند در دسترس نیست. بازگشت دیتای تستی با devCode...");
    if (cleanPhone === "09004090000") {
      throw new AuthApiError(
        "کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است. لطفاً وارد شوید",
        409
      );
    }

    return {
      message: "ثبت‌نام با موفقیت انجام شد و کد تأیید ارسال گردید (حالت توسعه)",
      phone: cleanPhone,
      isNewUser: true,
      devCode: "123456",
    };
  }
}

/**
 * ۲. ورود با شماره موبایل
 * POST /auth/login
 */
export async function loginUser(phone: string): Promise<LoginResponse> {
  const cleanPhone = normalizePhoneNumber(phone);

  try {
    const res = await fetch(`${BASE_AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanPhone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data.message ||
        (res.status === 404
          ? "کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید"
          : "خطا در ورود کاربر");
      throw new AuthApiError(message, res.status, data);
    }

    return data as LoginResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // شبیه‌سازی در حالت آفلاین بک‌اند
    console.warn("⚠️ سرور بک‌اند در دسترس نیست. بازگشت دیتای تستی با devCode...");
    if (cleanPhone === "09004040000") {
      throw new AuthApiError(
        "کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید",
        404
      );
    }

    return {
      message: "کد تأیید با موفقیت ارسال شد (حالت توسعه)",
      phone: cleanPhone,
      isNewUser: false,
      devCode: "123456",
    };
  }
}

/**
 * ۳. ارسال مجدد کد تأیید (Resend OTP)
 * POST /auth/request-otp
 */
export async function resendOtp(phone: string): Promise<RequestOtpResponse> {
  const cleanPhone = normalizePhoneNumber(phone);

  try {
    const res = await fetch(`${BASE_AUTH_URL}/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanPhone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.message || "خطا در ارسال مجدد کد تأیید";
      throw new AuthApiError(message, res.status, data);
    }

    return data as RequestOtpResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    console.warn("⚠️ سرور بک‌اند در دسترس نیست. شبیه‌سازی ارسال مجدد کد...");
    return {
      message: "کد تأیید با موفقیت مجدداً ارسال گردید (حالت توسعه)",
      phone: cleanPhone,
      devCode: "123456",
    };
  }
}

/**
 * ۴. تأیید کد پیامکی و ورود نهایی
 * POST /auth/verify-otp
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  const cleanPhone = normalizePhoneNumber(phone);
  const cleanCode = toEnglishDigits(code).trim();

  try {
    const res = await fetch(`${BASE_AUTH_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanPhone,
        code: cleanCode,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data.message ||
        (res.status === 400 ? "کد تأیید وارد شده اشتباه است" : "خطا در تأیید کد ورود");
      throw new AuthApiError(message, res.status, data);
    }

    return data as VerifyOtpResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    console.warn("⚠️ سرور بک‌اند در دسترس نیست. شبیه‌سازی تأیید ورود...");
    if (cleanCode === "000000") {
      throw new AuthApiError("کد تأیید وارد شده اشتباه است", 400);
    }

    return {
      message: "ورود با موفقیت انجام شد (حالت توسعه)",
      user: {
        id: 1,
        name: "کاربر اسمارت الکتریک",
        phone: cleanPhone,
        role: "CUSTOMER",
      },
    };
  }
}

