"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  Sparkles,
  Flame,
  Cpu,
  ToggleRight,
  Cable,
  Lightbulb,
  ShieldAlert,
  Wrench,
  Layers,
  PhoneCall,
  GraduationCap,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/components/providers/auth-provider";

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
      text: "ارسال رایگان برای خریدهای بالای ۱,۰۰۰,۰۰۰ تومان به سراسر ایران",
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
      label: "مشاوره و پشتیبانی ۲۴/۷",
      phone: "tel:02191015555",
      displayPhone: "۰۲۱-۹۱۰۱۵۵۵۵",
    },
  },
  navigation: {
    categoriesTitle: "دسته‌بندی کالاها",
    categories: [
      {
        id: "smart-home",
        title: "خانه هوشمند و BMS",
        href: "/category/smart-home",
        icon: Cpu,
        badge: "جدید",
        subcategories: [
          { id: "controllers", title: "کنترلرهای مرکزی و گیت‌وی", href: "/category/smart-home/controllers" },
          { id: "relays", title: "رله‌های هوشمند تابلویی", href: "/category/smart-home/relays" },
          { id: "touch-switches", title: "کلیدهای لمسی هوشمند", href: "/category/smart-home/touch-switches" },
          { id: "sensors", title: "سنسورهای هوشمند حضور و دما", href: "/category/smart-home/sensors" },
        ],
      },
      {
        id: "switches",
        title: "کلید، پریز و کادر",
        href: "/category/switches",
        icon: ToggleRight,
        subcategories: [
          { id: "luxury-switches", title: "کلید و پریز لوکس و مدرن", href: "/category/switches/luxury" },
          { id: "standard-switches", title: "کلید و پریز مکانیکی استاندارد", href: "/category/switches/standard" },
          { id: "waterproof-switches", title: "پریزهای صنعتی و بارانی ضدآب", href: "/category/switches/waterproof" },
          { id: "frames", title: "قاب و کادرهای شیشه‌ای و چوبی", href: "/category/switches/frames" },
        ],
      },
      {
        id: "cables",
        title: "سیم، کابل و لوله برقی",
        href: "/category/cables",
        icon: Cable,
        subcategories: [
          { id: "building-wires", title: "سیم‌های ساختمانی (افشان و مفتول)", href: "/category/cables/building" },
          { id: "power-cables", title: "کابل‌های قدرت زمینی و هوایی", href: "/category/cables/power" },
          { id: "network-cables", title: "کابل‌های مخابرات و شبکه LAN", href: "/category/cables/network" },
        ],
      },
      {
        id: "lighting",
        title: "روشنایی و نورپردازی",
        href: "/category/lighting",
        icon: Lightbulb,
        subcategories: [
          { id: "led-panels", title: "پنل‌ها و چراغ‌های توکار و روکار SMD", href: "/category/lighting/panels" },
          { id: "linear-lights", title: "لاینرها و پروفیل‌های نور خطی", href: "/category/lighting/linear" },
          { id: "floodlights", title: "پروژکتور و چراغ خیابانی و سوله", href: "/category/lighting/floodlights" },
        ],
      },
      {
        id: "switchboards",
        title: "تابلو برق، فیوز و کلید خودکار",
        href: "/category/switchboards",
        icon: ShieldAlert,
        subcategories: [
          { id: "mcb", title: "کلیدهای مینیاتوری MCB", href: "/category/switchboards/mcb" },
          { id: "rcd", title: "کلیدهای محافظ جان RCCB", href: "/category/switchboards/rcd" },
          { id: "contactors", title: "کنتاکتورها و کلیدهای حرارتی", href: "/category/switchboards/contactors" },
        ],
      },
      {
        id: "tools",
        title: "ابزار دقیق و اندازه‌گیری",
        href: "/category/tools",
        icon: Wrench,
        subcategories: [
          { id: "multimeter", title: "مولتی‌متر دیجیتال و تستر ولتاژ", href: "/category/tools/multimeter" },
          { id: "clamp-meter", title: "کلمپ‌آمپرمتر و میگر تستر عایق", href: "/category/tools/clamp-meter" },
          { id: "crimping", title: "پرس کابل‌شو و سیم‌لخت‌کن اتوماتیک", href: "/category/tools/crimping" },
        ],
      },
    ],
    navLinks: [
      {
        id: "special-offers",
        title: "شگفت‌انگیزها",
        href: "/offers",
        icon: Sparkles,
        isSpecial: true,
        badge: "ویژه",
      },
      {
        id: "bestsellers",
        title: "پرفروش‌ترین‌ها",
        href: "/bestsellers",
        icon: Flame,
      },
      {
        id: "industrial",
        title: "تجهیزات صنعتی",
        href: "/industrial",
        icon: Layers,
      },
      {
        id: "blog",
        title: "وبلاگ و آموزش",
        href: "/blog",
        icon: GraduationCap,
      },
      {
        id: "contact",
        title: "تماس با ما",
        href: "/contact",
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
   ۴. کامپوننت اصلی Header (۳ طبقه کامل و ماژولار)
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

  const isLoggedIn = mounted && Boolean(isAuth && authUser);
  const displayName = authUser?.name || authUser?.phone || "حساب کاربری";
  const userTargetHref = (role === "ADMIN" || authUser?.role === "ADMIN") ? "/admin" : "/profile";

  const effectiveCartCount = mounted ? liveCount : (cartCount ?? 0);

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
      categories:
        userConfig?.navigation?.categories ||
        DEFAULT_HEADER_CONFIG.navigation.categories,
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
