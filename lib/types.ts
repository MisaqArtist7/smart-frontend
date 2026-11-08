/**
 * Centralized TypeScript types for Smart Electric API responses and entities.
 * Strictly mirrors NestJS backend models and DTOs (Prisma 7, PostgreSQL).
 * All nullable fields are explicitly typed with `| null`.
 */

// ----------------------------------------------------
// Authentication & User Types
// ----------------------------------------------------

export type UserRole = "ADMIN" | "CUSTOMER" | string;

export interface User {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface RequestOtpResponse {
  message: string;
  phone: string;
  isNewUser: boolean;
  devCode?: string;
}

export interface VerifyOtpResponse {
  message: string;
  user: User;
}

// ----------------------------------------------------
// Catalog: Product & Category Types
// ----------------------------------------------------

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  alt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Product {
  id: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string | null;
  specs: Record<string, unknown> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  price: number; // Toman, integer
  discountPrice: number | null; // null = no discount
  stock: number;
  sku: string | null;
  isActive: boolean;
  images: ProductImage[];
  category?: { id: number; name: string; slug?: string };
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  parentId: number | null;
  parent?: Category | null;
  parentName?: string | null;
  children?: Category[];
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// Addresses & Shipping Types
// ----------------------------------------------------

export interface Address {
  id: number;
  userId: number;
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// Order & Payment Types
// ----------------------------------------------------

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "WAITING_REVIEW"
  | "PAID"
  | "FAILED";

export type PaymentMethod = "CARD_TO_CARD" | "COD";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  title: string;
  price: number; // unit price at purchase time
  quantity: number;
  image?: string | null;
  product?: Product;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  addressId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paidAt: string | null;
  receiptUrl: string | null;
  trackingCode?: string | null;
  adminNote: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address?: Address;
}

// ----------------------------------------------------
// API Error & Common Response Types
// ----------------------------------------------------

export interface ApiErrorResponse {
  statusCode?: number;
  status?: number;
  message?: string | string[];
  error?: string;
}
