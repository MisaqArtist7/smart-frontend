/**
 * Centralized Helper Functions and Utilities for Customer Account
 */

export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  registeredAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "CARD_TO_CARD" | "ONLINE";
export type PaymentStatus = "PENDING" | "WAITING_REVIEW" | "PAID" | "FAILED";

export interface OrderItem {
  id: string | number;
  productId: string | number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string | number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  receiptUrl?: string | null;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  trackingCode?: string | null;
  note?: string | null;
  createdAt: string;
  items: OrderItem[];
}

/**
 * تابع تبدیل اعداد و مبالغ به فرمت فارسی همراه با جداکننده ارقام
 */
export function formatPrice(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "۰ تومان";
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

// ----------------------------------------------------------------------
// مقادیر اولیه خالی بدون هرگونه داده ماک یا فیک
// تمام داده‌ها باید منحصراً از سرور دریافت شوند
// ----------------------------------------------------------------------

export const INITIAL_USER: User = {
  id: "",
  name: "",
  phone: "",
  role: "CUSTOMER",
  isActive: true,
  avatarUrl: "",
  registeredAt: "",
};

export const INITIAL_ADDRESSES: Address[] = [];

export const INITIAL_ORDERS: Order[] = [];
