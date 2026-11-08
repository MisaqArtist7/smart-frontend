/**
 * Centralized TypeScript types for Smart Electric API responses and entities.
 * Strictly mirrors NestJS backend Prisma schema & DTOs (PostgreSQL).
 * All nullable fields are explicitly typed with `| null`.
 */

// ----------------------------------------------------
// Authentication & User Types
// ----------------------------------------------------

export type UserRole = "ADMIN" | "CUSTOMER" | string;

export interface User {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  category?: Category | { id: number; name: string; slug?: string };
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
  products?: Product[];
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

export interface CreateAddressInput {
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {
  id: number;
}

// ----------------------------------------------------
// Order & Payment Types (Mirrors Prisma Order, OrderItem, Enums)
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
  price: number; // Unit price at order time in Toman
  quantity: number;
  image?: string | null;
  product?: Product;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  receiptUrl: string | null;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  note: string | null;
  trackingCode?: string | null;
  adminNote: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  addressId?: number;
  address?: Address;
}

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  addressId: number;
  paymentMethod: "CARD_TO_CARD";
  items: CreateOrderItemInput[];
  note?: string;
}

export interface PaymentInfoResponse {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
}

export interface PaginatedOrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// ----------------------------------------------------
// Admin Orders Management Types
// ----------------------------------------------------

export interface AdminOrderListItem extends Order {
  hasReceipt?: boolean;
  user?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface AdminOrdersQueryOptions {
  page?: number;
  limit?: number;
  status?: OrderStatus | "";
  paymentStatus?: PaymentStatus | "";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminOrdersResponse {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewReceiptInput {
  orderId: number;
  action: "approve" | "reject";
  adminNote?: string;
}

export interface UpdateOrderStatusInput {
  orderId: number;
  status: "SHIPPED" | "DELIVERED";
  trackingCode?: string;
  adminNote?: string;
}

export interface AdminCancelOrderInput {
  orderId: number;
  adminNote?: string;
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
