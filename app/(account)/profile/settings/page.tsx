"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  UserCog,
  Save,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Headphones,
  Info,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toPersianDigits } from "@/lib/account-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("لطفاً نام و نام خانوادگی را وارد فرمایید.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("مشخصات حساب کاربری با موفقیت ذخیره شد.");
    }, 400);
  };

  return (
    <div className="space-y-6 select-none max-w-3xl">
      {/* سربرگ بخش اطلاعات حساب */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          اطلاعات حساب کاربری
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          مشاهده، ویرایش نام کاربری، وضعیت احراز هویت و امنیت حساب
        </p>
      </div>

      {/* کارت فرم مشخصات کاربری */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/70">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              <span>مشخصات فردی و هویتی</span>
            </CardTitle>

            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1 px-2.5 py-1">
              <ShieldCheck className="size-3.5" />
              <span>مشتری گرامی</span>
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            این نام در فاکتورهای رسمی و برچسب‌های مرسوله پستی درج خواهد شد.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* فیلد نام و نام خانوادگی */}
            <div className="space-y-1.5">
              <label htmlFor="user-fullname" className="text-xs font-bold text-foreground">
                نام و نام خانوادگی <span className="text-destructive">*</span>
              </label>
              <Input
                id="user-fullname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام و نام خانوادگی کامل"
                className="h-10 rounded-xl"
              />
            </div>

            {/* فیلد شماره موبایل (غیرقابل ویرایش) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="user-phone" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>شماره تلفن همراه (شناسه ورود)</span>
                </label>

                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <Lock className="size-3 text-muted-foreground" />
                  <span>غیرقابل تغییر</span>
                </span>
              </div>

              <div className="relative">
                <Input
                  id="user-phone"
                  value={toPersianDigits(user?.phone || "")}
                  disabled
                  readOnly
                  dir="ltr"
                  className="h-10 rounded-xl bg-muted/40 font-mono text-muted-foreground cursor-not-allowed select-none text-start pe-9"
                />
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
              </div>

              {/* یادداشت راهنمای شماره موبایل */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground leading-relaxed mt-2">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  به دلیل لزوم حفظ امنیت تراکنش‌ها و احراز هویت پیامکی، تغییر شماره موبایل صرفاً از طریق هماهنگی با پشتیبانی امکان‌پذیر است.
                </span>
              </div>
            </div>

            {/* فیلد وضعیت عضویت و تاریخ ثبت نام */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-border/80 bg-background flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-4.5" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">وضعیت حساب:</div>
                  <div className="text-xs font-bold text-foreground mt-0.5">
                    فعال و تایید شده
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar className="size-4.5" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">تاریخ پیوستن:</div>
                  <div className="text-xs font-bold text-foreground font-mono mt-0.5">
                    {user.registeredAt}
                  </div>
                </div>
              </div>
            </div>

            {/* دکمه ذخیره تغییرات */}
            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 px-6 py-2.5"
              >
                <Save className="size-4" />
                <span>{isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* کارت راهنما و پشتیبانی سریع */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Headphones className="size-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">
                نیاز به راهنمایی یا تغییر شماره تماس دارید؟
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                تیم پشتیبانی اسمارت الکتریک همه روزه از ساعت ۹ الی ۱۸ پاسخگوی شماست.
              </div>
            </div>
          </div>

          <Link
            href="/contact-us"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-xl border-border text-xs font-bold shrink-0 self-start sm:self-auto",
            })}
          >
            <span>ارتباط با پشتیبانی</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
