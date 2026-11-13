import React, { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "کاتالوگ و لیست محصولات | فروشگاه اینترنتی اسمارت الکتریک",
  description:
    "مشاهده و خرید انواع تجهیزات برق صنعتی، ساختمانی، کلید و پریز، اتوماسیون هوشمند و ملزومات شبکه با تضمین اصالت کالا و بهترین قیمت.",
};

export default function ProductsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        <Suspense
          fallback={
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs">در حال بارگذاری کاتالوگ محصولات...</span>
            </div>
          }
        >
          <CatalogClient />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

