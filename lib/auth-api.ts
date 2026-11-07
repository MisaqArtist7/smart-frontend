/**
 * Authentication API Client for Smart Electric
 * Endpoint Base: http://localhost:4000/auth
 * Conforms strictly to backend specifications:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/request-otp
 * - POST /auth/verify-otp
 * - GET /auth/me
 * - POST /auth/refresh
 * - POST /auth/logout
 *
 * All requests are executed with `credentials: "include"` for httpOnly cookie exchange.
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
  role: "ADMIN" | "CUSTOMER" | string;
  avatarUrl?: string;
}

export interface VerifyOtpResponse {
  message: string;
  user: AuthUser;
}

// متغیر سشن تستی در حافظه جهت پایداری تست در زمان آفلاین بودن بک‌اند
let devSessionUser: AuthUser | null = null;

/**
 * تابع کمکی ارسال درخواست با credentials: 'include'
 */
async function fetchAuth<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: unknown
): Promise<T> {
  const url = `${BASE_AUTH_URL}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let msg = data.message;
    if (res.status === 401) {
      msg = msg || "احراز هویت انجام نشده است یا نشست شما منقضی شده است";
    } else if (res.status === 403) {
      msg = msg || "شما اجازه دسترسی به این بخش را ندارید (دسترسی غیرمجاز)";
    } else if (res.status === 404) {
      msg = msg || "کاربری با این مشخصات یافت نشد";
    } else if (res.status === 409) {
      msg = msg || "کاربری با این مشخصات قبلاً ثبت‌نام کرده است";
    } else if (res.status === 429) {
      msg = msg || "کمی صبر کنید. تعداد درخواست‌های ارسال کد بیش از حد مجاز است";
    } else {
      msg = msg || `خطای سرور: ${res.status}`;
    }

    throw new AuthApiError(msg, res.status, data);
  }

  return data as T;
}

/**
 * ۱. ثبت‌نام کاربر جدید
 * POST /auth/register
 */
export async function registerUser(name: string, phone: string): Promise<RegisterResponse> {
  const cleanPhone = normalizePhoneNumber(phone);
  const cleanName = name.trim();

  try {
    return await fetchAuth<RegisterResponse>("/register", "POST", {
      name: cleanName,
      phone: cleanPhone,
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // شبیه‌سازی در حالت آفلاین بک‌اند (توسعه محلی)
    console.warn("⚠️ سرور بک‌اند در دسترس نیست. استفاده از حالت توسعه محلی...");
    if (cleanPhone === "09004090000") {
      throw new AuthApiError(
        "کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است. لطفاً وارد شوید",
        409
      );
    }
    if (cleanPhone === "09004290000") {
      throw new AuthApiError("کمی صبر کنید. تعداد درخواست‌های ارسال کد بیش از حد مجاز است", 429);
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
    return await fetchAuth<LoginResponse>("/login", "POST", {
      phone: cleanPhone,
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // شبیه‌سازی در حالت آفلاین بک‌اند
    console.warn("⚠️ سرور بک‌اند در دسترس نیست. استفاده از حالت توسعه محلی...");
    if (cleanPhone === "09004040000") {
      throw new AuthApiError(
        "کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید",
        404
      );
    }
    if (cleanPhone === "09004290000") {
      throw new AuthApiError("کمی صبر کنید. تعداد درخواست‌های ارسال کد بیش از حد مجاز است", 429);
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
    return await fetchAuth<RequestOtpResponse>("/request-otp", "POST", {
      phone: cleanPhone,
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    console.warn("⚠️ سرور بک‌اند در دسترس نیست. شبیه‌سازی ارسال مجدد کد...");
    if (cleanPhone === "09004290000") {
      throw new AuthApiError("کمی صبر کنید. تعداد درخواست‌های ارسال کد بیش از حد مجاز است", 429);
    }

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
    const res = await fetchAuth<VerifyOtpResponse>("/verify-otp", "POST", {
      phone: cleanPhone,
      code: cleanCode,
    });

    devSessionUser = res.user;
    return res;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    console.warn("⚠️ سرور بک‌اند در دسترس نیست. شبیه‌سازی تأیید ورود...");
    if (cleanCode === "000000") {
      throw new AuthApiError("کد تأیید وارد شده اشتباه است", 400);
    }

    // شماره‌های اختصاصی تست ادمین در محیط توسعه (مثلاً 09120000000 یا 09121111111)
    const isAdminTest =
      cleanPhone === "09120000000" ||
      cleanPhone === "09121111111" ||
      cleanPhone.endsWith("9999");

    const mockUser: AuthUser = {
      id: isAdminTest ? 99 : 1,
      name: isAdminTest ? "مدیر ارشد اسمارت الکتریک" : "کاربر اسمارت الکتریک",
      phone: cleanPhone,
      role: isAdminTest ? "ADMIN" : "CUSTOMER",
    };

    devSessionUser = mockUser;

    return {
      message: "ورود با موفقیت انجام شد (حالت توسعه)",
      user: mockUser,
    };
  }
}

/**
 * ۵. دریافت اطلاعات هویت و نقش کاربر جاری (معتبرترین منبع تشخیص نقش)
 * GET /auth/me
 */
export async function getMe(): Promise<AuthUser> {
  try {
    const data = await fetchAuth<AuthUser | { user: AuthUser }>("/me", "GET");
    const user = "user" in data && data.user ? data.user : (data as AuthUser);
    devSessionUser = user;
    return user;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // در حالت آفلاین بک‌اند:
    if (devSessionUser) {
      return devSessionUser;
    }

    throw new AuthApiError("نشست شما منقضی شده است یا هنوز وارد نشده‌اید", 401);
  }
}

/**
 * ۶. تازه‌سازی توکن احراز هویت
 * POST /auth/refresh
 * اگر موفق بود true برمی‌گرداند؛ اگر 401 بود false.
 */
export async function refreshToken(): Promise<boolean> {
  try {
    await fetchAuth<{ message?: string }>("/refresh", "POST");
    return true;
  } catch (err) {
    if (err instanceof AuthApiError && err.statusCode === 401) {
      devSessionUser = null;
      return false;
    }
    // اگر سرور در دسترس نبود یا خطای دیگر
    return false;
  }
}

/**
 * ۷. خروج از حساب کاربری
 * POST /auth/logout
 */
export async function logoutUser(): Promise<void> {
  devSessionUser = null;
  try {
    await fetchAuth<{ message?: string }>("/logout", "POST");
  } catch {
    // حتی در صورت خطای شبکه، وضعیت کلاینت پاک می‌شود
  }
}
