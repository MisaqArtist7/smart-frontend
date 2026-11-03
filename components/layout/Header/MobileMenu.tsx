"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ChevronDown,
  Headphones,
  User,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react";
import type { HeaderConfig } from "./header.types";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  config: HeaderConfig;
  cartCount?: number;
}

/**
 * منوی بازشونده موبایل (Mobile Drawer) جهت دسترسی کامل در صفحات لمسی
 */
export function MobileMenu({
  isOpen,
  onClose,
  config,
  cartCount = 0,
}: MobileMenuProps) {
  const { topBar, mainBar, navigation } = config;
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    null
  );

  // بستن منو هنگام فشردن کلید Escape و قفل اسکرول بادی
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* پس‌زمینه نیمه‌شفاف تار */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* پنل کشویی از سمت راست (RTL) */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs sm:max-w-sm flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-250">
        {/* سربرگ دراور موبایل */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <Link
            href={mainBar.logo.href}
            onClick={onClose}
            className="flex items-center gap-2"
          >
            {mainBar.logo.src ? (
              <div className="relative h-9 flex items-center shrink-0">
                <Image
                  src={mainBar.logo.src}
                  alt={mainBar.logo.alt || mainBar.logo.title || "اسمارت الکتریک"}
                  width={110}
                  height={36}
                  className="h-8 w-auto object-contain"
                />
              </div>
            ) : null}
            {mainBar.logo.title && (
              <span className="font-black text-foreground text-base">
                {mainBar.logo.title}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* بدنه اسکرول‌خور دراور */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* دکمه‌های ورود و سبد خرید در بالای منوی موبایل */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={navigation.authButton.href}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2 px-3 text-xs font-semibold shadow-xs"
            >
              <User className="size-3.5" />
              <span>{navigation.authButton.text}</span>
            </Link>
            <Link
              href={navigation.cartButton.href}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 px-3 text-xs font-semibold text-foreground hover:bg-accent"
            >
              <ShoppingCart className="size-3.5" />
              <span>{navigation.cartButton.text}</span>
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {cartCount}
              </span>
            </Link>
          </div>

          {/* دسته‌بندی‌ها */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {navigation.categoriesTitle}
            </div>
            <div className="space-y-1">
              {navigation.categories.map((cat) => {
                const CatIcon = cat.icon;
                const isExpanded = expandedCategoryId === cat.id;
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;

                return (
                  <div
                    key={cat.id}
                    className="rounded-lg border border-border/60 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-2.5 hover:bg-accent/50 transition-colors">
                      <Link
                        href={cat.href}
                        onClick={onClose}
                        className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors flex-1"
                      >
                        {CatIcon && (
                          <div className="flex size-6 items-center justify-center rounded-md bg-accent text-primary">
                            <CatIcon className="size-3.5" />
                          </div>
                        )}
                        <span>{cat.title}</span>
                      </Link>
                      {hasSubs && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategoryId(isExpanded ? null : cat.id)
                          }
                          aria-label="نمایش زیرمجموعه‌ها"
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown
                            className={`size-3.5 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {isExpanded && hasSubs && (
                      <div className="border-t border-border bg-accent/20 p-2 space-y-1">
                        {cat.subcategories!.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={onClose}
                            className="flex items-center gap-1.5 py-1 px-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="size-3 text-muted-foreground/50" />
                            <span>{sub.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* لینک‌های منو */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              پیوندهای سریع
            </div>
            <ul className="space-y-1">
              {navigation.navLinks.map((link) => {
                const LinkIcon = link.icon;
                return (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-medium transition-colors ${
                        link.isSpecial
                          ? "bg-accent/50 text-primary font-bold"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {LinkIcon && (
                          <LinkIcon
                            className={`size-4 ${
                              link.isSpecial ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        )}
                        <span>{link.title}</span>
                      </div>
                      {link.badge && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* تماس با پشتیبانی */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
                <Headphones className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">
                  {mainBar.support.label}
                </span>
                <a
                  href={mainBar.support.phone}
                  dir="ltr"
                  className="text-xs font-bold text-primary"
                >
                  {mainBar.support.displayPhone}
                </a>
              </div>
            </div>
          </div>

          {/* بنر اطلاعیه بالا و کد تخفیف در انتهای منو */}
          <div className="rounded-xl border border-dashed border-primary/40 bg-accent/20 p-3 text-center space-y-1.5">
            <p className="text-[11px] text-muted-foreground">
              {topBar.announcement.text}
            </p>
            <div className="inline-flex items-center gap-1 rounded border border-dashed border-primary px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
              <span>{topBar.discount.code}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;

