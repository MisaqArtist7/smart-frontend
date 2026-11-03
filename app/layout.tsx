import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

// کانفیگ فونت وزیرمتن
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "فروشگاه اینترنتی",
  description: "خرید آنلاین انواع محصولات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className={vazir.className}>
        {children}
      </body>
    </html>
  );
}