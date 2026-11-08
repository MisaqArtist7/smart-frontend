"use client";

import React, { useState } from "react";
import { Search, Shield, Phone, Loader2, Users } from "lucide-react";
import { useAdminUsers } from "@/lib/api";
import { toPersianDigits } from "@/lib/account-data";
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
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading } = useAdminUsers();

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const phoneMatch = u.phone?.includes(term);
    return nameMatch || phoneMatch;
  });

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

  return (
    <div className="space-y-6 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          کاربران و مشتریان
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          مشاهده حساب‌های کاربری ثبت‌شده در سیستم، نقش‌ها و شماره‌های تماس
        </p>
      </div>

      {/* جستجو */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام یا شماره موبایل..."
              className="ps-9 h-10 rounded-xl"
            />
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
                  <TableHead>نام کاربر</TableHead>
                  <TableHead>شماره تماس</TableHead>
                  <TableHead>نقش کاربری</TableHead>
                  <TableHead>وضعیت حساب</TableHead>
                  <TableHead>تاریخ ثبت نام</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span>در حال بارگذاری لیست کاربران از سرور...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                      <div className="space-y-2">
                        <Users className="size-8 mx-auto opacity-30 stroke-1" />
                        <div className="font-bold text-foreground">کاربری در سیستم یافت نشد.</div>
                        <p className="text-[11px] text-muted-foreground">
                          {searchTerm
                            ? "با عبارت جستجو شده کاربری پیدا نشد."
                            : "هنوز کاربری در سیستم ثبت‌نام نکرده است یا پاسخی از سرور دریافت نشد."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-bold text-xs sm:text-sm text-foreground">
                          {user.name || "کاربر گرامی"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          شناسه: #{user.id}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1" dir="ltr">
                          <Phone className="size-3 text-muted-foreground" />
                          {toPersianDigits(user.phone)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {user.role === "ADMIN" ? (
                          <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
                            <Shield className="size-3" />
                            مدیر سیستم
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            مشتری
                          </Badge>
                        )}
                      </TableCell>

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

                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
