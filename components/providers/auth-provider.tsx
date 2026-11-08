"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError, onUnauthorized } from "@/lib/api";
import { getMe } from "@/lib/auth-api";
import type { User } from "@/lib/types";
import { useAccountStore } from "@/lib/account-store";

export interface AuthContextType {
  user: User | null;
  role: "ADMIN" | "CUSTOMER" | string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  loginSuccess: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuthUser, logout: storeLogout } = useAccountStore();

  /**
   * استعلام مشخصات و نقش کاربر جاری از سرور
   * GET /auth/me با مدیریت کامل سشن و کوکی‌ها
   */
  const {
    data: user = null,
    isLoading,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const data = await apiFetch<User | { user: User }>("/auth/me");
        if (data && "user" in data && data.user) {
          return data.user;
        }
        return (data as User) || null;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        // در صورت عدم دسترسی به سرور از وضعیت توسعه محلی چک می‌شود
        try {
          return await getMe();
        } catch {
          return null;
        }
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // همگام‌سازی وضعیت کاربر با استور اکانت
  useEffect(() => {
    if (user) {
      setAuthUser({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
        avatarUrl: user.avatarUrl ?? undefined,
      });
    } else if (!isLoading) {
      storeLogout();
    }
  }, [user, isLoading, setAuthUser, storeLogout]);

  // ثبت شنونده برای پاکسازی وضعیت در صورت بروز خطای 401 حل‌نشده
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      queryClient.setQueryData(["auth", "me"], null);
      storeLogout();
    });
    return unsubscribe;
  }, [queryClient, storeLogout]);

  /**
   * بازخوانی مشخصات کاربر از سرور
   */
  const refreshUser = useCallback(async (): Promise<User | null> => {
    const result = await refetch();
    return result.data ?? null;
  }, [refetch]);

  /**
   * تنظیم سریع اطلاعات کاربر بعد از لاگین موفق
   */
  const loginSuccess = useCallback(
    (userData: User) => {
      queryClient.setQueryData(["auth", "me"], userData);
      setAuthUser({
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        role: userData.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
        avatarUrl: userData.avatarUrl ?? undefined,
      });
    },
    [queryClient, setAuthUser]
  );

  /**
   * خروج از حساب کاربری
   * ۱. فراخوانی POST /auth/logout
   * ۲. پاکسازی کامل Query Cache
   * ۳. هدایت به /login
   */
  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ادامه پاکسازی کلاینت حتی در صورت خطای شبکه
    } finally {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      storeLogout();
      toast.success("با موفقیت از حساب کاربری خارج شدید.");
      router.push("/login");
    }
  }, [queryClient, router, storeLogout]);

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "ADMIN";
  const role = user?.role ?? null;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role,
      isAuthenticated,
      isAdmin,
      isLoading,
      refreshUser,
      logout,
      loginSuccess,
    }),
    [user, role, isAuthenticated, isAdmin, isLoading, refreshUser, logout, loginSuccess]
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
