"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useCategories, useCreateCategory } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// ولیدیشن فرم دسته‌بندی
const categoryFormSchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد"),
  slug: z.string().min(2, "نامک انگلیسی الزامی است"),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().min(1, "ترتیب نمایش باید عددی مثبت باشد"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function AdminCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();

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
      parentId: null,
      sortOrder: 1,
    },
  });

  // فیلتر دسته‌بندی‌ها
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // تولید خودکار اسلاگ
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    const autoSlug = val
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "");
    setValue("slug", autoSlug);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      await createCategoryMutation.mutateAsync({
        name: values.name,
        slug: values.slug,
        parentId: values.parentId || null,
        sortOrder: values.sortOrder,
      });

      toast.success(`دسته‌بندی «${values.name}» با موفقیت افزوده شد.`);
      setIsCreateOpen(false);
      reset();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "خطا در ثبت دسته‌بندی");
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* سربرگ بخش دسته‌بندی‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            ایجاد ساختار درختی کاتالوگ محصولات، تعریف دسته‌های والد و زیرمجموعه‌ها
          </p>
        </div>

        <Button
          onClick={() => {
            reset({
              name: "",
              slug: "",
              parentId: null,
              sortOrder: categories.length + 1,
            });
            setIsCreateOpen(true);
          }}
          className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>افزودن دسته‌بندی جدید</span>
        </Button>
      </div>

      {/* نوار جستجو */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام یا شناسه انگلیسی دسته‌بندی..."
              className="ps-9 h-10 rounded-xl"
            />
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
                  <TableHead className="w-16 text-center">ترتیب</TableHead>
                  <TableHead>نام دسته‌بندی</TableHead>
                  <TableHead>شناسه انگلیسی (Slug)</TableHead>
                  <TableHead>سطح و ساختار والد</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead className="w-24 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      در حال دریافت لیست دسته‌بندی‌ها...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      هیچ دسته‌بندی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      {/* شماره ترتیب */}
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                        {cat.sortOrder}
                      </TableCell>

                      {/* نام دسته‌بندی */}
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                          {cat.parentId ? (
                            <CornerDownLeft className="size-3.5 text-muted-foreground" />
                          ) : (
                            <FolderTree className="size-4 text-primary" />
                          )}
                          <span>{cat.name}</span>
                        </div>
                      </TableCell>

                      {/* اسلاگ */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                          {cat.slug}
                        </span>
                      </TableCell>

                      {/* سطح والد و فرزند */}
                      <TableCell>
                        {cat.parentId ? (
                          <Badge variant="outline" className="text-[11px] font-medium border-border gap-1 text-muted-foreground">
                            <span>زیردسته:</span>
                            <span className="font-bold text-foreground">
                              {cat.parentName || "والد"}
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            دسته‌بندی اصلی
                          </Badge>
                        )}
                      </TableCell>

                      {/* تاریخ ثبت */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {cat.createdAt}
                        </span>
                      </TableCell>

                      {/* دکمه‌های عملیات */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => toast.info(`ویرایش دسته‌بندی ${cat.name}`)}
                            className="size-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="size-3.5" />
                            <span className="sr-only">ویرایش</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مدال افزودن دسته‌بندی */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              افزودن دسته‌بندی کالا
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              دسته‌بندی‌های منظم باعث سهولت در فیلتر کالاها و خرید مشتریان می‌شود.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* نام دسته‌بندی */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                اسلاگ انگلیسی (Slug) <span className="text-destructive">*</span>
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

            {/* انتخاب والد */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                دسته‌بندی والد (اختیاری)
              </label>
              <Select {...register("parentId")}>
                <option value="">-- دسته‌بندی اصلی (بدون والد) --</option>
                {categories
                  .filter((c) => !c.parentId)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
            </div>

            {/* اولویت ترتیب نمایش */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                ترتیب نمایش (اولویت عددی)
              </label>
              <Input
                type="number"
                {...register("sortOrder")}
                placeholder="1"
              />
              {errors.sortOrder && (
                <p className="text-[11px] text-destructive">{errors.sortOrder.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 pt-3">
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
                disabled={isSubmitting || createCategoryMutation.isPending}
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
              >
                {isSubmitting || createCategoryMutation.isPending
                  ? "در حال ذخیره..."
                  : "ثبت دسته‌بندی"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
