"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import ProfileSidebar, { PROFILE_NAV_ITEMS } from "@/components/account/profile-sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  // محافظت از مسیرهای حساب کاربری: در صورت عدم ورود، هدایت به /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // ۱. حالت در حال بارگذاری استعلام نشست
  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 w-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-bold text-foreground">در حال بارگذاری اطلاعات حساب کاربری...</p>
          <p className="text-xs text-muted-foreground mt-1">بررسی وضعیت نشست کاربری</p>
        </main>
        <Footer />
      </div>
    );
  }

  // ۲. کاربر وارد نشده
  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 w-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-foreground">نیاز به ورود به حساب کاربری</p>
          <p className="text-xs text-muted-foreground mt-1">در حال هدایت خودکار به صفحه ورود...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // ۳. کاربر احراز هویت شده
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* هدر کامل ۳ طبقه فروشگاه */}
      <Header />

      {/* کانتینر اصلی بخش حساب کاربری */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* نوار ناوبری افقی مخصوص موبایل و تبلت‌های کوچک */}
        <div className="lg:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none flex items-center gap-2 select-none">
          {PROFILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/profile"
                ? pathname === "/profile"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* چیدمان دو ستونه دسکتاپ: سایدبار در راست + محتوا در چپ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ستون سایدبار دسکتاپ (۴ ستون از ۱۲ ستون) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24">
            <ProfileSidebar />
          </div>

          {/* ستون محتوای ساب‌پیج‌ها (۸ ستون از ۱۲ ستون) */}
          <div className="lg:col-span-8 xl:col-span-9 min-w-0">
            {children}
          </div>
        </div>
      </main>

      {/* فوتر فروشگاه */}
      <Footer />
    </div>
  );
}
