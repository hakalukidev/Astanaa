import type { Language } from "@/contexts/LanguageContext";

export const homeTranslations = {
  en: {
    languageToggleLabel: "বাংলা",
    search: {
      title: "Find the right equipment, fast",
      subtitle: "Search our full catalog or browse by category",
      placeholder: "Search for tools, machines, equipment...",
      button: "Search",
      categoriesHeading: "Browse by Category",
      allProducts: "All Products",
    },
    brand: {
      badge: "MUAZ TECHNOLOGY",
      title: "Trusted Garage Equipment & Workshop Tools Provider in Bangladesh",
      subtitle:
        "Upgrade your workshop with durable, high-quality tools for better productivity and performance.",
    },
    showcase: {
      latestEyebrow: "New arrivals",
      latestTitle: "Latest Products",
      latestDescription:
        "A compact lineup of our latest workshop equipment, presented in a cleaner horizontal layout for faster scanning.",
      browseCatalog: "Browse catalog",
      exploreCategory: "Explore category",
      categoryEyebrow: "Shop by category",
      categoryDescriptionWithSubcategories:
        "Browse products from {category} and its related subcategories.",
      categoryDescriptionNoSubcategories:
        "Browse a focused selection from our {category} range.",
    },
    video: {
      tag: "Upgrade your workshop performance",
      title: "Need top-quality garage equipment and expert installation?",
      description:
        "Muaz Technology has you covered! We supply, install, and provide training on a wide range of garage equipment. With our skilled team and commitment to customer satisfaction, we ensure that your garage is equipped with the best tools and that your staff is fully trained to use them efficiently. Whether you're upgrading or starting from scratch,",
      button: "GARAGE EQUIPMENTS",
    },
    blog: {
      heading: "Latest from Our Blog",
      subheading: "Stay updated with our latest news, tips, and insights",
    },
  },
  bn: {
    languageToggleLabel: "English",
    search: {
      title: "সঠিক ইকুইপমেন্ট খুঁজে নিন দ্রুত",
      subtitle: "পুরো ক্যাটালগে খুঁজুন অথবা ক্যাটাগরি অনুযায়ী দেখুন",
      placeholder: "টুলস, মেশিন, ইকুইপমেন্ট খুঁজুন...",
      button: "খুঁজুন",
      categoriesHeading: "ক্যাটাগরি অনুযায়ী দেখুন",
      allProducts: "সব পণ্য",
    },
    brand: {
      badge: "মুয়াজ টেকনোলজি",
      title: "বাংলাদেশে বিশ্বস্ত গ্যারেজ ইকুইপমেন্ট ও ওয়ার্কশপ টুলস সরবরাহকারী",
      subtitle:
        "উন্নত উৎপাদনশীলতা ও পারফরম্যান্সের জন্য আপনার ওয়ার্কশপ সাজান টেকসই, উচ্চমানের টুলস দিয়ে।",
    },
    showcase: {
      latestEyebrow: "নতুন সংযোজন",
      latestTitle: "সাম্প্রতিক পণ্য",
      latestDescription:
        "আমাদের সাম্প্রতিক ওয়ার্কশপ ইকুইপমেন্টের একটি ঝকঝকে তালিকা, দ্রুত দেখার জন্য সাজানো।",
      browseCatalog: "ক্যাটালগ দেখুন",
      exploreCategory: "ক্যাটাগরি দেখুন",
      categoryEyebrow: "ক্যাটাগরি অনুযায়ী কিনুন",
      categoryDescriptionWithSubcategories:
        "{category} এবং এর সংশ্লিষ্ট সাব-ক্যাটাগরি থেকে পণ্য দেখুন।",
      categoryDescriptionNoSubcategories:
        "আমাদের {category} রেঞ্জ থেকে বাছাইকৃত পণ্য দেখুন।",
    },
    video: {
      tag: "আপনার ওয়ার্কশপের পারফরম্যান্স বাড়ান",
      title: "উচ্চমানের গ্যারেজ ইকুইপমেন্ট ও বিশেষজ্ঞ ইনস্টলেশন দরকার?",
      description:
        "মুয়াজ টেকনোলজি আপনার পাশে আছে! আমরা বিভিন্ন গ্যারেজ ইকুইপমেন্ট সরবরাহ, ইনস্টল এবং প্রশিক্ষণ প্রদান করি। আমাদের দক্ষ টিম ও গ্রাহক সন্তুষ্টির প্রতিশ্রুতি নিয়ে, আমরা নিশ্চিত করি যে আপনার গ্যারেজ সেরা টুলসে সজ্জিত এবং আপনার স্টাফ দক্ষভাবে সেগুলো ব্যবহার করতে প্রশিক্ষিত। নতুন করে শুরু করুন বা আপগ্রেড করুন,",
      button: "গ্যারেজ ইকুইপমেন্ট",
    },
    blog: {
      heading: "আমাদের ব্লগ থেকে সাম্প্রতিক",
      subheading: "আমাদের সর্বশেষ খবর, টিপস এবং তথ্য নিয়ে আপডেট থাকুন",
    },
  },
} satisfies Record<Language, unknown>;

export type HomeTranslations = (typeof homeTranslations)["en"];
