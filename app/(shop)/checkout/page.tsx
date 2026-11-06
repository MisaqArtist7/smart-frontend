"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  Plus,
  Clock,
  Building2,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  FileText,
  BadgePercent,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/footer";
import { useCartStore } from "@/lib/cart-store";
import { useAccountStore } from "@/lib/account-store";
import { formatPrice, toPersianDigits, type Order, type PaymentMethod } from "@/lib/account-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CheckoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // دیالوگ افزودن آدرس جدید
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: "",
    receiverName: "",
    receiverPhone: "",
    province: "تهران",
    city: "تهران",
    addressLine: "",
    postalCode: "",
    isDefault: false,
  });

  // فیلد کارت‌به‌کارت
  const [cardTrackNumber, setCardTrackNumber] = useState("");

  // دسترسی به داده‌های استورها
  const {
    items,
    coupon,
    selectedShippingMethod,
    selectedPaymentMethod,
    orderNote,
    setShippingMethod,
    setPaymentMethod,
    setOrderNote,
    getRawTotal,
    getDiscountTotal,
    getShippingFee,
    getFinalTotal,
    getTotalCount,
    clearCart,
  } = useCartStore();

  const { addresses, addAddress, addOrder } = useAccountStore();

  // آدرس انتخاب‌شده
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const effectiveAddressId =
    selectedAddressId ||
    (addresses.find((a) => a.isDefault) || addresses[0])?.id ||
    "";

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} در حافظه کپی شد`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAddressForm.title.trim() ||
      !newAddressForm.receiverName.trim() ||
      !newAddressForm.receiverPhone.trim() ||
      !newAddressForm.addressLine.trim() ||
      !newAddressForm.postalCode.trim()
    ) {
      toast.error("لطفاً تمامی فیلدهای الزامی آدرس را تکمیل کنید.");
      return;
    }

    if (!/^09\d{9}$/.test(newAddressForm.receiverPhone.trim())) {
      toast.error("شماره تماس تحویل‌گیرنده باید یک شماره موبایل معتبر ۱۱ رقمی باشد (مثال: ۰۹۱۲۳۴۵۶۷۸۹).");
      return;
    }

    if (!/^\d{10}$/.test(newAddressForm.postalCode.trim())) {
      toast.error("کد پستی باید دقیقاً یک عدد ۱۰ رقمی باشد.");
      return;
    }

    addAddress({
      title: newAddressForm.title.trim(),
      receiverName: newAddressForm.receiverName.trim(),
      receiverPhone: newAddressForm.receiverPhone.trim(),
      province: newAddressForm.province.trim(),
      city: newAddressForm.city.trim(),
      addressLine: newAddressForm.addressLine.trim(),
      postalCode: newAddressForm.postalCode.trim(),
      isDefault: newAddressForm.isDefault,
    });

    toast.success("آدرس جدید با موفقیت ذخیره شد.");
    setIsAddressModalOpen(false);
    setNewAddressForm({
      title: "",
      receiverName: "",
      receiverPhone: "",
      province: "تهران",
      city: "تهران",
      addressLine: "",
      postalCode: "",
      isDefault: false,
    });
  };

  const handleFinalSubmit = async () => {
    const chosenAddress = addresses.find((a) => a.id === effectiveAddressId);
    if (!chosenAddress) {
      toast.error("لطفاً یک آدرس تحویل انتخاب کنید یا آدرس جدید اضافه فرمایید.");
      return;
    }

    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است.");
      return;
    }

    if (selectedPaymentMethod === "card_to_card" && !cardTrackNumber.trim()) {
      toast.error("لطفاً ۴ رقم آخر کارت یا شماره پیگیری واریز کارت‌به‌کارت را وارد نمایید.");
      return;
    }

    setIsSubmitting(true);

    try {
      // شبیه‌سازی ارتباط با درگاه پرداخت یا ثبت در پایگاه داده
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const now = new Date();
      const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderNumber = `SE-${datePart}-${randomCode}`;
      const trackingCode = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

      let methodEnum: PaymentMethod = "ONLINE";
      if (selectedPaymentMethod === "card_to_card") methodEnum = "CARD_TO_CARD";
      if (selectedPaymentMethod === "cod") methodEnum = "COD";

      const finalOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: generatedOrderNumber,
        status: methodEnum === "ONLINE" ? "CONFIRMED" : "PENDING",
        paymentMethod: methodEnum,
        paymentStatus: methodEnum === "ONLINE" ? "PAID" : "PENDING",
        receiptUrl: cardTrackNumber ? `پیگیری: ${cardTrackNumber}` : null,
        itemsPrice: getRawTotal() - getDiscountTotal(),
        shippingPrice: getShippingFee(),
        totalPrice: getFinalTotal(),
        receiverName: chosenAddress.receiverName,
        receiverPhone: chosenAddress.receiverPhone,
        province: chosenAddress.province,
        city: chosenAddress.city,
        addressLine: chosenAddress.addressLine,
        postalCode: chosenAddress.postalCode,
        trackingCode: trackingCode,
        note: orderNote || undefined,
        createdAt: new Intl.DateTimeFormat("fa-IR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(now),
        items: items.map((item) => ({
          id: `item-${item.id}-${Date.now()}`,
          productId: String(item.id),
          title: item.title,
          price:
            item.discountPrice && item.discountPrice < item.price
              ? item.discountPrice
              : item.price,
          quantity: item.quantity,
          image: item.image,
        })),
      };

      addOrder(finalOrder);
      clearCart();

      toast.success("سفارش شما با موفقیت ثبت شد!");
      router.push(`/checkout/success?orderNumber=${generatedOrderNumber}`);
    } catch {
      toast.error("خطایی در ثبت سفارش رخ داد. لطفاً مجدداً تلاش فرمایید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">در حال بارگذاری اطلاعات پرداخت...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // اگر سبد خرید خالی باشد
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">سبد خرید شما خالی است</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            برای ثبت سفارش ابتدا کالاهای مورد نظر خود را به سبد خرید اضافه کنید.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl inline-flex items-center gap-2")}
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به فروشگاه و مشاهده محصولات
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const payableSubtotal = getRawTotal() - getDiscountTotal();
  const rawTotal = getRawTotal();
  const discountTotal = getDiscountTotal();
  const shippingFee = getShippingFee();
  const finalTotal = getFinalTotal();
  const totalCount = getTotalCount();
  const chosenAddress = addresses.find((a) => a.id === effectiveAddressId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* نوار مراحل سفارش (Order Steps Tracker) */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {/* مرحله ۱: سبد خرید */}
            <Link
              href="/cart"
              className="flex items-center gap-2 text-primary font-medium hover:underline text-sm sm:text-base group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Check className="w-4 h-4" />
              </div>
              <span>سبد خرید</span>
            </Link>

            <div className="flex-1 h-0.5 bg-primary/40 mx-2 sm:mx-4" />

            {/* مرحله ۲: مشخصات و پرداخت (فعال) */}
            <div className="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                ۲
              </div>
              <span>اطلاعات ارسال و پرداخت</span>
            </div>

            <div className="flex-1 h-0.5 bg-border mx-2 sm:mx-4" />

            {/* مرحله ۳: تایید نهایی و فاکتور */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                ۳
              </div>
              <span>فاکتور نهایی</span>
            </div>
          </div>
        </div>

        {/* ساختار ۲ ستونه صفحه پرداخت */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ستون اصلی راست (فرم آدرس، شیوه ارسال، شیوه پرداخت) */}
          <div className="lg:col-span-8 space-y-6">
            {/* ۱. انتخاب یا ثبت آدرس تحویل */}
            <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5 text-primary">
                  <MapPin className="w-5 h-5" />
                  <h2 className="font-bold text-base sm:text-lg text-foreground">
                    نشانی و مشخصات تحویل گیرنده
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="rounded-xl gap-1.5 text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آدرس جدید
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-border rounded-xl">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium mb-1">هنوز آدرسی ثبت نکرده‌اید</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    برای ارسال سفارش، لطفاً نشانی محل تحویل کالا را وارد نمایید.
                  </p>
                  <Button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="rounded-xl text-xs sm:text-sm"
                  >
                    ثبت اولین آدرس تحویل
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = effectiveAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`relative cursor-pointer rounded-xl p-4 border transition-all text-right ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-border/80 bg-background"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                            </div>
                            <span className="font-semibold text-sm">{addr.title}</span>
                          </div>
                          {addr.isDefault && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              پیش‌فرض
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                          {addr.province}، {addr.city}، {addr.addressLine}
                        </p>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                          <span>گیرنده: {addr.receiverName}</span>
                          <span dir="ltr">{addr.receiverPhone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* نمایش خلاصه آدرس فعال */}
              {chosenAddress && (
                <div className="bg-muted/40 rounded-xl p-3.5 text-xs text-muted-foreground flex flex-wrap items-center gap-y-2 gap-x-4 border border-border/50">
                  <span className="font-medium text-foreground">کد پستی ۱۰ رقمی:</span>
                  <span className="font-mono" dir="ltr">{toPersianDigits(chosenAddress.postalCode)}</span>
                  <span className="text-border">|</span>
                  <span className="font-medium text-foreground">تحویل‌گیرنده:</span>
                  <span>{chosenAddress.receiverName} ({toPersianDigits(chosenAddress.receiverPhone)})</span>
                </div>
              )}
            </section>

            {/* ۲. شیوه ارسال سفارش */}
            <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-primary pb-3 border-b border-border">
                <Truck className="w-5 h-5" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">روش و زمان ارسال کالا</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* گزینه ۱: پیک اکسپرس */}
                <div
                  onClick={() => setShippingMethod("express")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedShippingMethod === "express"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">پیک اختصاصی اسمارت الکتریک</span>
                    </div>
                    {payableSubtotal >= 5000000 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                        رایگان
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold">{formatPrice(65000)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ویژه شهر تهران - ارسال فوری همان روز (ساعت تحویل بین ۱۴ الی ۱۹)
                  </p>
                </div>

                {/* گزینه ۲: تیپاکس */}
                <div
                  onClick={() => setShippingMethod("tipax")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedShippingMethod === "tipax"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-sm">تیپاکس / کالارسان سریع</span>
                    </div>
                    {payableSubtotal >= 5000000 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                        رایگان
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold">{formatPrice(55000)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    تحویل سریع ۲۴ تا ۴۸ ساعته درب منزل در سراسر شهرهای کشور
                  </p>
                </div>

                {/* گزینه ۳: پست پیشتاز */}
                <div
                  onClick={() => setShippingMethod("post")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedShippingMethod === "post"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-sm">پست پیشتاز سراسری</span>
                    </div>
                    {payableSubtotal >= 5000000 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                        رایگان
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold">{formatPrice(45000)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    تحویل اقتصادی ۲ الی ۴ روز کاری توسط شرکت ملی پست ایران
                  </p>
                </div>

                {/* گزینه ۴: باربری صنعتی */}
                <div
                  onClick={() => setShippingMethod("freight")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedShippingMethod === "freight"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-sm">باربری و بار سنگین صنعتی</span>
                    </div>
                    {payableSubtotal >= 5000000 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                        رایگان
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold">{formatPrice(120000)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    مخصوص سفارش‌های تجاری B2B، تابلو برق‌ها و تجهیزات سنگین پروژه
                  </p>
                </div>
              </div>
            </section>

            {/* ۳. شیوه پرداخت */}
            <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-primary pb-3 border-b border-border">
                <CreditCard className="w-5 h-5" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">انتخاب روش پرداخت</h2>
              </div>

              <div className="space-y-3">
                {/* پرداخت آنلاین */}
                <div
                  onClick={() => setPaymentMethod("online")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedPaymentMethod === "online"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">درگاه پرداخت اینترنتی شاپرک</div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          پرداخت آنلاین با کلیه کارت‌های عضو شبکه شتاب (سامان، ملت، سداد)
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">سریع‌ترین روش</Badge>
                  </div>
                </div>

                {/* پرداخت کارت‌به‌کارت */}
                <div
                  onClick={() => setPaymentMethod("card_to_card")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedPaymentMethod === "card_to_card"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">واریز کارت‌به‌کارت / حساب بانکی</div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          مناسب سقف مبالغ بالا و ثبت خریدهای پروژه‌ای و شرکتی
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedPaymentMethod === "card_to_card" && (
                    <div className="mt-4 pt-4 border-t border-border/80 space-y-3 text-xs bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">صاحب حساب:</span>
                        <span className="font-semibold text-foreground">شرکت فنی و مهندسی اسمارت الکتریک</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">شماره کارت بانک ملی:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold" dir="ltr">۶۰۳۷ - ۹۹۷۵ - ۱۴۲۳ - ۸۸۹۹</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard("6037997514238899", "شماره کارت");
                            }}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          >
                            {copiedField === "شماره کارت" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">شماره شبا (IBAN):</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]" dir="ltr">IR04 0170 0000 0010 9988 7766 55</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard("IR040170000000109988776655", "شماره شبا");
                            }}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          >
                            {copiedField === "شماره شبا" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          شماره پیگیری واریز یا ۴ رقم آخر کارت پرداخت‌کننده: *
                        </label>
                        <Input
                          value={cardTrackNumber}
                          onChange={(e) => setCardTrackNumber(e.target.value)}
                          placeholder="مثلاً: کد رهگیری ۵۴۳۲۱ یا کارت به نام احمدی"
                          className="h-9 text-xs rounded-lg bg-background"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* پرداخت در محل */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedPaymentMethod === "cod"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">پرداخت در محل (کارت‌خوان سیار)</div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          پرداخت وجه کالا هنگام تحویل سفارش توسط مامور پیک (مختص تهران)
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">ویژه تهران</Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* ۴. یادداشت سفارش */}
            <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <label htmlFor="order-note" className="block font-bold text-sm text-foreground">
                یادداشت یا توضیحات سفارش (اختیاری):
              </label>
              <Textarea
                id="order-note"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="در صورت نیاز به هماهنگی ساعت تحویل، ارسال فاکتور رسمی حقوقی و یا بسته بندی ضدضربه صنعتی در این قسمت بنویسید..."
                className="text-xs rounded-xl resize-none h-20"
              />
            </section>
          </div>

          {/* ستون کناری چپ: خلاصه فاکتور و دکمه پرداخت نهایی (Sticky Sidebar) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-foreground pb-3 border-b border-border flex items-center justify-between">
                <span>خلاصه فاکتور سفارش</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {toPersianDigits(totalCount)} قلم کالا
                </Badge>
              </h3>

              {/* پیش‌نمایش خلاصه اقلام داخل سبد */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <div className="relative w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{item.title}</p>
                      <div className="flex items-center justify-between text-muted-foreground mt-1">
                        <span>{toPersianDigits(item.quantity)} عدد</span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(
                            (item.discountPrice && item.discountPrice < item.price
                              ? item.discountPrice
                              : item.price) * item.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ریز مبالغ فاکتور */}
              <div className="pt-3 border-t border-border space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>قیمت کل محصولات:</span>
                  <span className="font-semibold text-foreground">{formatPrice(rawTotal)}</span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      سود شما از خرید:
                    </span>
                    <span className="font-semibold">-{formatPrice(discountTotal)}</span>
                  </div>
                )}

                {coupon && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>کد تخفیف ({coupon.code}):</span>
                    <span className="font-semibold">-{formatPrice(coupon.discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>هزینه حمل و ارسال:</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      رایگان (خرید بالای ۵ میلیون)
                    </span>
                  ) : (
                    <span className="font-semibold text-foreground">{formatPrice(shippingFee)}</span>
                  )}
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">مبلغ نهایی قابل پرداخت:</span>
                  <span className="font-extrabold text-base sm:text-lg text-primary">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* دکمه ثبت و پرداخت */}
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    در حال اتصال و ثبت سفارش...
                  </span>
                ) : selectedPaymentMethod === "online" ? (
                  "تایید و پرداخت اینترنتی"
                ) : (
                  "تایید نهایی و ثبت سفارش"
                )}
              </Button>

              <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>ضمانت اصالت فیزیکی و بازگشت ۷ روزه وجه</span>
              </div>
            </div>

            {/* بنر تضمین خرید امن */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">فاکتور رسمی اسمارت الکتریک</p>
                <p className="text-muted-foreground mt-0.5">
                  ارائه فاکتور رسمی معتبر شرکتی با درج شناسه ملی به همراه کالا
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* مودال دیالوگ افزودن آدرس جدید */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base sm:text-lg font-bold">
              افزودن نشانی و مشخصات تحویل جدید
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddNewAddress} className="space-y-4 pt-2 text-right">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                عنوان آدرس (مثال: شرکت، دفتر کار، منزل) *
              </label>
              <Input
                required
                value={newAddressForm.title}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, title: e.target.value })}
                placeholder="عنوان نشانی را بنویسید"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  نام و نام خانوادگی تحویل گیرنده *
                </label>
                <Input
                  required
                  value={newAddressForm.receiverName}
                  onChange={(e) =>
                    setNewAddressForm({ ...newAddressForm, receiverName: e.target.value })
                  }
                  placeholder="نام کامل گیرنده"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  شماره موبایل تحویل گیرنده *
                </label>
                <Input
                  required
                  dir="ltr"
                  value={newAddressForm.receiverPhone}
                  onChange={(e) =>
                    setNewAddressForm({ ...newAddressForm, receiverPhone: e.target.value })
                  }
                  placeholder="09123456789"
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">استان *</label>
                <Input
                  required
                  value={newAddressForm.province}
                  onChange={(e) =>
                    setNewAddressForm({ ...newAddressForm, province: e.target.value })
                  }
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">شهر *</label>
                <Input
                  required
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *
              </label>
              <Textarea
                required
                rows={3}
                value={newAddressForm.addressLine}
                onChange={(e) =>
                  setNewAddressForm({ ...newAddressForm, addressLine: e.target.value })
                }
                placeholder="نشانی کامل پستی خود را دقیق بنویسید"
                className="text-xs rounded-xl resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                کد پستی ۱۰ رقمی *
              </label>
              <Input
                required
                dir="ltr"
                maxLength={10}
                value={newAddressForm.postalCode}
                onChange={(e) =>
                  setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })
                }
                placeholder="1234567890"
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                className="rounded-xl text-xs sm:text-sm"
              >
                انصراف
              </Button>
              <Button type="submit" className="rounded-xl text-xs sm:text-sm">
                ذخیره و استفاده از این آدرس
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
