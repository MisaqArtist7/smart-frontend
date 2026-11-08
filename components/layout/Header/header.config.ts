import {
  Sparkles,
  Flame,
  Cpu,
  ToggleRight,
  Cable,
  Lightbulb,
  ShieldAlert,
  Wrench,
  Layers,
  PhoneCall,
  GraduationCap,
} from "lucide-react";
import type { HeaderConfig } from "./header.types";

/**
 * کانفیگ پیش‌فرض و جامع هدر ۳ طبقه فروشگاه الکتریکی و خانه هوشمند
 * تمامی متون، لینک‌ها، کد تخفیف و شماره پشتیبانی از اینجا تغذیه می‌شوند
 * و هیچ متنی درون JSX هاردکد نشده است.
 */
export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  topBar: {
    announcement: {
      text: "ارسال رایگان برای سفارش‌های بالای ۱,۰۰۰,۰۰۰ تومان به سراسر کشور",
      badgeText: "تخفیف ویژه",
    },
    discount: {
      label: "کد تخفیف اولین خرید:",
      code: "FIRST-SMART",
      copiedNotice: "کد تخفیف کپی شد!",
    },
  },
  mainBar: {
    logo: {
      src: "/images/brand/logo.png",
      alt: "لوگوی اسمارت الکتریک",
      title: "اسمارت الکتریک",
      subtitle: "تجهیزات و اتوماسیون برق هوشمند",
      href: "/",
    },
    search: {
      placeholder: "جستجو در میان بیش از ۱۰,۰۰۰ کالای الکتریکی، برند یا کد محصول...",
    },
    support: {
      label: "مشاوره فنی و پشتیبانی ۲۴/۷",
      phone: "tel:02191015555",
      displayPhone: "۰۲۱-۹۱۰۱۵۵۵۵",
    },
  },
  navigation: {
    categoriesTitle: "دسته‌بندی کالاها",
    categories: [
      {
        id: "smart-home",
        title: "خانه هوشمند و BMS",
        href: "/category/smart-home",
        icon: Cpu,
        badge: "جدید",
        subcategories: [
          { id: "controllers", title: "کنترلرهای مرکزی و گیت‌وی", href: "/category/smart-home/controllers" },
          { id: "smart-relays", title: "رله‌های هوشمند تابلویی", href: "/category/smart-home/relays" },
          { id: "smart-touch-switches", title: "کلیدهای لمسی هوشمند", href: "/category/smart-home/touch-switches" },
          { id: "sensors", title: "سنسورهای حرکتی، دما و دود", href: "/category/smart-home/sensors" },
        ],
      },
      {
        id: "switches",
        title: "کلید و پریز و کادر",
        href: "/category/switches",
        icon: ToggleRight,
        subcategories: [
          { id: "modern-switches", title: "کلید و پریز لوکس و مدرن", href: "/category/switches/modern" },
          { id: "traditional-switches", title: "کلید و پریز سنتی و استاندارد", href: "/category/switches/standard" },
          { id: "industrial-switches", title: "پریزهای بارانی و صنعتی", href: "/category/switches/industrial" },
          { id: "switch-frames", title: "قاب و کادرهای چندخانه", href: "/category/switches/frames" },
        ],
      },
      {
        id: "cables",
        title: "سیم، کابل و لوله برقی",
        href: "/category/cables",
        icon: Cable,
        subcategories: [
          { id: "building-wires", title: "سیم‌های ساختمانی (افشان و مفتول)", href: "/category/cables/building" },
          { id: "power-cables", title: "کابل‌های قدرت و شیلددار", href: "/category/cables/power" },
          { id: "network-cables", title: "کابل‌های شبکه و مخابراتی", href: "/category/cables/network" },
          { id: "conduits", title: "لوله‌های خرطومی و PVC", href: "/category/cables/conduits" },
        ],
      },
      {
        id: "lighting",
        title: "روشنایی و نورپردازی",
        href: "/category/lighting",
        icon: Lightbulb,
        subcategories: [
          { id: "led-panels", title: "پنل‌ها و هالوژن‌های SMD و COB", href: "/category/lighting/panels" },
          { id: "strip-lights", title: "ریسه و لاینرهای نوری خطی", href: "/category/lighting/strips" },
          { id: "floodlights", title: "پروژکتور و چراغ‌های سوله و خیابانی", href: "/category/lighting/floodlights" },
          { id: "smart-lamps", title: "لامپ‌های هوشمند RGB", href: "/category/lighting/smart-lamps" },
        ],
      },
      {
        id: "switchboards",
        title: "تجهیزات تابلو برق و فیوز",
        href: "/category/switchboards",
        icon: ShieldAlert,
        subcategories: [
          { id: "mcb-breakers", title: "کلیدهای مینیاتوری (MCB)", href: "/category/switchboards/mcb" },
          { id: "rcd-breakers", title: "محافظ جان (RCCB و RCBO)", href: "/category/switchboards/rcd" },
          { id: "contactors", title: "کنتاکتور و بیمتال", href: "/category/switchboards/contactors" },
          { id: "distribution-boxes", title: "جعبه فیوز و جعبه مینیاتوری", href: "/category/switchboards/boxes" },
        ],
      },
      {
        id: "tools",
        title: "ابزار دقیق و اندازه‌گیری",
        href: "/category/tools",
        icon: Wrench,
        subcategories: [
          { id: "multimeters", title: "مولتی‌متر دیجیتال و کلمپ‌آمپرمتر", href: "/category/tools/multimeters" },
          { id: "testers", title: "تستر کابل و فازمتر القایی", href: "/category/tools/testers" },
          { id: "crimpers", title: "پرس سرسیم و سیم‌لخت‌کن", href: "/category/tools/crimpers" },
        ],
      },
    ],
    navLinks: [
      {
        id: "special-offers",
        title: "شگفت‌انگیزها",
        href: "/offers",
        icon: Sparkles,
        isSpecial: true,
        badge: "ویژه",
      },
      {
        id: "bestsellers",
        title: "پرفروش‌ترین‌ها",
        href: "/bestsellers",
        icon: Flame,
      },
      {
        id: "industrial",
        title: "تجهیزات صنعتی",
        href: "/industrial",
        icon: Layers,
      },
      {
        id: "blog",
        title: "مقالات و آموزش",
        href: "/blog",
        icon: GraduationCap,
      },
      {
        id: "contact",
        title: "تماس با ما",
        href: "/contact-us",
        icon: PhoneCall,
      },
    ],
    authButton: {
      text: "ورود / عضویت",
      href: "/login",
    },
    cartButton: {
      text: "سبد خرید",
      href: "/cart",
    },
  },
};

