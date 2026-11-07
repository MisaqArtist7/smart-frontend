"use client";

import React, { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* الگوهای پس‌زمینه لطیف و دکوراتیو */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-50 pointer-events-none" />

      <Suspense
        fallback={
          <div className="py-20 text-center text-muted-foreground animate-pulse text-sm">
            در حال بارگذاری صفحه ثبت‌نام...
          </div>
        }
      >
        <AuthCard initialTab="register" />
      </Suspense>
    </div>
  );
}
