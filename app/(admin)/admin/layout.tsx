"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldAlert,
  Loader2,
  Lock,
  User,
  ShoppingBag,
} from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role, isLoading, isAuthenticated } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // نظارت و محافظت لحظه‌ای از مسیر /admin/*
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login?redirect=/admin");
      } else if (role !== "ADMIN") {
        toast.error("دسترسی غیرمجاز (۴۰۳): حساب کاربری شما اجازه ورود به پنل مدیریت را ندارد.");
        const timer = setTimeout(() => {
          router.replace("/profile");
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  // ۱. حالت در حال بارگذاری و استعلام me از سرور
  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          در حال استعلام سطح دسترسی مدیریت...
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          بررسی احراز هویت و مجوز دسترسی از سرور
        </p>
      </div>
    );
  }

  // ۲. در صورت عدم ورود کاربر، صفحه ادمین به هیچ وجه رندر نمی‌شود
  if (!isAuthenticated) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-foreground">نیاز به ورود به حساب کاربری</h2>
        <p className="text-xs text-muted-foreground mt-1">در حال هدایت به صفحه ورود...</p>
      </div>
    );
  }

  // ۳. در صورتی که کاربر وارد شده اما نقش ADMIN ندارد (مثلاً CUSTOMER)
  if (role !== "ADMIN") {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none"
      >
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground">
              دسترسی غیرمجاز (خطای ۴۰۳)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              شما با حساب کاربری <span className="font-bold text-foreground">«{user?.name || "مشتری"}»</span> وارد شده‌اید، اما این بخش تنها ویژه مدیران سیستم است و شما دسترسی مدیریت ندارید.
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
            در حال انتقال خودکار به پنل کاربری تا لحظاتی دیگر...
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ size: "default" }),
                "flex-1 rounded-xl text-xs sm:text-sm font-bold h-10 flex items-center justify-center gap-2"
              )}
            >
              <User className="w-4 h-4" />
              ورود به حساب کاربری خود
            </Link>

            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex-1 rounded-xl text-xs sm:text-sm h-10 flex items-center justify-center gap-2"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ۴. کاربر ادمین معتبر: نمایش پیشخوان مدیریت
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex">
      {/* سایدبار دسکتاپ ثابت */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* منوی کشویی سایدبار برای موبایل */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="p-0 w-72 max-w-[85vw] border-e bg-card">
          <AdminSidebar
            isCollapsed={false}
            onNavigate={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* بخش محتوای اصلی و تاپ‌بار بالایی */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
