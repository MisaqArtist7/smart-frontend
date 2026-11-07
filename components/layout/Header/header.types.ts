import type React from "react";

/**
 * تایپ‌های مربوط به آیتم‌های ناوبری
 */
export interface HeaderNavItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSpecial?: boolean;
}

/**
 * تایپ‌های زیرمجموعه دسته‌بندی‌ها
 */
export interface HeaderCategorySubItem {
  id: string;
  title: string;
  href: string;
}

/**
 * تایپ‌های دسته‌بندی اصلی محصولات
 */
export interface HeaderCategoryItem {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  subcategories?: HeaderCategorySubItem[];
}

/**
 * کانفیگ نوار بالایی (Top Bar)
 */
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

/**
 * کانفیگ نوار میانی (Main Bar)
 */
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

/**
 * کانفیگ نوار ناوبری (Navigation Bar)
 */
export interface HeaderNavigationConfig {
  categoriesTitle: string;
  categories: HeaderCategoryItem[];
  navLinks: HeaderNavItem[];
  authButton: {
    text: string;
    href: string;
    isLoggedIn?: boolean;
    userName?: string;
  };
  cartButton: {
    text: string;
    href: string;
  };
}

/**
 * آبجکت جامع کانفیگ هدر
 */
export interface HeaderConfig {
  topBar: HeaderTopBarConfig;
  mainBar: HeaderMainBarConfig;
  navigation: HeaderNavigationConfig;
}

/**
 * پراپ‌های کامپوننت اصلی Header
 */
export interface HeaderProps {
  /**
   * تعداد اقلام موجود در سبد خرید (پیش‌فرض: ۰)
   */
  cartCount?: number;

  /**
   * کانفیگ اختیاری جهت شخصی‌سازی تمام بخش‌ها بدون هاردکد
   */
  config?: Partial<HeaderConfig>;

  /**
   * کلاس‌های اضافی Tailwind
   */
  className?: string;

  /**
   * آیا هدر در بالای صفحه چسبان (sticky) باشد؟ (پیش‌فرض: true)
   */
  sticky?: boolean;
}

/**
 * پراپ‌های زیرکامپوننت نوار بالایی
 */
export interface TopBarProps {
  config: HeaderTopBarConfig;
  className?: string;
}

/**
 * پراپ‌های زیرکامپوننت نوار میانی
 */
export interface MainBarProps {
  config: HeaderMainBarConfig;
  cartCount?: number;
  cartHref?: string;
  onOpenMobileMenu?: () => void;
  className?: string;
}

/**
 * پراپ‌های زیرکامپوننت نوار ناوبری
 */
export interface NavigationBarProps {
  config: HeaderNavigationConfig;
  cartCount?: number;
  className?: string;
}

