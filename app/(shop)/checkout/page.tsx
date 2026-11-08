"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  Plus,
  ShoppingBag,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Info,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useCartStore } from "@/lib/cart-store";
import {
  useAddresses,
  useCreateAddress,
  useCreateOrder,
  useProducts,
  ApiError,
  type Address,
} from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const IRAN_PROVINCES = [
  "تهران",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "البرز",
  "آذربایجان شرقی",
  "خوزستان",
  "مازندران",
  "گیلان",
  "کرمان",
  "قم",
  "یزد",
  "هرمزگان",
  "کرمانشاه",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const createOrderMutation = useCreateOrder();
  const createAddressMutation = useCreateAddress();
  const { data: addresses = [], isLoading: isAddressesLoading } = useAddresses();
  const { data: freshProducts } = useProducts();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // محافظت از مسیر: ورود الزامی است
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.info("برای تکمیل سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید.");
      router.replace("/login?redirect=/checkout");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // دسترسی به سبد خرید
  const {
    items,
    orderNote,
    setOrderNote,
    getRawTotal,
    getDiscountTotal,
    getFinalTotal,
    clearCart,
    syncWithProducts,
  } = useCartStore();

  // همگام‌سازی موجودی و قیمت قبل از پرداخت نهایی
  useEffect(() => {
    if (freshProducts && freshProducts.length > 0) {
      const warnings = syncWithProducts(freshProducts);
      if (warnings.length > 0) {
        warnings.forEach((msg) => toast.warning(msg));
      }
    }
  }, [freshProducts, syncWithProducts]);

  // انتخاب آدرس
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  // فرم ایجاد آدرس درون‌خطی
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "",
    receiverName: "",
    receiverPhone: "",
    province: "تهران",
    city: "تهران",
    addressLine: "",
    postalCode: "",
    isDefault: false,
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  const handleOpenNewAddressModal = () => {
    if (addresses.length >= 10) {
      toast.error("امکان ثبت بیش از ۱۰ آدرس وجود ندارد (حداکثر سقف مجاز تکمیل است).");
      return;
    }
    setAddressForm({
      title: "",
      receiverName: user?.name || "",
      receiverPhone: user?.phone || "",
      province: "تهران",
      city: "تهران",
      addressLine: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = addressForm.title.trim();
    const receiverName = addressForm.receiverName.trim();
    const receiverPhone = addressForm.receiverPhone.trim();
    const province = addressForm.province.trim();
    const city = addressForm.city.trim();
    const addressLine = addressForm.addressLine.trim();
    const postalCode = addressForm.postalCode.trim();

    if (title.length < 2 || title.length > 50) {
      toast.error("عنوان آدرس باید بین ۲ تا ۵۰ کاراکتر باشد.");
      return;
    }
    if (receiverName.length < 2 || receiverName.length > 100) {
      toast.error("نام تحویل‌گیرنده باید بین ۲ تا ۱۰۰ کاراکتر باشد.");
      return;
    }
    if (!/^09\d{9}$/.test(receiverPhone)) {
      toast.error("شماره تماس تحویل‌گیرنده باید شماره موبایل معتبر ۱۱ رقمی باشد (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
      return;
    }
    if (province.length < 2 || province.length > 50) {
      toast.error("نام استان نامعتبر است.");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      toast.error("نام شهر نامعتبر است.");
      return;
    }
    if (addressLine.length < 5 || addressLine.length > 500) {
      toast.error("نشانی پستی باید حداقل ۵ و حداکثر ۵۰۰ کاراکتر باشد.");
      return;
    }
    if (!/^\d{10}$/.test(postalCode)) {
      toast.error("کد پستی باید دقیقاً ۱۰ رقم عددی باشد.");
      return;
    }

    setIsSubmittingAddress(true);
    try {
      const newAddr = await createAddressMutation.mutateAsync({
        title,
        receiverName,
        receiverPhone,
        province,
        city,
        addressLine,
        postalCode,
        isDefault: addressForm.isDefault,
      });

      setSelectedAddressId(newAddr.id);
      setIsAddressModalOpen(false);
      toast.success("آدرس تحویل با موفقیت ثبت و انتخاب شد.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error("امکان ثبت بیش از ۱۰ آدرس وجود ندارد (خطای ۴۰۹).");
          return;
        }
        toast.error(err.message);
      } else {
        toast.error("خطا در ذخیره‌سازی آدرس تحویل.");
      }
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  // ثبت نهایی سفارش
  const handleFinalSubmit = async () => {
    if (!selectedAddressId) {
      toast.error("لطفاً یک آدرس تحویل را انتخاب کنید یا آدرس جدیدی اضافه نمایید.");
      return;
    }

    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است.");
      return;
    }

    try {
      // ارسال ساختار دقیق DTO به بک‌اند:
      // فقط addressId, paymentMethod: "CARD_TO_CARD", items: [{ productId, quantity }], note?
      const res = await createOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        paymentMethod: "CARD_TO_CARD",
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
        note: orderNote.trim() ? orderNote.trim().slice(0, 500) : undefined,
      });

      toast.success("سفارش شما با موفقیت ثبت شد!");
      clearCart();
      router.push(`/orders/${res.id}?new=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const lower = String(err.message).toLowerCase();
          if (lower.includes("stock") || lower.includes("موجودی")) {
            toast.error("موجودی برخی از کالاها در انبار تغییر یافته است. لطفاً سبد خرید خود را بازبینی فرمایید.");
          } else if (lower.includes("unpaid") || lower.includes("پرداخت")) {
            toast.error("شما سفارش پرداخت‌نشده‌ی فعالی دارید. لطفاً ابتدا سفارش قبلی را تکمیل یا لغو فرمایید.");
          } else {
            toast.error(err.message);
          }
          return;
        }

        if (err.status === 400) {
          const lower = String(err.message).toLowerCase();
          if (lower.includes("inactive") || lower.includes("غیرفعال")) {
            toast.error("یکی از اقلام سفارش دیگر فعال نیست و امکان خرید آن وجود ندارد.");
          } else {
            toast.error(err.message);
          }
          return;
        }

        toast.error(err.message);
      } else {
        toast.error("خطایی در ثبت سفارش رخ داد. لطفاً مجدداً امتحان کنید.");
      }
    }
  };

  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>در حال بررسی اطلاعات کاربری...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const rawTotal = getRawTotal();
  const discountTotal = getDiscountTotal();
  const finalTotal = getFinalTotal();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
        {/* نوار مراحل خرید */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-center gap-3 sm:gap-8 text-xs font-bold">
            <Link href="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <span className="size-6 rounded-full bg-muted flex items-center justify-center text-xs">
                ۱
              </span>
              <span>سبد خرید</span>
            </Link>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                ۲
              </span>
              <span>انتخاب آدرس تحویل</span>
            </div>
            <div className="w-10 sm:w-20 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                ۳
              </span>
              <span>پرداخت کارت‌به‌کارت و ثبت نهایی</span>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 sm:p-16 text-center space-y-5 my-6">
            <ShoppingBag className="size-16 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground">کالایی در سبد خرید شما وجود ندارد!</h2>
              <p className="text-xs text-muted-foreground">برای ثبت سفارش ابتدا کالاهای مورد نظر خود را به سبد خرید اضافه کنید.</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all"
            >
              <span>مشاهده محصولات</span>
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ستون اصلی راست: آدرس تحویل، روش پرداخت، یادداشت و بررسی اقلام */}
            <div className="lg:col-span-8 space-y-6">
              {/* بخش ۱: انتخاب یا افزودن آدرس تحویل */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    <h2 className="font-black text-base text-foreground">آدرس تحویل سفارش</h2>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewAddressModal}
                    disabled={addresses.length >= 10}
                    className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>افزودن آدرس جدید</span>
                  </Button>
                </div>

                {isAddressesLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>در حال بارگذاری آدرس‌های ثبت‌شده...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-3 bg-muted/10">
                    <p className="text-xs text-muted-foreground">هنوز هیچ آدرسی ثبت نکرده‌اید.</p>
                    <Button onClick={handleOpenNewAddressModal} className="rounded-xl text-xs font-bold">
                      ثبت آدرس تحویل
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-2 relative ${
                            isSelected
                              ? "border-primary bg-primary/[0.04] ring-1 ring-primary/40 shadow-xs"
                              : "border-border hover:border-border/80 bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {isSelected ? (
                                <CheckCircle2 className="size-4 text-primary" />
                              ) : (
                                <div className="size-4 rounded-full border border-border" />
                              )}
                              {addr.title}
                            </span>
                            {addr.isDefault && (
                              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                پیش‌فرض
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                            {addr.province}، {addr.city}، {addr.addressLine}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                            <span>گیرنده: {addr.receiverName}</span>
                            <span>{addr.receiverPhone}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* بخش ۲: روش پرداخت ثابت (کارت‌به‌کارت) و اطلاعیه پس‌کرایه */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <CreditCard className="size-5 text-primary" />
                  <h2 className="font-black text-base text-foreground">روش پرداخت و تسویه حساب</h2>
                </div>

                <div className="p-4 rounded-xl border border-primary/40 bg-primary/[0.03] flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-foreground">
                      پرداخت از طریق کارت‌به‌کارت (انتقال بانکی و بارگذاری رسید)
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      پس از ثبت نهایی سفارش، شماره کارت فروشگاه و دستورالعمل واریز همراه با فاکتور به شما نمایش داده می‌شود و می‌توانید فیش واریزی خود را ثبت نمایید تا بلافاصله تایید و پردازش گردد.
                    </p>
                  </div>
                </div>

                {/* اطلاعیه رسمی عدم دریافت هزینه پست در زمان ثبت */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3 text-xs leading-relaxed">
                  <Truck className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-muted-foreground">
                    <strong className="text-foreground block">
                      هزینه ارسال به صورت پس‌کرایه (پرداخت در مقصد):
                    </strong>
                    <span>
                      هزینه بسته‌بندی و ارسال سفارش در این فاکتور <strong>۰ تومان</strong> لحاظ شده است؛ زیرا هزینه کرایه پستی یا باربری به صورت مستقیم توسط خریدار به مامور محترم پست در هنگام تحویل کالا پرداخت می‌شود.
                    </span>
                  </div>
                </div>
              </div>

              {/* بخش ۳: بازبینی اقلام سفارش */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="size-5 text-primary" />
                    <h2 className="font-black text-base text-foreground">اقلام انتخابی سفارش</h2>
                  </div>
                  <Link href="/cart" className="text-xs text-primary hover:underline font-bold">
                    ویرایش سبد خرید
                  </Link>
                </div>

                <div className="divide-y divide-border/60">
                  {items.map((item) => {
                    const price = item.discountPrice ?? item.price;
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-12 rounded-lg bg-muted/30 border border-border p-1 shrink-0 flex items-center justify-center">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="object-contain size-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-foreground line-clamp-1 block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              تعداد: {item.quantity.toLocaleString("fa-IR")} عدد
                            </span>
                          </div>
                        </div>

                        <div className="text-end shrink-0 font-mono font-bold text-foreground">
                          {(price * item.quantity).toLocaleString("fa-IR")} تومان
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* بخش ۴: یادداشت سفارش (اختیاری، حداکثر ۵۰۰ کاراکتر) */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="orderNote" className="text-xs font-bold text-foreground">
                    یادداشت یا توضیحات سفارش (اختیاری)
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {orderNote.length}/۵۰۰
                  </span>
                </div>

                <Textarea
                  id="orderNote"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
                  placeholder="در صورت وجود توضیح خاص پیرامون زمان تحویل، هماهنگی یا نوع بسته‌بندی اینجا بنویسید..."
                  rows={3}
                  maxLength={500}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* ستون چپ: کارت صورتحساب و دکمه پرداخت نهایی (Sticky) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-black text-sm text-foreground pb-2 border-b border-border/60">
                  فاکتور و تسویه سفارش
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مجموع قیمت اقلام:</span>
                    <span className="font-mono font-bold text-foreground">
                      {rawTotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span>تخفیف کالاها:</span>
                      <span className="font-mono font-bold">
                        - {discountTotal.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">هزینه ارسال پستی:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      پس‌کرایه (۰ تومان در فاکتور)
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border flex items-baseline justify-between">
                    <span className="font-black text-xs sm:text-sm text-foreground">
                      مبلغ نهایی پرداخت:
                    </span>
                    <div className="text-end">
                      <span className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">
                        {finalTotal.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs text-muted-foreground ms-1">تومان</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFinalSubmit}
                  disabled={createOrderMutation.isPending || !selectedAddressId || items.length === 0}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {createOrderMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      در حال ثبت سفارش...
                    </span>
                  ) : (
                    <span>ثبت سفارش و دریافت اطلاعات پرداخت</span>
                  )}
                </Button>

                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>تضمین اصالت کالا و گارانتی معتبر</span>
                  </div>
                  <p className="leading-relaxed">
                    با کلیک روی ثبت سفارش، اقلام انتخابی برای شما رزرو شده و کد پیگیری سفارش صادر می‌گردد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* مدال افزودن آدرس جدید به صورت درون‌خطی در چک‌اوت */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              افزودن آدرس جدید تحویل
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              لطفاً نشانی کامل پستی و مشخصات تحویل‌گیرنده را جهت ارسال سفارش وارد فرمایید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveInlineAddress} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  عنوان آدرس (مثال: شرکت، منزل، کارگاه) <span className="text-destructive">*</span>
                </label>
                <Input
                  value={addressForm.title}
                  onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                  placeholder="منزل، شرکت، انبار..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  نام و نام خانوادگی گیرنده <span className="text-destructive">*</span>
                </label>
                <Input
                  value={addressForm.receiverName}
                  onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                  placeholder="نام کامل تحویل‌گیرنده"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شماره موبایل گیرنده <span className="text-destructive">*</span>
                </label>
                <Input
                  value={addressForm.receiverPhone}
                  onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
                  placeholder="09121234567"
                  dir="ltr"
                  className="text-start"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  استان <span className="text-destructive">*</span>
                </label>
                <select
                  value={addressForm.province}
                  onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                  className="flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {IRAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شهر <span className="text-destructive">*</span>
                </label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="تهران"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  کد پستی ۱۰ رقمی <span className="text-destructive">*</span>
                </label>
                <Input
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  placeholder="1144893456"
                  maxLength={10}
                  dir="ltr"
                  className="text-start"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  نشانی کامل پستی <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  placeholder="خیابان، کوچه، پلاک، طبقه و واحد..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                className="rounded-xl text-xs sm:text-sm cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAddress}
                className="rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                {isSubmittingAddress ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    در حال ذخیره...
                  </span>
                ) : (
                  "ذخیره و انتخاب آدرس"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
