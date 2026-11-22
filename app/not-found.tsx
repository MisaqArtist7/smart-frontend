import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { buttonVariants } from "@/components/ui/button";
import { Home, ShoppingBag, Grid3X3, PhoneCall, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-xl w-full text-center space-y-6">
          {/* نماد گرافیکی ۴۰۴ */}
          <div className="relative mx-auto w-fit">
            <div className="size-24 sm:size-28 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-xs">
              <ZapOff className="size-12 sm:size-14 text-primary stroke-[1.75]" />
            </div>
            <span className="absolute -top-3 -end-4 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-black shadow-sm font-mono">
              ۴۰۴
            </span>
          </div>

          {/* تیتر و توضیحات */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              صفحه مورد نظر یافت نشد!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              به نظر می‌رسد آدرس واردشده اشتباه است یا این صفحه حذف و جابه‌جا شده است.
              می‌توانید از مسیرهای زیر به خرید خود ادامه دهید:
            </p>
          </div>

          {/* دکمه‌های هدایت */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-xl gap-2 font-bold shadow-sm"
              )}
            >
              <Home className="size-4" />
              بازگشت به صفحه اصلی
            </Link>

            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-xl gap-2 font-semibold"
              )}
            >
              <ShoppingBag className="size-4" />
              مشاهده محصولات
            </Link>
          </div>

          {/* لینک‌های کمکی */}
          <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link
              href="/category"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Grid3X3 className="size-3.5" />
              دسته‌بندی تجهیزات برقی
            </Link>
            <Link
              href="/contact-us"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <PhoneCall className="size-3.5" />
              تماس و پشتیبانی
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
