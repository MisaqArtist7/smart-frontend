"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Plus,
  FolderTree,
  CornerDownLeft,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from "lucide-react";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  ApiError,
  type Category,
  type CreateCategoryInput,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { normalizeImageUrl } from "@/lib/utils";

// ولیدیشن فرم دسته‌بندی مطابق با CreateCategoryDto بک‌اند
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام دسته‌بندی نباید بیشتر از ۱۰۰ کاراکتر باشد"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "فقط حروف کوچک انگلیسی، اعداد و خط تیره مجاز است (مثلاً smart-switches)"
    )
    .max(120, "شناسه انگلیسی نباید بیشتر از ۱۲۰ کاراکتر باشد"),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
  image: z.string().max(255, "حداکثر ۲۵۵ کاراکتر").optional(),
  imageAlt: z.string().max(150, "حداکثر ۱۵۰ کاراکتر").optional(),
  metaTitle: z.string().max(70, "حداکثر ۷۰ کاراکتر").optional(),
  metaDescription: z.string().max(170, "حداکثر ۱۷۰ کاراکتر").optional(),
  sortOrder: z
    .number("ترتیب نمایش را وارد کنید")
    .int("ترتیب باید عدد صحیح باشد")
    .min(0, "ترتیب نمایش نمی‌تواند منفی باشد"),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// تبدیل مقادیر فرم به پی‌لود سازگار با بک‌اند
function toCategoryPayload(v: CategoryFormValues): CreateCategoryInput {
  const rawImage = v.image?.trim();
  const normalizedImage = rawImage ? normalizeImageUrl(rawImage, "") : undefined;
  return {
    name: v.name.trim(),
    slug: v.slug.trim(),
    parentId: v.parentId && v.parentId !== "" ? Number(v.parentId) : null,
    description: v.description?.trim() || undefined,
    image: normalizedImage || undefined,
    imageAlt: v.imageAlt?.trim() || undefined,
    metaTitle: v.metaTitle?.trim() || undefined,
    metaDescription: v.metaDescription?.trim() || undefined,
    sortOrder: v.sortOrder ?? 0,
    isActive: v.isActive,
  };
}

export default function AdminCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [parentFilter, setParentFilter] = useState<"all" | "root" | "sub">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);

  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      description: "",
      image: "",
      imageAlt: "",
      metaTitle: "",
      metaDescription: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  // فیلتر و جستجوی دسته‌بندی‌ها
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return categories.filter((cat) => {
      const matchSearch =
        term === "" ||
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && cat.isActive) ||
        (statusFilter === "inactive" && !cat.isActive);

      const matchParent =
        parentFilter === "all" ||
        (parentFilter === "root" && !cat.parentId) ||
        (parentFilter === "sub" && Boolean(cat.parentId));

      return matchSearch && matchStatus && matchParent;
    });
  }, [categories, searchTerm, statusFilter, parentFilter]);

  // باز کردن مدال در حالت افزودن جدید
  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      parentId: "",
      description: "",
      image: "",
      imageAlt: "",
      metaTitle: "",
      metaDescription: "",
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setIsActiveValue(true);
    setIsModalOpen(true);
  };

  // باز کردن مدال در حالت ویرایش دسته‌بندی موجود
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ? String(cat.parentId) : "",
      description: cat.description || "",
      image: cat.image || "",
      imageAlt: cat.imageAlt || "",
      metaTitle: cat.metaTitle || "",
      metaDescription: cat.metaDescription || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setIsActiveValue(cat.isActive);
    setIsModalOpen(true);
  };

  // تولید خودکار اسلاگ بر اساس نام فارسی در حالت افزودن کالا
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    if (!editingCategory) {
      const autoSlug = val
        .trim()
        .toLowerCase()
        .replace(/[\s\-_]+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]/g, "");
      setValue("slug", autoSlug);
    }
  };

  // ثبت فرم (ایجاد یا ویرایش)
  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = toCategoryPayload(values);

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          ...payload,
        });
        toast.success(`دسته‌بندی «${values.name}» با موفقیت ویرایش شد.`);
      } else {
        await createCategoryMutation.mutateAsync(payload);
        toast.success(`دسته‌بندی «${values.name}» با موفقیت افزوده شد.`);
      }

      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "خطا در پردازش اطلاعات دسته‌بندی");
    }
  };

  // حذف دسته‌بندی
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟`)) return;

    try {
      setDeletingId(id);
      await deleteCategoryMutation.mutateAsync(id);
      toast.success(`دسته‌بندی «${name}» با موفقیت حذف شد.`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("امکان حذف این دسته‌بندی وجود ندارد؛ این دسته دارای کالا یا زیردسته‌های وابسته است.");
      } else {
        const error = err as Error;
        toast.error(error.message || "خطا در حذف دسته‌بندی");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const isPending =
    isSubmitting ||
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending;

  return (
    <div className="space-y-6 select-none">
      {/* سربرگ بخش دسته‌بندی‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            ایجاد ساختار درختی کاتالوگ محصولات، تعریف دسته‌های والد، تنظیمات سئو و وضعیت انتشار
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>افزودن دسته‌بندی جدید</span>
        </Button>
      </div>

      {/* نوار جستجو و فیلترها */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام یا شناسه انگلیسی دسته‌بندی..."
                className="ps-9 h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="h-10 rounded-xl text-xs sm:w-36"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فقط فعال‌ها</option>
                <option value="inactive">فقط غیرفعال‌ها</option>
              </Select>

              <Select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value as "all" | "root" | "sub")}
                className="h-10 rounded-xl text-xs sm:w-36"
              >
                <option value="all">همه سطوح</option>
                <option value="root">دسته‌های اصلی</option>
                <option value="sub">زیردسته‌ها</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول دسته‌بندی‌ها */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">آیکون</TableHead>
                  <TableHead>نام و شناسه (Slug)</TableHead>
                  <TableHead>سطح والد</TableHead>
                  <TableHead className="w-20 text-center">ترتیب</TableHead>
                  <TableHead className="w-28 text-center">وضعیت</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead className="w-24 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      در حال دریافت لیست دسته‌بندی‌ها از سرور...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      هیچ دسته‌بندی مطابق با فیلترهای جستجو یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      {/* تصویر / آیکون کوچک */}
                      <TableCell className="text-center py-2.5">
                        <div className="size-10 rounded-xl border border-border bg-muted/20 p-1 mx-auto flex items-center justify-center overflow-hidden">
                          {cat.image ? (
                            <Image
                              src={normalizeImageUrl(cat.image)}
                              alt={cat.imageAlt || cat.name}
                              width={32}
                              height={32}
                              className="object-contain size-full"
                            />
                          ) : cat.parentId ? (
                            <CornerDownLeft className="size-4 text-muted-foreground" />
                          ) : (
                            <FolderTree className="size-4 text-primary" />
                          )}
                        </div>
                      </TableCell>

                      {/* نام، اسلاگ و توضیحات */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                            {cat.slug}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* سطح والد و زیردسته */}
                      <TableCell>
                        {cat.parentId ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-border gap-1 text-muted-foreground"
                          >
                            <span>زیردسته:</span>
                            <span className="font-bold text-foreground">
                              {cat.parent?.name || cat.parentName || `شناسه ${cat.parentId}`}
                            </span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
                          >
                            دسته‌بندی اصلی
                          </Badge>
                        )}
                      </TableCell>

                      {/* شماره ترتیب */}
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                        {cat.sortOrder}
                      </TableCell>

                      {/* وضعیت فعال بودن */}
                      <TableCell className="text-center">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                            <XCircle className="size-3.5" />
                            غیرفعال
                          </span>
                        )}
                      </TableCell>

                      {/* تاریخ ثبت */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {cat.createdAt}
                        </span>
                      </TableCell>

                      {/* منوی عملیات */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                              />
                            }
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">منوی عملیات</span>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => handleOpenEdit(cat)}>
                              <Edit className="size-3.5 text-muted-foreground" />
                              <span>ویرایش اطلاعات</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={deletingId === cat.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                              <span>حذف دسته‌بندی</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مدال ایجاد / ویرایش دسته‌بندی */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {editingCategory ? `ویرایش دسته‌بندی «${editingCategory.name}»` : "افزودن دسته‌بندی جدید"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              دسته‌بندی‌ها به تفکیک محصولات، ناوبری بهتر و سئوی فروشگاه در موتورهای جستجو کمک می‌کنند.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نام دسته‌بندی */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  نام دسته‌بندی (فارسی) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="مثال: کلید و پریز هوشمند"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* اسلاگ انگلیسی */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  شناسه انگلیسی (Slug) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("slug")}
                  placeholder="smart-switches"
                  dir="ltr"
                  className={errors.slug ? "border-destructive text-start" : "text-start"}
                />
                {errors.slug && (
                  <p className="text-[11px] text-destructive">{errors.slug.message}</p>
                )}
              </div>

              {/* انتخاب دسته‌بندی والد */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  دسته‌بندی والد (اختیاری)
                </label>
                <Select {...register("parentId")}>
                  <option value="">-- دسته‌بندی اصلی (بدون والد) --</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </div>

              {/* ترتیب نمایش */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اولویت ترتیب نمایش (عدد صحیح)
                </label>
                <Input
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.sortOrder ? "border-destructive" : ""}
                />
                {errors.sortOrder && (
                  <p className="text-[11px] text-destructive">{errors.sortOrder.message}</p>
                )}
              </div>

              {/* تصویر دسته‌بندی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>آدرس تصویر دسته‌بندی</span>
                  <span className="text-[11px] text-muted-foreground font-normal">اختیاری</span>
                </label>
                <div className="relative">
                  <Input
                    {...register("image")}
                    placeholder="/images/categories/switches.svg"
                    dir="ltr"
                    className="text-start pe-8"
                  />
                  <ImageIcon className="absolute end-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
                {errors.image && (
                  <p className="text-[11px] text-destructive">{errors.image.message}</p>
                )}
              </div>

              {/* متن جایگزین تصویر (Alt) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>متن جایگزین تصویر (Alt)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">اختیاری</span>
                </label>
                <Input
                  {...register("imageAlt")}
                  placeholder="تصویر کلید و پریز هوشمند"
                  className={errors.imageAlt ? "border-destructive" : ""}
                />
                {errors.imageAlt && (
                  <p className="text-[11px] text-destructive">{errors.imageAlt.message}</p>
                )}
              </div>

              {/* توضیحات دسته‌بندی */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  توضیحات و کاربرد دسته‌بندی
                </label>
                <Textarea
                  {...register("description")}
                  placeholder="معرفی اجمالی اقلام این دسته‌بندی برای نمایش در صفحه محصولات..."
                  rows={2}
                />
              </div>

              {/* سئو - Meta Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  عنوان سئو (Meta Title - حداکثر ۷۰ کاراکتر)
                </label>
                <Input
                  {...register("metaTitle")}
                  placeholder="خرید انواع کلید و پریز هوشمند با قیمت مناسب"
                  className={errors.metaTitle ? "border-destructive" : ""}
                />
                {errors.metaTitle && (
                  <p className="text-[11px] text-destructive">{errors.metaTitle.message}</p>
                )}
              </div>

              {/* سئو - Meta Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  توضیحات سئو (Meta Description - حداکثر ۱۷۰ کاراکتر)
                </label>
                <Textarea
                  {...register("metaDescription")}
                  placeholder="فروش آنلاین بهترین کلید و پریزهای لمسی و مکانیکی با گارانتی معتبر در اسمارت الکتریک..."
                  rows={2}
                  className={errors.metaDescription ? "border-destructive" : ""}
                />
                {errors.metaDescription && (
                  <p className="text-[11px] text-destructive">{errors.metaDescription.message}</p>
                )}
              </div>

              {/* وضعیت فعال بودن در فروشگاه */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    وضعیت انتشار در فروشگاه
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    در صورت غیرفعال بودن، این دسته‌بندی در منوها و ناوبری فروشگاه نمایش داده نمی‌شود.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {isActiveValue ? "فعال" : "غیرفعال"}
                  </span>
                  <Switch
                    checked={isActiveValue}
                    onCheckedChange={(checked) => {
                      setIsActiveValue(checked);
                      setValue("isActive", checked);
                    }}
                  />
                </div>
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
                disabled={isPending}
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
              >
                {isPending
                  ? "در حال ذخیره‌سازی..."
                  : editingCategory
                  ? "ذخیره تغییرات"
                  : "ثبت دسته‌بندی"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
