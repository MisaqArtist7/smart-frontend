"use client";

import React, { useState } from "react";
import { MapPin, Search, Shield, Phone, Mail } from "lucide-react";
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

const MOCK_USERS = [
  {
    id: "usr-1",
    fullName: "میثاق هنرمند",
    phoneNumber: "۰۹۱۲۲۱۹۳۵۵۱",
    email: "misaq@example.com",
    role: "ADMIN",
    ordersCount: 14,
    city: "تهران",
    address: "تهران، لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، پلاک ۱۲",
    postalCode: "۱۱۴۴۸۹۳۴۵۶",
    createdAt: "۱۴۰۳/۰۷/۱۵",
  },
  {
    id: "usr-2",
    fullName: "رضا محمدی",
    phoneNumber: "۰۹۱۸۳۳۲۴۴۵۵",
    email: "reza.m@gmail.com",
    role: "USER",
    ordersCount: 3,
    city: "اصفهان",
    address: "اصفهان، شهرک صنعتی مورچه خورت، خیابان رازی، فاز ۲، پلاک ۸",
    postalCode: "۸۳۳۴۵۱۲۷۸۹",
    createdAt: "۱۴۰۳/۰۸/۰۱",
  },
  {
    id: "usr-3",
    fullName: "سارا کریمی",
    phoneNumber: "۰۹۳۵۱۲۳۴۵۶۷",
    email: "sara.karimi@yahoo.com",
    role: "USER",
    ordersCount: 1,
    city: "شیراز",
    address: "شیراز، بلوار پاسداران، کوچه ۱۸، ساختمان پارس، واحد ۴",
    postalCode: "۷۱۳۴۵۹۸۷۶۵",
    createdAt: "۱۴۰۳/۰۸/۰۸",
  },
];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.fullName.includes(searchTerm) ||
      u.phoneNumber.includes(searchTerm) ||
      u.city.includes(searchTerm)
  );

  return (
    <div className="space-y-6 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          کاربران و نشانی‌ها
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          مدیریت حساب‌های کاربری خریداران، سطوح دسترسی و آدرس‌های تحویل سفارش
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
              placeholder="جستجو در نام، شماره موبایل یا شهر..."
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
                  <TableHead>نقش</TableHead>
                  <TableHead>شهر و استان</TableHead>
                  <TableHead>آدرس پستی</TableHead>
                  <TableHead className="text-center">سفارشات</TableHead>
                  <TableHead>عضویت</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {user.fullName}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Mail className="size-3" />
                        {user.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground" />
                        {user.phoneNumber}
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
                      <span className="text-xs font-semibold text-foreground">
                        {user.city}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs flex items-center gap-1">
                        <MapPin className="size-3 text-primary shrink-0" />
                        <span>{user.address}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-foreground">
                        {user.ordersCount} خرید
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {user.createdAt}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
