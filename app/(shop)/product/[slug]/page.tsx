import { Suspense } from "react";
import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/api";
import type { Product } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/utils";
import SingleProductClient from "./product-client";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://smart-electric.ir"
).replace(/\/+$/, "");

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function toAbsoluteUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return urlOrPath;
  }
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${SITE_URL}${cleanPath}`;
}

function truncateDescription(text?: string | null, maxLen = 160): string {
  if (!text) return "";
  const cleaned = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 3).trim()}...`;
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();

  const urls = [
    `${API_BASE_URL}/product/slug/${encodeURIComponent(decoded)}`,
    /^\d+$/.test(decoded) ? `${API_BASE_URL}/product/${decoded}` : null,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.ok) {
        return (await res.json()) as Product;
      }
    } catch {
      // ادامه به آدرس بعدی یا فال‌بک
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: "مشاهده محصول | فروشگاه اینترنتی اسمارت الکتریک",
      description:
        "خرید آنلاین انواع تجهیزات برقی، کلید و پریز، سیم و کابل و خانه هوشمند در فروشگاه اسمارت الکتریک.",
    };
  }

  const title =
    product.metaTitle?.trim() || `${product.title} | فروشگاه اسمارت الکتریک`;

  const description =
    truncateDescription(product.metaDescription) ||
    truncateDescription(product.description) ||
    `مشاهده مشخصات فنی، قیمت و خرید آنلاین ${product.title} با ضمانت اصالت کالا در فروشگاه اینترنتی اسمارت الکتریک.`;

  const rawImg =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null);
  const normalizedImg = normalizeImageUrl(
    rawImg,
    "/images/products/adapter-52240.png"
  );
  const ogImageUrl = toAbsoluteUrl(normalizedImg);
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug || slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: "فروشگاه اینترنتی اسمارت الکتریک",
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

async function ProductContent({ params }: ProductPageProps) {
  const { slug } = await params;
  return <SingleProductClient slug={slug} />;
}

export default function SingleProductPage({ params }: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-xs text-muted-foreground">
          در حال بارگذاری اطلاعات محصول...
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
