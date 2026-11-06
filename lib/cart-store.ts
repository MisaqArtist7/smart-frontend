import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/api";

export interface CartItem {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  image: string;
  quantity: number;
  stock: number;
  sku?: string;
  categoryName?: string;
}

export interface CouponData {
  code: string;
  percent: number;
  discountAmount: number;
}

interface CartStoreState {
  items: CartItem[];
  coupon: CouponData | null;
  selectedShippingMethod: "express" | "tipax" | "post" | "freight";
  selectedPaymentMethod: "online" | "card_to_card" | "cod";
  orderNote: string;

  // اکشن‌های سبد خرید
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;

  // کد تخفیف
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // تنظیمات سفارش
  setShippingMethod: (method: "express" | "tipax" | "post" | "freight") => void;
  setPaymentMethod: (method: "online" | "card_to_card" | "cod") => void;
  setOrderNote: (note: string) => void;

  // توابع محاسباتی
  getRawTotal: () => number;
  getDiscountTotal: () => number;
  getShippingFee: () => number;
  getFinalTotal: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      // محصولات پیش‌فرض اولیه برای نمایش و تست اولیه کاربر
      items: [
        {
          id: 1,
          title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
          slug: "adapter-52240",
          price: 5250000,
          discountPrice: 4950000,
          image: "/images/products/adapter-52240.png",
          quantity: 1,
          stock: 18,
          sku: "HRUI-AD-52240",
          categoryName: "آداپتور و منابع تغذیه",
        },
        {
          id: 3,
          title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
          slug: "switch-hr500-afg-82s",
          price: 19600000,
          discountPrice: 18500000,
          image: "/images/products/switch-8port.png",
          quantity: 1,
          stock: 12,
          sku: "HRUI-SW-82S",
          categoryName: "سوئیچ‌های صنعتی PoE",
        },
      ],
      coupon: null,
      selectedShippingMethod: "express",
      selectedPaymentMethod: "online",
      orderNote: "",

      addItem: (product: Product, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.id === product.id);

        const imgUrl =
          product.images?.[0]?.url ||
          (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
          "/images/products/adapter-52240.png";

        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, product.stock || 99);
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: nextQty } : i
            ),
          });
        } else {
          const newItem: CartItem = {
            id: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            discountPrice: product.discountPrice ?? null,
            image: imgUrl,
            quantity: Math.min(quantity, product.stock || 99),
            stock: product.stock || 99,
            sku: product.sku,
            categoryName: product.category?.name || product.categoryName,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (id: number) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.id === id) {
              const safeQty = Math.min(quantity, i.stock || 99);
              return { ...i, quantity: safeQty };
            }
            return i;
          }),
        });
      },

      clearCart: () => {
        set({ items: [], coupon: null });
      },

      applyCoupon: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
          return { success: false, message: "لطفاً کد تخفیف را وارد کنید." };
        }

        // کدهای معتبر ماک
        if (cleanCode === "SMART" || cleanCode === "OFF10") {
          const rawTotal = get().getRawTotal() - get().getDiscountTotal();
          const discountAmount = Math.round(rawTotal * 0.1); // ۱۰ درصد تخفیف
          set({
            coupon: {
              code: cleanCode,
              percent: 10,
              discountAmount,
            },
          });
          return { success: true, message: "کد تخفیف ۱۰ درصدی با موفقیت اعمال شد." };
        }

        if (cleanCode === "NOVALABS" || cleanCode === "ELECTRIC20") {
          const rawTotal = get().getRawTotal() - get().getDiscountTotal();
          const discountAmount = Math.round(rawTotal * 0.2); // ۲۰ درصد تخفیف
          set({
            coupon: {
              code: cleanCode,
              percent: 20,
              discountAmount,
            },
          });
          return { success: true, message: "کد تخفیف ویژه ۲۰ درصدی با موفقیت اعمال شد." };
        }

        return { success: false, message: "کد تخفیف وارد شده معتبر نمی‌باشد یا منقضی شده است." };
      },

      removeCoupon: () => {
        set({ coupon: null });
      },

      setShippingMethod: (method) => {
        set({ selectedShippingMethod: method });
      },

      setPaymentMethod: (method) => {
        set({ selectedPaymentMethod: method });
      },

      setOrderNote: (note) => {
        set({ orderNote: note });
      },

      // محاسبات مالی
      getRawTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getDiscountTotal: () => {
        return get().items.reduce((acc, item) => {
          if (item.discountPrice && item.discountPrice < item.price) {
            return acc + (item.price - item.discountPrice) * item.quantity;
          }
          return acc;
        }, 0);
      },

      getShippingFee: () => {
        const payableSubtotal = get().getRawTotal() - get().getDiscountTotal();
        if (payableSubtotal >= 5000000 || payableSubtotal === 0) {
          return 0; // ارسال رایگان برای خریدهای بالای ۵ میلیون تومان
        }
        const method = get().selectedShippingMethod;
        if (method === "express") return 65000;
        if (method === "tipax") return 55000;
        if (method === "freight") return 120000;
        return 45000; // post
      },

      getFinalTotal: () => {
        const subtotal = get().getRawTotal() - get().getDiscountTotal();
        const couponDisc = get().coupon?.discountAmount || 0;
        const shipping = get().getShippingFee();
        return Math.max(0, subtotal - couponDisc + shipping);
      },

      getTotalCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "smart-electric-cart",
    }
  )
);

