import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

// کانفیگ فونت وزیرمتن
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "فروشگاه اینترنتی اسمارت الکتریک",
  description: "خرید آنلاین انواع محصولات و تجهیزات برق و شبکه",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className={`${vazir.className}`}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
