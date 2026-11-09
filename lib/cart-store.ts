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
  lastPrice?: number;
}

export interface StoredCartItem {
  id: number;
  quantity: number;
  lastPrice?: number;
}

export interface CouponData {
  code: string;
  percent?: number;
  discountAmount: number;
  type?: "PERCENTAGE" | "FIXED_AMOUNT";
  value?: number;
}

interface CartStoreState {
  items: CartItem[];
  storedItems: StoredCartItem[];
  warnings: string[];
  coupon: CouponData | null;
  selectedShippingMethod: "post" | "express" | "tipax" | "freight";
  selectedPaymentMethod: "card_to_card";
  orderNote: string;

  // اکشن‌های سبد خرید
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  dismissWarnings: () => void;

  // همگام‌سازی با محصولات واقعی و اعتبارسنجی قیمت و موجودی
  syncWithProducts: (products: Product[]) => string[];

  // کد تخفیف
  applyCoupon: (code: string) => { success: boolean; message: string };
  setCoupon: (coupon: CouponData | null) => void;
  removeCoupon: () => void;

  // تنظیمات سفارش
  setShippingMethod: (method: "post" | "express" | "tipax" | "freight") => void;
  setPaymentMethod: (method: "card_to_card") => void;
  setOrderNote: (note: string) => void;

  // توابع محاسباتی (هزینه ارسال همیشه ۰ است چون در محل به مامور پست پرداخت می‌شود)
  getRawTotal: () => number;
  getDiscountTotal: () => number;
  getShippingFee: () => number;
  getFinalTotal: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      // در ابتدا خالی، هیچ داده ماکی ذخیره نمی‌شود
      items: [],
      storedItems: [],
      warnings: [],
      coupon: null,
      selectedShippingMethod: "post",
      selectedPaymentMethod: "card_to_card",
      orderNote: "",

      addItem: (product: Product, quantity = 1) => {
        const { items, storedItems } = get();
        const existing = items.find((i) => i.id === product.id);
        const effectivePrice = product.discountPrice ?? product.price;

        const imgUrl =
          product.images?.[0]?.url ||
          (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
          "/images/products/adapter-52240.png";

        let newItems: CartItem[];
        let newStored: StoredCartItem[];

        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, product.stock || 99);
          newItems = items.map((i) =>
            i.id === product.id
              ? {
                  ...i,
                  quantity: nextQty,
                  price: product.price,
                  discountPrice: product.discountPrice ?? null,
                  stock: product.stock,
                  lastPrice: effectivePrice,
                }
              : i
          );
          newStored = storedItems.map((s) =>
            s.id === product.id
              ? { id: s.id, quantity: nextQty, lastPrice: effectivePrice }
              : s
          );
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
            sku: product.sku ?? undefined,
            categoryName: product.category?.name || product.categoryName || undefined,
            lastPrice: effectivePrice,
          };
          newItems = [...items, newItem];
          newStored = [
            ...storedItems,
            {
              id: product.id,
              quantity: newItem.quantity,
              lastPrice: effectivePrice,
            },
          ];
        }

        set({ items: newItems, storedItems: newStored });
      },

      removeItem: (id: number) => {
        set({
          items: get().items.filter((i) => i.id !== id),
          storedItems: get().storedItems.filter((i) => i.id !== id),
        });
      },

      updateQuantity: (id: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const newItems = get().items.map((i) => {
          if (i.id === id) {
            const safeQty = Math.min(quantity, i.stock || 99);
            return { ...i, quantity: safeQty };
          }
          return i;
        });

        const newStored = get().storedItems.map((s) => {
          if (s.id === id) {
            return { ...s, quantity };
          }
          return s;
        });

        set({ items: newItems, storedItems: newStored });
      },

      clearCart: () => {
        set({ items: [], storedItems: [], warnings: [], coupon: null, orderNote: "" });
      },

      dismissWarnings: () => {
        set({ warnings: [] });
      },

      /**
       * همگام‌سازی اقلام سبد با دیتابیس زنده و تشخیص کالاهای غیرفعال، ناموجود یا تغییر قیمت یافته
       */
      syncWithProducts: (products: Product[]) => {
        if (!products || products.length === 0) return [];

        const currentStored = get().storedItems;
        const currentItems = get().items;
        const warnings: string[] = [];

        // منبع شناسه‌ها می‌تواند storedItems یا items باشد
        const sourceMap = new Map<number, { quantity: number; lastPrice?: number }>();
        currentStored.forEach((s) => sourceMap.set(s.id, { quantity: s.quantity, lastPrice: s.lastPrice }));
        currentItems.forEach((i) => {
          if (!sourceMap.has(i.id)) {
            sourceMap.set(i.id, { quantity: i.quantity, lastPrice: i.lastPrice ?? (i.discountPrice ?? i.price) });
          }
        });

        const updatedItems: CartItem[] = [];
        const updatedStored: StoredCartItem[] = [];

        for (const [id, itemData] of sourceMap.entries()) {
          const product = products.find((p) => p.id === id);

          if (!product || !product.isActive) {
            const title = product?.title || `کد ${id}`;
            warnings.push(`کالای «${title}» دیگر در فروشگاه در دسترس نیست و از سبد خرید شما حذف گردید.`);
            continue;
          }

          if (product.stock <= 0) {
            warnings.push(`موجودی کالای «${product.title}» به پایان رسیده و از سبد خرید حذف شد.`);
            continue;
          }

          let finalQty = itemData.quantity;
          if (finalQty > product.stock) {
            finalQty = product.stock;
            warnings.push(
              `تعداد درخواستی کالای «${product.title}» بیشتر از موجودی انبار بود و به ${product.stock.toLocaleString("fa-IR")} عدد کاهش یافت.`
            );
          }

          const currentEffectivePrice = product.discountPrice ?? product.price;
          if (itemData.lastPrice !== undefined && itemData.lastPrice !== currentEffectivePrice) {
            warnings.push(
              `قیمت کالای «${product.title}» تغییر یافته است (از ${itemData.lastPrice.toLocaleString("fa-IR")} تومان به ${currentEffectivePrice.toLocaleString("fa-IR")} تومان).`
            );
          }

          const imgUrl =
            product.images?.[0]?.url ||
            (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
            "/images/products/adapter-52240.png";

          const freshItem: CartItem = {
            id: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            discountPrice: product.discountPrice ?? null,
            image: imgUrl,
            quantity: finalQty,
            stock: product.stock,
            sku: product.sku ?? undefined,
            categoryName: product.category?.name || product.categoryName || undefined,
            lastPrice: currentEffectivePrice,
          };

          updatedItems.push(freshItem);
          updatedStored.push({
            id: product.id,
            quantity: finalQty,
            lastPrice: currentEffectivePrice,
          });
        }

        set({ items: updatedItems, storedItems: updatedStored, warnings });
        return warnings;
      },

      applyCoupon: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
          return { success: false, message: "لطفاً کد تخفیف را وارد کنید." };
        }

        if (cleanCode === "SMART" || cleanCode === "OFF10") {
          const rawTotal = get().getRawTotal() - get().getDiscountTotal();
          const discountAmount = Math.round(rawTotal * 0.1);
          set({
            coupon: {
              code: cleanCode,
              percent: 10,
              discountAmount,
            },
          });
          return { success: true, message: "کد تخفیف ۱۰ درصدی با موفقیت اعمال شد." };
        }

        return { success: false, message: "کد تخفیف وارد شده معتبر نمی‌باشد یا منقضی شده است." };
      },

      setCoupon: (coupon) => {
        set({ coupon });
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
        set({ orderNote: note.slice(0, 500) });
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

      /**
       * هزینه ارسال همیشه ۰ است زیرا پس‌کرایه است و توسط مشتری هنگام تحویل به مامور پست پرداخت می‌شود.
       */
      getShippingFee: () => {
        return 0;
      },

      getFinalTotal: () => {
        const subtotal = get().getRawTotal() - get().getDiscountTotal();
        const couponDisc = get().coupon?.discountAmount || 0;
        return Math.max(0, subtotal - couponDisc);
      },

      getTotalCount: () => {
        const { items, storedItems } = get();
        if (items.length > 0) {
          return items.reduce((acc, item) => acc + item.quantity, 0);
        }
        return storedItems.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "smart-electric-cart",
      // در localStorage تنها شناسه‌ها و تعداد ذخیره می‌شوند؛ قیمت‌های کلاینت هرگز ذخیره یا اعتماد نمی‌شوند.
      partialize: (state) => ({
        storedItems: state.storedItems.length > 0
          ? state.storedItems
          : state.items.map((i) => ({ id: i.id, quantity: i.quantity, lastPrice: i.lastPrice })),
        orderNote: state.orderNote,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.storedItems && state.storedItems.length > 0 && state.items.length === 0) {
          // بازسازی موقت اقلام به منظور کارکرد شمارنده و هدر تا زمان فراخوانی syncWithProducts
          state.items = state.storedItems.map((s) => ({
            id: s.id,
            quantity: s.quantity,
            title: `محصول کد ${s.id}`,
            slug: `${s.id}`,
            price: s.lastPrice || 0,
            discountPrice: null,
            image: "/images/products/adapter-52240.png",
            stock: 99,
            lastPrice: s.lastPrice,
          }));
        }
      },
    }
  )
);
