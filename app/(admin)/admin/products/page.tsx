"use client";

import React, { useState, useMemo } from "react";
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
  Upload,
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

// ولیدیشن فرم افزودن محصول مطابق با مدل دیتابیس
const productFormSchema = z.object({
  title: z.string().min(2, "عنوان محصول باید حداقل ۲ کاراکتر باشد"),
  slug: z.string().min(2, "شناسه انگلیسی (slug) الزامی است"),
  categoryId: z.string().min(1, "انتخاب دسته‌بندی کالا الزامی است"),
  price: z.number().positive("قیمت محصول باید عددی مثبت باشد"),
  discountPrice: z.number().optional().nullable(),
  stock: z.number().min(0, "موجودی انبار نمی‌تواند کمتر از صفر باشد"),
  sku: z.string().min(2, "کد شناسه انبار (SKU) الزامی است"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);

  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  // فرم ثبت محصول
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
      price: 0,
      discountPrice: null,
      stock: 10,
      sku: "",
      description: "",
      imageUrl: "/images/products/adapter-52240.png",
      isActive: true,
    },
  });

  // فیلتر کردن محصولات بر اساس جستجو و دسته‌بندی
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        prod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === "all" || prod.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // ثبت محصول جدید
  const onSubmit = async (values: ProductFormValues) => {
    try {
      await createProductMutation.mutateAsync({
        title: values.title,
        slug: values.slug,
        categoryId: values.categoryId,
        price: values.price,
        discountPrice: values.discountPrice,
        stock: values.stock,
        sku: values.sku,
        description: values.description,
        isActive: values.isActive,
        images: values.imageUrl ? [values.imageUrl] : ["/images/products/adapter-52240.png"],
      });

      toast.success("محصول جدید با موفقیت به انبار فروشگاه افزوده شد.");
      setIsCreateOpen(false);
      reset();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "خطا در ثبت محصول جدید");
    }
  };

  // حذف محصول با تایید کاربر
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف محصول «${title}» اطمینان دارید؟`)) return;

    try {
      setDeletingId(id);
      await deleteProductMutation.mutateAsync(id);
      toast.success(`محصول «${title}» با موفقیت حذف گردید.`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "خطا در حذف محصول");
    } finally {
      setDeletingId(null);
    }
  };

  // تولید خودکار اسلاگ انگلیسی هنگام تغییر عنوان محصول
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    setValue("title", titleVal);
    const autoSlug = titleVal
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "");
    setValue("slug", autoSlug);
  };

  return (
    <div className="space-y-6 select-none">
      {/* هدر صفحه و دکمه افزودن محصول جدید */}
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

      {/* نوار جستجو و فیلترها */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* اینپوت جستجو */}
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

            {/* فیلتر دسته‌بندی */}
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

      {/* جدول نمایش لیست محصولات */}
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
                      {/* تصویر بندانگشتی کالا */}
                      <TableCell className="text-center py-2.5">
                        <div className="size-12 rounded-xl border border-border bg-muted/20 p-1 mx-auto flex items-center justify-center overflow-hidden">
                          <Image
                            src={prod.images[0] || "/images/products/adapter-52240.png"}
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

                      {/* کد انبار */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                          {prod.sku}
                        </span>
                      </TableCell>

                      {/* دسته‌بندی */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium border-border">
                          {prod.categoryName || "عمومی"}
                        </Badge>
                      </TableCell>

                      {/* قیمت */}
                      <TableCell>
                        <div className="font-black text-xs sm:text-sm text-foreground">
                          {prod.price.toLocaleString("fa-IR")}
                        </div>
                        {prod.discountPrice && (
                          <div className="text-[11px] text-muted-foreground line-through">
                            {prod.discountPrice.toLocaleString("fa-IR")}
                          </div>
                        )}
                      </TableCell>

                      {/* موجودی انبار */}
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

                      {/* وضعیت فعال بودن کالا */}
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

                      {/* دراپ‌داون عملیات */}
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

      {/* مدال افزودن محصول جدید با فرم React Hook Form و Zod */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              افزودن محصول جدید به فروشگاه
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              مشخصات فنی، قیمت و دسته‌بندی کالا را طبق استانداردهای انبارداری تکمیل نمایید.
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
                  onChange={handleTitleChange}
                  placeholder="مثال: سوئیچ شبکه صنعتی ۸ پورت PoE گیگابیت HRUI"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-[11px] text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* اسلاگ انگلیسی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  اسلاگ انگلیسی (Slug) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("slug")}
                  placeholder="hrui-industrial-switch-8port"
                  dir="ltr"
                  className={errors.slug ? "border-destructive text-start" : "text-start"}
                />
                {errors.slug && (
                  <p className="text-[11px] text-destructive">{errors.slug.message}</p>
                )}
              </div>

              {/* کد انبار SKU */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  کد کالا / SKU <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("sku")}
                  placeholder="HRUI-SW-82S"
                  dir="ltr"
                  className={errors.sku ? "border-destructive text-start" : "text-start"}
                />
                {errors.sku && (
                  <p className="text-[11px] text-destructive">{errors.sku.message}</p>
                )}
              </div>

              {/* انتخاب دسته‌بندی */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  دسته‌بندی محصول <span className="text-destructive">*</span>
                </label>
                <Select {...register("categoryId")} className={errors.categoryId ? "border-destructive" : ""}>
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

              {/* موجودی انبار */}
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

              {/* قیمت پایه (تومان) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  قیمت اصلی (تومان) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="5000000"
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && (
                  <p className="text-[11px] text-destructive">{errors.price.message}</p>
                )}
              </div>

              {/* قیمت پس از تخفیف */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  قیمت با تخفیف (اختیاری)
                </label>
                <Input
                  type="number"
                  {...register("discountPrice", { valueAsNumber: true })}
                  placeholder="4500000"
                />
              </div>

              {/* آدرس اینترنتی تصویر */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>آدرس تصویر کالا</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    مسیر تصویر یا آدرس URL
                  </span>
                </label>
                <div className="relative">
                  <Input
                    {...register("imageUrl")}
                    placeholder="/images/products/adapter-52240.png"
                    dir="ltr"
                    className="text-start pe-10"
                  />
                  <Upload className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>

              {/* توضیحات کالا */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  توضیحات و مشخصات اجمالی
                </label>
                <Textarea
                  {...register("description")}
                  placeholder="مشخصات ولتاژ، پورت‌ها، استانداردهای صنعتی و کاربری محصول..."
                  rows={3}
                />
              </div>

              {/* وضعیت فعال بودن در فروشگاه */}
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
