import { type Slide } from "@/lib/slides";

export const fallbackSlides: Slide[] = [
  {
    id: "fallback-1",
    tag: "Advanced Equipment",
    title: "Premium Garage Equipment & Workshop Tools",
    cta: "CALL US TODAY",
    ctaHref: "/contact",
    bg: "bg-gray-200",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 1,
    isActive: true,
    createdAtMs: null,
    updatedAtMs: null,
  },
  {
    id: "fallback-2",
    tag: "Local Expertise",
    title: "Tailored solutions for the Bangladeshi Market.",
    cta: "EXPERT ADVICE",
    ctaHref: "/contact",
    bg: "bg-gray-100",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 2,
    isActive: true,
    createdAtMs: null,
    updatedAtMs: null,
  },
  {
    id: "fallback-3",
    tag: "Quality Assured",
    title: "Trusted Tools from Global Leading Brands.",
    cta: "VIEW PRODUCTS",
    ctaHref: "/products",
    bg: "bg-slate-100",
    image:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 3,
    isActive: true,
    createdAtMs: null,
    updatedAtMs: null,
  },
  {
    id: "fallback-4",
    tag: "Fast Delivery",
    title: "Nationwide Delivery with Expert Installation.",
    cta: "CONTACT US",
    ctaHref: "/contact",
    bg: "bg-gray-200",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80",
    imagePublicId: "",
    order: 4,
    isActive: true,
    createdAtMs: null,
    updatedAtMs: null,
  },
];

export const categories = [
  {
    id: 1,
    name: "LIFTING EQUIPMENT'S",
    icon: 'wrench',
    href: '/products?category=lifting',
    products: [
      { id: 1, name: 'Single Post Car Wash Lift Brand-Schumak India', image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&q=80' },
      { id: 2, name: 'FW43-CT-LT Electro-Hydraulic 4-Column Lift 4000kg', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80' },
      { id: 3, name: 'LAUNCH Wheel Alignment Four Post Lift', image: 'https://images.unsplash.com/photo-1597762117709-859f744b84c3?w=400&q=80' },
      { id: 4, name: 'LAUNCH Scissor Lift (লঞ্চ সিসর লিফট)', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80' },
    ],
  },
  {
    id: 2,
    name: 'DIAGNOSTIC AND CHECKING',
    icon: 'scan',
    href: '/products?category=diagnostic',
    products: [
      { id: 5, name: 'Texa OHW Package (Off Highway Diagnostics)', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80' },
      { id: 6, name: 'LAUNCH X-431 V / X341 V+', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80' },
      { id: 7, name: 'Fuel Pressure Test Kit Petrol - China', image: 'https://images.unsplash.com/photo-1581092160607-ee22731c552f?w=400&q=80' },
      { id: 8, name: 'FY-1000 Battery Booster & Charger', image: 'https://images.unsplash.com/photo-1609010697446-11f2155278b0?w=400&q=80' },
    ],
  },
  {
    id: 3,
    name: 'SUPPORTING EQUIPMENT',
    icon: 'settings',
    href: '/products?category=supporting',
    products: [
      { id: 9, name: 'Air Compressor (এয়ার কম্প্রেসর-বেড ডিউটি)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
      { id: 10, name: 'Floor Jack (ফ্লোর জ্যাক)', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&q=80' },
      { id: 11, name: 'Hans Tool Great Air Impact Wrench Made in Taiwan', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80' },
      { id: 12, name: 'Heavy Duty Dewalt Grinding Machine-Germany', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80' },
    ],
  },
  {
    id: 4,
    name: 'DENTING AND PAINTING',
    icon: 'paintbrush',
    href: '/products?category=denting',
    products: [
      { id: 13, name: 'Spray Booth Professional Auto Paint', image: 'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=400&q=80' },
      { id: 14, name: 'Dent Puller Kit Professional', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80' },
      { id: 15, name: 'Auto Body Repair Welding Machine', image: 'https://images.unsplash.com/photo-1504222490345-c075b626f817?w=400&q=80' },
      { id: 16, name: 'Car Paint Mixing System Digital', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80' },
    ],
  },
];

export const allProducts = [
  { id: 1, name: 'Single Post Car Wash Lift Brand-Schumak India (কার ওয়াশ ওয়ান পোস্ট লিফট)', image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&q=80', tab: 'top' },
  { id: 2, name: 'FW43-CT-LT Electro-Hydraulic 4-Column Lift. 4000 kg Capacity', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80', tab: 'top' },
  { id: 3, name: 'Texa OHW Package (Off Highway Diagnostics)', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', tab: 'top' },
  { id: 4, name: 'ENGINE STAND (ইঞ্জিন স্ট্যান্ড)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', tab: 'top' },
  { id: 5, name: 'Jack Stand (জ্যাক স্ট্যান্ড)', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80', tab: 'top' },
  { id: 6, name: 'LAUNCH Wheel Alignment Machine', image: 'https://images.unsplash.com/photo-1597762117709-859f744b84c3?w=400&q=80', tab: 'featured' },
  { id: 7, name: 'Air Compressor Heavy Duty (এয়ার কম্প্রেসর)', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80', tab: 'featured' },
  { id: 8, name: 'Hans Tool Air Impact Wrench Taiwan', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80', tab: 'featured' },
  { id: 9, name: 'FY-1000 Battery Booster & Charger', image: 'https://images.unsplash.com/photo-1609010697446-11f2155278b0?w=400&q=80', tab: 'featured' },
  { id: 10, name: 'Floor Jack Heavy Duty (ফ্লোর জ্যাক)', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&q=80', tab: 'featured' },
  { id: 11, name: 'Heavy Duty Dewalt Grinding Machine', image: 'https://images.unsplash.com/photo-1504222490345-c075b626f817?w=400&q=80', tab: 'all' },
  { id: 12, name: 'Makita Electric Drill Machine', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80', tab: 'all' },
  { id: 13, name: 'Fuel Pressure Test Kit Petrol', image: 'https://images.unsplash.com/photo-1581092160607-ee22731c552f?w=400&q=80', tab: 'all' },
  { id: 14, name: 'LAUNCH X-431 V Diagnostic Scanner', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80', tab: 'all' },
  { id: 15, name: 'Car Wash Spray Gun Professional', image: 'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=400&q=80', tab: 'all' },
];
