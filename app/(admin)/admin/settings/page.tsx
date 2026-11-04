"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Store, Save, Phone, Mail, MapPin, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("فروشگاه اینترنتی اسمارت الکتریک");
  const [supportPhone, setSupportPhone] = useState("۰۹۱۲۲۱۹۳۵۵۱");
  const [supportEmail, setSupportEmail] = useState("info@smart-electric.ir");
  const [shippingLimit, setShippingLimit] = useState("۵,۰۰۰,۰۰۰");
  const [address, setAddress] = useState("تهران، لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، پلاک ۱۲");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("تنظیمات فروشگاه با موفقیت به‌روزرسانی شد.");
  };

  return (
    <div className="space-y-6 select-none max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          تنظیمات فروشگاه
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          پیکربندی اطلاعات تماس، سقف ارسال رایگان، آدرس فیزیکی و سیاست‌های خرید
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* مشخصات عمومی */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="p-5 sm:p-6 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Store className="size-4.5 text-primary" />
              <span>اطلاعات پایه و هویت فروشگاه</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              عنوانی که در هدر، فوتر و متادیتاهای سئو به مشتریان نمایش داده می‌شود.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">نام برند و فروشگاه</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>شماره پشتیبانی و تماس سریع</span>
                </label>
                <Input
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  dir="ltr"
                  className="h-10 rounded-xl text-start"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>ایمیل رسمی مکاتبات</span>
                </label>
                <Input
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  dir="ltr"
                  className="h-10 rounded-xl text-start"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span>آدرس دفتر مرکزی و فروشگاه حضوری</span>
              </label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* قوانین ارسال و مالی */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="p-5 sm:p-6 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="size-4.5 text-primary" />
              <span>سیاست‌های مالی و ارسال سفارشات</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              تنظیم آستانه اعمال ارسال رایگان سفارشات در سبد خرید مشتری
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                حداقل سبد خرید برای ارسال رایگان (تومان)
              </label>
              <Input
                value={shippingLimit}
                onChange={(e) => setShippingLimit(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 px-6 py-2.5"
          >
            <Save className="size-4" />
            <span>ذخیره تغییرات تنظیمات</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
