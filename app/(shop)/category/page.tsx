import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { AllCategoriesClient } from "@/features/categories/components/all-categories-client";

export const metadata: Metadata = {
  title: "دسته‌بندی‌های محصولات | فروشگاه اینترنتی اسمارت الکتریک",
  description:
    "مشاهده و خرید آنلاین انواع تجهیزات برق صنعتی، ساختمانی، کلید و پریز، اتوماسیون خانه هوشمند، روشنایی و سیم و کابل در فروشگاه اسمارت الکتریک.",
  alternates: {
    canonical: "/category",
  },
};

export default function CategoryIndexPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        <AllCategoriesClient />
      </main>

      <Footer />
    </div>
  );
}
