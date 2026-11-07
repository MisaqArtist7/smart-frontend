"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageCheck,
  MapPin,
  UserCog,
  LogOut,
  CheckCircle2,
  User as UserIcon,
} from "lucide-react";
import { useAccountStore } from "@/lib/account-store";
import { useAuth } from "@/components/providers/auth-provider";
import { toPersianDigits } from "@/lib/account-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PROFILE_NAV_ITEMS: NavItem[] = [
  {
    title: "پیشخوان و خلاصه فعالیت",
    href: "/profile",
    icon: LayoutDashboard,
  },
  {
    title: "سفارش‌های من",
    href: "/profile/orders",
    icon: PackageCheck,
  },
  {
    title: "آدرس‌های من",
    href: "/profile/addresses",
    icon: MapPin,
  },
  {
    title: "اطلاعات حساب کاربری",
    href: "/profile/settings",
    icon: UserCog,
  },
];

interface ProfileSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function ProfileSidebar({ className, onNavigate }: ProfileSidebarProps) {
  const pathname = usePathname();
  const storeUser = useAccountStore((s) => s.user);
  const { user: authUser, logout } = useAuth();
  const user = authUser || storeUser;

  const handleLogout = async () => {
    if (window.confirm("آیا قصد خروج از حساب کاربری خود را دارید؟")) {
      await logout();
    }
  };

  return (
    <Card className={cn("rounded-2xl border-border bg-card shadow-xs overflow-hidden select-none", className)}>
      <CardContent className="p-4 sm:p-5 space-y-5">
        {/* کارت اطلاعات کاربر در بالای سایدبار */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-border/70">
          <div className="relative size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 shadow-xs">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="size-full object-cover rounded-2xl"
              />
            ) : (
              <UserIcon className="size-6" />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-sm sm:text-base text-foreground truncate">
                {user.name}
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1 px-1.5 py-0.5 shrink-0"
              >
                <CheckCircle2 className="size-2.5" />
                <span>تایید شده</span>
              </Badge>
            </div>

            <span className="text-xs text-muted-foreground font-mono mt-0.5 tracking-wider">
              {toPersianDigits(user.phone)}
            </span>
          </div>
        </div>

        {/* لیست لینک‌های ناوبری پروفایل */}
        <nav className="space-y-1" aria-label="منوی حساب کاربری">
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
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 outline-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5 shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}

          {/* دکمه خروج از حساب کاربری */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-destructive hover:bg-destructive/10 transition-all duration-200 mt-2 text-start focus:outline-none"
          >
            <LogOut className="size-4.5 shrink-0" />
            <span>خروج از حساب</span>
          </button>
        </nav>
      </CardContent>
    </Card>
  );
}

export default ProfileSidebar;

