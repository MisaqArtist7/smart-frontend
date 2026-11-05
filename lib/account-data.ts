/**
 * Centralized Types and Data Store for Customer Account & Dashboard
 * Conforms to Prisma Backend Models: User, Address, Order, OrderItem
 */

export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  registeredAt: string;
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

export type PaymentMethod = "COD" | "CARD_TO_CARD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
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
export function toPersianDigits(n: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

// ----------------------------------------------------------------------
// دیتای ماک پیش‌فرض حساب مشتری
// ----------------------------------------------------------------------

export const INITIAL_USER: User = {
  id: "usr-customer-1",
  name: "میثاق هنرمند",
  phone: "09122193551",
  role: "CUSTOMER",
  isActive: true,
  avatarUrl: "",
  registeredAt: "۱۴۰۳/۰۴/۱۵",
};

export const INITIAL_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    userId: "usr-customer-1",
    title: "محل کار و شرکت",
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، طبقه اول، پلاک ۱۲",
    postalCode: "1144893456",
    isDefault: true,
  },
  {
    id: "addr-2",
    userId: "usr-customer-1",
    title: "منزل مسکونی",
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "سعادت آباد، میدان کاج، خیابان سرو غربی، پلاک ۲۴، واحد ۲",
    postalCode: "1998745612",
    isDefault: false,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "SE-140308-5104",
    status: "SHIPPED",
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    receiptUrl: null,
    itemsPrice: 12350000,
    shippingPrice: 120000,
    totalPrice: 12470000,
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، طبقه اول، پلاک ۱۲",
    postalCode: "1144893456",
    trackingCode: "POST-IR-99432178",
    note: "لطفا قبل از تحویل حضوری هماهنگ شود.",
    createdAt: "۱۴۰۳/۰۸/۱۴",
    items: [
      {
        id: "item-101",
        productId: "prod-1",
        title: "آداپتور سوئیچ شبکه صنعتی HRUI مدل Industrial Adapter 52240",
        price: 5250000,
        quantity: 2,
        image: "/images/products/adapter-52240.png",
      },
      {
        id: "item-102",
        productId: "prod-7",
        title: "کلید لمسی هوشمند ۴ پل شیشه‌ای مشکی مدل زیگبی",
        price: 1850000,
        quantity: 1,
        image: "/images/categories/switches.svg",
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "SE-140308-5289",
    status: "PENDING",
    paymentMethod: "CARD_TO_CARD",
    paymentStatus: "PENDING",
    receiptUrl: null,
    itemsPrice: 8000000,
    shippingPrice: 120000,
    totalPrice: 8120000,
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "سعادت آباد، میدان کاج، خیابان سرو غربی، پلاک ۲۴، واحد ۲",
    postalCode: "1998745612",
    trackingCode: null,
    note: "واریز کارت به کارت به شماره کارت بانک ملت فروشگاه.",
    createdAt: "۱۴۰۳/۰۸/۱۵",
    items: [
      {
        id: "item-201",
        productId: "prod-4",
        title: "سوئیچ PoE صنعتی اچ ار یو ای HRUI HR500-AF-811GS",
        price: 8000000,
        quantity: 1,
        image: "/images/products/switch-hr500.png",
      },
    ],
  },
  {
    id: "ord-3",
    orderNumber: "SE-140308-4821",
    status: "DELIVERED",
    paymentMethod: "CARD_TO_CARD",
    paymentStatus: "PAID",
    receiptUrl: "/images/brand/logo.png",
    itemsPrice: 33200000,
    shippingPrice: 0,
    totalPrice: 33200000,
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، طبقه اول، پلاک ۱۲",
    postalCode: "1144893456",
    trackingCode: "TRK-88934521",
    note: "تحویل انبار مرکزی داده شد.",
    createdAt: "۱۴۰۳/۰۸/۱۰",
    items: [
      {
        id: "item-301",
        productId: "prod-3",
        title: "سوئیچ شبکه صنعتی ۸ پورت اچ ار یو ای مدل HR500-AFG-82S",
        price: 19600000,
        quantity: 1,
        image: "/images/products/switch-8port.png",
      },
      {
        id: "item-302",
        productId: "prod-6",
        title: "کابل شبکه لگراند Cat6 SFTP تمام مس حلقه ۳۰۵ متری",
        price: 6800000,
        quantity: 2,
        image: "/images/categories/cables.svg",
      },
    ],
  },
  {
    id: "ord-4",
    orderNumber: "SE-140307-3910",
    status: "CANCELLED",
    paymentMethod: "COD",
    paymentStatus: "FAILED",
    receiptUrl: null,
    itemsPrice: 1160000,
    shippingPrice: 120000,
    totalPrice: 1280000,
    receiverName: "میثاق هنرمند",
    receiverPhone: "09122193551",
    province: "تهران",
    city: "تهران",
    addressLine: "لاله زار جنوبی، کوچه بوشهری، پاساژ نیرو الکتریک، طبقه اول، پلاک ۱۲",
    postalCode: "1144893456",
    trackingCode: null,
    note: "لغو توسط مشتری به دلیل تغییر مشخصات فنی.",
    createdAt: "۱۴۰۳/۰۷/۲۵",
    items: [
      {
        id: "item-401",
        productId: "prod-8",
        title: "لامپ ادیسونی فیلامنتی ۶۰ وات سرپیچ E27 طرح کلاسیک",
        price: 290000,
        quantity: 4,
        image: "/images/categories/lighting.svg",
      },
    ],
  },
];

