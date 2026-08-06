import type { Language } from "@/contexts/LanguageContext";

export const homeTranslations = {
  en: {
    languageToggleLabel: "বাংলা",
    search: {
      title: "Find your next home, fast",
      subtitle: "Search all listings or browse by property type",
      placeholder: "Search by location, title...",
      button: "Search",
      categoriesHeading: "Browse by Property Type",
      allProducts: "All Listings",
    },
    brand: {
      badge: "ASTANAA.COM",
      title: "Buy, Sell & Rent Apartments Easily in Bangladesh",
      subtitle:
        "Post your own listing in minutes, or browse thousands of apartments for sale and rent near you.",
    },
  },
  bn: {
    languageToggleLabel: "English",
    search: {
      title: "আপনার পরবর্তী বাসা খুঁজুন দ্রুত",
      subtitle: "সব লিস্টিং খুঁজুন অথবা প্রপার্টি টাইপ অনুযায়ী দেখুন",
      placeholder: "লোকেশন, টাইটেল দিয়ে খুঁজুন...",
      button: "খুঁজুন",
      categoriesHeading: "প্রপার্টি টাইপ অনুযায়ী দেখুন",
      allProducts: "সব লিস্টিং",
    },
    brand: {
      badge: "ASTANAA.COM",
      title: "বাংলাদেশে সহজে অ্যাপার্টমেন্ট কিনুন, বিক্রি করুন ও ভাড়া দিন",
      subtitle:
        "মিনিটেই নিজের লিস্টিং পোস্ট করুন, অথবা আপনার কাছাকাছি হাজারো বিক্রি ও ভাড়ার অ্যাপার্টমেন্ট খুঁজুন।",
    },
  },
} satisfies Record<Language, unknown>;

export type HomeTranslations = (typeof homeTranslations)["en"];
