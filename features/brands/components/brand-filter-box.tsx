"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Search, X, Award, Check } from "lucide-react";
import { useBrands } from "@/lib/api/brands";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, normalizeImageUrl } from "@/lib/utils";

export interface BrandFilterBoxProps {
  selectedBrandIds: number[];
  onChange: (brandIds: number[]) => void;
  brandCounts?: Record<number, number>;
  className?: string;
}

export function BrandFilterBox({
  selectedBrandIds,
  onChange,
  brandCounts = {},
  className,
}: BrandFilterBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: brands = [], isLoading } = useBrands();

  // فیلتر برندها بر اساس جستجوی سریع
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.trim().toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  // تغییر وضعیت انتخاب یک برند (Toggle)
  const handleToggleBrand = (brandId: number) => {
    if (selectedBrandIds.includes(brandId)) {
      onChange(selectedBrandIds.filter((id) => id !== brandId));
    } else {
      onChange([...selectedBrandIds, brandId]);
    }
  };

  // پاک کردن تمام فیلترهای برند
  const handleClearAll = () => {
    onChange([]);
    setSearchQuery("");
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 space-y-3.5",
        className
      )}
    >
      {/* سربرگ بخش فیلتر برند */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground">برند کالا</h3>
          {selectedBrandIds.length > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-4.5 px-1.5 rounded-full">
              {selectedBrandIds.length.toLocaleString("fa-IR")}
            </Badge>
          )}
        </div>

        {selectedBrandIds.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>حذف فیلتر</span>
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* اینپوت جستجوی سریع برندها */}
      {brands.length > 5 && (
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="جستجوی برند..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pr-8 pl-7 text-xs rounded-xl bg-muted/40 border-border/80 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* لیست چک‌باکس برندها */}
      <div className="space-y-1 max-h-56 overflow-y-auto pe-1">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {searchQuery
              ? `برندی با عنوان «${searchQuery}» پیدا نشد.`
              : "برندی در این بخش موجود نیست."}
          </div>
        ) : (
          filteredBrands.map((brand) => {
            const isSelected = selectedBrandIds.includes(brand.id);
            const count = brandCounts[brand.id] ?? brand.productsCount;

            return (
              <div
                key={brand.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleToggleBrand(brand.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleBrand(brand.id);
                  }
                }}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer select-none transition-colors group",
                  isSelected
                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* چک‌باکس با استایل دیزاین سیستم */}
                  <div
                    className={cn(
                      "size-4.5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-background group-hover:border-primary/50"
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>

                  {/* لوگوی کوچک برند */}
                  <div className="size-5 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {brand.logo ? (
                      <Image
                        src={normalizeImageUrl(brand.logo)}
                        alt={brand.name}
                        fill
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">
                        {brand.slug.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  {/* نام برند */}
                  <span className="truncate">{brand.name}</span>
                </div>

                {/* تعداد محصولات این برند */}
                {typeof count === "number" && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 mr-1",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground bg-muted/50"
                    )}
                  >
                    {count.toLocaleString("fa-IR")}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default BrandFilterBox;
