import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import HeroCarousel from "@/components/home/hero-carousel";
import CategoryCarousel from "@/components/home/category-carousel";
import SpecialOffers from "@/components/home/special-offers";
import LatestProducts from "@/components/home/latest-products";
import PromoBanners from "@/components/home/promo-banners";
import BrandShowcase from "@/components/home/brand-showcase";
import B2BConsultation from "@/components/home/b2b-consultation";
import BlogSection from "@/components/home/blog-section";
import FaqSection from "@/components/home/faq-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* کامپوننت هدر ۳ طبقه */}
      <Header cartCount={3} />

      {/* محتوای اصلی و کامل صفحه نخست */}
      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* ۱. اسلایدر بنر اصلی هیرو (Hero Carousel) */}
        <HeroCarousel />

        {/* ۲. اسلایدر دسته‌بندی محصولات (Category Carousel) */}
        <CategoryCarousel />

        {/* ۳. بخش پیشنهاد شگفت‌انگیز همراه با تایمر معکوس (Special Offers) */}
        <SpecialOffers />

        {/* ۴. اسلایدر جدید ترین محصولات ما متصل به دیتابیس (Latest Products) */}
        <LatestProducts />

        {/* ۵. بنرهای دوقلوی تبلیغاتی کنار هم (۷ و ۸) */}
        <PromoBanners />

        {/* ۶. برندهای معتبر و همکاران تجاری (Brand Showcase) */}
        <BrandShowcase />

        {/* ۷. بخش مشاوره فنی، خرید پروژه‌ای و استعلام پیش‌فاکتور رسمی B2B */}
        <B2BConsultation />

        {/* ۸. مقالات آموزشی و راهنمای تخصصی خرید (Blog Section) */}
        <BlogSection />

        {/* ۹. سوالات متداول خریداران (FAQ Section) */}
        <FaqSection />
      </main>

      {/* کامپوننت فوتر کامل و مدرن */}
      <Footer />
    </div>
  );
}
