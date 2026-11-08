import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { OffersClient } from "@/components/offers/offers-client";

export const metadata: Metadata = {
  title: "پیشنهادات شگفت‌انگیز و تخفیف‌های ویژه (افرز) | اسمارت الکتریک",
  description:
    "مشاهده و خرید جدیدترین تجهیزات و ملزومات برق ساختمانی و صنعتی با تخفیف‌های استثنایی و پیشنهادات شگفت‌انگیز روزانه در فروشگاه اسمارت الکتریک.",
  alternates: {
    canonical: "/offers",
  },
  openGraph: {
    title: "پیشنهادات شگفت‌انگیز و تخفیف‌های ویژه (افرز) | اسمارت الکتریک",
    description:
      "تجهیزات برق صنعتی و ساختمانی با تخفیف‌های شگفت‌انگیز، گارانتی اصالت کالا و ارسال سریع به سراسر ایران.",
    url: "/offers",
    siteName: "اسمارت الکتریک",
    locale: "fa_IR",
    type: "website",
  },
};

export default function OffersPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* هدر فروشگاه */}
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* نوار مسیر صفحه (Breadcrumb) */}
        <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            خانه
          </Link>
          <ChevronLeft className="size-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium">پیشنهادات شگفت‌انگیز (افرز)</span>
        </nav>

        {/* محتوای تعاملی و لیست محصولات شگفت‌انگیز */}
        <OffersClient />
      </main>

      {/* فوتر فروشگاه */}
      <Footer />
    </div>
  );
}

