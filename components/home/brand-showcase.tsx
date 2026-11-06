import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandItem {
  id: string;
  name: string;
  latinName: string;
  category: string;
  badge: string;
  href: string;
}

const TOP_BRANDS: BrandItem[] = [
  {
    id: "hrui",
    name: "اچ‌آر‌یو‌آی",
    latinName: "HRUI",
    category: "سوئیچ‌های صنعتی PoE و شبکه",
    badge: "نمایندگی رسمی",
    href: "/products?brand=hrui",
  },
  {
    id: "legrand",
    name: "لگراند فرانسه",
    latinName: "Legrand",
    category: "کابل شبکه و تجهیزات پسیو",
    badge: "اورجینال ۱۰۰٪",
    href: "/products?brand=legrand",
  },
  {
    id: "schneider",
    name: "اشنایدر الکتریک",
    latinName: "Schneider",
    category: "کلیدهای اتوماتیک و برق صنعتی",
    badge: "استاندارد اروپا",
    href: "/products?brand=schneider",
  },
  {
    id: "siemens",
    name: "زیمنس آلمان",
    latinName: "Siemens",
    category: "اتوماسیون و کلیدهای قدرت",
    badge: "ضمانت کیفیت",
    href: "/products?brand=siemens",
  },
  {
    id: "meanwell",
    name: "مین ول تایوان",
    latinName: "Mean Well",
    category: "منابع تغذیه ریلی و صنعتی",
    badge: "کیفیت برتر",
    href: "/products?brand=meanwell",
  },
  {
    id: "simia",
    name: "کابل سیمیا",
    latinName: "Simia",
    category: "سیم و کابل نسوز ساختمانی",
    badge: "نشان استاندارد",
    href: "/products?brand=simia",
  },
];

export interface BrandShowcaseProps {
  className?: string;
}

/**
 * بخش برندهای برتر و معتبر فروشگاه اسمارت الکتریک
 */
export function BrandShowcase({ className }: BrandShowcaseProps) {
  return (
    <section
      dir="rtl"
      aria-label="برندهای معتبر"
      className={cn("w-full py-4 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز رنگ شاخص + عنوان */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
              برندهای معتبر و همکاران تجاری
            </h2>
          </div>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group"
        >
          <span>مشاهده همه کاتالوگ</span>
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* گرید برندها */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {TOP_BRANDS.map((brand) => (
          <Link
            key={brand.id}
            href={brand.href}
            className="group relative flex flex-col justify-between items-center text-center p-4 rounded-2xl border border-border/80 bg-card hover:bg-card/90 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {/* بج کیفیت بالای کارت */}
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors bg-muted/50 px-2 py-0.5 rounded-full mb-3">
              {brand.badge}
            </span>

            {/* لوگوتایپ لاتین برجسته */}
            <div className="size-14 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-center mb-3 group-hover:bg-primary/5 transition-colors">
              <span className="font-black text-sm sm:text-base tracking-tighter text-foreground group-hover:text-primary transition-colors">
                {brand.latinName}
              </span>
            </div>

            {/* نام فارسی و دسته‌بندی */}
            <div className="space-y-0.5 w-full">
              <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {brand.name}
              </h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {brand.category}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default BrandShowcase;
