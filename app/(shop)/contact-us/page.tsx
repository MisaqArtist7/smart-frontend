import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { ContactUsClient } from "@/components/contact/contact-us-client";

export const metadata: Metadata = {
  title: "تماس با ما | اسمارت الکتریک",
  description:
    "ارتباط مستقیم با تیم پشتیبانی و کارشناسان فنی فروشگاه اینترنتی تجهیزات و ملزومات برق ساختمانی و صنعتی اسمارت الکتریک.",
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: "تماس با ما | اسمارت الکتریک",
    description:
      "ارتباط مستقیم با تیم پشتیبانی و کارشناسان فنی فروشگاه اینترنتی اسمارت الکتریک جهت پیگیری سفارش، مشاوره فنی و خرید تجهیزات.",
    url: "/contact-us",
    siteName: "اسمارت الکتریک",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ContactUsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* هدر فروشگاه */}
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* نوار ناوبری متنی (Breadcrumb) */}
        <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            خانه
          </Link>
          <ChevronLeft className="size-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium">تماس با ما</span>
        </nav>

        {/* هدر و توضیحات معرفی صفحه */}
        <div className="mb-10 space-y-2 border-b border-border/60 pb-6 text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            پشتیبانی و ارتباط مستقیم
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            تماس با ما
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            تیم کارشناسان فنی و پشتیبانی اسمارت الکتریک آماده پاسخگویی به پرسش‌ها، ارائه مشاوره تخصصی خرید تجهیزات الکتریکی و پیگیری سفارش‌های شما هستند.
          </p>
        </div>

        {/* کلاینت کامپوننت فرم پیام و اطلاعات تماس */}
        <ContactUsClient />
      </main>

      {/* فوتر فروشگاه */}
      <Footer />
    </div>
  );
}
