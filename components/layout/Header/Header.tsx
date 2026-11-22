"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import {
  Sparkles,
  Cpu,
  ToggleRight,
  Cable,
  Lightbulb,
  ShieldAlert,
  Wrench,
  Layers,
  PhoneCall,
  Package,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useCategories, type Category } from "@/lib/api";

import { TopBar } from "./TopBar";
import { MainBar } from "./MainBar";
import { NavigationBar } from "./NavigationBar";
import { MobileMenu } from "./MobileMenu";

/* =========================================================================
   ۱. تعاریف تایپ‌های آبجکت کانفیگ (Data Architecture & Types)
   ========================================================================= */

export interface HeaderNavItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSpecial?: boolean;
}

export interface HeaderCategorySubItem {
  id: string;
  title: string;
  href: string;
}

export interface HeaderCategoryItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  subcategories?: HeaderCategorySubItem[];
}

export interface HeaderTopBarConfig {
  announcement: {
    text: string;
    badgeText?: string;
  };
  discount: {
    label: string;
    code: string;
    copiedNotice?: string;
  };
}

export interface HeaderMainBarConfig {
  logo: {
    src: string;
    alt: string;
    href: string;
    title?: string;
    subtitle?: string;
  };
  search: {
    placeholder: string;
  };
  support: {
    label: string;
    phone: string;
    displayPhone: string;
  };
}

export interface HeaderNavigationConfig {
  categoriesTitle: string;
  categories: HeaderCategoryItem[];
  navLinks: HeaderNavItem[];
  authButton: {
    text: string;
    href: string;
    isLoggedIn?: boolean;
    userName?: string;
    role?: string;
    phone?: string;
  };
  cartButton: {
    text: string;
    href: string;
  };
}

export interface HeaderConfig {
  topBar: HeaderTopBarConfig;
  mainBar: HeaderMainBarConfig;
  navigation: HeaderNavigationConfig;
}

/* =========================================================================
   ۲. آبجکت تایپ‌شده داده‌های پیش‌فرض هدر (بدون هاردکد کردن متون در JSX)
   ========================================================================= */

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  topBar: {
    announcement: {
      text: "تضمین اصالت کالا، مشاوره تخصصی و ارسال سریع به سراسر ایران",
      badgeText: "تخفیف ویژه",
    },
    discount: {
      label: "کد تخفیف اولین خرید:",
      code: "FIRST-SMART",
      copiedNotice: "کد تخفیف کپی شد!",
    },
  },
  mainBar: {
    logo: {
      src: "/images/brand/logo.png",
      alt: "لوگوی اسمارت الکتریک",
      title: "اسمارت الکتریک",
      subtitle: "تجهیزات و اتوماسیون برق هوشمند",
      href: "/",
    },
    search: {
      placeholder: "جستجوی کالا، برند یا کد محصول (کلید و پریز، فیوز، سیم و کابل...)",
    },
    support: {
      label: "مشاوره و پشتیبانی فروش",
      phone: "tel:09122193551",
      displayPhone: "۰۹۱۲ ۲۱۹ ۳۵۵۱",
    },
  },
  navigation: {
    categoriesTitle: "دسته‌بندی کالاها",
    categories: [],
    navLinks: [
      {
        id: "special-offers",
        title: "پیشنهادات شگفت‌انگیز (افرز)",
        href: "/offers",
        icon: Sparkles,
        isSpecial: true,
        badge: "ویژه",
      },
      {
        id: "infrastructure",
        title: "تجهیزات زیر ساخت",
        href: `/category/${encodeURIComponent("تچهیزات-زیر-ساخت")}`,
        icon: Layers,
      },
      {
        id: "security-systems",
        title: "سیستم های امنیتی",
        href: `/category/${encodeURIComponent("سیستم-های-امنیتی")}`,
        icon: ShieldAlert,
      },
      {
        id: "contact",
        title: "تماس با ما",
        href: "/contact-us",
        icon: PhoneCall,
      },
    ],
    authButton: {
      text: "ورود / عضویت",
      href: "/login",
    },
    cartButton: {
      text: "سبد خرید",
      href: "/cart",
    },
  },
};

/* =========================================================================
   ۳. پراپ‌های کامپوننت هدر
   ========================================================================= */

export interface HeaderProps {
  /**
   * تعداد محصولات سبد خرید با پیش‌فرض ۰
   */
  cartCount?: number;
  /**
   * امکان ارسال کانفیگ سفارشی جهت بازنویسی بخش‌ها
   */
  config?: Partial<HeaderConfig>;
  /**
   * کلاس‌های تکمیلی CSS
   */
  className?: string;
  /**
   * وضعیت چسبندگی هدر در بالای صفحه (پیش‌فرض: true)
   */
  sticky?: boolean;
}

/* =========================================================================
   ۴. توابع کمکی تطبیق دسته‌بندی‌های سرور با معماری هدر
   ========================================================================= */

/**
 * تطبیق هوشمند آیکون دسته‌بندی بر اساس نام یا اسلاگ کالا
 */
function getCategoryIcon(
  slug: string,
  name: string
): React.ComponentType<{ className?: string }> {
  const text = `${slug} ${name}`.toLowerCase();
  if (
    text.includes("smart") ||
    text.includes("هوشمند") ||
    text.includes("auto") ||
    text.includes("رله") ||
    text.includes("کنترل")
  ) {
    return Cpu;
  }
  if (
    text.includes("switch") ||
    text.includes("کلید") ||
    text.includes("پریز") ||
    text.includes("socket")
  ) {
    return ToggleRight;
  }
  if (
    text.includes("cable") ||
    text.includes("wire") ||
    text.includes("سیم") ||
    text.includes("کابل")
  ) {
    return Cable;
  }
  if (
    text.includes("light") ||
    text.includes("روشنایی") ||
    text.includes("لامپ") ||
    text.includes("لوستر") ||
    text.includes("پروژکتور")
  ) {
    return Lightbulb;
  }
  if (
    text.includes("safety") ||
    text.includes("حفاظت") ||
    text.includes("امنیت") ||
    text.includes("فیوز") ||
    text.includes("محافظ") ||
    text.includes("shield")
  ) {
    return ShieldAlert;
  }
  if (
    text.includes("tool") ||
    text.includes("ابزار") ||
    text.includes("تستر") ||
    text.includes("مولتی‌متر") ||
    text.includes("آچار")
  ) {
    return Wrench;
  }
  if (
    text.includes("board") ||
    text.includes("تابلو") ||
    text.includes("صنعتی") ||
    text.includes("industrial")
  ) {
    return Layers;
  }
  return Package;
}

/**
 * تبدیل دسته‌بندی‌های زنده سرور به ساختار درختی دو سطحی برای مگامنو
 */
function mapCategoriesToHeader(categories: Category[]): HeaderCategoryItem[] {
  if (!categories || categories.length === 0) return [];

  // فیلتر دسته‌بندی‌های فعال
  const activeList = categories.filter((c) => c.isActive !== false);
  if (activeList.length === 0) return [];

  // ۱. شناسایی دسته‌های ریشه (سطح اول که parentId ندارند)
  const roots = activeList.filter((c) => !c.parentId);

  // ۲. مپ کردن فرزندان بر اساس parentId در صورت دریافت ساختار مسطح از سرور
  const childMap = new Map<number, Category[]>();
  activeList.forEach((c) => {
    if (c.parentId) {
      const list = childMap.get(c.parentId) || [];
      list.push(c);
      childMap.set(c.parentId, list);
    }
  });

  const effectiveRoots = roots.length > 0 ? roots : activeList;

  return effectiveRoots.map((root) => {
    // استخراج زیرمجموعه‌ها چه به صورت آبجکت تودرتو (children) و چه مسطح (childMap)
    const rawSubs: Category[] =
      root.children && root.children.length > 0
        ? root.children.filter((ch) => ch.isActive !== false)
        : childMap.get(root.id) || [];

    const subcategories: HeaderCategorySubItem[] = rawSubs.map((sub) => ({
      id: String(sub.id),
      title: sub.name,
      href: `/category/${root.slug}/${sub.slug}`,
    }));

    return {
      id: String(root.id),
      title: root.name,
      href: `/category/${root.slug}`,
      icon: getCategoryIcon(root.slug, root.name),
      subcategories: subcategories.length > 0 ? subcategories : undefined,
    };
  });
}

/* =========================================================================
   ۵. کامپوننت اصلی Header (۳ طبقه کامل و ماژولار)
   ========================================================================= */

export function Header({
  cartCount,
  config: userConfig,
  className = "",
  sticky = true,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const liveCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const { user: authUser, isAuthenticated: isAuth, role } = useAuth();
  const { data: serverCategories = [] } = useCategories();

  const isLoggedIn = mounted && Boolean(isAuth && authUser);
  const displayName = authUser?.name || authUser?.phone || "حساب کاربری";
  const userTargetHref = (role === "ADMIN" || authUser?.role === "ADMIN") ? "/admin" : "/profile";

  const effectiveCartCount = mounted ? liveCount : (cartCount ?? 0);

  // تبدیل داده‌های واقعی اندپوینت دسته‌بندی‌ها به ساختار منو
  const dynamicCategories = useMemo(() => {
    if (userConfig?.navigation?.categories) {
      return userConfig.navigation.categories;
    }
    return mapCategoriesToHeader(serverCategories);
  }, [serverCategories, userConfig?.navigation?.categories]);

  // ادغام عمیق کانفیگ پیش‌فرض با کانفیگ سفارشی احتمالی
  const mergedConfig: HeaderConfig = {
    topBar: {
      ...DEFAULT_HEADER_CONFIG.topBar,
      ...(userConfig?.topBar || {}),
      announcement: {
        ...DEFAULT_HEADER_CONFIG.topBar.announcement,
        ...(userConfig?.topBar?.announcement || {}),
      },
      discount: {
        ...DEFAULT_HEADER_CONFIG.topBar.discount,
        ...(userConfig?.topBar?.discount || {}),
      },
    },
    mainBar: {
      ...DEFAULT_HEADER_CONFIG.mainBar,
      ...(userConfig?.mainBar || {}),
      logo: {
        ...DEFAULT_HEADER_CONFIG.mainBar.logo,
        ...(userConfig?.mainBar?.logo || {}),
      },
      search: {
        ...DEFAULT_HEADER_CONFIG.mainBar.search,
        ...(userConfig?.mainBar?.search || {}),
      },
      support: {
        ...DEFAULT_HEADER_CONFIG.mainBar.support,
        ...(userConfig?.mainBar?.support || {}),
      },
    },
    navigation: {
      ...DEFAULT_HEADER_CONFIG.navigation,
      ...(userConfig?.navigation || {}),
      categories: dynamicCategories,
      navLinks:
        userConfig?.navigation?.navLinks ||
        DEFAULT_HEADER_CONFIG.navigation.navLinks,
      authButton: {
        ...DEFAULT_HEADER_CONFIG.navigation.authButton,
        ...(userConfig?.navigation?.authButton || {}),
        text: isLoggedIn
          ? displayName
          : (userConfig?.navigation?.authButton?.text || DEFAULT_HEADER_CONFIG.navigation.authButton.text),
        href: isLoggedIn
          ? userTargetHref
          : (userConfig?.navigation?.authButton?.href || "/login"),
        isLoggedIn,
        userName: isLoggedIn ? displayName : undefined,
        role: isLoggedIn ? (authUser?.role || role || undefined) : undefined,
        phone: isLoggedIn ? authUser?.phone : undefined,
      },
      cartButton: {
        ...DEFAULT_HEADER_CONFIG.navigation.cartButton,
        ...(userConfig?.navigation?.cartButton || {}),
      },
    },
  };

  return (
    <header
      dir="rtl"
      className={`w-full bg-background transition-colors ${
        sticky ? "sticky top-0 z-40 shadow-xs backdrop-blur-md" : ""
      } ${className}`}
    >
      {/* طبقه اول: نوار بالا (Top Bar) */}
      <TopBar config={mergedConfig.topBar} />

      {/* طبقه دوم: نوار میانی (Main Bar) */}
      <MainBar
        config={mergedConfig.mainBar}
        cartCount={effectiveCartCount}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* طبقه سوم: نوار ناوبری (Navigation Bar) */}
      <NavigationBar
        config={mergedConfig.navigation}
        cartCount={effectiveCartCount}
      />

      {/* منوی دراور ویژه صفحات موبایل و تبلت */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        config={mergedConfig}
        cartCount={effectiveCartCount}
      />
    </header>
  );
}

// ضمیمه کردن زیرکامپوننت‌ها جهت استفاده ماژولار
Header.TopBar = TopBar;
Header.MainBar = MainBar;
Header.NavigationBar = NavigationBar;
Header.MobileMenu = MobileMenu;

export default Header;
