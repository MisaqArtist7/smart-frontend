"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Headphones, Zap, Menu, X } from "lucide-react";
import type { MainBarProps } from "./header.types";

/**
 * لایه دوم: نوار میانی هدر (Main Bar)
 * - سمت راست (RTL): کامپوننت لوگو + اینپوت جستجوی کپسولی گرد با آیکون Search
 * - سمت چپ (RTL): باکس تماس با پشتیبانی شامل آیکون Headphones، متن راهنما و شماره تماس با رنگ شاخص (text-primary font-bold)
 */
export function MainBar({
  config,
  onOpenMobileMenu,
  className = "",
}: MainBarProps) {
  const { logo, search, support } = config;
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div
      className={`border-b border-border bg-background py-3.5 transition-colors ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* سمت راست: دکمه منوی موبایل (در صفحات کوچک) + لوگو + فرم جستجوی کپسولی */}
        <div className="flex flex-1 items-center gap-4 sm:gap-6 lg:gap-8">
          {/* دکمه منوی موبایل (فقط در صفحات کوچکتر از lg) */}
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="باز کردن منو"
              className="flex size-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent hover:text-accent-foreground lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Menu className="size-5" />
            </button>
          )}

          {/* کامپوننت لوگو برند */}
          <Link
            href={logo.href}
            className="group flex items-center gap-2.5 shrink-0 focus:outline-none"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Zap className="size-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-foreground text-primary transition-colors">
                {logo.title}
              </span>
              {logo.subtitle && (
                <span className="hidden sm:block text-[11px] text-muted-foreground font-medium">
                  {logo.subtitle}
                </span>
              )}
            </div>
          </Link>

          {/* اینپوت جستجوی کپسولی گرد با آیکون Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden md:flex flex-1 max-w-md lg:max-w-lg items-center"
            role="search"
          >
            <div className="flex w-full items-center rounded-full border border-border bg-card px-3.5 py-2 shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-primary/50">
              <Search className="size-4.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={search.placeholder}
                className="w-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* سمت چپ: باکس تماس با پشتیبانی */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={support.phone}
            className="group flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition-colors hover:border-border hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Headphones className="size-5" />
            </div>
            <div className="hidden sm:flex flex-col items-start text-right">
              <span className="text-xs text-muted-foreground font-medium">
                {support.label}
              </span>
              <span
                dir="ltr"
                className="text-sm font-bold text-primary tracking-wide transition-colors"
              >
                {support.displayPhone}
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* اینپوت جستجو در موبایل (صفحات زیر md) */}
      <div className="mt-3 px-4 md:hidden">
        <form onSubmit={handleSearchSubmit} role="search">
          <div className="flex w-full items-center rounded-full border border-border bg-card px-3.5 py-2 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={search.placeholder}
              className="w-full bg-transparent px-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainBar;
