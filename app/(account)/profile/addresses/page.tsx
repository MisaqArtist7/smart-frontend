"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  Phone,
  User as UserIcon,
  Mail,
  Home,
  Building2,
} from "lucide-react";
import { useAccountStore } from "@/lib/account-store";
import { toPersianDigits, type Address } from "@/lib/account-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ولیدیشن فرم آدرس با Zod طبق الگوهای استاندارد
const addressFormSchema = z.object({
  title: z.string().min(2, "عنوان آدرس الزامی است (مثال: محل کار یا خانه)"),
  receiverName: z.string().min(2, "نام تحویل‌گیرنده الزامی است"),
  receiverPhone: z
    .string()
    .regex(/^09[0-9]{9}$/, "شماره تماس باید با 09 شروع شده و ۱۱ رقم باشد"),
  province: z.string().min(2, "انتخاب یا ورود استان الزامی است"),
  city: z.string().min(2, "ورود نام شهر الزامی است"),
  addressLine: z.string().min(8, "نشانی کامل پستی باید حداقل ۸ کاراکتر باشد"),
  postalCode: z.string().regex(/^[0-9]{10}$/, "کد پستی باید دقیقاً ۱۰ رقم باشد"),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

const IRAN_PROVINCES = [
  "تهران",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "البرز",
  "آذربایجان شرقی",
  "خوزستان",
  "مازندران",
  "گیلان",
  "کرمان",
  "قم",
  "یزد",
  "هرمزگان",
  "کرمانشاه",
];

export default function ProfileAddressesPage() {
  const addresses = useAccountStore((s) => s.addresses);
  const addAddress = useAccountStore((s) => s.addAddress);
  const updateAddress = useAccountStore((s) => s.updateAddress);
  const deleteAddress = useAccountStore((s) => s.deleteAddress);
  const setDefaultAddress = useAccountStore((s) => s.setDefaultAddress);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDefaultChecked, setIsDefaultChecked] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      title: "",
      receiverName: "",
      receiverPhone: "",
      province: "تهران",
      city: "تهران",
      addressLine: "",
      postalCode: "",
      isDefault: false,
    },
  });

  // باز کردن مدال برای افزودن آدرس جدید
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsDefaultChecked(addresses.length === 0);
    reset({
      title: "",
      receiverName: "میثاق هنرمند",
      receiverPhone: "09122193551",
      province: "تهران",
      city: "تهران",
      addressLine: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  // باز کردن مدال برای ویرایش آدرس
  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsDefaultChecked(addr.isDefault);
    reset({
      title: addr.title,
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      province: addr.province,
      city: addr.city,
      addressLine: addr.addressLine,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  // ثبت یا ویرایش آدرس
  const onSubmit = (values: AddressFormValues) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, values);
      toast.success("آدرس با موفقیت ویرایش شد.");
    } else {
      addAddress(values);
      toast.success("آدرس جدید به لیست نشانی‌های شما افزوده شد.");
    }
    setIsModalOpen(false);
  };

  // حذف آدرس با تایید
  const handleDelete = (addr: Address) => {
    if (window.confirm(`آیا از حذف نشانی «${addr.title}» اطمینان دارید؟`)) {
      deleteAddress(addr.id);
      toast.success("آدرس با موفقیت حذف گردید.");
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* سربرگ بخش آدرس‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            آدرس‌های من
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مدیریت نشانی‌های تحویل سفارش، تعیین آدرس پیش‌فرض و ویرایش مشخصات گیرنده
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 shrink-0"
        >
          <Plus className="size-4" />
          <span>افزودن آدرس جدید</span>
        </Button>
      </div>

      {/* گرید کارت‌های آدرس */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {addresses.length === 0 ? (
          <Card className="col-span-full rounded-2xl border-border bg-card p-10 text-center">
            <MapPin className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <div className="font-bold text-sm text-foreground">
              هنوز آدرسی ثبت نکرده‌اید
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              برای ثبت سفارش و ارسال سریع، اولین آدرس تحویل خود را اضافه نمایید.
            </p>
            <Button onClick={handleOpenAdd} size="sm" className="rounded-xl">
              ثبت اولین آدرس
            </Button>
          </Card>
        ) : (
          addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`rounded-2xl border transition-all duration-300 relative overflow-hidden bg-card ${
                addr.isDefault
                  ? "border-primary/50 shadow-sm shadow-primary/5"
                  : "border-border shadow-xs hover:border-border/80"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
                {/* ردیف عنوان و بَج پیش‌فرض */}
                <div className="flex items-center justify-between pb-3 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    {addr.title.includes("کار") || addr.title.includes("شرکت") ? (
                      <Building2 className="size-4.5 text-primary" />
                    ) : (
                      <Home className="size-4.5 text-primary" />
                    )}
                    <span className="font-black text-sm text-foreground">
                      {addr.title}
                    </span>
                  </div>

                  {addr.isDefault ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                      پیش‌فرض
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultAddress(addr.id);
                        toast.success(`نشانی «${addr.title}» به عنوان آدرس پیش‌فرض تنظیم شد.`);
                      }}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Check className="size-3" />
                      <span>انتخاب به عنوان پیش‌فرض</span>
                    </button>
                  )}
                </div>

                {/* مشخصات گیرنده و آدرس */}
                <div className="space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span>تحویل‌گیرنده: {addr.receiverName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground font-mono">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span>شماره تماس: {toPersianDigits(addr.receiverPhone)}</span>
                  </div>

                  <div className="flex items-start gap-2 text-muted-foreground pt-1">
                    <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {addr.province}، {addr.city}، {addr.addressLine}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground font-mono pt-1">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span>کد پستی: {toPersianDigits(addr.postalCode)}</span>
                  </div>
                </div>

                {/* دکمه‌های عملیات ویرایش و حذف */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(addr)}
                    className="h-8 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Edit className="size-3.5" />
                    <span>ویرایش</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(addr)}
                    className="h-8 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    <span>حذف</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* مدال فرم افزودن / ویرایش آدرس */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {editingAddress ? "ویرایش نشانی پستی" : "افزودن آدرس جدید"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              اطلاعات تحویل‌گیرنده و آدرس دقیق پستی را به همراه کدپستی ۱۰ رقمی وارد فرمایید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* عنوان آدرس */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  عنوان آدرس (مثال: منزل، شرکت یا انبار) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("title")}
                  placeholder="محل کار، خانه، کارگاه..."
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-[11px] text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* نام تحویل‌گیرنده */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  نام و نام خانوادگی گیرنده <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("receiverName")}
                  placeholder="نام کامل تحویل‌گیرنده"
                  className={errors.receiverName ? "border-destructive" : ""}
                />
                {errors.receiverName && (
                  <p className="text-[11px] text-destructive">{errors.receiverName.message}</p>
                )}
              </div>

              {/* شماره موبایل گیرنده */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شماره موبایل گیرنده <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("receiverPhone")}
                  placeholder="09121234567"
                  dir="ltr"
                  className={errors.receiverPhone ? "border-destructive text-start" : "text-start"}
                />
                {errors.receiverPhone && (
                  <p className="text-[11px] text-destructive">{errors.receiverPhone.message}</p>
                )}
              </div>

              {/* استان */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  استان <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("province")}
                    className="flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.province && (
                  <p className="text-[11px] text-destructive">{errors.province.message}</p>
                )}
              </div>

              {/* شهر */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شهر <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("city")}
                  placeholder="تهران"
                  className={errors.city ? "border-destructive" : ""}
                />
                {errors.city && (
                  <p className="text-[11px] text-destructive">{errors.city.message}</p>
                )}
              </div>

              {/* کد پستی */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  کد پستی ۱۰ رقمی <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("postalCode")}
                  placeholder="1144893456"
                  maxLength={10}
                  dir="ltr"
                  className={errors.postalCode ? "border-destructive text-start" : "text-start"}
                />
                {errors.postalCode && (
                  <p className="text-[11px] text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              {/* نشانی کامل پستی */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  نشانی کامل پستی <span className="text-destructive">*</span>
                </label>
                <Textarea
                  {...register("addressLine")}
                  placeholder="نام خیابان، کوچه، پلاک، طبقه و واحد..."
                  rows={3}
                  className={errors.addressLine ? "border-destructive" : ""}
                />
                {errors.addressLine && (
                  <p className="text-[11px] text-destructive">{errors.addressLine.message}</p>
                )}
              </div>

              {/* تعیین به عنوان آدرس پیش‌فرض */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    انتخاب به عنوان آدرس پیش‌فرض تحویل کالا
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    سفارش‌های جدید شما به طور خودکار به این نشانی فرستاده خواهند شد.
                  </div>
                </div>

                <Switch
                  checked={isDefaultChecked}
                  onCheckedChange={(checked) => {
                    setIsDefaultChecked(checked);
                    setValue("isDefault", checked);
                  }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs sm:text-sm"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
              >
                {editingAddress ? "ذخیره تغییرات" : "ثبت آدرس"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
