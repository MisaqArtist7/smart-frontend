import {
  Sparkles,
  Layers,
  PhoneCall,
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
      text: "تضمین اصالت کالا، مشاوره تخصصی و ارسال سریع به سراسر ایران",
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
      label: "مشاوره و پشتیبانی فروش",
      phone: "tel:09122193551",
      displayPhone: "۰۹۱۲ ۲۱۹ ۳۵۵۱",
    },
  },
  navigation: {
    categoriesTitle: "دسته‌بندی کالاها",
    categories: [],
    navLinks: [
      {
        id: "special-offers",
        title: "پیشنهادات شگفت‌انگیز (افرز)",
        href: "/offers",
        icon: Sparkles,
        isSpecial: true,
        badge: "ویژه",
      },
      {
        id: "industrial",
        title: "تجهیزات صنعتی",
        href: "/industrial",
        icon: Layers,
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

