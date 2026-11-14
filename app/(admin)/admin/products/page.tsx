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
  Loader2,
  UploadCloud,
} from "lucide-react";
import {
  useAdminProducts,
  useAdminCategories,
  useAdminBrands,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadImage,
  ApiError,
  type Product,
} from "@/lib/api";
import { cn, normalizeImageUrl } from "@/lib/utils";
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
import { Button, buttonVariants } from "@/components/ui/button";
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
      .min(2, "اسلاگ محصول حداقل باید ۲ کاراکتر باشد")
      .regex(
        /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u,
        "اسلاگ فقط می‌تواند شامل حروف (فارسی یا انگلیسی)، عدد و خط تیره (-) باشد (بدون فاصله)"
      )
      .max(220, "شناسه نباید بیشتر از ۲۲۰ کاراکتر باشد"),
    categoryId: z.string().min(1, "انتخاب دسته‌بندی کالا الزامی است"),
    brandId: z.string().optional().nullable(),
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

interface ProductImageItem {
  url: string;
  alt?: string | null;
  sortOrder?: number;
}

// تبدیل مقادیر فرم به بدنه‌ای که بک‌اند می‌خواد
// فیلدهای خالی undefined می‌شن تا اصلاً ارسال نشن
function toProductPayload(
  v: ProductFormValues,
  images?: ProductImageItem[]
) {
  return {
    title: v.title.trim(),
    slug: v.slug.trim(),
    categoryId: Number(v.categoryId),
    brandId: v.brandId && v.brandId !== "" ? Number(v.brandId) : null,
    price: v.price,
    discountPrice: v.discountPrice || undefined,
    stock: v.stock,
    sku: v.sku?.trim() || undefined,
    description: v.description?.trim() || undefined,
    metaTitle: v.metaTitle?.trim() || undefined,
    metaDescription: v.metaDescription?.trim() || undefined,
    isActive: v.isActive,
    images: images && images.length > 0 ? images : undefined,
  };
}

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [conflictProduct, setConflictProduct] = useState<{ id: number; title: string } | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);

  const { data: products = [], isLoading: isProductsLoading } = useAdminProducts();
  const { data: categories = [] } = useAdminCategories();
  const { data: brands = [] } = useAdminBrands();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const uploadMutation = useUploadImage();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      categoryId: "",
      brandId: "",
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

  // باز کردن مدال برای ثبت محصول جدید
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductImages([]);
    reset({
      title: "",
      slug: "",
      categoryId: categories[0]?.id ? String(categories[0].id) : "",
      brandId: "",
      price: undefined,
      discountPrice: undefined,
      stock: 10,
      sku: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    });
    setIsActiveValue(true);
    setIsCreateOpen(true);
  };

  // باز کردن مدال برای ویرایش محصول موجود
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setProductImages(
      (prod.images || []).map((img, i) => ({
        url: img.url,
        alt: img.alt || "",
        sortOrder: img.sortOrder ?? i,
      }))
    );
    reset({
      title: prod.title,
      slug: prod.slug,
      categoryId: String(prod.categoryId),
      brandId: prod.brandId ? String(prod.brandId) : "",
      price: prod.price,
      discountPrice: prod.discountPrice ?? undefined,
      stock: prod.stock,
      sku: prod.sku || "",
      description: prod.description || "",
      metaTitle: prod.metaTitle || "",
      metaDescription: prod.metaDescription || "",
      isActive: prod.isActive,
    });
    setIsActiveValue(prod.isActive);
    setIsCreateOpen(true);
  };

  // آپلود عکس جدید برای محصول
  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadMutation.mutateAsync({ file, type: "product" });
      setProductImages((prev) => [
        ...prev,
        { url: res.path, alt: "", sortOrder: prev.length },
      ]);
      toast.success("تصویر با موفقیت آپلود شد.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در آپلود تصویر";
      toast.error(msg);
    }
  };

  const handleRemoveProductImage = (indexToRemove: number) => {
    setProductImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateImageAlt = (index: number, alt: string) => {
    setProductImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, alt } : img))
    );
  };

  // ثبت یا ویرایش محصول
  const onSubmit = async (values: ProductFormValues) => {
    if (values.discountPrice !== undefined && values.discountPrice >= values.price) {
      toast.error("قیمت تخفیفی باید کمتر از قیمت اصلی محصول باشد.");
      return;
    }

    try {
      const payload = toProductPayload(values, productImages);
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          ...payload,
        });
        toast.success(`محصول «${values.title}» با موفقیت ویرایش شد.`);
      } else {
        await createProductMutation.mutateAsync(payload);
        toast.success("محصول جدید با موفقیت به فروشگاه افزوده شد.");
      }
      setIsCreateOpen(false);
      setEditingProduct(null);
      setProductImages([]);
      reset();
      setIsActiveValue(true);
    } catch (err: unknown) {
      toast.error((err as Error).message || "خطا در ثبت اطلاعات محصول");
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
      if (err instanceof ApiError && err.status === 409) {
        setConflictProduct({ id, title });
      } else {
        toast.error((err as Error).message || "خطا در حذف محصول");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // غیرفعال‌سازی محصول در صورت بروز تداخل حذف با سوابق سفارشات قبلی (خطای ۴۰۹)
  const handleDeactivateConflictProduct = async () => {
    if (!conflictProduct) return;
    try {
      await updateProductMutation.mutateAsync({
        id: conflictProduct.id,
        isActive: false,
      });
      toast.success(`محصول «${conflictProduct.title}» به جای حذف، با موفقیت غیرفعال شد.`);
      setConflictProduct(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "خطا در غیرفعال‌سازی محصول");
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
          onClick={handleOpenCreate}
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
                            src={prod.images?.[0]?.url ? normalizeImageUrl(prod.images[0].url) : FALLBACK_IMAGE}
                            alt={prod.title}
                            width={44}
                            height={44}
                            className="object-contain size-full"
                          />
                        </div>
                      </TableCell>

                      {/* عنوان و اسلاگ */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 max-w-xs">
                            {prod.title}
                          </span>
                          {prod.brand && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 text-primary border-primary/20 bg-primary/5 font-semibold"
                            >
                              {prod.brand.name}
                            </Badge>
                          )}
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
                            <DropdownMenuItem onClick={() => handleOpenEdit(prod)}>
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

      {/* مدال افزودن یا ویرایش محصول */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {editingProduct ? `ویرایش محصول «${editingProduct.title}»` : "افزودن محصول جدید به فروشگاه"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingProduct
                ? "مشخصات، قیمت و موجودی محصول را ویرایش نمایید."
                : "مشخصات، قیمت و دسته‌بندی کالا را تکمیل نمایید. تصاویر بعد از ثبت محصول اضافه می‌شوند."}
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
                  اسلاگ محصول (Slug) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("slug")}
                  placeholder="مثلاً: led-lamp-9w یا لامپ-ال-ای-دی-۹وات"
                  dir="auto"
                  className={errors.slug ? "border-destructive text-start" : "text-start"}
                />
                <p className="text-[10px] text-muted-foreground">
                  می‌توانید اسلاگ را به زبان انگلیسی یا فارسی وارد کنید (بین کلمات از خط تیره استفاده نمایید).
                </p>
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

              {/* برند محصول (اختیاری) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  برند سازنده محصول (اختیاری)
                </label>
                <Select {...register("brandId")}>
                  <option value="">بدون برند / متفرقه</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  اولین گزینه «متفرقه» است. در صورت نیاز برند کالا را مشخص کنید.
                </p>
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

              {/* گالری تصاویر محصول */}
              <div className="space-y-2 sm:col-span-2 p-3.5 rounded-xl border border-border bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      تصاویر و گالری محصول
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      اولین تصویر به عنوان تصویر اصلی نمایش داده می‌شود.
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleUploadProductImage}
                      disabled={uploadMutation.isPending}
                    />
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 gap-1.5 text-xs rounded-lg cursor-pointer",
                        uploadMutation.isPending && "opacity-50 pointer-events-none"
                      )}
                    >
                      {uploadMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="size-3.5" />
                      )}
                      {uploadMutation.isPending ? "در حال آپلود..." : "افزودن تصویر"}
                    </span>
                  </label>
                </div>

                {productImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {productImages.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        className="relative flex items-center gap-2 p-2 rounded-lg border border-border bg-card/60"
                      >
                        <div className="relative size-14 rounded-md border border-border overflow-hidden shrink-0 bg-muted/20">
                          <Image
                            src={normalizeImageUrl(img.url)}
                            alt={img.alt || `تصویر شماره ${idx + 1}`}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {idx === 0 ? "تصویر اصلی" : `تصویر ${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductImage(idx)}
                              className="size-5 rounded-md text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                              title="حذف این تصویر"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <Input
                            value={img.alt || ""}
                            onChange={(e) => handleUpdateImageAlt(idx, e.target.value)}
                            placeholder="متن جایگزین (Alt)..."
                            className="h-7 text-[10px] px-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                    هنوز تصویری برای این کالا آپلود نشده است.
                  </div>
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
                disabled={
                  isSubmitting ||
                  createProductMutation.isPending ||
                  updateProductMutation.isPending
                }
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
              >
                {isSubmitting ||
                createProductMutation.isPending ||
                updateProductMutation.isPending
                  ? "در حال ذخیره‌سازی..."
                  : editingProduct
                  ? "ذخیره تغییرات محصول"
                  : "ثبت و انتشار محصول"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* دیالوگ راهنمای خطای ۴۰۹ (پیشنهاد غیرفعال‌سازی به جای حذف) */}
      <Dialog open={!!conflictProduct} onOpenChange={(open) => !open && setConflictProduct(null)}>
        {conflictProduct && (
          <DialogContent className="max-w-md rounded-2xl" dir="rtl">
            <DialogHeader>
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
                <AlertCircle className="size-6" />
              </div>
              <DialogTitle className="text-base font-black">
                عدم امکان حذف فیزیکی محصول (خطای ۴۰۹)
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                محصول «{conflictProduct.title}» قبلاً در سفارش‌های مشتریان ثبت شده است و جهت حفظ سوابق فاکتورها قابل حذف از پایگاه داده نیست.
                آیا می‌خواهید این محصول را به جای حذف، <strong className="text-foreground">غیرفعال (عدم نمایش در فروشگاه)</strong> کنید؟
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConflictProduct(null)}
                className="rounded-xl text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeactivateConflictProduct}
                disabled={updateProductMutation.isPending}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
              >
                {updateProductMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>در حال تغییر وضعیت...</span>
                  </span>
                ) : (
                  <span>غیرفعال‌سازی محصول</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}