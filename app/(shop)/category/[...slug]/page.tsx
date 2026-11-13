import React, { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { CategoryClient } from "@/features/categories";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface CategoryPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const currentSlug = slug?.[slug.length - 1] || "";

  try {
    const res = await fetch(`${API_BASE_URL}/categories/slug/${encodeURIComponent(currentSlug)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const title = data.metaTitle || `خرید محصولات ${data.name} | فروشگاه اسمارت الکتریک`;
      const description =
        data.metaDescription ||
        data.description ||
        `مشاهده لیست قیمت و خرید آنلاین انواع محصولات دسته ${data.name} با تضمین بهترین قیمت و کیفیت در اسمارت الکتریک`;
      return {
        title,
        description,
      };
    }
  } catch {
    // در صورت بروز خطا در دریافت متادیتا، فال‌بک امن
  }

  return {
    title: `دسته‌بندی محصولات | فروشگاه اینترنتی اسمارت الکتریک`,
    description: "خرید آنلاین انواع تجهیزات برقی، کلید و پریز و خانه هوشمند در فروشگاه اسمارت الکتریک.",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const currentSlug = slug?.[slug.length - 1] || "";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        <Suspense
          fallback={
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs">در حال بارگذاری اطلاعات دسته‌بندی...</span>
            </div>
          }
        >
          <CategoryClient slug={currentSlug} fullPath={slug} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

