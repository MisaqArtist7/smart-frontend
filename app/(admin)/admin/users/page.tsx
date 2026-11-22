"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Loader2,
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  MessageSquare,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useAdminUsers, useUpdateAdminUser, type User } from "@/lib/api";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { toPersianDigits } from "@/lib/account-data";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FilterTab = "ALL" | "ADMIN" | "CUSTOMER" | "INACTIVE";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<"ADMIN" | "CUSTOMER">("CUSTOMER");
  const [targetActive, setTargetActive] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users = [], isLoading, isError, error, refetch } = useAdminUsers();
  const updateMutation = useUpdateAdminUser();
  const { user: currentUser } = useAuth();

  // آمار سریع
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const customers = users.filter((u) => u.role !== "ADMIN").length;
    const inactive = users.filter((u) => u.isActive === false).length;
    return { total, admins, customers, inactive };
  }, [users]);

  // فیلتر کردن کاربران بر اساس تب و متن جستجو
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // فیلتر تب
      if (filterTab === "ADMIN" && u.role !== "ADMIN") return false;
      if (filterTab === "CUSTOMER" && u.role === "ADMIN") return false;
      if (filterTab === "INACTIVE" && u.isActive !== false) return false;

      // فیلتر جستجو
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const nameMatch = u.name?.toLowerCase().includes(term);
      const phoneMatch = u.phone?.includes(term);
      const idMatch = String(u.id) === term;
      return nameMatch || phoneMatch || idMatch;
    });
  }, [users, filterTab, searchTerm]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setTargetRole(user.role === "ADMIN" ? "ADMIN" : "CUSTOMER");
    setTargetActive(user.isActive !== false);
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    const isCurrentAdmin =
      currentUser && Number(currentUser.id) === Number(selectedUser.id);

    if (isCurrentAdmin && targetRole !== "ADMIN") {
      toast.error("شما نمی‌توانید دسترسی ادمین حساب کاربری خودتان را لغو کنید.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        role: targetRole,
        isActive: targetActive,
      });

      toast.success(
        `دسترسی کاربر «${selectedUser.name || selectedUser.phone}» با موفقیت به‌روزرسانی شد.`
      );
      setIsDialogOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "خطا در ویرایش دسترسی کاربر";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* عنوان صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            کاربران و مدیریت دسترسی‌ها
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مشاهده حساب‌های کاربری ثبت‌شده در سیستم، تعیین نقش‌ها و اعطای دسترسی ادمین
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-xl text-xs gap-1.5 self-start sm:self-auto"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Users className="size-3.5" />
          )}
          به‌روزرسانی لیست
        </Button>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">کل کاربران</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-1">
                {toPersianDigits(stats.total)}
              </p>
            </div>
            <div className="size-10 sm:size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="size-5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">مدیران سیستم</p>
              <p className="text-xl sm:text-2xl font-black text-primary mt-1">
                {toPersianDigits(stats.admins)}
              </p>
            </div>
            <div className="size-10 sm:size-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
              <ShieldCheck className="size-5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">مشتریان عادی</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-1">
                {toPersianDigits(stats.customers)}
              </p>
            </div>
            <div className="size-10 sm:size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <UserCheck className="size-5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حساب‌های مسدود</p>
              <p className="text-xl sm:text-2xl font-black text-destructive mt-1">
                {toPersianDigits(stats.inactive)}
              </p>
            </div>
            <div className="size-10 sm:size-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
              <UserX className="size-5 sm:size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تب‌های فیلتر و جستجو */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* تب‌ها */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setFilterTab("ALL")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  filterTab === "ALL"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                همه کاربران ({toPersianDigits(stats.total)})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("ADMIN")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1",
                  filterTab === "ADMIN"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="size-3" />
                مدیران ({toPersianDigits(stats.admins)})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("CUSTOMER")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  filterTab === "CUSTOMER"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                مشتریان ({toPersianDigits(stats.customers)})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("INACTIVE")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  filterTab === "INACTIVE"
                    ? "bg-destructive text-destructive-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                مسدود / غیرفعال ({toPersianDigits(stats.inactive)})
              </button>
            </div>

            {/* کادر جستجو */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام، شماره تماس یا شناسه..."
                className="ps-9 h-9 rounded-xl text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول کاربران */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">شناسه</TableHead>
                  <TableHead>نام و مشخصات کاربر</TableHead>
                  <TableHead>شماره تماس</TableHead>
                  <TableHead>نقش کاربری</TableHead>
                  <TableHead>فعالیت (سفارش / دیدگاه)</TableHead>
                  <TableHead>وضعیت حساب</TableHead>
                  <TableHead>تاریخ عضویت</TableHead>
                  <TableHead className="text-end">عملیات دسترسی</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="font-semibold text-foreground">
                          در حال بارگذاری لیست کاربران از سرور...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center text-xs text-destructive"
                    >
                      <div className="space-y-2 max-w-md mx-auto">
                        <AlertTriangle className="size-8 mx-auto opacity-80" />
                        <div className="font-bold text-sm">
                          خطا در دریافت لیست کاربران از سرور
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {error instanceof Error
                            ? error.message
                            : "لطفاً مطمئن شوید سرور بک‌اند با آخرین تغییرات ریستارت شده است."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center text-xs text-muted-foreground"
                    >
                      <div className="space-y-2 max-w-sm mx-auto">
                        <Users className="size-10 mx-auto opacity-30 stroke-1" />
                        <div className="font-bold text-foreground text-sm">
                          کاربری یافت نشد.
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {searchTerm
                            ? "با عبارت جستجو شده یا فیلتر انتخابی کاربری پیدا نشد."
                            : "هنوز کاربری در سیستم ثبت‌نام نکرده است."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf =
                      currentUser &&
                      Number(currentUser.id) === Number(user.id);
                    const isAdmin = user.role === "ADMIN";

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        {/* شناسه */}
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground font-semibold">
                            #{toPersianDigits(user.id)}
                          </span>
                        </TableCell>

                        {/* نام و مشخصات */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                isAdmin
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {(user.name || "ک")[0]}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                                {user.name || "کاربر گرامی"}
                                {isSelf && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                                  >
                                    شما
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* شماره تماس */}
                        <TableCell>
                          <span
                            className="font-mono text-xs font-semibold text-foreground flex items-center gap-1"
                            dir="ltr"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            {toPersianDigits(user.phone)}
                          </span>
                        </TableCell>

                        {/* نقش کاربری */}
                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 font-medium">
                              <ShieldCheck className="size-3" />
                              مدیر سیستم
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground text-[10px] gap-1"
                            >
                              مشتری عادی
                            </Badge>
                          )}
                        </TableCell>

                        {/* فعالیت */}
                        <TableCell>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span
                              className="flex items-center gap-1"
                              title="تعداد سفارش‌ها"
                            >
                              <ShoppingBag className="size-3 text-muted-foreground/80" />
                              {toPersianDigits(user._count?.orders ?? 0)} سفارش
                            </span>
                            <span className="text-border">|</span>
                            <span
                              className="flex items-center gap-1"
                              title="تعداد دیدگاه‌ها"
                            >
                              <MessageSquare className="size-3 text-muted-foreground/80" />
                              {toPersianDigits(user._count?.comments ?? 0)} نظر
                            </span>
                          </div>
                        </TableCell>

                        {/* وضعیت حساب */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.isActive !== false
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                                : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                            }
                          >
                            {user.isActive !== false ? "فعال" : "مسدود / غیرفعال"}
                          </Badge>
                        </TableCell>

                        {/* تاریخ عضویت */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <Calendar className="size-3 opacity-60" />
                            {formatDate(user.createdAt)}
                          </span>
                        </TableCell>

                        {/* عملیات */}
                        <TableCell className="text-end">
                          <Button
                            variant={isAdmin ? "outline" : "default"}
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className={cn(
                              "text-xs rounded-xl h-8 gap-1.5 transition-all",
                              isAdmin
                                ? "border-primary/40 hover:bg-primary/10 text-primary"
                                : "bg-primary text-primary-foreground shadow-xs"
                            )}
                          >
                            <Shield className="size-3" />
                            <span>تغییر دسترسی</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مدال تغییر دسترسی و مشخصات کاربر */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              مدیریت سطح دسترسی کاربر
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              تعیین نقش و وضعیت حساب کاربری در سیستم اسمارت الکتریک
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* خلاصه اطلاعات کاربر */}
              <div className="p-3 bg-muted/50 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {selectedUser.name || "کاربر گرامی"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">
                    {toPersianDigits(selectedUser.phone)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    selectedUser.role === "ADMIN"
                      ? "bg-primary/10 text-primary border-primary/20 text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  نقش فعلی: {selectedUser.role === "ADMIN" ? "مدیر سیستم" : "مشتری"}
                </Badge>
              </div>

              {/* انتخاب نقش */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  سطح دسترسی (نقش) را انتخاب کنید:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* گزینه ادمین */}
                  <div
                    onClick={() => setTargetRole("ADMIN")}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1.5",
                      targetRole === "ADMIN"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/30 bg-card text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="size-4 shrink-0" />
                      مدیر سیستم (ADMIN)
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      دسترسی کامل به پنل ادمین، سفارشات، محصولات، کدهای تخفیف و تنظیمات
                    </p>
                  </div>

                  {/* گزینه مشتری */}
                  <div
                    onClick={() => {
                      const isSelf =
                        currentUser &&
                        Number(currentUser.id) === Number(selectedUser.id);
                      if (isSelf) {
                        toast.error(
                          "شما نمی‌توانید دسترسی ادمین خودتان را لغو کنید."
                        );
                        return;
                      }
                      setTargetRole("CUSTOMER");
                    }}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1.5",
                      targetRole === "CUSTOMER"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/30 bg-card text-foreground",
                      currentUser &&
                        Number(currentUser.id) === Number(selectedUser.id) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserCheck className="size-4 shrink-0" />
                      مشتری عادی
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      دسترسی محدود به حساب کاربری شخصی، ثبت سفارش و مشاهده تاریخچه خرید
                    </p>
                  </div>
                </div>
              </div>

              {/* اخطار در صورت اعطای دسترسی ادمین */}
              {targetRole === "ADMIN" && selectedUser.role !== "ADMIN" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    توجه: با تبدیل این کاربر به <strong className="font-bold">مدیر سیستم</strong>،
                    وی قادر به مشاهده درآمدها، مدیریت تمام سفارش‌ها و ویرایش کاتالوگ فروشگاه خواهد بود.
                  </p>
                </div>
              )}

              {/* سوئیچ وضعیت حساب */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    وضعیت حساب کاربری
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {targetActive
                      ? "حساب کاربر فعال است و اجازه ورود دارد."
                      : "حساب کاربر مسدود شده و امکان ورود نخواهد داشت."}
                  </div>
                </div>
                <Switch
                  checked={targetActive}
                  onCheckedChange={setTargetActive}
                  disabled={Boolean(
                    currentUser &&
                    Number(currentUser.id) === Number(selectedUser.id)
                  )}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              انصراف
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveRole}
              disabled={updateMutation.isPending}
              className="rounded-xl text-xs gap-1.5"
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
