"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useCreateAddress,
  useUpdateAddress,
  useProvinces,
  useCities,
  ApiError,
  type Address,
} from "@/lib/api";
import {
  normalizePhoneInput,
  normalizePostalCodeInput,
  POSTAL_CODE_REGEX,
  PRIMARY_PHONE_REGEX,
  SECONDARY_PHONE_REGEX,
} from "@/lib/address-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addressFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "عنوان آدرس باید حداقل ۲ کاراکتر باشد")
      .max(50, "عنوان آدرس حداکثر می‌تواند ۵۰ کاراکتر باشد"),
    receiverName: z
      .string()
      .trim()
      .min(2, "نام تحویل‌گیرنده باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام تحویل‌گیرنده حداکثر می‌تواند ۱۰۰ کاراکتر باشد"),
    receiverPhone: z
      .string()
      .transform((val) => normalizePhoneInput(val))
      .refine((val) => PRIMARY_PHONE_REGEX.test(val), {
        message: "شماره تماس اصلی باید شماره موبایل معتبر ایران باشد (مثال: 09123456789)",
      }),
    secondaryPhone: z
      .string()
      .optional()
      .transform((val) => (val ? normalizePhoneInput(val) : ""))
      .refine((val) => !val || SECONDARY_PHONE_REGEX.test(val), {
        message:
          "شماره تماس دوم باید موبایل (09xxxxxxxxx) یا تلفن ثابت ۱۱ رقمی با کد شهر (مثال: 02188776655) باشد",
      }),
    provinceId: z
      .number({ message: "انتخاب استان الزامی است" })
      .int()
      .min(1, "انتخاب استان الزامی است"),
    cityId: z
      .number({ message: "انتخاب شهر الزامی است" })
      .int()
      .min(1, "انتخاب شهر الزامی است"),
    streetAddress: z
      .string()
      .trim()
      .min(5, "نشانی خیابان و کوچه باید حداقل ۵ کاراکتر باشد")
      .max(300, "نشانی خیابان حداکثر می‌تواند ۳۰۰ کاراکتر باشد"),
    plaque: z
      .string()
      .trim()
      .min(1, "پلاک الزامی است")
      .max(20, "پلاک حداکثر می‌تواند ۲۰ کاراکتر باشد"),
    floor: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || val.length <= 20, {
        message: "طبقه حداکثر می‌تواند ۲۰ کاراکتر باشد",
      }),
    unit: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || val.length <= 20, {
        message: "واحد حداکثر می‌تواند ۲۰ کاراکتر باشد",
      }),
    postalCode: z
      .string()
      .optional()
      .transform((val) => (val ? normalizePostalCodeInput(val) : ""))
      .refine((val) => !val || POSTAL_CODE_REGEX.test(val), {
        message: "کد پستی باید دقیقاً ۱۰ رقم باشد",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.secondaryPhone && data.secondaryPhone === data.receiverPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondaryPhone"],
        message: "شماره تماس دوم نمی‌تواند با شماره تماس اصلی یکسان باشد",
      });
    }
  });

type AddressFormValues = z.input<typeof addressFormSchema>;
type AddressParsedValues = z.output<typeof addressFormSchema>;

export interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddress?: Address | null;
  onSuccess?: (address: Address) => void;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  editingAddress = null,
  onSuccess,
}: AddressFormDialogProps) {
  const { user } = useAuth();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const [receiverIsMe, setReceiverIsMe] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues, unknown, AddressParsedValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      title: "",
      receiverName: "",
      receiverPhone: "",
      secondaryPhone: "",
      provinceId: 0,
      cityId: 0,
      streetAddress: "",
      plaque: "",
      floor: "",
      unit: "",
      postalCode: "",
    },
  });

  const selectedProvinceId = watch("provinceId");

  const {
    data: provinces = [],
    isLoading: provincesLoading,
    error: provincesError,
  } = useProvinces();

  const {
    data: cities = [],
    isLoading: citiesLoading,
    error: citiesError,
  } = useCities(selectedProvinceId > 0 ? selectedProvinceId : undefined);

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.id, label: p.name })),
    [provinces]
  );

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.id, label: c.name })),
    [cities]
  );

  useEffect(() => {
    if (!open) return;

    if (editingAddress) {
      setReceiverIsMe(false);
      reset({
        title: editingAddress.title,
        receiverName: editingAddress.receiverName,
        receiverPhone: editingAddress.receiverPhone,
        secondaryPhone: editingAddress.secondaryPhone || "",
        provinceId: editingAddress.provinceId,
        cityId: editingAddress.cityId,
        streetAddress: editingAddress.streetAddress,
        plaque: editingAddress.plaque,
        floor: editingAddress.floor || "",
        unit: editingAddress.unit || "",
        postalCode: editingAddress.postalCode || "",
      });
    } else {
      setReceiverIsMe(false);
      reset({
        title: "",
        receiverName: "",
        receiverPhone: "",
        secondaryPhone: "",
        provinceId: 0,
        cityId: 0,
        streetAddress: "",
        plaque: "",
        floor: "",
        unit: "",
        postalCode: "",
      });
    }
  }, [open, editingAddress, reset]);

  const handleReceiverIsMeChange = (checked: boolean) => {
    setReceiverIsMe(checked);
    if (checked && user) {
      if (user.name) setValue("receiverName", user.name, { shouldValidate: true });
      if (user.phone) setValue("receiverPhone", user.phone, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: AddressParsedValues) => {
    try {
      const payload = {
        title: values.title,
        receiverName: values.receiverName,
        receiverPhone: values.receiverPhone,
        provinceId: values.provinceId,
        cityId: values.cityId,
        streetAddress: values.streetAddress,
        plaque: values.plaque,
        ...(values.secondaryPhone ? { secondaryPhone: values.secondaryPhone } : {}),
        ...(values.floor ? { floor: values.floor } : {}),
        ...(values.unit ? { unit: values.unit } : {}),
        ...(values.postalCode ? { postalCode: values.postalCode } : {}),
      };

      let saved: Address;
      if (editingAddress) {
        saved = await updateAddress.mutateAsync({
          id: editingAddress.id,
          ...payload,
        });
        toast.success("آدرس با موفقیت ویرایش شد");
      } else {
        saved = await createAddress.mutateAsync(payload);
        toast.success("آدرس جدید با موفقیت ثبت شد");
      }

      onOpenChange(false);
      onSuccess?.(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error("حداکثر ۱۰ آدرس می‌توانید ثبت کنید");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("خطایی در ذخیره‌سازی آدرس رخ داد");
      }
    }
  };

  const isPending = isSubmitting || createAddress.isPending || updateAddress.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {editingAddress ? "ویرایش آدرس تحویل" : "افزودن آدرس جدید"}
          </DialogTitle>
          <DialogDescription className="text-right text-xs">
            استان، شهر، نشانی دقیق و شماره‌های تماس را وارد کنید تا ارسال بدون خطا انجام شود.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              عنوان آدرس <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="مثال: منزل، محل کار، انبار"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {user && (
            <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={receiverIsMe}
                onChange={(e) => handleReceiverIsMeChange(e.target.checked)}
                className="size-4 accent-primary rounded"
              />
              <span>تحویل‌گیرنده خودم هستم ({user.name})</span>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                نام و نام خانوادگی تحویل‌گیرنده <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="مثال: علی محمدی"
                {...register("receiverName")}
              />
              {errors.receiverName && (
                <p className="text-xs text-destructive">{errors.receiverName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                شماره تماس اصلی (موبایل) <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="09123456789"
                dir="ltr"
                className="text-left font-mono"
                {...register("receiverPhone")}
              />
              {errors.receiverPhone && (
                <p className="text-xs text-destructive">{errors.receiverPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              شماره تماس دوم (اختیاری - موبایل یا تلفن ثابت با کد شهر)
            </label>
            <Input
              placeholder="مثال: 02188776655 یا 09129876543"
              dir="ltr"
              className="text-left font-mono"
              {...register("secondaryPhone")}
            />
            {errors.secondaryPhone && (
              <p className="text-xs text-destructive">{errors.secondaryPhone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                استان <span className="text-destructive">*</span>
              </label>
              <Controller
                control={control}
                name="provinceId"
                render={({ field }) => (
                  <Combobox
                    options={provinceOptions}
                    value={field.value > 0 ? field.value : null}
                    onValueChange={(val) => {
                      const nextProvinceId = val ?? 0;
                      if (nextProvinceId !== field.value) {
                        field.onChange(nextProvinceId);
                        setValue("cityId", 0, { shouldValidate: false });
                      }
                    }}
                    placeholder="انتخاب استان..."
                    searchPlaceholder="جستجوی نام استان..."
                    emptyText="استانی یافت نشد"
                    loading={provincesLoading}
                    error={provincesError ? "خطا در دریافت لیست استان‌ها" : null}
                  />
                )}
              />
              {errors.provinceId && (
                <p className="text-xs text-destructive">{errors.provinceId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                شهر <span className="text-destructive">*</span>
              </label>
              <Controller
                control={control}
                name="cityId"
                render={({ field }) => (
                  <Combobox
                    options={cityOptions}
                    value={field.value > 0 ? field.value : null}
                    onValueChange={(val) => field.onChange(val ?? 0)}
                    placeholder={
                      selectedProvinceId > 0
                        ? "انتخاب شهر..."
                        : "ابتدا استان را انتخاب کنید"
                    }
                    searchPlaceholder="جستجوی نام شهر..."
                    emptyText="شهری یافت نشد"
                    disabled={!(selectedProvinceId > 0)}
                    loading={citiesLoading}
                    error={citiesError ? "خطا در دریافت لیست شهرها" : null}
                  />
                )}
              />
              {errors.cityId && (
                <p className="text-xs text-destructive">{errors.cityId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              خیابان و کوچه اصلی <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="مثال: خیابان ولیعصر، کوچه یاس"
              {...register("streetAddress")}
            />
            {errors.streetAddress && (
              <p className="text-xs text-destructive">{errors.streetAddress.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                پلاک <span className="text-destructive">*</span>
              </label>
              <Input placeholder="۱۲" {...register("plaque")} />
              {errors.plaque && (
                <p className="text-xs text-destructive">{errors.plaque.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                طبقه (اختیاری)
              </label>
              <Input placeholder="۳" {...register("floor")} />
              {errors.floor && (
                <p className="text-xs text-destructive">{errors.floor.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                واحد (اختیاری)
              </label>
              <Input placeholder="۵" {...register("unit")} />
              {errors.unit && (
                <p className="text-xs text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              کد پستی ۱۰ رقمی (اختیاری)
            </label>
            <Input
              placeholder="1234567890"
              dir="ltr"
              className="text-left font-mono"
              maxLength={14}
              {...register("postalCode")}
            />
            {errors.postalCode && (
              <p className="text-xs text-destructive">{errors.postalCode.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin ml-2" />}
              {editingAddress ? "ذخیره تغییرات" : "ثبت آدرس"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
