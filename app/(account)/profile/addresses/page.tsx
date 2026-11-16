"use client";

import React, { useState } from "react";
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
  Loader2,
} from "lucide-react";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  ApiError,
  type Address,
} from "@/lib/api";
import { formatAddressSummary } from "@/lib/address-utils";
import { toPersianDigits } from "@/lib/account-data";
import { AddressFormDialog } from "@/components/address/address-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleDelete = async (addr: Address) => {
    if (window.confirm(`آیا از حذف نشانی «${addr.title}» اطمینان دارید؟`)) {
      try {
        await deleteAddressMutation.mutateAsync(addr.id);
        toast.success("آدرس با موفقیت حذف گردید.");
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error("خطا در حذف آدرس رخ داد.");
        }
      }
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      await setDefaultAddressMutation.mutateAsync(addr.id);
      toast.success(`نشانی «${addr.title}» به عنوان آدرس پیش‌فرض تنظیم شد.`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("خطا در تنظیم آدرس پیش‌فرض رخ داد.");
      }
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
            مدیریت نشانی‌های تحویل سفارش، تعیین آدرس پیش‌فرض و ویرایش مشخصات گیرنده (حداکثر ۱۰ آدرس)
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          disabled={addresses.length >= 10}
          className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 shrink-0 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>افزودن آدرس جدید</span>
          {addresses.length > 0 && (
            <span className="text-[11px] opacity-80 font-mono">
              ({toPersianDigits(addresses.length)}/۱۰)
            </span>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>در حال دریافت آدرس‌های ثبت‌شده...</span>
        </div>
      ) : (
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
              <Button onClick={handleOpenAdd} size="sm" className="rounded-xl cursor-pointer">
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
                        onClick={() => handleSetDefault(addr)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
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

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-mono">
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span>اصلی: {toPersianDigits(addr.receiverPhone)}</span>
                      </span>
                      {addr.secondaryPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground/70" />
                          <span>دوم: {toPersianDigits(addr.secondaryPhone)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground pt-1">
                      <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{formatAddressSummary(addr)}</span>
                    </div>

                    {addr.postalCode && (
                      <div className="flex items-center gap-2 text-muted-foreground font-mono pt-1">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span>کد پستی: {toPersianDigits(addr.postalCode)}</span>
                      </div>
                    )}
                  </div>

                  {/* دکمه‌های عملیات ویرایش و حذف */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(addr)}
                      className="h-8 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                    >
                      <Edit className="size-3.5" />
                      <span>ویرایش</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(addr)}
                      className="h-8 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
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
      )}

      {/* مدال فرم افزودن / ویرایش آدرس */}
      <AddressFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingAddress={editingAddress}
      />
    </div>
  );
}
