"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "faq-1",
    question: "آیا امکان خرید حضوری یا دریافت پیش‌فاکتور رسمی وجود دارد؟",
    answer:
      "بله، فروشگاه اسمارت الکتریک علاوه بر فروش اینترنتی، امکان مراجعه حضوری به دفتر پخش و همچنین صدور پیش‌فاکتور رسمی شرکتی دارای شناسه ملی و کد اقتصادی را برای کلیه سازمان‌ها، کارخانجات و پیمانکاران محترم فراهم نموده است.",
  },
  {
    id: "faq-2",
    question: "شرایط گارانتی و ضمانت اصالت کالاها به چه صورت است؟",
    answer:
      "کلیه محصولات ارائه‌شده در اسمارت الکتریک دارای ضمانت اصالت فیزیکی ۱۰۰٪ اورجینال می‌باشند. تجهیزات شبکه و سوئیچ‌های صنعتی HRUI با گارانتی تعویض شرکتی معتبر و تست سلامت در محل به مشتریان تحویل داده می‌شوند.",
  },
  {
    id: "faq-3",
    question: "سفارش‌ها چگونه و در چه بازه زمانی به سراسر کشور ارسال می‌شوند؟",
    answer:
      "سفارش‌های شهر تهران در صورت ثبت تا ساعت ۱۴، در همان روز توسط پیک اختصاصی تحویل می‌گردند. سفارش‌های سایر استان‌ها نیز روزانه از طریق تیپاکس، پست پیشتاز، چاپار و باربری‌های معتبر ارسال شده و ظرف ۲۴ تا ۴۸ ساعت کاری به دست خریدار می‌رسند.",
  },
  {
    id: "faq-4",
    question: "روش‌های پرداخت در سایت چگونه است؟",
    answer:
      "شما می‌توانید مبلغ سفارش را به صورت اینترنتی از طریق کلیه کارت‌های عضو شتاب پرداخت نمایید. همچنین برای مبالغ بالا یا سفارش‌های سازمانی، امکان پرداخت کارت‌به‌کارت و واریز به حساب بانکی حقوقی شرکت فراهم می‌باشد.",
  },
  {
    id: "faq-5",
    question: "در صورت نیاز به مشاوره فنی برای انتخاب محصول چه اقدامی انجام دهیم؟",
    answer:
      "کارشناسان فنی برق و شبکه اسمارت الکتریک همه‌روزه از ساعت ۹ الی ۱۸ از طریق شماره مستقیم ۰۹۱۲۲۱۹۳۵۵۱ و پشتیبانی آنلاین سایت، آماده راهنمایی شما در انتخاب دقیق مشخصات فنی کالا و تجهیز پروژه هستند.",
  },
];

export interface FaqSectionProps {
  className?: string;
}

/**
 * بخش سوالات متداول خریداران همراه با آکاردئون تعاملی و زیبا
 */
export function FaqSection({ className }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      dir="rtl"
      aria-label="سوالات متداول"
      className={cn("w-full py-4 select-none", className)}
    >
      {/* سربرگ بخش: دات قرمز شاخص + عنوان */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="size-2.5 rounded-full bg-primary inline-block shrink-0 shadow-xs" />
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground">
            پرسش‌های متداول خریداران
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            پاسخ به رایج‌ترین سوالات شما درباره خرید، ضمانت کالا و ارسال سفارش‌ها
          </p>
        </div>
      </div>

      {/* آکاردئون سوالات */}
      <div className="space-y-3">
        {FAQ_DATA.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border transition-all duration-200 overflow-hidden",
                isOpen
                  ? "border-primary/30 bg-card shadow-xs"
                  : "border-border/80 bg-card/60 hover:bg-card hover:border-border"
              )}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-start cursor-pointer focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <HelpCircle className="size-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {item.question}
                  </span>
                </div>

                <ChevronDown
                  className={cn(
                    "size-4.5 text-muted-foreground shrink-0 transition-transform duration-200 ms-2",
                    isOpen && "rotate-180 text-primary"
                  )}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 animate-in fade-in-50 duration-200">
                  <p className="ps-11">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FaqSection;

