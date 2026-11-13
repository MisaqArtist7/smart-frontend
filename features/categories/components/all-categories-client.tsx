"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  ChevronLeft,
  ArrowLeft,
  Sparkles,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { useCategories } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/utils";
import { CATEGORIES_DATA } from "./category-carousel";

export function AllCategoriesClient() {
  const { data: serverCategories = [], isLoading } = useCategories();

  // تفکیک دسته‌های ریشه (والد) و زیردسته‌ها
  const { rootCategories, subcategoriesByParent } = useMemo(() => {
    if (!serverCategories || serverCategories.length === 0) {
      return {
        rootCategories: CATEGORIES_DATA.map((c) => ({
          id: c.id,
          name: c.title,
          slug: c.id.toString(),
          image: c.image,
          description: "تجهیزات تخصصی و استاندارد با ضمانت اصالت کالا",
        })),
        subcategoriesByParent: {} as Record<string | number, typeof serverCategories>,
      };
    }

    const activeCats = serverCategories.filter((c) => c.isActive !== false);
    const roots = activeCats.filter((c) => !c.parentId);
    const subMap: Record<number, typeof serverCategories> = {};

    activeCats.forEach((c) => {
      if (c.parentId) {
        if (!subMap[c.parentId]) subMap[c.parentId] = [];
        subMap[c.parentId].push(c);
      }
    });

    return {
      rootCategories: roots.length > 0 ? roots : activeCats,
      subcategoriesByParent: subMap,
    };
  }, [serverCategories]);

  return (
    <div className="space-y-8 sm:space-y-10 select-none">
      {/* نوار مسیر صفحه (Breadcrumb) */}
      <nav
        aria-label="مسیر صفحه"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          خانه
        </Link>
        <ChevronLeft className="size-3 text-muted-foreground/60" />
        <span className="text-foreground font-bold">دسته‌بندی‌های محصولات</span>
      </nav>

      {/* سربرگ بنر هیرو دسته‌بندی‌ها (طرح لندینگ پیج عریض) */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-6 sm:p-8 lg:p-10 shadow-lg">
        {/* المان‌های نوری و ترنسپرنت پس‌زمینه */}
        <div className="absolute -left-16 -bottom-16 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-black/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold shadow-xs">
              <Sparkles className="size-4 text-amber-300" />
              <span>راهنمای جامع کاتالوگ فروشگاه اسمارت الکتریک</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              دسته‌بندی‌های تجهیزات برق و روشنایی
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/85 leading-relaxed">
              مرور و دسترسی سریع به کلیه گروه‌های کالایی، کلید و پریز، سیم و کابل، تابلو برق، خانه هوشمند و روشنایی مدرن.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-5 py-3.5">
              <LayoutGrid className="size-6 text-white" />
              <div className="text-right">
                <span className="block text-lg font-black">{rootCategories.length} گروه</span>
                <span className="text-[11px] text-white/80">کالای اصلی فعال</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* گرید تمام‌عرض کارت‌های دسته‌بندی با افکت هاور اسلایدی */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            گروه‌های اصلی کالا
          </h2>
        </div>

        {isLoading && serverCategories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs font-bold">در حال بارگذاری دسته‌بندی‌ها...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {rootCategories.map((cat) => {
              const imageSrc = normalizeImageUrl(cat.image, "/images/categories/cables.svg");
              const targetHref = `/category/${cat.slug || cat.id}`;

              return (
                <Link
                  key={cat.id}
                  href={targetHref}
                  className="group relative block h-[200px] sm:h-[220px] md:h-[240px] w-full rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-border overflow-hidden select-none"
                >
                  {/* تصویر تمام‌صفحه */}
                  <Image
                    src={imageSrc}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="size-full object-cover transition-all duration-500 ease-out group-hover:scale-110 group-hover:blur-[4px]"
                  />

                  {/* گرادیان تیره پایین تصویر */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />

                  {/* اورلی تاریک و بلار در هاور */}
                  <div className="absolute inset-0 z-10 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* کانتینر متن: پایین در حالت عادی، مرکز در هاور */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 pointer-events-none">
                    <div className="flex flex-col items-center justify-center text-center w-full translate-y-[58px] sm:translate-y-[66px] md:translate-y-[72px] group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      {/* بج نام دسته‌بندی با بردر سفید */}
                      <span className="text-white font-bold text-xs sm:text-sm md:text-base text-center tracking-tight drop-shadow-md px-3.5 py-1.5 rounded-xl border border-white bg-black/35 backdrop-blur-[2px] transition-all duration-500 group-hover:bg-primary/95 group-hover:shadow-lg group-hover:border-white group-hover:font-black max-w-[92%] line-clamp-1">
                        {cat.name}
                      </span>

                      {/* نشانگر مشاهده محصولات در هاور */}
                      <div className="opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-8 transition-all duration-500 ease-out mt-0 group-hover:mt-2">
                        <span className="text-white/95 text-[10px] sm:text-xs font-semibold flex items-center gap-1 drop-shadow-sm">
                          <span>مشاهده محصولات</span>
                          <ArrowLeft className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* بخش نمایش درختی دسته‌بندی‌ها به همراه زیردسته‌ها */}
      <section className="space-y-6 pt-4 border-t border-border/70">
        <div className="flex items-center gap-2.5">
          <Layers className="size-5 text-primary" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            کاوش زیردسته‌ها و گروه‌های تخصصی
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {rootCategories.map((root) => {
            const subs = subcategoriesByParent[root.id as number] || [];

            return (
              <div
                key={root.id}
                className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                    <Link
                      href={`/category/${root.slug || root.id}`}
                      className="font-black text-sm sm:text-base text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>{root.name}</span>
                    </Link>
                    <Link
                      href={`/category/${root.slug || root.id}`}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>مشاهده همه</span>
                      <ChevronLeft className="size-3.5" />
                    </Link>
                  </div>

                  {root.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {root.description}
                    </p>
                  )}

                  {subs.length > 0 ? (
                    <ul className="space-y-1.5">
                      {subs.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${sub.slug}`}
                            className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            <span className="font-medium">{sub.name}</span>
                            <ChevronLeft className="size-3 text-muted-foreground/60" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/80 py-2">
                      محصولات این دسته‌بندی مستقیماً در کاتالوگ قابل دسترسی هستند.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/40">
                  <Link
                    href={`/category/${root.slug || root.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>مشاهده محصولات {root.name}</span>
                    <ArrowLeft className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

