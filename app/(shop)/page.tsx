import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* کامپوننت هدر ۳ طبقه */}
      <Header cartCount={3} />

      {/* محتوای نمونه جهت نمایش تعامل و چسبندگی هدر */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            فروشگاه تخصصی اسمارت الکتریک
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            هدر ۳ طبقه هوشمند و ماژولار فروشگاه
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6">
            طراحی شده با استانداردهای توکن سیستم shadcn، پشتیبانی کامل از RTL، مدیریت داینامیک سبد خرید، دراپ‌داون دسته‌بندی‌ها و بدون هاردکد کردن مقادیر رنگی و متنی.
          </p>
        </div>
      </main>

      {/* کامپوننت فوتر */}
      <Footer />
    </div>
  );
}
