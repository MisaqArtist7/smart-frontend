"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Search,
  Loader2,
  Trash2,
  Eye,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
} from "lucide-react";
import {
  useAdminContactList,
  useUpdateAdminContact,
  useDeleteAdminContact,
  CONTACT_SUBJECT_CONFIG,
  CONTACT_SUBJECT_OPTIONS,
  CONTACT_STATUS_CONFIG,
} from "@/lib/api/contact";
import { ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/account-data";
import type { ContactMessage, ContactStatus, ContactSubject } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminContactPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "ALL">("ALL");
  const [subjectFilter, setSubjectFilter] = useState<ContactSubject | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [editStatus, setEditStatus] = useState<ContactStatus>("NEW");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const { data, isLoading } = useAdminContactList({
    page,
    limit: 15,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    subject: subjectFilter === "ALL" ? undefined : subjectFilter,
    search: searchInput.trim() || undefined,
  });

  const updateMutation = useUpdateAdminContact();
  const deleteMutation = useDeleteAdminContact();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts ?? { NEW: 0, IN_PROGRESS: 0, DONE: 0 };
  const totalPages = Math.max(1, Math.ceil(total / 15));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const openDetailModal = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setEditStatus(msg.status);
    setEditNote(msg.adminNote || "");
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedMessage.id,
        input: {
          id: selectedMessage.id,
          status: editStatus,
          adminNote: editNote.trim(),
        },
      });
      toast.success("وضعیت و یادداشت پیام با موفقیت به‌روزرسانی شد.");
      setSelectedMessage(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "خطا در به‌روزرسانی پیام";
      toast.error(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("پیام با موفقیت حذف شد.");
      setDeleteTarget(null);
      if (selectedMessage?.id === deleteTarget.id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "خطا در حذف پیام";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          پیام‌های تماس با ما
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          مشاهده، پیگیری و ثبت یادداشت برای پیام‌های ارسالی مشتریان از صفحه تماس با ما
        </p>
      </div>

      {/* کارت‌های آمار وضعیت */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="rounded-2xl border-border bg-card shadow-xs cursor-pointer hover:border-amber-500/40 transition-colors"
          onClick={() => {
            setStatusFilter(statusFilter === "NEW" ? "ALL" : "NEW");
            setPage(1);
          }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">پیام‌های جدید</p>
              <p className="text-2xl font-black text-foreground mt-1">
                {toPersianDigits(counts.NEW)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-2xl border-border bg-card shadow-xs cursor-pointer hover:border-blue-500/40 transition-colors"
          onClick={() => {
            setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS");
            setPage(1);
          }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">در حال پیگیری</p>
              <p className="text-2xl font-black text-foreground mt-1">
                {toPersianDigits(counts.IN_PROGRESS)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-2xl border-border bg-card shadow-xs cursor-pointer hover:border-emerald-500/40 transition-colors"
          onClick={() => {
            setStatusFilter(statusFilter === "DONE" ? "ALL" : "DONE");
            setPage(1);
          }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">انجام‌شده</p>
              <p className="text-2xl font-black text-foreground mt-1">
                {toPersianDigits(counts.DONE)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها و جستجو */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو در نام، شماره تماس یا متن پیام..."
              className="ps-9"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContactStatus | "ALL");
              setPage(1);
            }}
            className="w-full sm:w-44"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="NEW">جدید</option>
            <option value="IN_PROGRESS">در حال پیگیری</option>
            <option value="DONE">انجام‌شده</option>
          </Select>

          <Select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value as ContactSubject | "ALL");
              setPage(1);
            }}
            className="w-full sm:w-56"
          >
            <option value="ALL">همه موضوعات</option>
            {CONTACT_SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* جدول پیام‌ها */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">در حال بارگذاری پیام‌ها...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <Mail className="size-6" />
              </div>
              <p className="text-sm font-bold text-foreground">پیامی یافت نشد</p>
              <p className="text-xs text-muted-foreground">
                با تغییر فیلترها یا عبارت جستجو دوباره امتحان کنید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">فرستنده</TableHead>
                    <TableHead className="text-start">شماره تماس</TableHead>
                    <TableHead className="text-start">موضوع</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">تاریخ ارسال</TableHead>
                    <TableHead className="text-end">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((msg) => {
                    const statusCfg = CONTACT_STATUS_CONFIG[msg.status];
                    const subjectCfg = CONTACT_SUBJECT_CONFIG[msg.subject];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <TableRow key={msg.id}>
                        <TableCell className="font-bold text-foreground">
                          <div className="flex flex-col">
                            <span>{msg.fullName}</span>
                            {msg.user && (
                              <span className="text-[11px] font-normal text-muted-foreground">
                                کاربر عضو (#{toPersianDigits(msg.user.id)})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="text-start font-mono text-xs">
                          {toPersianDigits(msg.phone)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-52 truncate">
                          {subjectCfg?.label || msg.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 font-medium ${statusCfg.badgeClass}`}
                          >
                            <StatusIcon className="size-3" />
                            <span>{statusCfg.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(msg.createdAt)}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailModal(msg)}
                            >
                              <Eye className="size-4" />
                              <span>بررسی</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(msg)}
                              aria-label="حذف پیام"
                            >
                              <Trash2 className="size-4" />
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
        </CardContent>
      </Card>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع{" "}
            {toPersianDigits(total)} پیام)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}

      {/* مودال بررسی و تغییر وضعیت پیام */}
      <Dialog
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="size-5 text-primary" />
              <span>جزئیات پیام تماس</span>
            </DialogTitle>
            <DialogDescription>
              {selectedMessage
                ? `ارسال‌شده توسط ${selectedMessage.fullName} در ${formatDate(
                    selectedMessage.createdAt
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">شماره تماس:</span>
                  <span className="font-bold dir-ltr">{toPersianDigits(selectedMessage.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">موضوع:</span>
                  <span className="font-bold truncate">
                    {CONTACT_SUBJECT_CONFIG[selectedMessage.subject]?.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">متن پیام مشتری</label>
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">وضعیت پیگیری</label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ContactStatus)}
                >
                  <option value="NEW">جدید</option>
                  <option value="IN_PROGRESS">در حال پیگیری</option>
                  <option value="DONE">انجام‌شده</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">یادداشت ادمین</label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="نتیجه تماس یا پیگیری را برای ثبت در سوابق بنویسید..."
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  <span>ذخیره تغییرات</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال تایید حذف */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف پیام تماس</DialogTitle>
            <DialogDescription>
              آیا از حذف پیام ارسالی «{deleteTarget?.fullName}» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              <span>حذف پیام</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
