import React, { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { SearchClient } from "@/features/search";
import { Loader2 } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || resolvedParams.search || "";

  return {
    title: query
      ? `نتایج جستجو برای «${query}» | فروشگاه اینترنتی اسمارت الکتریک`
      : "جستجوی محصولات | فروشگاه اینترنتی اسمارت الکتریک",
    description: query
      ? `مشاهده نتایج جستجو و لیست محصولات برقی و الکتریکی منطبق با «${query}» با بهترین قیمت در اسمارت الکتریک.`
      : "جستجوی انواع تجهیزات برق ساختمانی، صنعتی، کلید و پریز و ملزومات هوشمند در فروشگاه اسمارت الکتریک.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function SearchPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        <Suspense
          fallback={
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs font-bold">در حال بارگذاری نتایج جستجو...</span>
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

