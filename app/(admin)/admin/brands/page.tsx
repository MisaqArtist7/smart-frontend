"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import {
  useAdminBrands,
  useCreateAdminBrand,
  useUpdateAdminBrand,
  useDeleteAdminBrand,
  type Brand,
} from "@/lib/api/brands";
import { useAdminProducts, useUploadImage } from "@/lib/api";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn, normalizeImageUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ولیدیشن فرم برند بر اساس مشخصات فنی
const brandFormSchema = z.object({
  name: z
    .string()
    .min(2, "نام برند باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام برند نباید بیشتر از ۱۰۰ کاراکتر باشد"),
  slug: z
    .string()
    .min(2, "اسلاگ برند باید حداقل ۲ کاراکتر باشد")
    .regex(
      /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u,
      "اسلاگ فقط می‌تواند شامل حروف (فارسی یا انگلیسی)، عدد و خط تیره (-) باشد (بدون فاصله)"
    )
    .max(120, "اسلاگ نباید بیشتر از ۱۲۰ کاراکتر باشد"),
  logo: z.string().max(300, "حداکثر ۳۰۰ کاراکتر").optional().nullable(),
  description: z.string().max(500, "حداکثر ۵۰۰ کاراکتر").optional().nullable(),
  metaTitle: z.string().max(70, "حداکثر ۷۰ کاراکتر").optional().nullable(),
  metaDescription: z.string().max(170, "حداکثر ۱۷۰ کاراکتر").optional().nullable(),
  isActive: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

export default function AdminBrandsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  // واکشی برندها و محصولات برای محاسبه تعداد کالاها
  const { data: brands = [], isLoading, isFetching, refetch } = useAdminBrands();
  const { data: products = [] } = useAdminProducts();

  const createMutation = useCreateAdminBrand();
  const updateMutation = useUpdateAdminBrand();
  const deleteMutation = useDeleteAdminBrand();
  const uploadMutation = useUploadImage();

  // فرم برند
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    },
  });

  const currentLogo = useWatch({ control, name: "logo" });

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadMutation.mutateAsync({ file, type: "brand" });
      setValue("logo", res.path, { shouldValidate: true, shouldDirty: true });
      toast.success("لوگوی برند با موفقیت آپلود شد.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در آپلود لوگو";
      toast.error(msg);
    }
  };

  // محاسبه تعداد محصولات هر برند
  const brandProductCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    products.forEach((p) => {
      if (p.brandId) {
        counts[p.brandId] = (counts[p.brandId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // باز کردن فرم برای ایجاد برند جدید
  const handleOpenCreate = () => {
    setEditingBrand(null);
    reset({
      name: "",
      slug: "",
      logo: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  // باز کردن فرم برای ویرایش برند
  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    reset({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      description: brand.description || "",
      metaTitle: brand.metaTitle || "",
      metaDescription: brand.metaDescription || "",
      isActive: brand.isActive,
    });
    setIsDialogOpen(true);
  };

  // ارسال فرم ایجاد یا ویرایش
  const onSubmitForm = async (values: BrandFormValues) => {
    const rawLogo = values.logo?.trim();
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase(),
      logo: rawLogo ? normalizeImageUrl(rawLogo, "") : null,
      description: values.description?.trim() || null,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
      isActive: values.isActive,
    };

    try {
      if (editingBrand) {
        await updateMutation.mutateAsync({
          id: editingBrand.id,
          ...payload,
        });
        toast.success(`برند «${payload.name}» با موفقیت ویرایش شد.`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`برند جدید «${payload.name}» با موفقیت افزوده شد.`);
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ذخیره برند";
      toast.error(msg);
    }
  };

  // تغییر وضعیت فعال / غیرفعال بودن
  const handleToggleActive = async (brand: Brand) => {
    try {
      await updateMutation.mutateAsync({
        id: brand.id,
        isActive: !brand.isActive,
      });
      toast.success(
        !brand.isActive
          ? `برند «${brand.name}» فعال شد.`
          : `برند «${brand.name}» غیرفعال شد.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در تغییر وضعیت برند";
      toast.error(msg);
    }
  };

  // تأیید حذف برند
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`برند «${deleteTarget.name}» حذف شد.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در حذف برند";
      toast.error(msg);
    }
  };

  // فیلتر برندها بر اساس جستجو
  const filteredBrands = useMemo(() => {
    if (!searchInput.trim()) return brands;
    const query = searchInput.trim().toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.slug.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query))
    );
  }, [brands, searchInput]);

  // آمار کلی برندها
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.isActive).length;
    const withProducts = brands.filter(
      (b) => (brandProductCounts[b.id] || 0) > 0 || (b.productsCount || 0) > 0
    ).length;
    return { total, active, withProducts };
  }, [brands, brandProductCounts]);

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه و دکمه افزودن */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Award className="size-6 text-primary" />
            <span>مدیریت برندهای کالا</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            تعریف، ویرایش و مدیریت برندهای معتبر کالا، نماد لوگو و ارتباط با محصولات فروشگاه
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
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Plus className="size-4" />
            <span>افزودن برند جدید</span>
          </Button>
        </div>
      </div>

      {/* کارت‌های شاخص‌های کلیدی */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">کل برندهای تعریف‌شده</span>
              <div className="text-2xl font-black text-foreground">
                {stats.total.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">برندهای فعال در سایت</span>
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
              <span className="text-xs text-muted-foreground font-medium">برندهای دارای کالای ثبت‌شده</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {stats.withProducts.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Package className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار جستجو */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="جستجو در نام فارسی، اسلاگ انگلیسی یا توضیحات..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9 pl-3 text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* جدول برندها */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs">در حال بارگذاری برندها...</span>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
              <Award className="size-7" />
            </div>
            <h3 className="font-bold text-foreground text-sm">هیچ برندی یافت نشد</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchInput
                ? `برای عبارت «${searchInput}» نتیجه‌ای یافت نشد.`
                : "هنوز برندی ثبت نشده است. با دکمه بالا اولین برند را ثبت کنید."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-center text-xs font-black w-16">لوگو</TableHead>
                  <TableHead className="text-right text-xs font-black">نام برند (فارسی)</TableHead>
                  <TableHead className="text-right text-xs font-black">شناسه انگلیسی (Slug)</TableHead>
                  <TableHead className="text-right text-xs font-black">تعداد کالاها</TableHead>
                  <TableHead className="text-right text-xs font-black">وضعیت</TableHead>
                  <TableHead className="text-center text-xs font-black">فعال/غیرفعال</TableHead>
                  <TableHead className="text-left text-xs font-black">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredBrands.map((brand) => {
                  const productCount =
                    brandProductCounts[brand.id] ?? brand._count?.products ?? brand.productsCount ?? 0;

                  return (
                    <TableRow key={brand.id} className="text-xs hover:bg-muted/20">
                      {/* ستون لوگو */}
                      <TableCell className="text-center py-3">
                        <div className="size-10 rounded-xl border border-border bg-muted/20 p-1 mx-auto flex items-center justify-center overflow-hidden relative">
                          {brand.logo ? (
                            <Image
                              src={normalizeImageUrl(brand.logo)}
                              alt={brand.name}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <span className="font-mono font-bold text-[10px] text-muted-foreground uppercase">
                              {brand.slug.slice(0, 2)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* ستون نام فارسی */}
                      <TableCell className="py-3">
                        <div className="font-bold text-xs sm:text-sm text-foreground">
                          {brand.name}
                        </div>
                        {brand.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs mt-0.5">
                            {brand.description}
                          </div>
                        )}
                      </TableCell>

                      {/* ستون اسلاگ */}
                      <TableCell className="py-3 font-mono text-muted-foreground" dir="ltr">
                        {brand.slug}
                      </TableCell>

                      {/* ستون تعداد کالاها */}
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold px-2.5 py-1 rounded-md bg-muted/50 text-foreground">
                          <Package className="size-3 text-muted-foreground" />
                          <span>{productCount.toLocaleString("fa-IR")} کالا</span>
                        </span>
                      </TableCell>

                      {/* ستون وضعیت */}
                      <TableCell className="py-3">
                        {brand.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-bold">
                            <CheckCircle2 className="size-3" />
                            <span>فعال</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
                            <XCircle className="size-3" />
                            <span>غیرفعال</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* سوئیچ فعال / غیرفعال مستقیم */}
                      <TableCell className="py-3 text-center">
                        <Switch
                          checked={brand.isActive}
                          disabled={updateMutation.isPending}
                          onCheckedChange={() => handleToggleActive(brand)}
                        />
                      </TableCell>

                      {/* عملیات */}
                      <TableCell className="py-3 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products?brandId=${brand.id}`}
                            target="_blank"
                            title="مشاهده کالاهای این برند در سایت"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            title="ویرایش برند"
                            onClick={() => handleOpenEdit(brand)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg"
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            title="حذف برند"
                            onClick={() => setDeleteTarget(brand)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
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

      {/* مودال ایجاد / ویرایش برند */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <span>{editingBrand ? `ویرایش برند «${editingBrand.name}»` : "افزودن برند جدید"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              مشخصات نام فارسی، اسلاگ انگلیسی، نشان لوگو و تنظیمات سئو برند را تکمیل کنید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-2">
            {/* نام فارسی و اسلاگ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  نام برند (فارسی) <span className="text-destructive">*</span>:
                </label>
                <Input
                  {...register("name")}
                  placeholder="مثلاً: پارس شعاع توس"
                  className={errors.name ? "border-destructive text-xs rounded-xl" : "text-xs rounded-xl"}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اسلاگ برند (Slug) <span className="text-destructive">*</span>:
                </label>
                <Input
                  {...register("slug")}
                  placeholder="مثلاً: pars-shoa یا پارس-شعاع"
                  className={errors.slug ? "border-destructive text-xs rounded-xl" : "text-xs rounded-xl"}
                  dir="auto"
                />
                {errors.slug && (
                  <p className="text-[11px] text-destructive">{errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* تصویر یا لوگو */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                تصویر یا لوگوی برند (اختیاری):
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {currentLogo ? (
                  <div className="relative size-14 rounded-xl border border-border bg-muted/20 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={normalizeImageUrl(currentLogo)}
                      alt="پیش‌نمایش لوگو"
                      fill
                      className="object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() => setValue("logo", "", { shouldValidate: true, shouldDirty: true })}
                      className="absolute top-0.5 end-0.5 size-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] leading-none"
                      title="حذف لوگو"
                    >
                      ×
                    </button>
                  </div>
                ) : null}

                <div className="flex-1 w-full space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        {...register("logo")}
                        placeholder="مثلاً: /images/brands/pars-shoa.png یا مسیر آپلود"
                        className="font-mono text-xs rounded-xl pe-8"
                        dir="ltr"
                      />
                      <ImageIcon className="absolute end-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleUploadLogo}
                        disabled={uploadMutation.isPending}
                      />
                      <span
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-9 gap-1.5 text-xs shrink-0 rounded-xl cursor-pointer",
                          uploadMutation.isPending && "opacity-50 pointer-events-none"
                        )}
                      >
                        {uploadMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="size-3.5" />
                        )}
                        {uploadMutation.isPending ? "در حال آپلود..." : "آپلود لوگو"}
                      </span>
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    فرمت‌های مجاز: WebP, PNG, JPEG (حداکثر ۵ مگابایت)
                  </p>
                </div>
              </div>
            </div>

            {/* توضیحات برند */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                معرفی و توضیحات برند (اختیاری):
              </label>
              <Textarea
                {...register("description")}
                placeholder="توضیح کوتاه درباره سابقه کارخانه، استانداردهای تولید یا رسته محصولات..."
                rows={3}
                className="text-xs rounded-xl"
              />
            </div>

            {/* عنوان و توضیحات سئو */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  عنوان سئو (Meta Title - اختیاری):
                </label>
                <Input
                  {...register("metaTitle")}
                  placeholder="حداکثر ۷۰ کاراکتر"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  توضیحات سئو (Meta Description - اختیاری):
                </label>
                <Input
                  {...register("metaDescription")}
                  placeholder="حداکثر ۱۷۰ کاراکتر"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {/* سوئیچ وضعیت فعال بودن */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">وضعیت نمایش در فروشگاه</div>
                <div className="text-[11px] text-muted-foreground">
                  در صورت فعال بودن، برند در فیلترهای کاتالوگ و صفحه محصول نمایش می‌یابد.
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
                  <CheckCircle2 className="size-3.5" />
                )}
                <span>{editingBrand ? "ذخیره تغییرات" : "افزودن برند"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* مودال تأیید حذف برند */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>حذف برند</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              آیا از حذف برند «{deleteTarget?.name}» اطمینان دارید؟ در صورت حذف، محصولات متصل به این
              برند به حالت بدون برند (متفرقه) تغییر خواهند یافت.
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
