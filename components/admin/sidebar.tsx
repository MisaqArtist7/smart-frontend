"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Settings,
  Store,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "پیشخوان",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "مدیریت سفارش‌ها",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "محصولات",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "دسته‌بندی‌ها",
    href: "/admin/categories",
    icon: Layers,
  },
  {
    title: "دیدگاه‌ها و نظرات",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  {
    title: "کدهای تخفیف",
    href: "/admin/discounts",
    icon: Tag,
  },
  {
    title: "آدرس‌ها و کاربران",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "تنظیمات",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-e border-border transition-all duration-300 select-none",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* سربرگ سایدبار ادمین: لوگو و نام فروشگاه */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 overflow-hidden focus:outline-none"
        >
          <div className="relative size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Image
              src="/images/brand/logo.png"
              alt="اسمارت الکتریک"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-black text-sm text-foreground tracking-tight line-clamp-1">
                اسمارت الکتریک
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <ShieldCheck className="size-3 text-primary" />
                پنل مدیریت فروشگاه
              </span>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
            className="hidden lg:flex size-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={cn("size-4 transition-transform", isCollapsed && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* لیست آیتم‌های ناوبری اصلی */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {!isCollapsed ? "مدیریت و دسترسی‌ها" : "•••"}
        </div>

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />

              {!isCollapsed && (
                <span className="flex-1 truncate">{item.title}</span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* بخش پایین سایدبار: بازگشت به ویترین فروشگاه */}
      <div className="p-3 border-t border-border mt-auto">
        <Link
          href="/"
          title={isCollapsed ? "بازگشت به فروشگاه" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/30 transition-all duration-200"
        >
          <Store className="size-5 shrink-0" />
          {!isCollapsed && <span className="font-semibold">بازگشت به فروشگاه</span>}
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;

