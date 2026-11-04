"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "پیشخوان و آمار",
  "/admin/products": "مدیریت محصولات",
  "/admin/categories": "مدیریت دسته‌بندی‌ها",
  "/admin/users": "کاربران و آدرس‌ها",
  "/admin/settings": "تنظیمات فروشگاه",
};

export function AdminTopbar({ onOpenMobileSidebar }: AdminTopbarProps) {
  const pathname = usePathname();
  const currentTitle = ROUTE_TITLES[pathname] || "مدیریت پنل";

  return (
    <header className="h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* بخش راست (RTL): دکمه همبرگر موبایل و مسیر صفحه (Breadcrumb) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="منوی موبایل"
          className="lg:hidden flex size-9 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="size-5" />
        </button>

        {/* بردکرامب ساده و تمیز */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            پیشخوان
          </Link>
          {pathname !== "/admin" && (
            <>
              <span className="text-muted-foreground/60">/</span>
              <span className="font-bold text-foreground">{currentTitle}</span>
            </>
          )}
        </nav>
      </div>

      {/* بخش چپ (RTL): اعلان‌ها و دراپ‌داون پروفایل مدیر */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* دکمه نوتیفیکیشن‌ها */}
        <button
          type="button"
          aria-label="اعلان‌ها"
          className="relative size-9 flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 start-2 size-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* دراپ‌داون مشخصات ادمین */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-accent/80 transition-colors focus:outline-none"
              />
            }
          >
            <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              <Shield className="size-4" />
            </div>
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-bold text-foreground line-clamp-1 leading-tight">
                مدیر ارشد فروشگاه
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                admin@smart-electric.ir
              </span>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-52" align="start">
            <DropdownMenuLabel>
              <div className="font-bold text-xs text-foreground">حساب مدیریتی</div>
              <div className="text-[11px] text-muted-foreground font-normal">دسترسی سوپرادمین</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <User className="size-4 text-muted-foreground" />
              <span>پروفایل کاربری</span>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <SettingsIcon className="size-4 text-muted-foreground" />
              <span>تنظیمات امنیتی</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <Link href="/login" className="flex items-center gap-2 w-full">
                <LogOut className="size-4" />
                <span>خروج از حساب</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminTopbar;
