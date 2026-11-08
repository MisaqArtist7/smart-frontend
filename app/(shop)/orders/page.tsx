"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";

export default function OrdersRedirectPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login?redirect=/orders");
      } else {
        router.replace("/profile/orders");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-bold text-foreground">
          در حال بررسی وضعیت احراز هویت و انتقال به سفارش‌ها...
        </p>
      </main>
      <Footer />
    </div>
  );
}
