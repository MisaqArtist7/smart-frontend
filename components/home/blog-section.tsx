import React from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPostItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  href: string;
}

const FEATURED_POSTS: BlogPostItem[] = [
  {
    id: "post-1",
    title: "راهنمای جامع خرید سوئیچ شبکه صنعتی PoE و تفاوت آن با سوئیچ معمولی",
    excerpt:
      "چرا در محیط‌های کارخانه‌ای و سوله‌ها باید از سوئیچ‌های صنعتی مقاوم در برابر نویز و نوسان حرارتی استفاده کرد؟",
    category: "شبکه و PoE",
    date: "۱۴ آبان ۱۴۰۳",
    readTime: "۵ دقیقه مطالعه",
    href: "/about-us",
  },
  {
    id: "post-2",
    title: "تفاوت کابل شبکه Cat6 SFTP تمام مس با کابل‌های آلومینیومی (CCA)",
    excerpt:
      "بررسی افت سیگنال، استانداردهای مقاومت در برابر حریق (LSZH) و نحوه تشخیص کابل اورجینال لگراند در بازار برق.",
    category: "سیم و کابل",
    date: "۱۰ آبان ۱۴۰۳",
    readTime: "۴ دقیقه مطالعه",
    href: "/about-us",
  },
  {
    id: "post-3",
    title: "راهنمای هوشمندسازی روشنایی ساختمان با کلیدهای لمسی زیگبی و وای‌فای",
    excerpt:
      "چگونه بدون نیاز به تخریب سیم‌کشی سنتی، کلید و پریزهای خانه را به سیستم هوشمند و کنترل با موبایل مجهز کنیم؟",
    category: "خانه هوشمند",
    date: "۰۶ آبان ۱۴۰۳",
    readTime: "۶ دقیقه مطالعه",
    href: "/about-us",
  },
];

export interface BlogSectionProps {
  className?: string;
}

/**
 * بخش آخرین مقالات و راهنمای تخصصی خرید
 */
export function BlogSection({ className }: BlogSectionProps) {
  return (
    <section
      dir="rtl"
      aria-label="خواندنی‌ها و راهنمای خرید"
      className={cn("w-full py-4 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز شاخص + عنوان */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            خواندنی‌ها و راهنمای تخصصی خرید
          </h2>
        </div>

        <Link
          href="/about-us"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group"
        >
          <span>مشاهده همه مقالات</span>
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* کارت‌های مقالات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {FEATURED_POSTS.map((post) => (
          <Link
            key={post.id}
            href={post.href}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div>
              {/* تگ دسته‌بندی و زمان مطالعه */}
              <div className="flex items-center justify-between gap-2 text-[11px] mb-3">
                <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>

                <div className="flex items-center gap-1 text-muted-foreground font-medium">
                  <Clock className="size-3" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              {/* عنوان مقاله */}
              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                {post.title}
              </h3>

              {/* خلاصه متن */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {post.excerpt}
              </p>
            </div>

            {/* تاریخ و لینک ادامه مطلب */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="size-3 text-muted-foreground" />
                <span>{post.date}</span>
              </div>

              <span className="font-bold text-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                <span>مطالعه مقاله</span>
                <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default BlogSection;
