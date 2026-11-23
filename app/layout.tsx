import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import FloatingCallButton from "@/components/common/floating-call-button";

// کانفیگ فونت وزیرمتن
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://smart-electric.ir"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "فروشگاه اینترنتی اسمارت الکتریک",
  description: "خرید آنلاین انواع محصولات و تجهیزات برق، روشنایی، خانه هوشمند و شبکه",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "فروشگاه اینترنتی اسمارت الکتریک",
    title: "فروشگاه اینترنتی اسمارت الکتریک",
    description: "خرید آنلاین انواع محصولات و تجهیزات برق، روشنایی، خانه هوشمند و شبکه",
    images: [
      {
        url: "/images/brand/logo.png",
        width: 512,
        height: 512,
        alt: "فروشگاه اینترنتی اسمارت الکتریک",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "فروشگاه اینترنتی اسمارت الکتریک",
    description: "خرید آنلاین انواع محصولات و تجهیزات برق، روشنایی، خانه هوشمند و شبکه",
    images: ["/images/brand/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
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
          <AuthProvider>
            {children}
            <FloatingCallButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
