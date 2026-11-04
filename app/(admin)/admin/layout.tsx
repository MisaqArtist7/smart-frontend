"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex">
      {/* سایدبار دسکتاپ ثابت */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* منوی کشویی سایدبار برای موبایل */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="p-0 w-72 max-w-[85vw] border-e bg-card">
          <AdminSidebar
            isCollapsed={false}
            onNavigate={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* بخش محتوای اصلی و تاپ‌بار بالایی */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

