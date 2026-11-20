/**
 * Authentication API Client for Smart Electric
 * Uses centralized apiFetch and typed ApiError.
 *
 * Backend endpoints:
 * - POST /auth/request-otp (phone) -> { message, phone, isNewUser, devCode? }
 * - POST /auth/verify-otp (phone, code, name?) -> { message, user: { id, name, phone, role } }
 * - GET  /auth/me -> User | { user: User }
 * - POST /auth/refresh -> 200 OK / 401
 * - POST /auth/logout -> 200 OK
 */

import { apiFetch, ApiError } from "@/lib/api";
import type { User, RequestOtpResponse, VerifyOtpResponse } from "@/lib/types";

export type AuthUser = User;

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

// Backward compatibility alias
export const AuthApiError = ApiError;

/**
 * ارسال درخواست دریافت کد یکبار مصرف (OTP)
 * POST /auth/request-otp
 */
export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  const cleanPhone = normalizePhoneNumber(phone);

  return await apiFetch<RequestOtpResponse>("/auth/request-otp", {
    method: "POST",
    body: { phone: cleanPhone },
  });
}

/**
 * تأیید کد پیامکی و ورود نهایی
 * POST /auth/verify-otp
 * نکته حیاتی: فیلد name تنها در صورتی که کاربر جدید باشد ارسال می‌شود.
 */
export async function verifyOtp(
  phone: string,
  code: string,
  name?: string
): Promise<VerifyOtpResponse> {
  const cleanPhone = normalizePhoneNumber(phone);
  const cleanCode = toEnglishDigits(code).trim();
  const cleanName = name ? name.trim() : undefined;

  const payload: { phone: string; code: string; name?: string } = {
    phone: cleanPhone,
    code: cleanCode,
  };

  if (cleanName && cleanName.length >= 2) {
    payload.name = cleanName;
  }

  return await apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: payload,
  });
}

/**
 * دریافت اطلاعات هویت و نقش کاربر جاری (معتبرترین منبع تشخیص نقش)
 * GET /auth/me
 */
export async function getMe(): Promise<User> {
  const data = await apiFetch<User | { user: User }>("/auth/me", {
    method: "GET",
  });
  return data && "user" in data && data.user ? data.user : (data as User);
}

/**
 * خروج از حساب کاربری
 * POST /auth/logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiFetch<{ message?: string }>("/auth/logout", {
      method: "POST",
    });
  } catch {
    // Continue local cleanup even on network failure
  }
}

// Backward compatibility helper wrappers
export const registerUser = async (name: string, phone: string) => {
  return requestOtp(phone);
};

export const loginUser = async (phone: string) => {
  return requestOtp(phone);
};

export const resendOtp = async (phone: string) => {
  return requestOtp(phone);
};

export const refreshToken = async (): Promise<boolean> => {
  try {
    await apiFetch("/auth/refresh", { method: "POST" });
    return true;
  } catch {
    return false;
  }
};
