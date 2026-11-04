"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  ChevronDown,
  ShoppingCart,
  User,
  ChevronLeft,
} from "lucide-react";
import type { NavigationBarProps } from "./header.types";

/**
 * لایه سوم: نوار ناوبری اصلی (Navigation Bar)
 * - سمت راست (RTL): دراپ‌داون دسته‌بندی‌ها (LayoutGrid و ChevronDown) + لینک‌های ناوبری (map شده از آرایه کانفیگ)
 * - سمت چپ (RTL): دکمه سبد خرید با بج دایره‌ای (bg-primary text-primary-foreground) + دکمه ورود/عضویت (bg-primary text-primary-foreground)
 */
export function NavigationBar({
  config,
  cartCount = 0,
  className = "",
}: NavigationBarProps) {
  const { categoriesTitle, categories, navLinks, authButton, cartButton } =
    config;

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // بستن دراپ‌داون هنگام کلیک در خارج از کامپوننت
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoriesOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoriesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav
      className={`transition-colors bg-white/88 ${className}`}
      aria-label="ناوبری اصلی"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
        {/* سمت راست: دراپ‌داون دسته‌بندی‌ها + لینک‌های اصلی منو */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* بخش دراپ‌داون دسته‌بندی‌ها */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              aria-expanded={isCategoriesOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <LayoutGrid className="size-4.5 text-primary" />
              <span>{categoriesTitle}</span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${
                  isCategoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* پنل بازشونده دسته‌بندی‌ها (Mega Dropdown) */}
            {isCategoriesOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-[320px] sm:w-[480px] md:w-[620px] rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
                  {categories.map((category) => {
                    const CategoryIcon = category.icon;
                    return (
                      <div
                        key={category.id}
                        className="rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-accent/40"
                      >
                        <Link
                          href={category.href}
                          onClick={() => setIsCategoriesOpen(false)}
                          className="flex items-center justify-between font-semibold text-foreground text-sm hover:text-primary transition-colors mb-1.5"
                        >
                          <div className="flex items-center gap-2">
                            {CategoryIcon && (
                              <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-primary">
                                <CategoryIcon className="size-4" />
                              </div>
                            )}
                            <span>{category.title}</span>
                          </div>
                          {category.badge && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {category.badge}
                            </span>
                          )}
                        </Link>

                        {/* زیرمجموعه‌ها */}
                        {category.subcategories && category.subcategories.length > 0 && (
                          <ul className="mt-1 space-y-1 pr-9">
                            {category.subcategories.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={sub.href}
                                  onClick={() => setIsCategoriesOpen(false)}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
                                >
                                  <ChevronLeft className="size-3 text-muted-foreground/60" />
                                  <span>{sub.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* جداکننده ظریف بین دسته‌بندی و لینک‌ها در دسکتاپ */}
          <div className="hidden lg:block h-5 w-px bg-border" />

          {/* لیست لینک‌های اصلی منو (رندر شده با map) */}
          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      item.isSpecial
                        ? "text-primary hover:bg-accent font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {ItemIcon && (
                      <ItemIcon
                        className={`size-4 ${
                          item.isSpecial ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    )}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* سمت چپ: دکمه سبد خرید با بج تعداد + دکمه ورود/عضویت */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* دکمه سبد خرید با بج نمایش تعداد (دایره با bg-primary text-primary-foreground) */}
          <Link
            href={cartButton.href}
            className="relative flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`${cartButton.text}، ${cartCount} کالا`}
          >
            <div className="relative">
              <ShoppingCart className="size-4.5" />
              {/* بج نمایش تعداد محصولات */}
              <span className="absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-xs">
                {cartCount}
              </span>
            </div>
            <span className="hidden sm:inline font-medium">
              {cartButton.text}
            </span>
          </Link>

          {/* دکمه ورود / عضویت با کلاس استاندارد bg-primary text-primary-foreground */}
          <Link
            href={authButton.href}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-xs transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <User className="size-4" />
            <span>{authButton.text}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;

