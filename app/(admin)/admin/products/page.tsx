"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  AlertCircle,
  X,
} from "lucide-react";
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useDeleteProduct,
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

const FALLBACK_IMAGE = "/images/products/adapter-52240.png";

// ولیدیشن فرم، هماهنگ با CreateProductDto بک‌اند
// (export نمی‌کنیم، چون فایل page در Next.js نباید export اضافه داشته باشه)
const productFormSchema = z
  .object({
    title: z
      .string()
      .min(2, "عنوان محصول باید حداقل ۲ کاراکتر باشد")
      .max(200, "عنوان نباید بیشتر از ۲۰۰ کاراکتر باشد"),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "فقط حروف کوچک انگلیسی، عدد و خط تیره (مثلاً led-lamp-9w)"
      )
      .max(220, "شناسه نباید بیشتر از ۲۲۰ کاراکتر باشد"),
    categoryId: z.string().min(1, "انتخاب دسته‌بندی کالا الزامی است"),
    price: z
      .number("قیمت را وارد کنید")
      .int("قیمت باید عدد صحیح باشد")
      .positive("قیمت محصول باید عددی مثبت باشد"),
    discountPrice: z
      .number()
      .int("قیمت تخفیفی باید عدد صحیح باشد")
      .min(0)
      .optional(),
    stock: z
      .number("موجودی را وارد کنید")
      .int("موجودی باید عدد صحیح باشد")
      .min(0, "موجودی انبار نمی‌تواند کمتر از صفر باشد"),
    sku: z.string().max(50, "حداکثر ۵۰ کاراکتر").optional(),
    description: z.string().optional(),
    metaTitle: z.string().max(70, "حداکثر ۷۰ کاراکتر").optional(),
    metaDescription: z.string().max(170, "حداکثر ۱۷۰ کاراکتر").optional(),
    isActive: z.boolean(),
  })
  .refine((d) => d.discountPrice === undefined || d.discountPrice < d.price, {
    message: "قیمت تخفیفی باید کمتر از قیمت اصلی باشد",
    path: ["discountPrice"],
  });

type ProductFormValues = z.infer<typeof productFormSchema>;

// تبدیل مقادیر فرم به بدنه‌ای که بک‌اند می‌خواد
// فیلدهای خالی undefined می‌شن تا اصلاً ارسال نشن
function toProductPayload(v: ProductFormValues) {
  return {
    title: v.title.trim(),
    slug: v.slug.trim(),
    categoryId: Number(v.categoryId),
    price: v.price,
    discountPrice: v.discountPrice || undefined,
    stock: v.stock,
    sku: v.sku?.trim() || undefined,
    description: v.description?.trim() || undefined,
    metaTitle: v.metaTitle?.trim() || undefined,
    metaDescription: v.metaDescription?.trim() || undefined,
    isActive: v.isActive,
  };
}

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      categoryId: "",
      price: undefined,
      discountPrice: undefined,
      stock: 10,
      sku: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  // فیلتر محصولات بر اساس جستجو و دسته‌بندی
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter((prod) => {
      const matchSearch =
        prod.title.toLowerCase().includes(term) ||
        (prod.sku ?? "").toLowerCase().includes(term);
      const matchCategory =
        selectedCategory === "all" ||
        prod.categoryId === Number(selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // ثبت محصول جدید
  const onSubmit = async (values: ProductFormValues) => {
    try {
      await createProductMutation.mutateAsync(toProductPayload(values));
      toast.success("محصول جدید با موفقیت افزوده شد.");
      setIsCreateOpen(false);
      reset();
    } catch (err: unknown) {
      toast.error((err as Error).message || "خطا در ثبت محصول جدید");
    }
  };

  // حذف محصول با تایید کاربر
  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`آیا از حذف محصول «${title}» اطمینان دارید؟`)) return;

    try {
      setDeletingId(id);
      await deleteProductMutation.mutateAsync(id);
      toast.success(`محصول «${title}» با موفقیت حذف گردید.`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "خطا در حذف محصول");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            مدیریت محصولات
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مشاهده، جستجو، ویرایش موجودی و ثبت اقلام جدید در ویترین هوشمند
          </p>
        </div>

        <Button
          onClick={() => {
            reset();
            setIsCreateOpen(true);
          }}
          className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>افزودن محصول جدید</span>
        </Button>
      </div>

      {/* جستجو و فیلتر */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام محصول یا کد SKU..."
                className="ps-9 h-10 rounded-xl"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-xl"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول محصولات */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">تصویر</TableHead>
                  <TableHead>عنوان محصول</TableHead>
                  <TableHead>کد SKU</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>قیمت (تومان)</TableHead>
                  <TableHead>موجودی</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-14 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isProductsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      در حال بارگذاری لیست محصولات...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      هیچ کالایی مطابق با فیلترهای جستجو یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((prod) => (
                    <TableRow key={prod.id}>
                      {/* تصویر */}
                      <TableCell className="text-center py-2.5">
                        <div className="size-12 rounded-xl border border-border bg-muted/20 p-1 mx-auto flex items-center justify-center overflow-hidden">
                          <Image
                            src={prod.images?.[0]?.url || FALLBACK_IMAGE}
                            alt={prod.title}
                            width={44}
                            height={44}
                            className="object-contain size-full"
                          />
                        </div>
                      </TableCell>

                      {/* عنوان و اسلاگ */}
                      <TableCell>
                        <div className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 max-w-xs">
                          {prod.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {prod.slug}
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        {prod.sku ? (
                          <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                            {prod.sku}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* دسته‌بندی */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium border-border">
                          {prod.category?.name ?? "عمومی"}
                        </Badge>
                      </TableCell>

                      {/* قیمت: قیمت نهایی اصلی، قیمت قبل از تخفیف خط‌خورده */}
                      <TableCell>
                        <div className="font-black text-xs sm:text-sm text-foreground">
                          {(prod.discountPrice ?? prod.price).toLocaleString("fa-IR")}
                        </div>
                        {prod.discountPrice != null && (
                          <div className="text-[11px] text-muted-foreground line-through">
                            {prod.price.toLocaleString("fa-IR")}
                          </div>
                        )}
                      </TableCell>

                      {/* موجودی */}
                      <TableCell>
                        {prod.stock === 0 ? (
                          <span className="text-xs font-bold text-destructive flex items-center gap-1">
                            <AlertCircle className="size-3.5" />
                            ناموجود
                          </span>
                        ) : prod.stock <= 5 ? (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="size-3.5" />
                            {prod.stock.toLocaleString("fa-IR")} عدد (کسری)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-foreground">
                            {prod.stock.toLocaleString("fa-IR")} عدد
                          </span>
                        )}
                      </TableCell>

                      {/* وضعیت */}
                      <TableCell>
                        {prod.isActive ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                            فعال در فروشگاه
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            غیرفعال
                          </Badge>
                        )}
                      </TableCell>

                      {/* عملیات */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                              />
                            }
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">عملیات</span>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast.info(`ویرایش سریع محصول ${prod.title}`)}>
                              <Edit className="size-3.5 text-muted-foreground" />
                              <span>ویرایش اطلاعات</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => window.open(`/product/${prod.slug}`, "_blank")}
                            >
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                              <span>نمایش در سایت</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleDelete(prod.id, prod.title)}
                              disabled={deletingId === prod.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                              <span>حذف محصول</span>
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

      {/* مدال افزودن محصول */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              افزودن محصول جدید به فروشگاه
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              مشخصات، قیمت و دسته‌بندی کالا را تکمیل نمایید. تصاویر بعد از ثبت محصول اضافه می‌شوند.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نام کالا */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  نام کامل محصول <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("title")}
                  placeholder="مثال: لامپ LED ۹ وات"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-[11px] text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* اسلاگ */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اسلاگ انگلیسی (Slug) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("slug")}
                  placeholder="led-lamp-9w"
                  dir="ltr"
                  className={errors.slug ? "border-destructive text-start" : "text-start"}
                />
                {errors.slug && (
                  <p className="text-[11px] text-destructive">{errors.slug.message}</p>
                )}
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  کد کالا / SKU (اختیاری)
                </label>
                <Input
                  {...register("sku")}
                  placeholder="LED-9W-001"
                  dir="ltr"
                  className={errors.sku ? "border-destructive text-start" : "text-start"}
                />
                {errors.sku && (
                  <p className="text-[11px] text-destructive">{errors.sku.message}</p>
                )}
              </div>

              {/* دسته‌بندی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  دسته‌بندی محصول <span className="text-destructive">*</span>
                </label>
                <Select
                  {...register("categoryId")}
                  className={errors.categoryId ? "border-destructive" : ""}
                >
                  <option value="">انتخاب دسته‌بندی...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId && (
                  <p className="text-[11px] text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              {/* موجودی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  تعداد موجودی انبار <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  {...register("stock", { valueAsNumber: true })}
                  placeholder="10"
                  className={errors.stock ? "border-destructive" : ""}
                />
                {errors.stock && (
                  <p className="text-[11px] text-destructive">{errors.stock.message}</p>
                )}
              </div>

              {/* قیمت اصلی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  قیمت اصلی (تومان) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="85000"
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && (
                  <p className="text-[11px] text-destructive">{errors.price.message}</p>
                )}
              </div>

              {/* قیمت با تخفیف */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  قیمت با تخفیف (اختیاری)
                </label>
                <Input
                  type="number"
                  {...register("discountPrice", {
                    setValueAs: (v) =>
                      v === "" || v == null ? undefined : Number(v),
                  })}
                  placeholder="70000"
                  className={errors.discountPrice ? "border-destructive" : ""}
                />
                {errors.discountPrice && (
                  <p className="text-[11px] text-destructive">{errors.discountPrice.message}</p>
                )}
              </div>

              {/* توضیحات */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  توضیحات و مشخصات اجمالی
                </label>
                <Textarea
                  {...register("description")}
                  placeholder="مشخصات، کاربرد و ویژگی‌های محصول..."
                  rows={3}
                />
              </div>

              {/* سئو */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  عنوان سئو (Meta Title)
                </label>
                <Input
                  {...register("metaTitle")}
                  placeholder="حداکثر ۷۰ کاراکتر"
                  className={errors.metaTitle ? "border-destructive" : ""}
                />
                {errors.metaTitle && (
                  <p className="text-[11px] text-destructive">{errors.metaTitle.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  توضیحات سئو (Meta Description)
                </label>
                <Textarea
                  {...register("metaDescription")}
                  placeholder="حداکثر ۱۷۰ کاراکتر"
                  rows={2}
                  className={errors.metaDescription ? "border-destructive" : ""}
                />
                {errors.metaDescription && (
                  <p className="text-[11px] text-destructive">{errors.metaDescription.message}</p>
                )}
              </div>

              {/* وضعیت انتشار */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">
                    وضعیت انتشار در فروشگاه
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    در صورت غیرفعال بودن، این کالا در ویترین عمومی نمایش داده نخواهد شد.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {isActive ? "فعال" : "غیرفعال"}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs sm:text-sm"
              >
                انصراف
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || createProductMutation.isPending}
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
              >
                {isSubmitting || createProductMutation.isPending
                  ? "در حال ثبت کالا..."
                  : "ثبت و انتشار محصول"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}