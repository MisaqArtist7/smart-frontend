"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  type AuthUser,
  getMe,
  refreshToken,
  logoutUser,
  AuthApiError,
} from "@/lib/auth-api";
import { useAccountStore } from "@/lib/account-store";

interface AuthContextType {
  user: AuthUser | null;
  role: "ADMIN" | "CUSTOMER" | string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  loginSuccess: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { setAuthUser, logout: storeLogout } = useAccountStore();

  /**
   * دریافت کاربر جاری از GET /auth/me
   * با مکانیسم یکبار تلاش مجدد پس از POST /auth/refresh در صورت بروز ۴۰۱
   */
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      const meUser = await getMe();
      setUser(meUser);
      setAuthUser({
        id: meUser.id,
        name: meUser.name,
        phone: meUser.phone,
        role: meUser.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      });
      return meUser;
    } catch (error) {
      if (error instanceof AuthApiError && error.statusCode === 401) {
        // تلاش برای تمدید نشست با رفرش توکن
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            const meUser = await getMe();
            setUser(meUser);
            setAuthUser({
              id: meUser.id,
              name: meUser.name,
              phone: meUser.phone,
              role: meUser.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
            });
            return meUser;
          }
        } catch {
          // در صورت شکست رفرش توکن
        }
      }

      // کاربر وارد نشده یا نشست منقضی شده
      setUser(null);
      storeLogout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthUser, storeLogout]);

  // بررسی اولیه وضعیت ورود در زمان بارگذاری اپلیکیشن
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const meUser = await getMe();
        if (!isMounted) return;
        setUser(meUser);
        setAuthUser({
          id: meUser.id,
          name: meUser.name,
          phone: meUser.phone,
          role: meUser.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
          avatarUrl: meUser.avatarUrl,
        });
      } catch (error) {
        if (error instanceof AuthApiError && error.statusCode === 401) {
          const refreshed = await refreshToken().catch(() => false);
          if (refreshed && isMounted) {
            const retried = await getMe().catch(() => null);
            if (retried && isMounted) {
              setUser(retried);
              setAuthUser({
                id: retried.id,
                name: retried.name,
                phone: retried.phone,
                role: retried.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
                avatarUrl: retried.avatarUrl,
              });
              setIsLoading(false);
              return;
            }
          }
        }
        if (isMounted) {
          setUser(null);
          storeLogout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [setAuthUser, storeLogout]);

  /**
   * به‌روزرسانی موفقیت‌آمیز نشست بعد از اعتبارسنجی OTP
   */
  const loginSuccess = useCallback(
    (userData: AuthUser) => {
      setUser(userData);
      setAuthUser({
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        role: userData.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      });
      setIsLoading(false);
    },
    [setAuthUser]
  );

  /**
   * خروج کامل از حساب کاربری
   * ۱. فراخوانی POST /auth/logout با credentials: 'include'
   * ۲. پاکسازی کامل وضعیت کاربر در کلاینت
   * ۳. هدایت به /login
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch {
      // ادامه پاکسازی محلی
    } finally {
      setUser(null);
      storeLogout();
      setIsLoading(false);
      toast.success("با موفقیت از حساب کاربری خارج شدید.");
      router.push("/login");
    }
  }, [router, storeLogout]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      isLoading,
      refreshUser,
      logout,
      loginSuccess,
    }),
    [user, isLoading, refreshUser, logout, loginSuccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
