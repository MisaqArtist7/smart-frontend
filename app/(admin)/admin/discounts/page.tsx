"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Percent,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  useAdminCoupons,
  useCreateAdminCoupon,
  useUpdateAdminCoupon,
  useDeleteAdminCoupon,
  DISCOUNT_TYPE_CONFIG,
  COUPON_STATUS_CONFIG,
  getCouponStatus,
  normalizeCouponCode,
  type Coupon,
  type CouponStatus,
} from "@/lib/api/coupons";
import { formatPersianDate, formatToman } from "@/lib/order-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// اعتبارسنجی فرم کوپن تخفیف
const couponFormSchema = z.object({
  code: z
    .string()
    .min(2, "کد تخفیف باید حداقل ۲ کاراکتر باشد")
    .max(30, "کد تخفیف نباید بیشتر از ۳۰ کاراکتر باشد"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().min(1, "مقدار تخفیف باید بزرگتر از صفر باشد"),
  maxDiscountAmount: z.number().optional().nullable(),
  minOrderAmount: z.number().optional().nullable(),
  isUnlimitedUsage: z.boolean(),
  totalUsageLimit: z.number().optional().nullable(),
  perUserLimit: z.number().min(1, "حداقل ۱ بار استفاده").optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().max(200, "حداکثر ۲۰۰ کاراکتر").optional().nullable(),
  isActive: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

export default function AdminDiscountsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // مودال ایجاد / ویرایش
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // مودال حذف
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // هوک‌های API
  const { data: coupons = [], isLoading, isFetching, refetch } = useAdminCoupons();
  const createMutation = useCreateAdminCoupon();
  const updateMutation = useUpdateAdminCoupon();
  const deleteMutation = useDeleteAdminCoupon();

  // فرم با react-hook-form
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: 10,
      maxDiscountAmount: null,
      minOrderAmount: null,
      isUnlimitedUsage: true,
      totalUsageLimit: null,
      perUserLimit: 1,
      startDate: "",
      endDate: "",
      description: "",
      isActive: true,
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const isUnlimited = useWatch({ control, name: "isUnlimitedUsage" });

  // باز کردن فرم برای ایجاد کوپن جدید
  const handleOpenCreateDialog = () => {
    setEditingCoupon(null);
    reset({
      code: "",
      type: "PERCENTAGE",
      value: 10,
      maxDiscountAmount: null,
      minOrderAmount: null,
      isUnlimitedUsage: true,
      totalUsageLimit: null,
      perUserLimit: 1,
      startDate: "",
      endDate: "",
      description: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  // باز کردن فرم برای ویرایش کوپن موجود
  const handleOpenEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      minOrderAmount: coupon.minOrderAmount ?? null,
      isUnlimitedUsage: !coupon.totalUsageLimit,
      totalUsageLimit: coupon.totalUsageLimit ?? null,
      perUserLimit: coupon.perUserLimit ?? 1,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
      description: coupon.description ?? "",
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  // ثبت فرم ایجاد یا ویرایش
  const onSubmitForm = async (values: CouponFormValues) => {
    if (values.type === "PERCENTAGE" && values.value > 100) {
      toast.error("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰٪ باشد.");
      return;
    }

    const payload = {
      code: normalizeCouponCode(values.code),
      type: values.type,
      value: Number(values.value),
      maxDiscountAmount:
        values.type === "PERCENTAGE" && values.maxDiscountAmount
          ? Number(values.maxDiscountAmount)
          : null,
      minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
      totalUsageLimit: values.isUnlimitedUsage ? null : Number(values.totalUsageLimit) || null,
      perUserLimit: values.perUserLimit ? Number(values.perUserLimit) : 1,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
      description: values.description?.trim() || null,
      isActive: values.isActive,
    };

    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({
          id: editingCoupon.id,
          ...payload,
        });
        toast.success(`کد تخفیف «${payload.code}» با موفقیت به‌روزرسانی شد.`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`کد تخفیف «${payload.code}» با موفقیت ایجاد شد.`);
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ذخیره کد تخفیف";
      toast.error(msg);
    }
  };

  // کپی کد در کلیپ‌بورد
  const handleCopyCode = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      toast.success(`کد «${coupon.code}» در حافظه کپی شد.`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("خطا در کپی کد تخفیف");
    }
  };

  // تغییر وضعیت فعال / غیرفعال
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateMutation.mutateAsync({
        id: coupon.id,
        isActive: !coupon.isActive,
      });
      toast.success(
        !coupon.isActive
          ? `کد تخفیف «${coupon.code}» فعال شد.`
          : `کد تخفیف «${coupon.code}» غیرفعال شد.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در تغییر وضعیت کد تخفیف";
      toast.error(msg);
    }
  };

  // تأیید حذف کوپن
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`کد تخفیف «${deleteTarget.code}» حذف شد.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در حذف کد تخفیف";
      toast.error(msg);
    }
  };

  // فیلتر و جستجوی کدهای تخفیف
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const status = getCouponStatus(coupon);
      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }
      if (searchInput.trim()) {
        const query = searchInput.trim().toLowerCase();
        const codeMatch = coupon.code.toLowerCase().includes(query);
        const descMatch = coupon.description?.toLowerCase().includes(query);
        return codeMatch || descMatch;
      }
      return true;
    });
  }, [coupons, statusFilter, searchInput]);

  // آمار کلی کوپن‌ها
  const stats = useMemo(() => {
    const total = coupons.length;
    let active = 0;
    let expired = 0;
    let depleted = 0;
    let totalUses = 0;

    for (const c of coupons) {
      const s = getCouponStatus(c);
      if (s === "ACTIVE") active++;
      else if (s === "EXPIRED") expired++;
      else if (s === "DEPLETED") depleted++;
      totalUses += c.usedCount || 0;
    }

    return { total, active, expired, depleted, totalUses };
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Tag className="size-6 text-primary" />
            <span>مدیریت کدهای تخفیف و کوپن‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            تعریف کوپن‌های درصدی و مبلغ ثابت، سقف مصرف، حداقل خرید و پایش استفاده کاربران
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl text-xs font-bold gap-2"
          >
            {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
            <span>بروزرسانی</span>
          </Button>

          <Button
            onClick={handleOpenCreateDialog}
            size="sm"
            className="rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Plus className="size-4" />
            <span>تعریف کد تخفیف جدید</span>
          </Button>
        </div>
      </div>

      {/* کارت‌های آمار سریع */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">کل کدهای تعریف‌شده</span>
              <div className="text-2xl font-black text-foreground">
                {stats.total.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Tag className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">کدهای فعال و معتبر</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.active.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">مجموع دفعات استفاده</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {stats.totalUses.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">منقضی یا تکمیل ظرفیت</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {(stats.expired + stats.depleted).toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجو بر اساس کد تخفیف یا توضیحات..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-9 pl-3 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 font-medium">فیلتر وضعیت:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CouponStatus | "ALL")}
              className="w-[170px] text-xs rounded-xl h-9"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="ACTIVE">فعال</option>
              <option value="EXPIRED">منقضی شده</option>
              <option value="DEPLETED">پایان سقف استفاده</option>
              <option value="INACTIVE">غیرفعال دستی</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* جدول کدهای تخفیف */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs">در حال بارگذاری کدهای تخفیف...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
              <Tag className="size-7" />
            </div>
            <h3 className="font-bold text-foreground text-sm">هیچ کد تخفیفی یافت نشد</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchInput || statusFilter !== "ALL"
                ? "با فیلترهای انتخابی موردی پیدا نشد. عبارت جستجو یا وضعیت را تغییر دهید."
                : "هنوز هیچ کد تخفیفی در سیستم تعریف نشده است. با دکمه بالا اولین کد را ایجاد کنید."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right text-xs font-black">کد تخفیف</TableHead>
                  <TableHead className="text-right text-xs font-black">نوع و مقدار تخفیف</TableHead>
                  <TableHead className="text-right text-xs font-black">حداقل خرید / سقف تخفیف</TableHead>
                  <TableHead className="text-right text-xs font-black">میزان مصرف</TableHead>
                  <TableHead className="text-right text-xs font-black">تاریخ اعتبار</TableHead>
                  <TableHead className="text-right text-xs font-black">وضعیت</TableHead>
                  <TableHead className="text-center text-xs font-black">فعال/غیرفعال</TableHead>
                  <TableHead className="text-left text-xs font-black">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const statusConf = COUPON_STATUS_CONFIG[status];
                  const typeConf = DISCOUNT_TYPE_CONFIG[coupon.type];
                  const TypeIcon = typeConf?.icon || Percent;
                  const isCopied = copiedId === coupon.id;

                  return (
                    <TableRow key={coupon.id} className="text-xs hover:bg-muted/20">
                      {/* ستون کد تخفیف با کپی */}
                      <TableCell className="font-mono font-bold py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="کپی کد تخفیف"
                          >
                            {isCopied ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <div className="text-[11px] font-sans font-normal text-muted-foreground mt-1 line-clamp-1">
                            {coupon.description}
                          </div>
                        )}
                      </TableCell>

                      {/* ستون نوع و مقدار */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            <TypeIcon className="size-3" />
                          </div>
                          <span>
                            {coupon.type === "PERCENTAGE"
                              ? `${coupon.value.toLocaleString("fa-IR")}٪ تخفیف`
                              : `${formatToman(coupon.value)} تخفیف ثابت`}
                          </span>
                        </div>
                      </TableCell>

                      {/* حداقل خرید و سقف */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5 text-muted-foreground">
                          <div>
                            حداقل:{" "}
                            <span className="font-semibold text-foreground">
                              {coupon.minOrderAmount
                                ? formatToman(coupon.minOrderAmount)
                                : "بدون سقف"}
                            </span>
                          </div>
                          {coupon.type === "PERCENTAGE" && coupon.maxDiscountAmount && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400">
                              تا سقف {formatToman(coupon.maxDiscountAmount)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* میزان استفاده / سقف کل */}
                      <TableCell className="py-3.5">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {coupon.usedCount.toLocaleString("fa-IR")}{" "}
                            <span className="text-muted-foreground font-normal">از</span>{" "}
                            {coupon.totalUsageLimit
                              ? coupon.totalUsageLimit.toLocaleString("fa-IR")
                              : "نامحدود"}
                          </div>
                          {coupon.totalUsageLimit && coupon.totalUsageLimit > 0 && (
                            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (coupon.usedCount / coupon.totalUsageLimit) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* تاریخ اعتبار */}
                      <TableCell className="py-3.5 font-mono text-muted-foreground">
                        {coupon.endDate ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="size-3 text-muted-foreground shrink-0" />
                            <span>تا {formatPersianDate(coupon.endDate)}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                            نامحدود زمانی
                          </span>
                        )}
                      </TableCell>

                      {/* وضعیت اعتبار */}
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold", statusConf?.badgeClass)}
                        >
                          {statusConf?.label || status}
                        </Badge>
                      </TableCell>

                      {/* سوئیچ فعال / غیرفعال مستقیم */}
                      <TableCell className="py-3.5 text-center">
                        <Switch
                          checked={coupon.isActive}
                          disabled={updateMutation.isPending}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                      </TableCell>

                      {/* عملیات */}
                      <TableCell className="py-3.5 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="ویرایش کد تخفیف"
                            onClick={() => handleOpenEditDialog(coupon)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg cursor-pointer"
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            title="حذف کد تخفیف"
                            onClick={() => setDeleteTarget(coupon)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* مودال ایجاد / ویرایش کد تخفیف */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              <span>{editingCoupon ? "ویرایش کد تخفیف" : "تعریف کد تخفیف جدید"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              مشخصات کوپن، نوع تخفیف، محدودیت سفارش و سقف مصرف را تنظیم کنید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-2">
            {/* کد تخفیف و نوع */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">کد تخفیف (لاتین):</label>
                <Input
                  {...register("code", {
                    onChange: (e) => {
                      e.target.value = normalizeCouponCode(e.target.value);
                    },
                  })}
                  placeholder="مثلاً: SPRING1403"
                  className="font-mono text-xs uppercase tracking-wider rounded-xl"
                  dir="ltr"
                />
                {errors.code && (
                  <p className="text-[11px] text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">نوع تخفیف:</label>
                <Select
                  {...register("type")}
                  className="text-xs rounded-xl h-10 w-full"
                >
                  <option value="PERCENTAGE">درصدی (٪)</option>
                  <option value="FIXED_AMOUNT">مبلغ ثابت (تومان)</option>
                </Select>
              </div>
            </div>

            {/* مقدار تخفیف و حداکثر سقف تخفیف */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {selectedType === "PERCENTAGE" ? "درصد تخفیف (۱ تا ۱۰۰):" : "مبلغ تخفیف (تومان):"}
                </label>
                <Input
                  type="number"
                  {...register("value", { valueAsNumber: true })}
                  placeholder={selectedType === "PERCENTAGE" ? "مثلاً ۲۰" : "مثلاً ۵۰۰۰۰"}
                  className="text-xs rounded-xl font-mono"
                  dir="ltr"
                />
                {errors.value && (
                  <p className="text-[11px] text-destructive">{errors.value.message}</p>
                )}
              </div>

              {selectedType === "PERCENTAGE" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    حداکثر سقف تخفیف (تومان - اختیاری):
                  </label>
                  <Input
                    type="number"
                    {...register("maxDiscountAmount", { valueAsNumber: true })}
                    placeholder="مثلاً ۲۰۰۰۰۰ (بدون سقف خالی بگذارید)"
                    className="text-xs rounded-xl font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    برای جلوگیری از تخفیف‌های نامتعارف روی خریدهای بزرگ
                  </p>
                </div>
              )}
            </div>

            {/* حداقل خرید و سقف استفاده هر کاربر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  حداقل مبلغ خرید (تومان - اختیاری):
                </label>
                <Input
                  type="number"
                  {...register("minOrderAmount", { valueAsNumber: true })}
                  placeholder="مثلاً ۳۰۰۰۰۰ (بدون حداقل خالی بگذارید)"
                  className="text-xs rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  سقف استفاده به ازای هر کاربر:
                </label>
                <Input
                  type="number"
                  {...register("perUserLimit", { valueAsNumber: true })}
                  placeholder="۱"
                  className="text-xs rounded-xl font-mono"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">
                  معمولاً هر کاربر فقط ۱ بار مجاز به اعمال این کد است.
                </p>
              </div>
            </div>

            {/* محدودیت سقف کل استفاده */}
            <div className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">سقف کل دفعات استفاده:</div>
                  <div className="text-[11px] text-muted-foreground">
                    آیا این کد به تعداد کل مشخصی محدود شود یا نامحدود باشد؟
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {isUnlimited ? "نامحدود" : "محدود"}
                  </span>
                  <Switch
                    checked={!isUnlimited}
                    onCheckedChange={(checked) => setValue("isUnlimitedUsage", !checked)}
                  />
                </div>
              </div>

              {!isUnlimited && (
                <div className="pt-2">
                  <Input
                    type="number"
                    {...register("totalUsageLimit", { valueAsNumber: true })}
                    placeholder="مثلاً ۱۰۰ (پس از ۱۰۰ بار مصرف کد غیرفعال می‌شود)"
                    className="text-xs rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              )}
            </div>

            {/* تاریخ شروع و پایان */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">تاریخ شروع اعتبار (اختیاری):</label>
                <Input
                  type="date"
                  {...register("startDate")}
                  className="text-xs rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">تاریخ انقضا (اختیاری):</label>
                <Input
                  type="date"
                  {...register("endDate")}
                  className="text-xs rounded-xl font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* توضیحات */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                توضیحات داخلی یا عنوان کمپین (اختیاری):
              </label>
              <Textarea
                {...register("description")}
                placeholder="مثلاً: کمپین یلدا، ارسال به خبرنامه ایمیلی، همکاری با اینفلوئنسرها..."
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            {/* سوئیچ فعال بودن اولیه */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">فعال بودن کد تخفیف</div>
                <div className="text-[11px] text-muted-foreground">
                  کاربران بلافاصله بتوانند این کد را در سبد خرید اعمال کنند.
                </div>
              </div>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-xl text-xs font-bold gap-2 cursor-pointer"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{editingCoupon ? "ذخیره تغییرات" : "ایجاد کد تخفیف"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* مودال تأیید حذف کد تخفیف */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>حذف کد تخفیف</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              آیا از حذف کد تخفیف «{deleteTarget?.code}» اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl text-xs cursor-pointer"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              <span>بله، حذف کن</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
