"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, Search, Loader2, Building2, ChevronLeft } from "lucide-react";
import {
  useAdminProvinces,
  useAdminCities,
  useToggleProvinceActive,
  useToggleCityActive,
} from "@/lib/api/locations";
import { ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/account-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function AdminLocationsPage() {
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const { data: provinces = [], isLoading: isProvincesLoading } = useAdminProvinces();
  const effectiveProvinceId = selectedProvinceId ?? provinces[0]?.id ?? null;

  const { data: cities = [], isLoading: isCitiesLoading } = useAdminCities(effectiveProvinceId);
  const toggleProvince = useToggleProvinceActive();
  const toggleCity = useToggleCityActive();

  const filteredProvinces = useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return provinces;
    return provinces.filter((p) => p.name.toLowerCase().includes(q));
  }, [provinces, provinceSearch]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, citySearch]);

  const selectedProvince = provinces.find((p) => p.id === effectiveProvinceId) || null;

  const handleToggleProvince = async (id: number, nextActive: boolean) => {
    try {
      await toggleProvince.mutateAsync({ id, isActive: nextActive });
      toast.success(
        nextActive
          ? "استان با موفقیت فعال شد."
          : "استان غیرفعال شد (شهرهای آن برای مشتریان پنهان می‌شوند)."
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت استان");
    }
  };

  const handleToggleCity = async (id: number, nextActive: boolean) => {
    try {
      await toggleCity.mutateAsync({ id, isActive: nextActive });
      toast.success(nextActive ? "شهر با موفقیت فعال شد." : "شهر غیرفعال شد.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت شهر");
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          مدیریت استان‌ها و شهرها
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          فعال یا غیرفعال‌سازی استان‌ها و شهرهای مجاز برای ثبت آدرس و ارسال سفارش
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* لیست استان‌ها */}
        <Card className="lg:col-span-5 rounded-2xl border-border bg-card shadow-xs flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="size-4.5 text-primary" />
              <span>استان‌ها ({toPersianDigits(provinces.length)})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              برای مشاهده شهرها روی نام استان کلیک کنید
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute start-3 top-[calc(50%+4px)] -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
                placeholder="جستجوی استان..."
                className="ps-9"
              />
            </div>
          </CardHeader>

          <CardContent className="p-2 sm:p-3 max-h-[560px] overflow-y-auto divide-y divide-border/50">
            {isProvincesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">در حال بارگذاری...</span>
              </div>
            ) : filteredProvinces.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                استانی یافت نشد.
              </div>
            ) : (
              filteredProvinces.map((province) => {
                const isSelected = province.id === effectiveProvinceId;
                return (
                  <div
                    key={province.id}
                    onClick={() => {
                      setSelectedProvinceId(province.id);
                      setCitySearch("");
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronLeft
                        className={cn(
                          "size-4 shrink-0 transition-transform",
                          isSelected ? "text-primary" : "text-muted-foreground/50"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{province.name}</p>
                        {typeof province._count?.cities === "number" && (
                          <p className="text-[11px] text-muted-foreground">
                            {toPersianDigits(province._count.cities)} شهر
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge
                        variant={province.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {province.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                      <Switch
                        checked={province.isActive}
                        disabled={toggleProvince.isPending}
                        onCheckedChange={(checked) =>
                          handleToggleProvince(province.id, checked)
                        }
                        aria-label={`تغییر وضعیت استان ${province.name}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* لیست شهرهای استان انتخاب‌شده */}
        <Card className="lg:col-span-7 rounded-2xl border-border bg-card shadow-xs flex flex-col">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="size-4.5 text-primary" />
              <span>
                {selectedProvince
                  ? `شهرهای استان ${selectedProvince.name} (${toPersianDigits(cities.length)})`
                  : "شهرهای استان"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedProvince && !selectedProvince.isActive
                ? "توجه: این استان در حال حاضر غیرفعال است و شهرهای آن به مشتریان نمایش داده نمی‌شود."
                : "وضعیت فعال بودن هر شهر را به صورت مجزا مدیریت کنید"}
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute start-3 top-[calc(50%+4px)] -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="جستجوی شهر..."
                className="ps-9"
              />
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 max-h-[560px] overflow-y-auto">
            {!effectiveProvinceId ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                یک استان را از لیست سمت راست انتخاب کنید.
              </div>
            ) : isCitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">در حال بارگذاری شهرها...</span>
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                شهری یافت نشد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCities.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {city.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {city.isActive ? "قابل انتخاب در خرید" : "غیرفعال"}
                      </p>
                    </div>
                    <Switch
                      checked={city.isActive}
                      disabled={toggleCity.isPending}
                      onCheckedChange={(checked) => handleToggleCity(city.id, checked)}
                      aria-label={`تغییر وضعیت شهر ${city.name}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
